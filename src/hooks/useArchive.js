import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useArchive() {
  const { user } = useAuth();
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchArchived = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*, subtasks(*)")
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });

    if (!error) setArchivedTasks(data || []);
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