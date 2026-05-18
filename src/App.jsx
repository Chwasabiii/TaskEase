import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Pomodoro from "./pages/Pomodoro";
import Focus from "./pages/Focus";
import Archive from "./pages/Archive";
import Collaboration from "./pages/Collaboration";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";

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
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
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
        return <Focus />;
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
        onNotificationAction={handleNotificationAction}
      >
        {renderPage()}
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}