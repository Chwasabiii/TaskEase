import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../ui/ThemeToggle";
import { supabase } from "../../lib/supabase";

export default function Navbar({
  activePage,
  user,
  onSignOut,
  notifications = [],
  onClearNotifications,
  onNotificationAction,
  setActivePage,
  onSendProfileRequest,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileQuery, setProfileQuery] = useState("");
  const [profileResults, setProfileResults] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedProfileFriends, setSelectedProfileFriends] = useState([]);
  const [loadingSelectedProfile, setLoadingSelectedProfile] = useState(false);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [requestingProfileId, setRequestingProfileId] = useState(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const pageLabels = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    pomodoro: "Pomodoro Timer",
    archive: "Archive",
    focus: "Focus Mode",
    collaboration: "Collaboration",
    profile: "Profile",
  };

  useEffect(() => {
    if (!notificationsOpen && !searchOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen, searchOpen]);

  useEffect(() => {
    const searchTerm = profileQuery.trim().replace(/[%_,()]/g, "");

    if (!searchOpen || searchTerm.length < 2) {
      setProfileResults([]);
      return undefined;
    }

    let isMounted = true;
    const searchTimer = window.setTimeout(async () => {
      setSearchingProfiles(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio")
        .neq("id", user.id)
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order("full_name", { ascending: true })
        .limit(6);

      if (isMounted) {
        const profiles = data || [];
        const profilesWithStatus = await Promise.all(profiles.map(async (profile) => {
          const { data: connection } = await supabase
            .from("profile_connections")
            .select("status, requester_id, addressee_id")
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
            .maybeSingle();

          return {
            ...profile,
            connectionStatus: connection?.status || null,
            requestSent: connection?.status === "pending" && connection?.requester_id === user.id,
            requestReceived: connection?.status === "pending" && connection?.addressee_id === user.id,
            isFriend: connection?.status === "accepted",
          };
        }));

        if (!isMounted) return;
        setProfileResults(profilesWithStatus);
        setSearchingProfiles(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(searchTimer);
    };
  }, [profileQuery, searchOpen, user.id]);

  const handleNotificationClick = (notification) => {
    onNotificationAction?.(notification);
    setNotificationsOpen(false);
  };

  const handleSendRequest = async (profileId) => {
    setRequestingProfileId(profileId);
    const { error } = await onSendProfileRequest?.(profileId);
    if (!error) {
      setProfileResults((current) =>
        current.map((profile) =>
          profile.id === profileId ? { ...profile, requestSent: true } : profile
        )
      );
    }
    setRequestingProfileId(null);
  };

  const openProfilePreview = async (profile) => {
    setSelectedProfile(profile);
    setSelectedProfileFriends([]);
    setLoadingSelectedProfile(true);
    setSearchOpen(true);

    const { data } = await supabase
      .from("profile_connections")
      .select(`
        id,
        requester_id,
        addressee_id,
        requester:profiles!profile_connections_requester_id_fkey(id, username, full_name, avatar_url, bio),
        addressee:profiles!profile_connections_addressee_id_fkey(id, username, full_name, avatar_url, bio)
      `)
      .eq("status", "accepted")
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
      .order("updated_at", { ascending: false })
      .limit(12);

    setSelectedProfileFriends((data || []).map((connection) =>
      connection.requester_id === profile.id ? connection.addressee : connection.requester
    ).filter(Boolean));
    setLoadingSelectedProfile(false);
  };

  const getInitial = (profile) =>
    (profile?.full_name || profile?.username || "U")[0]?.toUpperCase();

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "var(--color-surface)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--color-foreground)",
        }}
      >
        {pageLabels[activePage] || "TaskEase"}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <ThemeToggle />

        <div ref={searchRef} style={{ position: "relative" }}>
          <div
            className="interactive-pop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--color-surface)",
              border: searchOpen ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0.35rem 0.75rem",
              width: "280px",
            }}
          >
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-muted)", fontWeight: 700 }}>
              Search
            </span>
            <input
              type="text"
              value={profileQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setProfileQuery(event.target.value);
                setSearchOpen(true);
              }}
              placeholder="Find profiles..."
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                color: "var(--color-foreground)",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {searchOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.75rem)",
                width: "390px",
                maxWidth: "calc(100vw - 2rem)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-strong)",
                boxShadow: "0 22px 60px rgba(15, 23, 42, 0.28)",
                padding: "0.75rem",
              }}
            >
              {profileQuery.trim().length < 2 ? (
                <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  Type at least 2 characters to find profiles.
                </p>
              ) : searchingProfiles ? (
                <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  Searching profiles...
                </p>
              ) : profileResults.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  No matching profiles.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {profileResults.map((profile) => (
                    <div
                      key={profile.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "44px minmax(0, 1fr) auto",
                        gap: "0.75rem",
                        alignItems: "center",
                        padding: "0.65rem",
                        borderRadius: "12px",
                        backgroundColor: "var(--color-subtle)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openProfilePreview(profile)}
                        style={{ display: "contents", cursor: "pointer" }}
                      >
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)", color: "white", fontFamily: "var(--font-heading)", fontWeight: 800 }}>
                            {getInitial(profile)}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {profile.full_name || "Unnamed User"}
                          </p>
                          <p style={{ margin: "0.15rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            @{profile.username || "username"} {profile.isFriend ? "- Friends" : profile.requestSent ? "- Request sent" : profile.requestReceived ? "- Requested you" : ""}
                          </p>
                          {profile.bio && (
                            <p style={{ margin: "0.2rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.74rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {profile.bio}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendRequest(profile.id)}
                        disabled={requestingProfileId === profile.id || profile.requestSent || profile.requestReceived || profile.isFriend}
                        style={{
                          padding: "0.45rem 0.75rem",
                          borderRadius: "9px",
                          border: "none",
                          backgroundColor: profile.isFriend || profile.requestSent ? "rgba(16,185,129,0.14)" : "var(--color-primary-soft)",
                          color: profile.isFriend || profile.requestSent ? "#10B981" : "var(--color-primary)",
                          fontFamily: "var(--font-body)",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          cursor: requestingProfileId === profile.id || profile.requestSent || profile.requestReceived || profile.isFriend ? "default" : "pointer",
                        }}
                      >
                        {profile.isFriend ? "Friends" : profile.requestSent ? "Sent" : profile.requestReceived ? "Pending" : requestingProfileId === profile.id ? "Adding..." : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedProfile && (
                <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
                  <div style={{ height: "88px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(16,185,129,0.78), rgba(91,140,255,0.9))" }} />
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-end", marginTop: "-28px", padding: "0 0.75rem" }}>
                    {selectedProfile.avatar_url ? (
                      <img src={selectedProfile.avatar_url} alt="" style={{ width: "68px", height: "68px", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--color-surface-strong)" }} />
                    ) : (
                      <div style={{ width: "68px", height: "68px", borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)", color: "white", fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 800, border: "4px solid var(--color-surface-strong)" }}>
                        {getInitial(selectedProfile)}
                      </div>
                    )}
                    <div style={{ minWidth: 0, paddingBottom: "0.35rem" }}>
                      <p style={{ margin: 0, color: "var(--color-foreground)", fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 800, overflowWrap: "anywhere" }}>
                        {selectedProfile.full_name || "Unnamed User"}
                      </p>
                      <p style={{ margin: "0.15rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>
                        @{selectedProfile.username || "username"} - {loadingSelectedProfile ? "Loading friends..." : `${selectedProfileFriends.length} friend${selectedProfileFriends.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: "0.75rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.84rem", lineHeight: 1.45 }}>
                    {selectedProfile.bio || "This profile has not added a bio yet."}
                  </p>
                  <div style={{ marginTop: "0.75rem" }}>
                    <p style={{ margin: "0 0 0.45rem", color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 800 }}>
                      Friends
                    </p>
                    {loadingSelectedProfile ? (
                      <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>Loading...</p>
                    ) : selectedProfileFriends.length === 0 ? (
                      <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>No friends to show.</p>
                    ) : (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {selectedProfileFriends.slice(0, 8).map((friend) => (
                          <span key={friend.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", maxWidth: "170px", padding: "0.35rem 0.5rem", borderRadius: "999px", backgroundColor: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>
                            <span style={{ width: "20px", height: "20px", borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)", color: "white", fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>
                              {getInitial(friend)}
                            </span>
                            <span style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {friend.full_name || friend.username || "User"}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={notificationRef} style={{ position: "relative" }}>
          <button
            className="interactive-pop"
            onClick={() => setNotificationsOpen((current) => !current)}
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              border: notificationsOpen ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
              backgroundColor: notificationsOpen ? "var(--color-primary-soft)" : "var(--color-surface)",
              color: notificationsOpen ? "var(--color-primary)" : "var(--color-foreground)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.95rem",
              fontWeight: 800,
              position: "relative",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "relative",
                width: "15px",
                height: "16px",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "2px",
                  top: "3px",
                  width: "11px",
                  height: "10px",
                  border: "2px solid currentColor",
                  borderBottom: "none",
                  borderRadius: "8px 8px 3px 3px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "1px",
                  bottom: "2px",
                  width: "13px",
                  height: "2px",
                  borderRadius: "999px",
                  backgroundColor: "currentColor",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "6px",
                  bottom: "-1px",
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  backgroundColor: "currentColor",
                }}
              />
            </span>
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  borderRadius: "999px",
                  backgroundColor: "#EF4444",
                  border: "2px solid var(--color-surface-strong)",
                  color: "white",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.62rem",
                  lineHeight: "12px",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {Math.min(notifications.length, 9)}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="notification-menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.75rem)",
                width: "360px",
                maxWidth: "calc(100vw - 2rem)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-strong)",
                boxShadow: "0 22px 60px rgba(15, 23, 42, 0.28)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>
                    Notifications
                  </h2>
                  <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-muted)" }}>
                    {notifications.length ? `${notifications.length} recent update${notifications.length === 1 ? "" : "s"}` : "All quiet"}
                  </p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearNotifications}
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-subtle)",
                      color: "var(--color-muted)",
                      borderRadius: "10px",
                      padding: "0.45rem 0.65rem",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "360px", overflowY: "auto", padding: notifications.length ? "0.5rem" : "1rem" }}>
                {notifications.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    No notifications yet. Updates from tasks, collaboration, and focus sessions will show here.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((notification, index) => (
                    <div
                      key={notification.id}
                      className="notification-item interactive-pop"
                      style={{
                        animationDelay: `${index * 28}ms`,
                        width: "100%",
                        border: "none",
                        borderRadius: "12px",
                        backgroundColor: "transparent",
                        padding: "0.85rem",
                        cursor: "pointer",
                        display: "grid",
                        gap: "0.35rem",
                        textAlign: "left",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        style={{ border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}
                      >
                      <span style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", color: "var(--color-foreground)", fontWeight: 700 }}>
                          {notification.title}
                        </span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-muted)", flexShrink: 0 }}>
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "var(--color-muted)", lineHeight: 1.45 }}>
                        {notification.message}
                      </span>
                      </button>
                      {notification.type === "profile_request" && (
                        <span style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => onNotificationAction?.({ ...notification, action: "accept_profile_request" })}
                            style={{ padding: "0.38rem 0.65rem", borderRadius: "8px", border: "none", backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981", fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => onNotificationAction?.({ ...notification, action: "ignore_profile_request" })}
                            style={{ padding: "0.38rem 0.65rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}
                          >
                            Ignore
                          </button>
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActivePage?.("profile")}
          title="Open profile"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "var(--color-on-primary)",
            cursor: "pointer",
          }}
        >
          {user?.email?.[0].toUpperCase() ?? "U"}
        </button>

        <button
          className="interactive-pop"
          onClick={onSignOut}
          style={{
            padding: "0.4rem 0.875rem",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#EF4444";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-surface)";
            e.currentTarget.style.color = "var(--color-muted)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
