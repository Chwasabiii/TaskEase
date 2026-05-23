import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// Read EXIF orientation from a File
async function getImageOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const view = new DataView(e.target.result);
      try {
        if (view.getUint16(0, false) !== 0xFFD8) return resolve(1);
        let offset = 2;
        const length = view.byteLength;
        while (offset < length) {
          const marker = view.getUint16(offset, false);
          offset += 2;
          if (marker === 0xFFE1) {
            const exifLength = view.getUint16(offset, false);
            const exifStart = offset + 2;
            if (view.getUint32(exifStart, false) !== 0x45786966) break; // 'Exif'
            const little = view.getUint16(exifStart + 6, false) === 0x4949;
            const tags = view.getUint16(exifStart + 10, little);
            let tagOffset = exifStart + 12;
            for (let i = 0; i < tags; i++) {
              const tag = view.getUint16(tagOffset + i * 12, little);
              if (tag === 0x0112) {
                const value = view.getUint16(tagOffset + i * 12 + 8, little);
                return resolve(value);
              }
            }
            break;
          } else {
            const skip = view.getUint16(offset, false);
            offset += skip;
          }
        }
      } catch {
        // ignore
      }
      resolve(1);
    };
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
}

// Rotate image file per EXIF orientation and return a Blob
async function rotateImageFile(file, orientation) {
  if (!orientation || orientation === 1) return file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  if (orientation === 6 || orientation === 8) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }
  // apply transforms
  if (orientation === 3) {
    ctx.translate(w, h);
    ctx.rotate(Math.PI);
    ctx.drawImage(img, 0, 0);
  } else if (orientation === 6) {
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0);
  } else if (orientation === 8) {
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(img, 0, 0);
  } else {
    ctx.drawImage(img, 0, 0);
  }
  URL.revokeObjectURL(url);
  return await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
}

const profileSelect = "email, username, full_name, avatar_url, cover_url, bio, profile_status, location, role_title, school_work, interests, website_url, show_bio, show_friends, show_stats, is_discoverable, created_at";
const fallbackSelect = "email, username, full_name, avatar_url, bio, created_at";

const initialProfile = {
  email: "",
  username: "",
  full_name: "",
  avatar_url: "",
  cover_url: "",
  bio: "",
  profile_status: "Available",
  location: "",
  role_title: "",
  school_work: "",
  interests: "",
  website_url: "",
  show_bio: true,
  show_friends: true,
  show_stats: true,
  is_discoverable: true,
  created_at: "",
};

