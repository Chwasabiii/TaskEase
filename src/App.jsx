import { Suspense, lazy, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const FocusMode = lazy(() => import("./pages/FocusMode"));
const Archive = lazy(() => import("./pages/Archive"));
const Collaboration = lazy(() => import("./pages/Collaboration"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_at: new Date().toISOString(),
        ...notification,
      },
      ...prev,
    ]);
  };

  const clearNotifications = () => setNotifications([]);

  const handleNotificationAction = (notification) => {
    if (notification.targetTaskId) {
      setSelectedTaskId(notification.targetTaskId);
    }
    if (notification.targetPage) {
      setActivePage(notification.targetPage);
    }
  };

  if (loading) return null;

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
            setActivePage={setActivePage}
            onSelectSharedTask={setSelectedTaskId}
            onNotify={addNotification}
          />
        );
      case "tasks":
        return <Tasks onNotify={addNotification} />;
      case "pomodoro":
        return <Pomodoro onNotify={addNotification} />;
      case "focus":
        return <FocusMode onNotify={addNotification} />;
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
      default:
        return <Dashboard onNotify={addNotification} />;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        activePage={activePage}
        setActivePage={setActivePage}
        onSignOut={signOut}
        user={user}
        notifications={notifications}
        onClearNotifications={clearNotifications}
        onNotificationAction={handleNotificationAction}
        onNotify={addNotification}
      >
        <Suspense fallback={null}>{renderPage()}</Suspense>
      </AppShell>
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
