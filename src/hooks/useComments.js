import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useComments(taskId) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const mergeComment = useCallback((comment) => {
    if (!comment) return;

    setComments((prev) => {
      const exists = prev.some((item) => item.id === comment.id);
      if (exists) {
        return prev.map((item) => (item.id === comment.id ? { ...item, ...comment } : item));
      }

      return [...prev, comment].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

  const attachProfiles = useCallback(async (commentRows) => {
    if (!commentRows?.length) return [];

    const userIds = [...new Set(commentRows.map((comment) => comment.user_id).filter(Boolean))];
    if (!userIds.length) return commentRows;

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Could not fetch comment profiles:", profilesError);
      return commentRows;
    }

    return commentRows.map((comment) => ({
      ...comment,
      profile: profiles?.find((profile) => profile.id === comment.user_id) || null,
    }));
  }, []);

  const normalizeRpcComments = useCallback((commentRows) =>
    (commentRows || []).map((comment) => ({
      id: comment.id,
      task_id: comment.task_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      profile: {
        id: comment.profile_id || comment.user_id,
        full_name: comment.full_name,
        avatar_url: comment.avatar_url,
      },
    })), []);

  const fetchCommentsViaTable = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) return { data: [], error };

    return {
      data: await attachProfiles(data || []),
      error: null,
    };
  }, [attachProfiles, taskId]);

  const fetchComment = useCallback(async (commentId) => {
    const { data, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("id", commentId)
      .single();

    if (fetchError) return { data: null, error: fetchError };

    const [commentWithProfile] = await attachProfiles([data]);
    return { data: commentWithProfile, error: null };
  }, [attachProfiles]);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data: rpcRows, error: rpcError } = await supabase.rpc("list_task_comments", {
      p_task_id: taskId,
    });

    if (!rpcError) {
      setError("");
      setComments(normalizeRpcComments(rpcRows));
      setLoading(false);
      return;
    }

    const { data, error } = await fetchCommentsViaTable();
    if (error) {
      setError(error.message || rpcError.message || "Could not load comments.");
    } else {
      setError("");
      setComments(data);
    }
    setLoading(false);
  }, [fetchCommentsViaTable, normalizeRpcComments, taskId]);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;
    const loadComments = async () => {
      await fetchComments();
    };
    loadComments();

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `task_id=eq.${taskId}` },
        async (payload) => {
          // Fetch full comment with profile
          const { data } = await fetchComment(payload.new.id);
          mergeComment(data);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments", filter: `task_id=eq.${taskId}` },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchComment, fetchComments, mergeComment, taskId]);

  const addComment = async (content) => {
    if (!user) return { error: { message: "Authentication required." } };
    if (!content.trim()) return;
    setError("");

    const optimisticComment = {
      id: `pending-${Date.now()}`,
      task_id: taskId,
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      profile: {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "You",
        avatar_url: null,
      },
      is_pending: true,
    };
    mergeComment(optimisticComment);

    const { data: inserted, error: rpcError } = await supabase
      .rpc("create_task_comment", {
        p_task_id: taskId,
        p_content: content.trim(),
      });

    if (rpcError) {
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      setError(rpcError.message || "Could not send comment.");
      return { data: null, error: rpcError };
    }

    const insertedComment = Array.isArray(inserted) ? inserted[0] : inserted;
    if (!insertedComment?.id) {
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      await fetchComments();
      return { data: insertedComment, error: null };
    }

    const { data: rpcComment, error: fetchError } = await fetchComment(insertedComment.id);
    if (fetchError) {
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      await fetchComments();
      return { data: inserted, error: fetchError };
    }

    setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
    mergeComment(rpcComment);
    return { data: rpcComment, error: null };
  };

  const deleteComment = async (commentId) => {
    if (!user) return { error: { message: "Authentication required." } };
    setError("");

    const { error: rpcError } = await supabase.rpc("delete_task_comment", {
      p_comment_id: commentId,
    });

    if (rpcError) {
      setError(rpcError.message || "Could not delete comment.");
      return { error: rpcError };
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId));
    return { error: null };
  };

  return { comments, loading, error, addComment, deleteComment };
}
