import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute";
import { supabase } from "./lib/supabase";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const FocusMode = lazy(() => import("./pages/FocusMode"));
const Archive = lazy(() => import("./pages/Archive"));
const Collaboration = lazy(() => import("./pages/Collaboration"));
const Profile = lazy(() => import("./pages/Profile"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [focusLock, setFocusLock] = useState({ locked: false, taskTitle: "" });
  const [showFocusLockPrompt, setShowFocusLockPrompt] = useState(false);
  const [voiceTaskDraft, setVoiceTaskDraft] = useState(null);
  const isResetPasswordPage = window.location.pathname === "/reset-password";

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_at: new Date().toISOString(),
        ...notification,
      },
      ...prev,
    ]);
  }, []);

  const clearNotifications = () => setNotifications([]);

  const handleSetActivePage = useCallback((page) => {
    if (focusLock.locked && page !== "focus") {
      setActivePage("focus");
      setShowFocusLockPrompt(true);
      addNotification({
        title: "Focus lock is on",
        message: focusLock.taskTitle
          ? `Finish or cancel the lock for "${focusLock.taskTitle}" first.`
          : "Cancel the lock before leaving Focus Mode.",
        type: "focus",
      });
      return;
    }

    setActivePage(page);
  }, [addNotification, focusLock.locked, focusLock.taskTitle]);

  const handleVoiceTaskDraft = useCallback((draft) => {
    setVoiceTaskDraft({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...draft,
    });
    handleSetActivePage("tasks");
  }, [handleSetActivePage]);

  useEffect(() => {
    if (focusLock.locked && activePage !== "focus") {
      setActivePage("focus");
      setShowFocusLockPrompt(true);
    }
  }, [activePage, focusLock.locked]);

  const loadProfileRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profile_connections")
      .select("id, created_at, requester_id")
      .eq("addressee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) return;

    const requesterIds = [...new Set((data || []).map((request) => request.requester_id))];
    const { data: requesterProfiles } = requesterIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", requesterIds)
      : { data: [] };

    const requesterById = new Map((requesterProfiles || []).map((profile) => [profile.id, profile]));

    setNotifications((prev) => {
      const nonRequestNotifications = prev.filter((notification) => notification.type !== "profile_request");
      const requestNotifications = (data || []).map((request) => {
        const requester = requesterById.get(request.requester_id);

        return {
          id: `profile-request-${request.id}`,
          created_at: request.created_at,
          title: "Profile request",
          message: `${requester?.full_name || requester?.username || "Someone"} wants to add your profile.`,
          type: "profile_request",
          requestId: request.id,
          requesterId: request.requester_id,
          targetPage: "profile",
        };
      });

      return [...requestNotifications, ...nonRequestNotifications];
    });
  }, [user]);

  useEffect(() => {
    const startProfileRequests = () => {
      window.setTimeout(() => loadProfileRequests(), 0);
    };

    startProfileRequests();
    const intervalId = window.setInterval(loadProfileRequests, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadProfileRequests]);

  const handleSendProfileRequest = async (profileId) => {
    if (!user || !profileId) {
      return { error: { message: "You must be signed in to add profiles." } };
    }

    const { data, error } = await supabase
      .from("profile_connections")
      .insert({
        requester_id: user.id,
        addressee_id: profileId,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!error) {
      addNotification({
        title: "Request sent",
        message: "Your profile request was sent.",
        type: "profile",
      });
    }

    return { data, error };
  };

  const handleProfileRequestResponse = async (requestId, status) => {
    const { error } = await supabase
      .from("profile_connections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (!error) {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== `profile-request-${requestId}`)
      );
      addNotification({
        title: status === "accepted" ? "Profile request accepted" : "Profile request ignored",
        message: status === "accepted" ? "The profile was added." : "The request was dismissed.",
        type: "profile",
      });
      await loadProfileRequests();
    }

    return { error };
  };

  const handleRemoveProfileConnection = async (connectionId) => {
    if (!connectionId) {
      return { error: { message: "Missing profile connection." } };
    }

    const { error } = await supabase
      .from("profile_connections")
      .delete()
      .eq("id", connectionId);

    if (!error) {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== `profile-request-${connectionId}`)
      );
      addNotification({
        title: "Profile connection updated",
        message: "The profile connection was removed.",
        type: "profile",
      });
      await loadProfileRequests();
    }

    return { error };
  };

  const handleNotificationAction = (notification) => {
    if (notification.action === "accept_profile_request") {
      handleProfileRequestResponse(notification.requestId, "accepted");
      return;
    }
    if (notification.action === "ignore_profile_request") {
      handleProfileRequestResponse(notification.requestId, "ignored");
      return;
    }
    if (notification.targetTaskId) {
      setSelectedTaskId(notification.targetTaskId);
    }
    if (notification.targetPage) {
      handleSetActivePage(notification.targetPage);
    }
  };

  if (loading) return null;

  if (isResetPasswordPage) {
    return (
      <Suspense fallback={null}>
        <ResetPassword />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={null}>
        {showRegister ? (
          <Register onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <Login onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </Suspense>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            setActivePage={handleSetActivePage}
            onSelectSharedTask={setSelectedTaskId}
            onNotify={addNotification}
          />
        );
      case "tasks":
        return (
          <Tasks
            onNotify={addNotification}
            voiceTaskDraft={voiceTaskDraft}
            onVoiceTaskDraftHandled={() => setVoiceTaskDraft(null)}
          />
        );
      case "pomodoro":
        return <Pomodoro onNotify={addNotification} />;
      case "focus":
        return <FocusMode onNotify={addNotification} onLockChange={setFocusLock} />;
      case "archive":
        return <Archive />;
      case "collaboration":
        return (
          <Collaboration
            selectedTaskId={selectedTaskId}
            setSelectedTaskId={setSelectedTaskId}
            onNotify={addNotification}
          />
        );
      case "profile":
        return <Profile onNotify={addNotification} />;
      case "privacy":
        return <Privacy onNotify={addNotification} />;
      default:
        return <Dashboard onNotify={addNotification} />;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        activePage={activePage}
        setActivePage={handleSetActivePage}
        onSignOut={signOut}
        user={user}
        notifications={notifications}
        onClearNotifications={clearNotifications}
        onNotificationAction={handleNotificationAction}
        onSendProfileRequest={handleSendProfileRequest}
        onProfileRequestResponse={handleProfileRequestResponse}
        onRemoveProfileConnection={handleRemoveProfileConnection}
        onNotify={addNotification}
        onVoiceTaskDraft={handleVoiceTaskDraft}
      >
        <Suspense fallback={null}>{renderPage()}</Suspense>
      </AppShell>

      {showFocusLockPrompt && focusLock.locked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-lock-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 14000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "rgba(2, 6, 23, 0.35)",
          }}
          onClick={() => setShowFocusLockPrompt(false)}
        >
          <div
            className="glass-card"
            style={{
              width: "min(360px, 100%)",
              padding: "1.25rem",
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(2, 6, 23, 0.35)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              margin: "0 auto 0.85rem",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
              color: "white",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
            }}>
              !
            </div>
            <h2
              id="focus-lock-title"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--color-foreground)",
                marginBottom: "0.45rem",
              }}
            >
              Site is locked
            </h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              lineHeight: 1.55,
              color: "var(--color-muted)",
              marginBottom: "1rem",
            }}>
              You locked TaskEase to focus
              {focusLock.taskTitle ? ` on "${focusLock.taskTitle}"` : ""}. Cancel the lock first if you want to open another page.
            </p>
            <button
              onClick={() => setShowFocusLockPrompt(false)}
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                color: "white",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Stay Focused
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PomodoroProvider>
          <AppContent />
        </PomodoroProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
