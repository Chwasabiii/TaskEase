import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Archive from "./pages/Archive";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [activePage, setActivePage]     = useState("dashboard");
  const [showRegister, setShowRegister] = useState(false);

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
      case "dashboard": return <Dashboard />;
      case "tasks":     return <Tasks />;
      case "archive":   return <Archive />;
      default:          return <Dashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        activePage={activePage}
        setActivePage={setActivePage}
        onSignOut={signOut}
        user={user}
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