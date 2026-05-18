import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell({ children, activePage, setActivePage, user, onSignOut, notifications }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content — offset by sidebar width */}
      <div
        style={{
          marginLeft: `${sidebarWidth}px`,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
        }}
      >
        <Navbar activePage={activePage} user={user} onSignOut={onSignOut} setActivePage={setActivePage} notifications={notifications} />
        <main
          style={{
            flex: 1,
            padding: "2rem",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}