import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch all tasks
  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*, subtasks(*)")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  // Create task
  const createTask = async (taskData) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert([{ ...taskData, user_id: user.id }])
      .select("*, subtasks(*)")
      .single();
    if (!error) setTasks((prev) => [data, ...prev]);
    return { data, error };
  };

  // Update task
  const updateTask = async (id, updates) => {
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, subtasks(*)")
      .single();
    if (!error) setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return { data, error };
  };

  // Delete task
  const deleteTask = async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  // Toggle complete
  const toggleComplete = async (id, currentStatus) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    return updateTask(id, { status: newStatus });
  };

  // Archive task
  const archiveTask = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_archived: true })
      .eq("id", id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  return {
    tasks, loading, error,
    createTask, updateTask, deleteTask,
    toggleComplete, archiveTask, fetchTasks,
  };
}