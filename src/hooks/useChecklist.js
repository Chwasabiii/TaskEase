import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const BUCKET = "task-files";

const sanitizeFileName = (name) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");

const createChecklistFilePath = (taskId, itemId, fileName) => {
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${taskId}/checklist/${itemId}/${id}-${sanitizeFileName(fileName)}`;
};

const attachFilesToItems = (items, files) =>
  items.map((item) => ({
    ...item,
    files: files.filter((file) => file.checklist_item_id === item.id),
  }));

export function useChecklist(taskId) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChecklist = async () => {
    if (!taskId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: checklistRows, error: itemsError } = await supabase
      .from("task_checklist_items")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("Could not fetch checklist:", itemsError);
      setError(itemsError.message);
      setLoading(false);
      return;
    }

    const itemIds = (checklistRows || []).map((item) => item.id);
    if (itemIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: fileRows, error: filesError } = await supabase
      .from("checklist_item_files")
      .select("*")
      .in("checklist_item_id", itemIds)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("Could not fetch checklist files:", filesError);
      setError(filesError.message);
      setItems(attachFilesToItems(checklistRows || [], []));
    } else {
      setItems(attachFilesToItems(checklistRows || [], fileRows || []));
    }

    setLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    const loadChecklist = async () => {
      if (!taskId) {
        if (isCurrent) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      const { data: checklistRows, error: itemsError } = await supabase
        .from("task_checklist_items")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (!isCurrent) return;

      if (itemsError) {
        console.error("Could not fetch checklist:", itemsError);
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      const itemIds = (checklistRows || []).map((item) => item.id);
      if (itemIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: fileRows, error: filesError } = await supabase
        .from("checklist_item_files")
        .select("*")
        .in("checklist_item_id", itemIds)
        .order("created_at", { ascending: false });

      if (!isCurrent) return;

      if (filesError) {
        console.error("Could not fetch checklist files:", filesError);
        setError(filesError.message);
        setItems(attachFilesToItems(checklistRows || [], []));
      } else {
        setItems(attachFilesToItems(checklistRows || [], fileRows || []));
      }

      setLoading(false);
    };

    loadChecklist();

    return () => {
      isCurrent = false;
    };
  }, [taskId]);

  const createItem = async (title) => {
    if (!user) return { error: { message: "Authentication required." } };
    if (!title.trim()) return { error: { message: "Checklist item is required." } };

    const { data, error: createError } = await supabase
      .rpc("create_checklist_item", {
        p_task_id: taskId,
        p_title: title.trim(),
        p_notes: "",
      })
      .single();

    if (createError) {
      console.error("Could not create checklist item:", createError);
      setError(createError.message);
      return { error: createError };
    }

    setItems((prev) => [...prev, { ...data, files: [] }]);
    return { data, error: null };
  };

  const updateItem = async (itemId, updates) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { data, error: updateError } = await supabase
      .from("task_checklist_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Could not update checklist item:", updateError);
      setError(updateError.message);
      return { error: updateError };
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...data, files: item.files || [] } : item))
    );
    return { data, error: null };
  };

  const deleteItem = async (item) => {
    if (!user) return { error: { message: "Authentication required." } };

    const filePaths = (item.files || []).map((file) => file.file_path);
    const { error: deleteError } = await supabase
      .from("task_checklist_items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      console.error("Could not delete checklist item:", deleteError);
      setError(deleteError.message);
      return { error: deleteError };
    }

    if (filePaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(filePaths);
    }

    setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    return { error: null };
  };

  const uploadItemFile = async (item, file) => {
    if (!file || !user) return { error: { message: "No file selected." } };

    const filePath = createChecklistFilePath(taskId, item.id, file.name);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Could not upload checklist file:", uploadError);
      setError(uploadError.message);
      return { error: uploadError };
    }

    const { data, error: metadataError } = await supabase
      .rpc("create_checklist_file_metadata", {
        p_checklist_item_id: item.id,
        p_file_name: file.name,
        p_file_path: filePath,
        p_file_type: file.type || "application/octet-stream",
        p_file_size: file.size,
      })
      .single();

    if (metadataError) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      console.error("Could not save checklist file metadata:", metadataError);
      setError(metadataError.message);
      return { error: metadataError };
    }

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, files: [data, ...(entry.files || [])] }
          : entry
      )
    );
    return { data, error: null };
  };

  const viewFile = async (file) => {
    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.file_path, 60);

    if (signedUrlError) {
      setError(signedUrlError.message);
      return { error: signedUrlError };
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    return { data, error: null };
  };

  const downloadFile = async (file) => {
    const { data, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(file.file_path);

    if (downloadError) {
      setError(downloadError.message);
      return { error: downloadError };
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { data, error: null };
  };

  const deleteFile = async (file) => {
    const { error: deleteError } = await supabase
      .from("checklist_item_files")
      .delete()
      .eq("id", file.id);

    if (deleteError) {
      setError(deleteError.message);
      return { error: deleteError };
    }

    await supabase.storage.from(BUCKET).remove([file.file_path]);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        files: (item.files || []).filter((entry) => entry.id !== file.id),
      }))
    );
    return { error: null };
  };

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    uploadItemFile,
    viewFile,
    downloadFile,
    deleteFile,
    fetchChecklist,
  };
}
