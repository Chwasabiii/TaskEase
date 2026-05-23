import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const initialPrivacy = {
  show_bio: true,
  show_friends: true,
  show_stats: true,
  is_discoverable: true,
};

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
};

const profileSelect = "email, username, full_name, avatar_url, cover_url, bio, profile_status, location, role_title, school_work, interests, website_url, show_bio, show_friends, show_stats, is_discoverable";

const privacyOptions = [
  ["show_bio", "Bio and about", "Summary, interests, and personal details."],
  ["show_friends", "Friends list", "Connections shown on your profile."],
  ["show_stats", "Activity stats", "Completed tasks and focus streaks."],
  ["is_discoverable", "Profile search", "Appear in search results."],
];

export default function Privacy({ onNotify }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingField, setSavingField] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const visibleCount = Object.values(privacy).filter(Boolean).length;

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      if (!user) return;

      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(profileSelect)
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPrivacy({ ...initialPrivacy, ...(data || {}) });
        setProfile({ ...initialProfile, ...(data || {}), email: data?.email || user.email || "" });
      }

      setLoading(false);
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [user]);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setError("");
    setStatus("");
  };

  const handleSaveProfile = async () => {
    if (!user || savingProfile) return;

    setSavingProfile(true);
    setError("");
    setStatus("");

    const payload = {
      id: user.id,
      email: user.email?.toLowerCase() || (profile.email || "").toLowerCase(),
      username: (profile.username || "").trim().toLowerCase(),
      full_name: (profile.full_name || "").trim(),
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

    setSavingProfile(false);
  };

  const updatePrivacy = async (field, value) => {
    if (!user) return;

    const nextPrivacy = { ...privacy, [field]: value };
    setPrivacy(nextPrivacy);
    setSavingField(field);
    setError("");
    setStatus("");

    const payload = {
      id: user.id,
      email: user.email?.toLowerCase() || "",
      [field]: value,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (saveError) {
      setPrivacy(privacy);
      setError(saveError.message);
    } else {
      window.dispatchEvent(new CustomEvent("taskease:profile-updated", { detail: { profile: { id: user.id, ...nextPrivacy } } }));
      setStatus("Privacy updated.");
      onNotify?.({ title: "Privacy updated", message: "Your privacy settings were saved.", type: "profile" });
    }

    setSavingField("");
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!user?.email) {
      setError("Unable to confirm your account email.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    setError("");
    setStatus("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Current password is incorrect.");
      setChangingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError(updateError.message);
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Password updated.");
      onNotify?.({ title: "Password updated", message: "Your password was changed.", type: "profile" });
    }

    setChangingPassword(false);
  };

  const cardStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.95rem 1rem",
    borderRadius: "12px",
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-surface)",
  };

  const titleStyle = {
    margin: 0,
    color: "var(--color-foreground)",
    fontFamily: "var(--font-heading)",
    fontSize: "1.05rem",
    fontWeight: 800,
  };

  const textStyle = {
    margin: 0,
    color: "var(--color-foreground)",
    fontFamily: "var(--font-body)",
    fontSize: "0.92rem",
    fontWeight: 700,
  };

  const hintStyle = {
    margin: "0.35rem 0 0",
    color: "var(--color-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    lineHeight: 1.45,
  };

  const panelStyle = {
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    backgroundColor: "var(--color-surface)",
    padding: "1.25rem",
    boxShadow: "0 18px 48px rgba(15, 23, 42, 0.08)",
  };

  const toggleInputStyle = {
    position: "absolute",
    opacity: 0,
    left: "-9999px",
    width: "1px",
    height: "1px",
  };

  const toggleSliderStyle = {
    position: "relative",
    width: "46px",
    height: "24px",
    borderRadius: "999px",
    transition: "background-color 0.2s ease",
    display: "inline-block",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    backgroundColor: "var(--color-subtle)",
    color: "var(--color-foreground)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    padding: "0.75rem 0.85rem",
    outline: "none",
  };

  const labelStyle = {
    display: "grid",
    gap: "0.4rem",
    color: "var(--color-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    fontWeight: 700,
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: "1.25rem", color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
        Loading privacy settings...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", width: "100%" }}>
      <section
        style={{
          ...panelStyle,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ ...titleStyle, fontSize: "1.35rem" }}>Profile settings</h2>
          <p style={{ ...hintStyle, maxWidth: "620px" }}>Manage your profile details, visibility, and account password.</p>
        </div>
        <div
          style={{
            minWidth: "150px",
            borderRadius: "14px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-subtle)",
            padding: "0.85rem 1rem",
            textAlign: "right",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 800 }}>
            Visible sections
          </p>
          <strong style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)", fontSize: "1.4rem" }}>
            {visibleCount}/{privacyOptions.length}
          </strong>
        </div>
      </section>

      {(error || status) && (
        <div
          style={{
            color: error ? "#EF4444" : "#10B981",
            backgroundColor: error ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            border: error ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
            borderRadius: "12px",
            padding: "0.85rem 1rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
          }}
        >
          {error || status}
        </div>
      )}

      <section style={{ ...panelStyle, display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={titleStyle}>Edit profile</h2>
            <p style={hintStyle}>Update the details people see on your profile.</p>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={{
              border: "none",
              borderRadius: "10px",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              fontWeight: 800,
              padding: "0.7rem 0.95rem",
              cursor: savingProfile ? "default" : "pointer",
              opacity: savingProfile ? 0.75 : 1,
            }}
          >
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.9rem" }}>
          <label style={labelStyle}>
            Email
            <input type="email" value={profile.email} disabled style={{ ...inputStyle, opacity: 0.7 }} />
          </label>
          <label style={labelStyle}>
            Full name
            <input value={profile.full_name} onChange={(event) => updateProfileField("full_name", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Username
            <input value={profile.username} onChange={(event) => updateProfileField("username", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Status
            <input value={profile.profile_status} onChange={(event) => updateProfileField("profile_status", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Role / title
            <input value={profile.role_title} onChange={(event) => updateProfileField("role_title", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Location
            <input value={profile.location} onChange={(event) => updateProfileField("location", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            School / work
            <input value={profile.school_work} onChange={(event) => updateProfileField("school_work", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Website
            <input type="url" value={profile.website_url} onChange={(event) => updateProfileField("website_url", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Avatar URL
            <input type="url" value={profile.avatar_url} onChange={(event) => updateProfileField("avatar_url", event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Cover URL
            <input type="url" value={profile.cover_url} onChange={(event) => updateProfileField("cover_url", event.target.value)} style={inputStyle} />
          </label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Bio
            <textarea value={profile.bio} onChange={(event) => updateProfileField("bio", event.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
          </label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Interests
            <textarea value={profile.interests} onChange={(event) => updateProfileField("interests", event.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
          </label>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
        <section style={{ ...panelStyle, display: "grid", gap: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "end" }}>
            <div>
              <h2 style={titleStyle}>Profile visibility</h2>
              <p style={hintStyle}>Control what appears to other people.</p>
            </div>
            {savingField && (
              <span style={{ color: "var(--color-primary)", fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 800 }}>
                Saving
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
            {privacyOptions.map(([field, label, hint]) => (
              <div key={field} style={cardStyle}>
                <div style={{ minWidth: 0 }}>
                  <p style={textStyle}>{label}</p>
                  <p style={hintStyle}>{savingField === field ? "Saving..." : hint}</p>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: "46px", height: "24px", flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(privacy[field])}
                    disabled={Boolean(savingField)}
                    onChange={(event) => updatePrivacy(field, event.target.checked)}
                    style={toggleInputStyle}
                  />
                  <span
                    role="switch"
                    aria-checked={Boolean(privacy[field])}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if ((event.key === "Enter" || event.key === " ") && !savingField) {
                        event.preventDefault();
                        updatePrivacy(field, !privacy[field]);
                      }
                    }}
                    onClick={() => {
                      if (!savingField) updatePrivacy(field, !privacy[field]);
                    }}
                    style={{ ...toggleSliderStyle, backgroundColor: privacy[field] ? "#5B8CFF" : "rgba(148,163,184,0.25)", cursor: savingField ? "default" : "pointer" }}
                  >
                    <span style={{
                      position: "absolute",
                      top: "2px",
                      left: privacy[field] ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      boxShadow: "0 2px 6px rgba(15,23,42,0.18)",
                      transition: "left 0.2s ease",
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>Password</h2>
          <p style={hintStyle}>Change the password you use to sign in.</p>

          <form onSubmit={handleChangePassword} style={{ display: "grid", gap: "0.85rem", marginTop: "1rem" }}>
            <label style={labelStyle}>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                style={inputStyle}
                autoComplete="current-password"
              />
            </label>
            <label style={labelStyle}>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                style={inputStyle}
                autoComplete="new-password"
              />
            </label>
            <label style={labelStyle}>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={inputStyle}
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              disabled={changingPassword}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                fontWeight: 800,
                padding: "0.75rem 0.95rem",
                cursor: changingPassword ? "default" : "pointer",
                opacity: changingPassword ? 0.75 : 1,
              }}
            >
              {changingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
