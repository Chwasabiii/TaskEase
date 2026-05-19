import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useComments(taskId) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*, profile:profiles(id, full_name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (!error) setComments(data || []);
    setLoading(false);
  }, [taskId]);

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
          const { data } = await supabase
            .from("comments")
            .select("*, profile:profiles(id, full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (data) setComments((prev) => [...prev, data]);
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
  }, [fetchComments, taskId]);

  const addComment = async (content) => {
    if (!content.trim()) return;
    const { data, error } = await supabase
      .from("comments")
      .insert([{ task_id: taskId, user_id: user.id, content }])
      .select("*, profile:profiles(id, full_name, avatar_url)")
      .single();
    return { data, error };
  };

  const deleteComment = async (commentId) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);
    return { error };
  };

  return { comments, loading, addComment, deleteComment };
}