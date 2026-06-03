import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const attachSubtasks = useCallback(async (taskRows) => {
    if (!taskRows?.length) return [];

    const taskIds = taskRows.map((task) => task.id);
    const { data: subtasks, error: subtasksError } = await supabase
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds);

    if (subtasksError) {
      console.error("Could not fetch subtasks:", subtasksError);
      return taskRows.map((task) => ({ ...task, subtasks: [] }));
    }

    return taskRows.map((task) => ({
      ...task,
      subtasks: subtasks?.filter((subtask) => subtask.task_id === task.id) || [],
    }));
  }, []);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*, profiles(id, full_name, avatar_url)")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not fetch tasks:", error);
      setError(error.message);
    } else {
      setError(null);
      setTasks(await attachSubtasks(data || []));
    }
    setLoading(false);
  }, [attachSubtasks, user]);

  useEffect(() => {
    const loadTasks = async () => {
      await fetchTasks();
    };
    loadTasks();
  }, [fetchTasks]);

  // Create task
  const createTask = async (taskData) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { data, error } = await supabase
      .from("tasks")
      .insert([{ ...taskData, user_id: user.id }])
      .select("*, profiles(id, full_name, avatar_url)")
      .single();
    if (!error && !data.is_archived) setTasks((prev) => [{ ...data, subtasks: [] }, ...prev]);
    return { data, error };
  };

  // Update task
  const updateTask = async (id, updates) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { data, error } = await supabase
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, profiles(id, full_name, avatar_url)")
      .single();
    if (!error) {
      setTasks((prev) =>
        data.is_archived
          ? prev.filter((t) => t.id !== id)
          : prev.map((t) => (t.id === id ? { ...data, subtasks: t.subtasks || [] } : t))
      );
    }
    return { data, error };
  };

  // Delete task
  const deleteTask = async (id) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  // Toggle complete
  const toggleComplete = async (id, currentStatus) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    return updateTask(id, {
      status: newStatus,
      is_archived: newStatus === "done",
    });
  };

  // Archive task
  const archiveTask = async (id) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { error } = await supabase
      .from("tasks")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  const findArchivedTaskSuggestion = async (title) => {
    const cleanTitle = title.trim().replace(/\s+/g, " ");
    if (!user || cleanTitle.length < 3) return null;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .ilike("title", `%${cleanTitle}%`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Could not fetch archived task suggestion:", error);
      return null;
    }

    return data;
  };

  return {
    tasks, loading, error,
    createTask, updateTask, deleteTask,
    toggleComplete, archiveTask, fetchTasks, findArchivedTaskSuggestion,
  };
}
