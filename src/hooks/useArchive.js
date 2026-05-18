import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useArchive() {
  const { user } = useAuth();
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading]             = useState(true);

  const attachSubtasks = async (taskRows) => {
    if (!taskRows?.length) return [];

    const taskIds = taskRows.map((task) => task.id);
    const { data: subtasks, error } = await supabase
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds);

    if (error) {
      console.error("Could not fetch archived subtasks:", error);
      return taskRows.map((task) => ({ ...task, subtasks: [] }));
    }

    return taskRows.map((task) => ({
      ...task,
      subtasks: subtasks?.filter((subtask) => subtask.task_id === task.id) || [],
    }));
  };

  const fetchArchived = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });

    if (error) console.error("Could not fetch archived tasks:", error);
    else setArchivedTasks(await attachSubtasks(data || []));
    setLoading(false);
  };

  useEffect(() => { fetchArchived(); }, [user]);

  // Restore task back to active
  const restoreTask = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) setArchivedTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  // Permanently delete
  const permanentDelete = async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setArchivedTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  // Permanently delete ALL archived tasks
  const clearAll = async () => {
    const ids = archivedTasks.map((t) => t.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (!error) setArchivedTasks([]);
    return { error };
  };

  return {
    archivedTasks, loading,
    restoreTask, permanentDelete, clearAll, fetchArchived,
  };
}