export default function Profile({ onNotify }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [activeTab, setActiveTab] = useState("friends");
  const [stats, setStats] = useState({ completedTasks: 0, focusSessions: 0, focusStreak: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [crop, setCrop] = useState(null);
  const cropRef = useRef({ dragging: false, startX: 0, startY: 0 });
  const modalRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);

  const completion = useMemo(() => {
    const checks = [
      profile.full_name,
      profile.username,
      profile.avatar_url,
      profile.cover_url,
      profile.bio,
      profile.profile_status,
      profile.role_title,
      profile.location || profile.school_work || profile.interests || profile.website_url,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : "Unknown";

  const getInitial = (person) =>
    (person?.full_name || person?.username || person?.email || "U")[0]?.toUpperCase();

  const renderAvatar = (person, size = 96, border = "4px solid var(--color-surface)") => (
    person?.avatar_url ? (
      <img src={person.avatar_url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border, backgroundColor: "var(--color-surface)", flexShrink: 0 }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", border, background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)", color: "white", fontFamily: "var(--font-heading)", fontSize: size > 70 ? "2rem" : "1rem", fontWeight: 800, flexShrink: 0 }}>
        {getInitial(person)}
      </div>
    )
  );

  const smallText = {
    margin: 0,
    color: "var(--color-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
  };

  const panelStyle = {
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    backgroundColor: "var(--color-surface)",
    padding: "1.25rem",
    boxShadow: "0 18px 48px rgba(15, 23, 42, 0.08)",
  };

  const achievementBadges = [
    {
      title: "Task finisher",
      detail: `${stats.completedTasks} completed task${stats.completedTasks === 1 ? "" : "s"}`,
      current: stats.completedTasks,
      target: 10,
    },
    {
      title: "Focus builder",
      detail: `${stats.focusSessions} completed focus session${stats.focusSessions === 1 ? "" : "s"}`,
      current: stats.focusSessions,
      target: 10,
    },
    {
      title: "Streak keeper",
      detail: `${stats.focusStreak} day focus streak`,
      current: stats.focusStreak,
      target: 7,
    },
    {
      title: "Connected",
      detail: `${friends.length} profile connection${friends.length === 1 ? "" : "s"}`,
      current: friends.length,
      target: 5,
    },
  ];

  const loadNetwork = useCallback(async () => {
    if (!user) return;
    setNetworkLoading(true);

    const [{ data: accepted }, { data: requests }, { data: outgoing }] = await Promise.all([
      supabase.from("profile_connections").select("id, requester_id, addressee_id, updated_at").eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).order("updated_at", { ascending: false }),
      supabase.from("profile_connections").select("id, requester_id, created_at").eq("addressee_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("profile_connections").select("id, addressee_id, created_at").eq("requester_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    const profileIds = [
      ...(accepted || []).map((row) => row.requester_id === user.id ? row.addressee_id : row.requester_id),
      ...(requests || []).map((row) => row.requester_id),
      ...(outgoing || []).map((row) => row.addressee_id),
    ];
    const uniqueIds = [...new Set(profileIds)];
    const { data: profiles } = uniqueIds.length
      ? await supabase.from("profiles").select("id, username, full_name, avatar_url, bio, profile_status").in("id", uniqueIds)
      : { data: [] };
    const byId = new Map((profiles || []).map((person) => [person.id, person]));

    setFriends((accepted || []).map((row) => {
      const id = row.requester_id === user.id ? row.addressee_id : row.requester_id;
      const person = byId.get(id);
      return person ? { ...person, connectionId: row.id } : null;
    }).filter(Boolean));
    setIncoming((requests || []).map((row) => ({ ...row, requester: byId.get(row.requester_id) })));
    setSent((outgoing || []).map((row) => ({ ...row, addressee: byId.get(row.addressee_id) })));
    setNetworkLoading(false);
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    const [{ count: completedTasks }, { count: focusSessions }, { data: sessionDates }] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "done"),
      supabase.from("pomodoro_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
      supabase.from("pomodoro_sessions").select("started_at").eq("user_id", user.id).eq("completed", true).order("started_at", { ascending: false }),
    ]);
    setStats({ completedTasks: completedTasks || 0, focusSessions: focusSessions || 0, focusStreak: calculateFocusStreak(sessionDates || []) });
  }, [user]);

  const loadRecentActivity = useCallback(async () => {
    if (!user) return;

    const [{ data: taskRows }, { data: focusRows }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("pomodoro_sessions")
        .select("id, started_at, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("started_at", { ascending: false })
        .limit(5),
    ]);

    const taskActivity = (taskRows || []).map((task) => ({
      id: `task-${task.id}`,
      type: "Task",
      title: task.status === "done" ? `Completed ${task.title || "a task"}` : `Updated ${task.title || "a task"}`,
      detail: task.status === "done" ? "Marked done" : "Task updated",
      date: task.updated_at || task.created_at,
    }));

    const focusActivity = (focusRows || []).map((session) => ({
      id: `focus-${session.id}`,
      type: "Focus",
      title: "Completed a focus session",
      detail: "Pomodoro session",
      date: session.started_at,
    }));

    setRecentActivity([...taskActivity, ...focusActivity]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6));
  }, [user]);

  const loadWeeklyActivity = useCallback(async () => {
    if (!user) return;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const [{ data: completedTasks }, { data: focusSessions }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, updated_at, created_at")
        .eq("user_id", user.id)
        .eq("status", "done")
        .gte("updated_at", startDate.toISOString()),
      supabase
        .from("pomodoro_sessions")
        .select("id, started_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("started_at", startDate.toISOString()),
    ]);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        key: date.toDateString(),
        label: date.toLocaleDateString([], { weekday: "short" }),
        tasks: 0,
        focus: 0,
      };
    });

    const byDay = new Map(days.map((day) => [day.key, day]));

    (completedTasks || []).forEach((task) => {
      const key = new Date(task.updated_at || task.created_at).toDateString();
      const day = byDay.get(key);
      if (day) day.tasks += 1;
    });

    (focusSessions || []).forEach((session) => {
      const key = new Date(session.started_at).toDateString();
      const day = byDay.get(key);
      if (day) day.focus += 1;
    });

    setWeeklyActivity(days);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError("");

      let { data, error: fetchError } = await supabase.from("profiles").select(profileSelect).eq("id", user.id).single();
      if (fetchError) {
        const fallback = await supabase.from("profiles").select(fallbackSelect).eq("id", user.id).single();
        data = fallback.data;
        fetchError = fallback.error;
      }
      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfile({ ...initialProfile, email: user.email || "", username: user.email || "", full_name: user.user_metadata?.full_name || "" });
      } else {
        setProfile({ ...initialProfile, ...data, email: data?.email || user.email || "" });
      }
      setLoading(false);
    };

    loadProfile();
    loadNetwork();
    loadStats();
    loadRecentActivity();
    loadWeeklyActivity();

    return () => {
      mounted = false;
    };
  }, [user, loadNetwork, loadStats, loadRecentActivity, loadWeeklyActivity]);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setError("");
    setStatus("");
  };

  // Start the crop flow instead of uploading immediately
  const handleUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    try {
      // account for EXIF orientation by pre-rotating if needed
      const orientation = await getImageOrientation(file);
      let fileToUse = file;
      if (orientation && orientation !== 1) {
        const rotated = await rotateImageFile(file, orientation);
        if (rotated) fileToUse = new File([rotated], file.name, { type: rotated.type });
      }
      const url = URL.createObjectURL(fileToUse);
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const isAvatar = field === "avatar_url";
      const container = isAvatar ? { w: 320, h: 320 } : { w: 1200, h: 320 };
      // scale to cover container
      const initialScale = Math.max(container.w / naturalWidth, container.h / naturalHeight);
      const displayW = naturalWidth * initialScale;
      const displayH = naturalHeight * initialScale;
      const initialX = (container.w - displayW) / 2;
      const initialY = (container.h - displayH) / 2;

      setCrop({
        file: fileToUse,
        url,
        field,
        naturalWidth,
        naturalHeight,
        container,
        scale: initialScale,
        x: initialX,
        y: initialY,
      });
      // show modal with slight delay to allow mount
      setTimeout(() => setModalVisible(true), 20);
    } catch {
      setError("Unable to prepare image for cropping.");
    }
  };

  const closeCrop = useCallback(() => {
    // animate close
    setModalVisible(false);
    setTimeout(() => {
      if (crop?.url) URL.revokeObjectURL(crop.url);
      setCrop(null);
    }, 200);
  }, [crop]);

  const onCropPointerDown = (e) => {
    if (!crop) return;
    cropRef.current.dragging = true;
    cropRef.current.startX = e.clientX;
    cropRef.current.startY = e.clientY;
    // capture pointer for smoother drag
    try { e.target.setPointerCapture?.(e.pointerId); } catch (e) {}
  };

  const onCropPointerMove = (e) => {
    if (!crop || !cropRef.current.dragging) return;
    const dx = e.clientX - cropRef.current.startX;
    const dy = e.clientY - cropRef.current.startY;
    cropRef.current.startX = e.clientX;
    cropRef.current.startY = e.clientY;
    setCrop((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
  };

  const onCropPointerUp = () => {
    cropRef.current.dragging = false;
    try { document.releasePointerCapture?.(); } catch (e) {}
  };

  const onCropZoom = (value) => {
    setCrop((c) => {
      if (!c) return c;
      const prevDisplayW = c.naturalWidth * c.scale;
      const prevDisplayH = c.naturalHeight * c.scale;
      const newScale = c.scale * value;
      const newDisplayW = c.naturalWidth * newScale;
      const newDisplayH = c.naturalHeight * newScale;
      // adjust x/y to keep image roughly centered on same point
      const cx = c.container.w / 2 - c.x;
      const cy = c.container.h / 2 - c.y;
      const nx = c.container.w / 2 - (cx * (newDisplayW / prevDisplayW));
      const ny = c.container.h / 2 - (cy * (newDisplayH / prevDisplayH));
      return { ...c, scale: newScale, x: nx, y: ny };
    });
  };

  // focus and keyboard handling for crop modal
  useEffect(() => {
    if (crop) {
      const el = modalRef.current;
      el?.focus();
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeCrop();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          confirmCropAndUpload();
          return;
        }
        // keyboard zoom
        if (e.key === '+' || e.key === '=' ) { onCropZoom(1.08); return; }
        if (e.key === '-') { onCropZoom(0.92); return; }
        // focus trap: manage Tab
        if (e.key === 'Tab') {
          const container = modalRef.current;
          if (!container) return;
          const focusable = Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [crop]);

  const confirmCropAndUpload = useCallback(async () => {
    if (!crop || !user) return;
    setUploading(crop.field);
    setError("");
    try {
      const outW = crop.field === "avatar_url" ? 512 : 1400;
      const outH = crop.field === "avatar_url" ? 512 : 420;
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.src = crop.url;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const displayW = crop.naturalWidth * crop.scale;
      const displayH = crop.naturalHeight * crop.scale;

      const srcX = Math.max(0, (-crop.x) * (crop.naturalWidth / displayW));
      const srcY = Math.max(0, (-crop.y) * (crop.naturalHeight / displayH));
      const srcW = Math.min(crop.container.w * (crop.naturalWidth / displayW), crop.naturalWidth - srcX);
      const srcH = Math.min(crop.container.h * (crop.naturalHeight / displayH), crop.naturalHeight - srcY);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
      const extension = "jpg";
      const filename = `${crop.field}-${Date.now()}.${extension}`;
      const path = `${user.id}/${filename}`;
      const fileForUpload = new File([blob], filename, { type: blob.type });
      const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, fileForUpload, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      updateProfileField(crop.field, data.publicUrl);
      setStatus(`${crop.field === "avatar_url" ? "Avatar" : "Cover photo"} uploaded. Save profile to keep it.`);
    } catch (err) {
      setError(err?.message || "Upload failed.");
    }
    setUploading("");
    // close with animation
    setModalVisible(false);
    setTimeout(() => {
      if (crop?.url) URL.revokeObjectURL(crop.url);
      setCrop(null);
    }, 200);
  }, [crop, user, updateProfileField]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    setError("");
    setStatus("");

    const payload = {
      id: user.id,
      email: user.email?.toLowerCase() || (profile.email || "").toLowerCase(),
      username: (profile.username || "").toLowerCase(),
      full_name: profile.full_name,
      avatar_url: (profile.avatar_url || "").trim() || null,
      cover_url: (profile.cover_url || "").trim() || null,
      bio: (profile.bio || "").trim() || null,
      profile_status: (profile.profile_status || "").trim() || "Available",
      location: (profile.location || "").trim() || null,
      role_title: (profile.role_title || "").trim() || null,
      school_work: (profile.school_work || "").trim() || null,
      interests: (profile.interests || "").trim() || null,
      website_url: (profile.website_url || "").trim() || null,
      updated_at: new Date().toISOString(),
    };

    let saveError;
    try {
      const result = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      saveError = result.error;
      if (saveError) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.cover_url;
        delete fallbackPayload.profile_status;
        delete fallbackPayload.location;
        delete fallbackPayload.role_title;
        delete fallbackPayload.school_work;
        delete fallbackPayload.interests;
        delete fallbackPayload.website_url;
        const fallback = await supabase.from("profiles").upsert(fallbackPayload, { onConflict: "id" });
        saveError = fallback.error;
      }
    } catch (err) {
      saveError = err instanceof Error ? err : new Error("Unable to save profile.");
    }

    if (saveError) {
      setError(saveError.message);
    } else {
      setProfile((current) => ({ ...current, ...payload }));
      window.dispatchEvent(new CustomEvent("taskease:profile-updated", { detail: { profile: payload } }));
      setStatus("Profile updated.");
      onNotify?.({ title: "Profile updated", message: "Your profile changes were saved.", type: "profile" });
    }
    setSaving(false);
  }, [saving, user, profile, onNotify]);

  const handleRequest = async (id, nextStatus) => {
    setUpdatingId(id);
    const { error: requestError } = await supabase.from("profile_connections").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
    if (requestError) setError(requestError.message);
    else {
      setStatus(nextStatus === "accepted" ? "Profile request accepted." : "Profile request ignored.");
      await loadNetwork();
    }
    setUpdatingId(null);
  };

  const handleDeleteConnection = async (id, kind) => {
    setUpdatingId(id);
    const { error: deleteError } = await supabase.from("profile_connections").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
    else {
      setStatus(kind === "friend" ? "Friend removed." : "Profile request canceled.");
      await loadNetwork();
    }
    setUpdatingId(null);
  };

  const renderPersonRow = (person, meta, action) => (
    <div style={{ display: "grid", gridTemplateColumns: action ? "42px minmax(0, 1fr) auto" : "42px minmax(0, 1fr)", gap: "0.75rem", alignItems: "center", padding: "0.75rem", borderRadius: "10px", backgroundColor: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>
      {renderAvatar(person, 42, "1px solid var(--color-border)")}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person?.full_name || person?.username || "Unknown user"}
        </p>
        <p style={{ margin: "0.15rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          @{person?.username || "username"}{meta ? ` - ${meta}` : ""}
        </p>
      </div>
      {action}
    </div>
  );

  const renderNetwork = () => {
    if (networkLoading) return <p style={smallText}>Loading profile network...</p>;
    if (activeTab === "friends") {
      return friends.length ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {friends.map((friend) => renderPersonRow(friend, friend.profile_status || friend.bio || "", (
            <button key="unfriend" type="button" onClick={() => handleDeleteConnection(friend.connectionId, "friend")} disabled={updatingId === friend.connectionId} style={dangerButtonStyle(updatingId === friend.connectionId)}>Unfriend</button>
          )))}
        </div>
      ) : <p style={smallText}>No friends yet.</p>;
    }
    if (activeTab === "received") {
      return incoming.length ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {incoming.map((request) => renderPersonRow(request.requester, "Wants to add you", (
            <span key="actions" style={{ display: "flex", gap: "0.45rem" }}>
              <button type="button" onClick={() => handleRequest(request.id, "accepted")} disabled={updatingId === request.id} style={acceptButtonStyle(updatingId === request.id)}>Accept</button>
              <button type="button" onClick={() => handleRequest(request.id, "ignored")} disabled={updatingId === request.id} style={ghostButtonStyle(updatingId === request.id)}>Ignore</button>
            </span>
          )))}
        </div>
      ) : <p style={smallText}>No received requests.</p>;
    }
    return sent.length ? (
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {sent.map((request) => renderPersonRow(request.addressee, "Waiting for response", (
          <button key="cancel" type="button" onClick={() => handleDeleteConnection(request.id, "sent")} disabled={updatingId === request.id} style={dangerButtonStyle(updatingId === request.id)}>Cancel</button>
        )))}
      </div>
    ) : <p style={smallText}>No sent requests.</p>;
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <p style={smallText}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section className="glass-card" style={{ padding: 0, overflow: "hidden", borderRadius: "14px", position: "relative" }}>
        <label htmlFor="coverUpload" style={{ display: "block", width: "100%", height: "220px", cursor: "pointer", background: profile.cover_url ? `linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.85)), url(${profile.cover_url}) center/cover no-repeat` : "linear-gradient(135deg, rgba(91,140,255,0.95), rgba(16,185,129,0.75) 52%, rgba(124,92,255,0.9))", position: "relative" }} aria-label="Upload cover photo">
          <span style={{ position: "absolute", right: "1rem", top: "1rem", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", backgroundColor: "rgba(15,23,42,0.75)", color: "white", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>
            ✎
          </span>
        </label>
        <input id="coverUpload" type="file" accept="image/*" onChange={(event) => handleUpload(event, "cover_url")} style={{ display: "none" }} />
        <div style={{ padding: "0 2rem 1.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginTop: "-64px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", minWidth: 0 }}>
            <div style={{ position: "relative", width: "124px", height: "124px", flexShrink: 0 }}>
              <label htmlFor="avatarUpload" style={{ cursor: "pointer", display: "block", width: "100%", height: "100%", position: "relative" }} aria-label="Upload avatar">
                {renderAvatar(profile, 124)}
                <span style={{ position: "absolute", right: 0, bottom: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", backgroundColor: "rgba(15,23,42,0.85)", color: "white", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>
                  ✎
                </span>
              </label>
              <input id="avatarUpload" type="file" accept="image/*" onChange={(event) => handleUpload(event, "avatar_url")} style={{ display: "none" }} />
            </div>
            <div style={{ minWidth: 0, paddingBottom: "0.7rem" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.7rem", fontWeight: 800, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.42)", overflowWrap: "anywhere" }}>
                {profile.full_name || "Unnamed User"}
              </h2>
              <p style={{ margin: "0.2rem 0 0", color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-body)", fontSize: "0.9rem", textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
                @{profile.username || "username"} - {profile.profile_status || "Available"}
              </p>
              <p style={{ margin: "0.45rem 0 0", color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.95rem", maxWidth: "680px", lineHeight: 1.5, textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                {profile.bio || "No bio yet. Add a short bio below to make your profile feel complete."}
              </p>
              <p style={{ margin: "0.55rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem", textShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
                Click the avatar or cover to upload a new profile image.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <div style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{saving ? "Saving changes..." : "Ready"}</div>
            <Button variant="primary" onClick={handleSave} style={{ transform: saving ? "scale(0.98)" : "none" }}>{saving ? "Saving..." : "Save Profile"}</Button>
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle, display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "0.25rem" }}>Profile overview</h3>
            <p style={smallText}>Your public profile, activity, and connection snapshot.</p>
          </div>
          <div style={{ minWidth: "180px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.45rem" }}>
              <span style={smallText}>Completion</span>
              <strong style={{ color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>{completion}%</strong>
            </div>
            <div style={{ height: "9px", borderRadius: "999px", backgroundColor: "var(--color-subtle)", overflow: "hidden" }}>
              <div style={{ width: `${completion}%`, height: "100%", background: "linear-gradient(135deg, #5B8CFF, #10B981)" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.85rem" }}>
          {[
            ["Friends", friends.length],
            ["Completed", stats.completedTasks],
            ["Focus sessions", stats.focusSessions],
            ["Focus streak", `${stats.focusStreak}d`],
            ["Joined", joinedDate],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid var(--color-border)", borderRadius: "12px", backgroundColor: "var(--color-subtle)", padding: "0.85rem" }}>
              <p style={{ ...smallText, fontSize: "0.76rem", fontWeight: 800 }}>{label}</p>
              <strong style={{ display: "block", marginTop: "0.35rem", color: "var(--color-foreground)", fontFamily: "var(--font-heading)", fontSize: "1.1rem", overflowWrap: "anywhere" }}>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      {(error || status || uploading) && (
        <div style={alertStyle(error ? "#EF4444" : "#10B981")}>
          {error || status || `Uploading ${uploading === "avatar_url" ? "avatar" : "cover"}...`}
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
        <div style={{ ...panelStyle, display: "grid", gap: "0.85rem" }}>
          <div>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "0.25rem" }}>Recent Activity</h3>
            <p style={smallText}>Latest profile, task, and focus updates.</p>
          </div>
          {recentActivity.length === 0 ? (
            <p style={{ ...smallText, padding: "0.85rem", borderRadius: "12px", backgroundColor: "var(--color-subtle)" }}>
              No activity yet. Complete tasks or focus sessions to build your timeline.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {recentActivity.map((activity) => (
                <div key={activity.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "0.75rem", alignItems: "start", padding: "0.85rem", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-subtle)" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: "10px", display: "grid", placeItems: "center", backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)", fontFamily: "var(--font-heading)", fontSize: "0.78rem", fontWeight: 800 }}>
                    {activity.type[0]}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 800, overflowWrap: "anywhere" }}>
                      {activity.title}
                    </p>
                    <p style={{ ...smallText, marginTop: "0.2rem" }}>
                      {activity.detail} - {new Date(activity.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...panelStyle, display: "grid", gap: "0.85rem" }}>
          <div>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "0.25rem" }}>Achievements</h3>
            <p style={smallText}>Milestones earned from task and focus progress.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {achievementBadges.map((badge) => {
              const complete = badge.current >= badge.target;

              return (
                <div key={badge.title} style={{ padding: "0.9rem", borderRadius: "12px", border: complete ? "1px solid rgba(16,185,129,0.35)" : "1px solid var(--color-border)", backgroundColor: complete ? "rgba(16,185,129,0.1)" : "var(--color-subtle)", opacity: complete ? 1 : 0.82 }}>
                  <p style={{ margin: 0, color: complete ? "#10B981" : "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 900 }}>
                    {complete ? "UNLOCKED" : `${Math.min(badge.current, badge.target)}/${badge.target}`}
                  </p>
                  <h4 style={{ margin: "0.35rem 0 0", color: "var(--color-foreground)", fontFamily: "var(--font-heading)", fontSize: "0.98rem" }}>
                    {badge.title}
                  </h4>
                  <p style={{ ...smallText, marginTop: "0.3rem" }}>{badge.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
        <div style={{ ...panelStyle, display: "grid", gap: "1rem" }}>
          <div>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "0.25rem" }}>Weekly Activity</h3>
            <p style={smallText}>Completed tasks and focus sessions from the last 7 days.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(34px, 1fr))", gap: "0.55rem", alignItems: "end", minHeight: "180px" }}>
            {weeklyActivity.map((day) => {
              const total = day.tasks + day.focus;
              const maxTotal = Math.max(1, ...weeklyActivity.map((item) => item.tasks + item.focus));
              const height = Math.max(total ? 28 : 8, (total / maxTotal) * 126);

              return (
                <div key={day.key} style={{ display: "grid", gap: "0.45rem", alignItems: "end", minWidth: 0 }}>
                  <div style={{ height: "132px", display: "flex", alignItems: "end", justifyContent: "center", borderRadius: "12px", backgroundColor: "var(--color-subtle)", padding: "0.35rem" }}>
                    <div
                      title={`${day.tasks} tasks, ${day.focus} focus sessions`}
                      style={{
                        width: "100%",
                        height: `${height}px`,
                        borderRadius: "9px",
                        background: total ? "linear-gradient(180deg, #5B8CFF, #10B981)" : "rgba(148,163,184,0.25)",
                        transition: "height 0.2s ease",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 800 }}>{total}</p>
                    <p style={{ ...smallText, fontSize: "0.72rem" }}>{day.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <span style={{ ...smallText, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#5B8CFF" }} />Tasks</span>
            <span style={{ ...smallText, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10B981" }} />Focus</span>
          </div>
        </div>

        <div style={{ ...panelStyle, display: "grid", gap: "0.85rem" }}>
          <div>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "0.25rem" }}>Achievement Progress</h3>
            <p style={smallText}>Progress toward your next profile milestones.</p>
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {achievementBadges.map((badge) => {
              const progress = Math.min(100, Math.round((badge.current / badge.target) * 100));
              const complete = progress >= 100;

              return (
                <div key={badge.title} style={{ padding: "0.9rem", borderRadius: "12px", border: complete ? "1px solid rgba(16,185,129,0.35)" : "1px solid var(--color-border)", backgroundColor: complete ? "rgba(16,185,129,0.1)" : "var(--color-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
                    <div>
                      <h4 style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-heading)", fontSize: "0.98rem" }}>{badge.title}</h4>
                      <p style={{ ...smallText, marginTop: "0.25rem" }}>{badge.detail}</p>
                    </div>
                    <strong style={{ color: complete ? "#10B981" : "var(--color-primary)", fontFamily: "var(--font-body)", fontSize: "0.82rem", flexShrink: 0 }}>
                      {Math.min(badge.current, badge.target)}/{badge.target}
                    </strong>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", backgroundColor: "rgba(148,163,184,0.22)", overflow: "hidden", marginTop: "0.75rem" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: "999px", background: complete ? "#10B981" : "linear-gradient(135deg, #5B8CFF, #7C5CFF)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={sectionTitleStyle}>Friend Management</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {[
            ["friends", `Friends (${friends.length})`],
            ["received", `Requests Received (${incoming.length})`],
            ["sent", `Requests Sent (${sent.length})`],
          ].map(([tab, label]) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={tabButtonStyle(activeTab === tab)}>{label}</button>
          ))}
        </div>
        {renderNetwork()}
      </section>
      {crop && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            backgroundColor: modalVisible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            transition: "background-color 220ms ease",
          }}
          onPointerMove={onCropPointerMove}
          onPointerUp={onCropPointerUp}
          onPointerCancel={onCropPointerUp}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={crop.field === "avatar_url" ? "Edit avatar" : "Edit cover photo"}
            tabIndex={-1}
            style={{
              width: "min(96vw, 1100px)",
              background: "white",
              borderRadius: "12px",
              padding: "1rem",
              boxShadow: "0 12px 40px rgba(2,6,23,0.45)",
              transform: modalVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
              opacity: modalVisible ? 1 : 0,
              transition: "opacity 200ms ease, transform 200ms cubic-bezier(.2,.9,.3,1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <h3 style={{ margin: 0 }}>{crop.field === "avatar_url" ? "Adjust Avatar" : "Adjust Cover"}</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={closeCrop} style={{ padding: "0.4rem 0.6rem" }}>Cancel</button>
                <button type="button" onClick={confirmCropAndUpload} style={{ padding: "0.45rem 0.8rem", background: "#5B8CFF", color: "white", border: "none", borderRadius: "6px" }}>Use image</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: crop.container.w, height: crop.container.h, overflow: "hidden", borderRadius: crop.field === "avatar_url" ? "50%" : "8px", touchAction: "none", background: "#f3f4f6", border: "1px solid #e5e7eb", position: "relative" }} onPointerDown={onCropPointerDown}>
                <img alt="crop preview" src={crop.url} draggable={false}
                  style={{ position: "relative", left: `${crop.x}px`, top: `${crop.y}px`, width: `${crop.naturalWidth * crop.scale}px`, height: `${crop.naturalHeight * crop.scale}px`, userSelect: "none", pointerEvents: "none", transition: "left 180ms cubic-bezier(.2,.9,.3,1), top 180ms cubic-bezier(.2,.9,.3,1), transform 180ms cubic-bezier(.2,.9,.3,1)" }} />
                {/* grid overlay for cropping guides */}
                <div aria-hidden style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`, backgroundSize: `${Math.max(40, crop.container.w/3)}px ${Math.max(40, crop.container.h/3)}px` }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: 0 }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => onCropZoom(1.1)} style={{ padding: "0.35rem 0.6rem" }}>Zoom +</button>
                  <button type="button" onClick={() => onCropZoom(0.9)} style={{ padding: "0.35rem 0.6rem" }}>Zoom −</button>
                  <button type="button" onClick={() => setCrop((c) => ({ ...c, x: (c.container.w - c.naturalWidth * c.scale) / 2, y: (c.container.h - c.naturalHeight * c.scale) / 2 }))} style={{ padding: "0.35rem 0.6rem" }}>Reset</button>
                </div>
                <p style={{ margin: 0, color: "#374151", fontSize: "0.9rem" }}>Drag the image to reposition; use zoom to scale. Click "Use image" when done.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

const sectionTitleStyle = {
  margin: "0 0 1rem",
  fontFamily: "var(--font-heading)",
  fontSize: "1rem",
  color: "var(--color-foreground)",
};

const tabButtonStyle = (active) => ({
  padding: "0.55rem 0.75rem",
  borderRadius: "999px",
  border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
  backgroundColor: active ? "var(--color-primary-soft)" : "var(--color-subtle)",
  color: active ? "var(--color-primary)" : "var(--color-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "0.8rem",
  fontWeight: 800,
  cursor: "pointer",
});

const dangerButtonStyle = (disabled) => ({
  padding: "0.42rem 0.7rem",
  borderRadius: "8px",
  border: "1px solid rgba(239,68,68,0.35)",
  backgroundColor: "rgba(239,68,68,0.1)",
  color: "#EF4444",
  fontFamily: "var(--font-body)",
  fontSize: "0.78rem",
  fontWeight: 800,
  cursor: disabled ? "default" : "pointer",
});

const acceptButtonStyle = (disabled) => ({
  padding: "0.42rem 0.7rem",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "rgba(16,185,129,0.15)",
  color: "#10B981",
  fontFamily: "var(--font-body)",
  fontSize: "0.78rem",
  fontWeight: 800,
  cursor: disabled ? "default" : "pointer",
});

const ghostButtonStyle = (disabled) => ({
  padding: "0.42rem 0.7rem",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  backgroundColor: "transparent",
  color: "var(--color-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "0.78rem",
  fontWeight: 800,
  cursor: disabled ? "default" : "pointer",
});

const alertStyle = (color) => ({
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: `1px solid ${color}55`,
  backgroundColor: `${color}18`,
  color,
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
  marginBottom: "1rem",
});

function calculateFocusStreak(rows) {
  const days = new Set(
    rows
      .map((row) => row.started_at)
      .filter(Boolean)
      .map((date) => new Date(date).toDateString())
  );
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
