import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { VoiceCommandButton } from "../voice";

export default function AppShell({
  children,
  activePage,
  setActivePage,
  user,
  onSignOut,
  notifications,
  onClearNotifications,
  onNotificationAction,
  onSendProfileRequest,
  onProfileRequestResponse,
  onRemoveProfileConnection,
  onNotify,
  onVoiceTaskDraft,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content — offset by sidebar width */}
      <div
        className="app-content"
        style={{
          marginLeft: `${sidebarWidth}px`,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left var(--motion-spring)",
          minHeight: "100vh",
        }}
      >
        <Navbar
          activePage={activePage}
          user={user}
          onSignOut={onSignOut}
          setActivePage={setActivePage}
          notifications={notifications}
          onClearNotifications={onClearNotifications}
          onNotificationAction={onNotificationAction}
          onSendProfileRequest={onSendProfileRequest}
          onProfileRequestResponse={onProfileRequestResponse}
          onRemoveProfileConnection={onRemoveProfileConnection}
        />
        <main
          className="app-main"
          style={{
            flex: 1,
            padding: "2rem",
            overflowY: "auto",
          }}
        >
          <div key={activePage} className="page-motion">
            {children}
          </div>
        </main>
        <VoiceCommandButton
          setActivePage={setActivePage}
          onNotify={onNotify}
          onTaskDraft={onVoiceTaskDraft}
        />
      </div>
    </div>
  );
}


