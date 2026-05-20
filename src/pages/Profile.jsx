import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const initialProfile = {
  email: "",
  username: "",
  full_name: "",
  avatar_url: "",
  bio: "",
};

const isMissingBioColumnError = (error) =>
  error?.message?.toLowerCase().includes("profiles.bio") ||
  error?.message?.toLowerCase().includes("column") && error?.message?.toLowerCase().includes("bio");

export default function Profile({ onNotify }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [friends, setFriends] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);
      setError("");

      let { data, error: fetchError } = await supabase
        .from("profiles")
        .select("email, username, full_name, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (isMissingBioColumnError(fetchError)) {
        const fallback = await supabase
          .from("profiles")
          .select("email, username, full_name, avatar_url")
          .eq("id", user.id)
          .single();
        data = fallback.data;
        fetchError = fallback.error;
      }

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfile({
          email: user.email || "",
          username: user.email || "",
          full_name: user.user_metadata?.full_name || "",
          avatar_url: "",
          bio: "",
        });
      } else {
        setProfile({
          email: data?.email || user.email || "",
          username: data?.username || "",
          full_name: data?.full_name || "",
          avatar_url: data?.avatar_url || "",
          bio: data?.bio || "",
        });
      }

      setLoading(false);
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchFriends = async () => {
      if (!user) return;

      setFriendsLoading(true);
      const { data, error: friendsError } = await supabase
        .from("profile_connections")
        .select(`
          id,
          requester_id,
          addressee_id,
          requester:profiles!profile_connections_requester_id_fkey(id, username, full_name, avatar_url, bio),
          addressee:profiles!profile_connections_addressee_id_fkey(id, username, full_name, avatar_url, bio)
        `)
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!isMounted) return;

      if (friendsError) {
        setFriends([]);
      } else {
        setFriends((data || []).map((connection) =>
          connection.requester_id === user.id ? connection.addressee : connection.requester
        ).filter(Boolean));
      }
      setFriendsLoading(false);
    };

    fetchFriends();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchRequests = async () => {
      if (!user) return;

      setRequestsLoading(true);
      const { data, error: requestsError } = await supabase
        .from("profile_connections")
        .select("id, requester_id, created_at")
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (requestsError) {
        setProfileRequests([]);
        setRequestsLoading(false);
        return;
      }

      const requesterIds = [...new Set((data || []).map((request) => request.requester_id))];
      const { data: requesterProfiles } = requesterIds.length
        ? await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, bio")
            .in("id", requesterIds)
        : { data: [] };

      if (!isMounted) return;

      const requesterById = new Map((requesterProfiles || []).map((requester) => [requester.id, requester]));
      setProfileRequests((data || []).map((request) => ({
        ...request,
        requester: requesterById.get(request.requester_id),
      })));
      setRequestsLoading(false);
    };

    fetchRequests();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleProfileRequest = async (requestId, nextStatus) => {
    setUpdatingRequestId(requestId);

    const { error: updateError } = await supabase
      .from("profile_connections")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) {
      setError(updateError.message);
    } else {
      const handledRequest = profileRequests.find((request) => request.id === requestId);
      setProfileRequests((current) => current.filter((request) => request.id !== requestId));
      if (nextStatus === "accepted" && handledRequest?.requester) {
        setFriends((current) => {
          if (current.some((friend) => friend.id === handledRequest.requester.id)) return current;
          return [handledRequest.requester, ...current];
        });
      }
      setStatus(nextStatus === "accepted" ? "Profile request accepted." : "Profile request ignored.");
      onNotify?.({
        title: nextStatus === "accepted" ? "Profile request accepted" : "Profile request ignored",
        message: nextStatus === "accepted" ? "The profile was added to your friends." : "The request was dismissed.",
        type: "profile",
      });
    }

    setUpdatingRequestId(null);
  };

  const handleChange = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setError("");
    setStatus("");
  };

  const handleSave = async () => {
    if (!profile.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!profile.username.trim()) {
      setError("Username is required.");
      return;
    }

    setSaving(true);
    setError("");
    setStatus("");

    let { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email?.toLowerCase() || profile.email.toLowerCase(),
        username: profile.username.trim().toLowerCase(),
        full_name: profile.full_name.trim(),
        avatar_url: profile.avatar_url.trim() || null,
        bio: profile.bio.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (isMissingBioColumnError(updateError)) {
      const fallback = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email?.toLowerCase() || profile.email.toLowerCase(),
          username: profile.username.trim().toLowerCase(),
          full_name: profile.full_name.trim(),
          avatar_url: profile.avatar_url.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
      updateError = fallback.error;
    }

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfile((current) => ({
        ...current,
        username: current.username.trim().toLowerCase(),
        full_name: current.full_name.trim(),
        avatar_url: current.avatar_url.trim(),
        bio: current.bio.trim(),
      }));
      setStatus("Profile updated.");
      onNotify?.({
        title: "Profile updated",
        message: "Your profile changes were saved.",
        type: "profile",
      });
    }

    setSaving(false);
  };

  const getInitial = (person) =>
    (person?.full_name || person?.username || person?.email || "U")[0]?.toUpperCase();

  const renderAvatar = (person, size = 124, border = "5px solid var(--color-surface)") => {
    const initial = getInitial(person);

    if (person?.avatar_url) {
      return (
        <img
          src={person.avatar_url}
          alt=""
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            objectFit: "cover",
            border,
            backgroundColor: "var(--color-surface)",
            flexShrink: 0,
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
          color: "white",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-heading)",
          fontSize: size >= 100 ? "2.5rem" : "1rem",
          fontWeight: 800,
          border,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 0.95rem",
    borderRadius: "10px",
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-hover)",
    color: "var(--color-foreground)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.4rem",
    color: "var(--color-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    fontWeight: 600,
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section className="glass-card" style={{ padding: 0, overflow: "hidden", borderRadius: "14px" }}>
        <div
          style={{
            height: "220px",
            background:
              "linear-gradient(135deg, rgba(91,140,255,0.95), rgba(16,185,129,0.75) 52%, rgba(124,92,255,0.9))",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.42))",
            }}
          />
        </div>

        <div
          style={{
            padding: "0 2rem 1.5rem",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginTop: "-54px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", minWidth: 0 }}>
            {renderAvatar(profile)}
            <div style={{ minWidth: 0, paddingBottom: "0.7rem" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.7rem", fontWeight: 800, color: "var(--color-foreground)", overflowWrap: "anywhere" }}>
                {profile.full_name || "Unnamed User"}
              </h2>
              <p style={{ margin: "0.2rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", overflowWrap: "anywhere" }}>
                @{profile.username || "username"} - {profile.email}
              </p>
              {profile.bio && (
                <p style={{ margin: "0.45rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", maxWidth: "680px", lineHeight: 1.45 }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.75rem 1.15rem",
              borderRadius: "10px",
              border: "none",
              background: saving ? "rgba(91,140,255,0.5)" : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
              color: "white",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: saving ? "not-allowed" : "pointer",
              marginBottom: "0.7rem",
            }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.8fr) minmax(0, 1.2fr)", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <section className="glass-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>
              Profile Summary
            </h3>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              {[
                ["Display name", profile.full_name || "Not set"],
                ["Username", profile.username ? `@${profile.username}` : "Not set"],
                ["Email", profile.email || "Not set"],
                ["Friends", friendsLoading ? "Loading..." : `${friends.length}`],
                ["Bio", profile.bio || "Not set"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ margin: "0 0 0.2rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 700 }}>
                    {label}
                  </p>
                  <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.9rem", overflowWrap: "anywhere", lineHeight: 1.45 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <section className="glass-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>
              Edit Profile
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {error && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}
              {status && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.3)", backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  {status}
                </div>
              )}

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={profile.email} disabled style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }} />
              </div>

              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" value={profile.full_name} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="Your name" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Username</label>
                <input type="text" value={profile.username} onChange={(e) => handleChange("username", e.target.value)} placeholder="username" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Share a short public bio"
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Avatar URL</label>
                <input type="url" value={profile.avatar_url} onChange={(e) => handleChange("avatar_url", e.target.value)} placeholder="https://example.com/avatar.png" style={inputStyle} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderRadius: "10px",
                    border: "none",
                    background: saving ? "rgba(91,140,255,0.5)" : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                    color: "white",
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>
              Profile Requests {profileRequests.length > 0 && `(${profileRequests.length})`}
            </h3>
            {requestsLoading ? (
              <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                Loading requests...
              </p>
            ) : profileRequests.length === 0 ? (
              <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                No pending profile requests.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {profileRequests.map((request) => (
                  <div key={request.id} style={{ display: "grid", gridTemplateColumns: "42px minmax(0, 1fr)", gap: "0.75rem", padding: "0.75rem", borderRadius: "10px", backgroundColor: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>
                    {renderAvatar(request.requester, 42, "1px solid var(--color-border)")}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {request.requester?.full_name || request.requester?.username || "Unknown user"}
                      </p>
                      <p style={{ margin: "0.15rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.78rem" }}>
                        @{request.requester?.username || "username"}
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => handleProfileRequest(request.id, "accepted")}
                          disabled={updatingRequestId === request.id}
                          style={{ padding: "0.42rem 0.7rem", borderRadius: "8px", border: "none", backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981", fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 800, cursor: updatingRequestId === request.id ? "default" : "pointer" }}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProfileRequest(request.id, "ignored")}
                          disabled={updatingRequestId === request.id}
                          style={{ padding: "0.42rem 0.7rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 800, cursor: updatingRequestId === request.id ? "default" : "pointer" }}
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>
              Friends {friends.length > 0 && `(${friends.length})`}
            </h3>
            {friendsLoading ? (
              <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                Loading friends...
              </p>
            ) : friends.length === 0 ? (
              <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                No friends yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {friends.map((friend) => (
                  <div key={friend.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem", borderRadius: "10px", backgroundColor: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>
                    {renderAvatar(friend, 42, "1px solid var(--color-border)")}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {friend.full_name || "Unnamed User"}
                      </p>
                      <p style={{ margin: "0.15rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        @{friend.username || "username"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
