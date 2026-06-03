import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const BUCKET = "task-files";

const sanitizeFileName = (name) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");

const createFilePath = (taskId, fileName) => {
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${taskId}/${id}-${sanitizeFileName(fileName)}`;
};

export function useTaskFiles(taskId) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFiles = async () => {
    if (!taskId || !user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("task_files")
      .select("*, profile:profiles(id, full_name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Could not fetch task files:", fetchError);
      setError(fetchError.message);
    } else {
      setFiles(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    const loadFiles = async () => {
      if (!taskId) {
        if (isCurrent) {
          setFiles([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("task_files")
        .select("*, profile:profiles(id, full_name, avatar_url)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (!isCurrent) return;

      if (fetchError) {
        console.error("Could not fetch task files:", fetchError);
        setError(fetchError.message);
      } else {
        setFiles(data || []);
      }

      setLoading(false);
    };

    loadFiles();

    return () => {
      isCurrent = false;
    };
  }, [taskId]);

  const uploadFile = async (file) => {
    if (!file || !taskId || !user) return { error: { message: "No file selected." } };

    setError("");
    const filePath = createFilePath(taskId, file.name);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Could not upload file:", uploadError);
      setError(uploadError.message);
      return { error: uploadError };
    }

    const { data, error: insertError } = await supabase
      .rpc("create_task_file_metadata", {
        p_task_id: taskId,
        p_file_name: file.name,
        p_file_path: filePath,
        p_file_type: file.type || "application/octet-stream",
        p_file_size: file.size,
      })
      .single();

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      console.error("Could not save file metadata:", insertError);
      setError(insertError.message);
      return { error: insertError };
    }

    setFiles((prev) => [
      {
        ...data,
        profile: {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          avatar_url: null,
        },
      },
      ...prev,
    ]);
    fetchFiles();
    return { data, error: null };
  };

  const createSignedUrl = async (filePath) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60);

    if (signedUrlError) {
      console.error("Could not create signed file URL:", signedUrlError);
      setError(signedUrlError.message);
      return { error: signedUrlError };
    }

    return { data, error: null };
  };

  const viewFile = async (file) => {
    const { data, error: signedUrlError } = await createSignedUrl(file.file_path);
    if (signedUrlError) return { error: signedUrlError };
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    return { data, error: null };
  };

  const downloadFile = async (file) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { data, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(file.file_path);

    if (downloadError) {
      console.error("Could not download file:", downloadError);
      setError(downloadError.message);
      return { error: downloadError };
    }

    const link = document.createElement("a");
    const url = URL.createObjectURL(data);
    link.href = url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { data, error: null };
  };

  const deleteFile = async (file) => {
    if (!user) return { error: { message: "Authentication required." } };

    const { error: deleteError } = await supabase
      .from("task_files")
      .delete()
      .eq("id", file.id);

    if (deleteError) {
      console.error("Could not delete file metadata:", deleteError);
      setError(deleteError.message);
      return { error: deleteError };
    }

    await supabase.storage.from(BUCKET).remove([file.file_path]);
    setFiles((prev) => prev.filter((item) => item.id !== file.id));
    return { error: null };
  };

  return {
    files,
    loading,
    error,
    uploadFile,
    viewFile,
    downloadFile,
    deleteFile,
    fetchFiles,
  };
}
