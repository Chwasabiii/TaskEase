import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useCollaboration() {
  const { user } = useAuth();
  const [sharedTasks, setSharedTasks]     = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading]             = useState(true);

  // Fetch tasks shared with me
  const fetchSharedTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("collaborators")
      .select(`
        id, role,
        task:tasks(*, profiles(id, full_name, avatar_url)),
        profile:profiles(id, full_name, avatar_url)
      `)
      .eq("user_id", user.id);
    if (!error) setSharedTasks(data || []);
    setLoading(false);
  };

  // Fetch collaborators for a specific task
  const fetchCollaborators = async (taskId) => {
    const { data, error } = await supabase
      .from("collaborators")
      .select("*, profile:profiles(id, full_name, avatar_url)")
      .eq("task_id", taskId);
    if (!error) setCollaborators(data || []);
    return { data, error };
  };

  // Generate invite code from task id
  const generateInviteCode = (taskId) =>
    taskId.replace(/-/g, "").slice(0, 8).toUpperCase();

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
      .from("collaborators")
      .update({ role: newRole })
      .eq("id", collaboratorId)
      .select()
      .single();
    if (!error) {
      setCollaborators((prev) =>
        prev.map((c) => (c.id === collaboratorId ? { ...c, role: newRole } : c))
      );
    }
    return { data, error };
  };

  // Remove collaborator
  const removeCollaborator = async (collaboratorId) => {
    const { error } = await supabase
      .from("collaborators")
      .delete()
      .eq("id", collaboratorId);
    if (!error) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    }
    return { error };
  };

  // Invite user by email
  const inviteByEmail = async (taskId, email, role = "viewer") => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", email)
      .single();

    if (profileError || !profile) {
      return { error: { message: "User not found. They must be registered on TaskEase." } };
    }

    const { data, error } = await supabase
      .from("collaborators")
      .insert([{ task_id: taskId, user_id: profile.id, role }])
      .select()
      .single();

    return { data, error };
  };

  useEffect(() => { fetchSharedTasks(); }, [user]);

  return {
    sharedTasks, collaborators, loading,
    fetchSharedTasks, fetchCollaborators,
    generateInviteCode, inviteByEmail,
    joinByCode, updateRole, removeCollaborator,
  };
}
