import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useCollaboration() {
  const { user } = useAuth();
  const [sharedTasks, setSharedTasks]     = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading]             = useState(true);

  // Fetch tasks shared with me
  const fetchSharedTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("collaborators")
      .select(`
        id, role,
        task:tasks(*, profiles(id, full_name, avatar_url)),
        profile:profiles(id, full_name, avatar_url)
      `)
      .eq("user_id", user.id)
      .neq("role", "owner");
    if (!error) setSharedTasks(data || []);
    setLoading(false);
  }, [user]);

  // Fetch collaborators for a specific task
  const fetchCollaborators = useCallback(async (taskId) => {
    const { data, error } = await supabase
      .from("collaborators")
      .select("*, profile:profiles(id, full_name, avatar_url)")
      .eq("task_id", taskId);
    if (!error) setCollaborators(data || []);
    return { data, error };
  }, []);

  // Create a secure invite code for a task.
  const createInviteCode = async (taskId) => {
    const { data, error } = await supabase
      .rpc("create_task_invite", {
        p_task_id: taskId,
        p_expires_in_hours: 168,
        p_max_uses: 20,
      })
      .single();

    return { data, error };
  };

  // Join a task via invite code
  const joinByCode = async (code) => {
    if (!code || code.trim().length < 6) {
      return { error: { message: "Invite code must be at least 6 characters." } };
    }

    const { data, error } = await supabase
      .rpc("join_task_by_invite_code", { invite_code: code.trim() })
      .single();

    if (error) {
      console.error("Could not join task by invite code:", error);
      return { error: { message: error.message || "Could not join task. Try again." } };
    }

    if (!data?.task_id) {
      return { error: { message: data?.message || "Invalid invite code. No task found." } };
    }

    await fetchSharedTasks();
    return {
      data,
      task: { id: data.task_id, title: data.title },
    };
  };

  // Update collaborator role
  const updateRole = async (collaboratorId, newRole) => {
    const { data, error } = await supabase
      .rpc("update_task_collaborator_role", {
        p_collaborator_id: collaboratorId,
        p_role: newRole,
      })
      .single();
    if (!error) {
      setCollaborators((prev) =>
        prev.map((c) => (c.id === collaboratorId ? { ...c, role: data.role || newRole } : c))
      );
    }
    return { data, error };
  };

  // Remove collaborator
  const removeCollaborator = async (collaboratorId) => {
    const { error } = await supabase
      .rpc("remove_task_collaborator", { p_collaborator_id: collaboratorId });
    if (!error) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    }
    return { error };
  };

  // Invite a registered user by email
  const inviteByEmail = async (taskId, email, role = "viewer") => {
    const { data, error } = await supabase
      .rpc("invite_user_to_task", {
        p_task_id: taskId,
        p_email: email.trim(),
        p_role: role,
      })
      .single();

    if (!error) {
      await fetchCollaborators(taskId);
      await fetchSharedTasks();
    }

    return { data, error };
  };

  useEffect(() => {
    const loadSharedTasks = async () => {
      await fetchSharedTasks();
    };
    loadSharedTasks();
  }, [fetchSharedTasks]);

  return {
    sharedTasks, collaborators, loading,
    fetchSharedTasks, fetchCollaborators,
    createInviteCode, inviteByEmail,
    joinByCode, updateRole, removeCollaborator,
  };
}
