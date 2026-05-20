import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCollaboration } from "../hooks/useCollaboration";
import { useTasks } from "../hooks/useTasks";
import CommentSection from "../components/collaboration/CommentSection";
import ChecklistSection from "../components/collaboration/ChecklistSection";
import CollaboratorList from "../components/collaboration/CollaboratorList";
import FileSection from "../components/collaboration/FileSection";
import InviteModal from "../components/collaboration/InviteModal";
import JoinModal from "../components/collaboration/JoinModal";

export default function Collaboration({ selectedTaskId }) {
  const { user }  = useAuth();
  const { tasks } = useTasks();
  const {
    sharedTasks, collaborators,
    fetchCollaborators, generateInviteCode,
    inviteByEmail, joinByCode, updateRole, removeCollaborator,
  } = useCollaboration();

  const [selectedTask, setSelectedTask] = useState(null);
  const [showInvite, setShowInvite]     = useState(false);
  const [showJoin, setShowJoin]         = useState(false);
  const [activeTab, setActiveTab]       = useState("mine");
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteRole, setInviteRole]     = useState("viewer");
  const [inviteError, setInviteError]   = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviting, setInviting]         = useState(false);
  const detailRef = useRef(null);

  const handleSelectTask = useCallback(async (task) => {
    setSelectedTask(task);
    setInviteEmail("");
    setInviteError("");
    setInviteStatus("");
    await fetchCollaborators(task.id);
  }, [fetchCollaborators]);

  const handleInviteByEmail = async () => {
    if (!selectedTask) return;
    if (!inviteEmail.trim()) {
      setInviteError("Enter the email address of a registered user.");
      return;
    }

    setInviting(true);
    setInviteError("");
    setInviteStatus("");

    const { data, error } = await inviteByEmail(selectedTask.id, inviteEmail, inviteRole);
    if (error) {
      setInviteError(error.message || "Could not add collaborator.");
    } else {
      setInviteStatus(`${data?.full_name || inviteEmail} was added as ${data?.role || inviteRole}.`);
      setInviteEmail("");
    }

    setInviting(false);
  };

  const myTasks    = useMemo(() => tasks.slice(0, 20), [tasks]);
  const sharedList = useMemo(
    () => sharedTasks.map((s) => s.task).filter(Boolean),
    [sharedTasks]
  );
  const displayTasks = activeTab === "mine" ? myTasks : sharedList;
  const isTaskLeader = Boolean(selectedTask && user?.id === selectedTask.user_id);
  const leaderProfile = selectedTask?.profiles || {
    id: selectedTask?.user_id,
    full_name: isTaskLeader
      ? user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You"
      : "Task creator",
    avatar_url: null,
  };
  const teamMembers = selectedTask
    ? [
        {
          id: `leader-${selectedTask.id}`,
          task_id: selectedTask.id,
          user_id: selectedTask.user_id,
          role: "owner",
          profile: leaderProfile,
        },
        ...collaborators.filter((member) => member.user_id !== selectedTask.user_id),
      ]
    : [];

  const syncSelectedTask = useCallback(async () => {
    if (!selectedTaskId) return;

    const selected = [...sharedList, ...myTasks].find((task) => task?.id === selectedTaskId);
    if (!selected) return;

    const isShared = sharedList.some((task) => task?.id === selectedTaskId);
    setActiveTab(isShared ? "shared" : "mine");
    await handleSelectTask(selected);
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedTaskId, sharedList, myTasks, handleSelectTask]);

  useEffect(() => {
    const initializeSelectedTask = async () => {
      await syncSelectedTask();
    };

    initializeSelectedTask();
  }, [syncSelectedTask]);

  const tabStyle = (active) => ({
    flex: 1, padding: "0.5rem",
    borderRadius: "8px", border: "none",
    backgroundColor: active ? "rgba(91,140,255,0.15)" : "transparent",
    color: active ? "#5B8CFF" : "var(--color-muted)",
    fontFamily: "var(--font-body)", fontSize: "0.875rem",
    fontWeight: active ? 600 : 400,
    cursor: "pointer", transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
      }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-heading)", fontSize: "1.5rem",
            fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.25rem",
          }}>
            Collaboration
          </h2>
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
            Work together on tasks in real time
          </p>
        </div>

        {/* Global join button — always visible */}
        <button
          onClick={() => setShowJoin(true)}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: "10px", border: "none",
            background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            color: "white", fontFamily: "var(--font-body)",
            fontWeight: 600, fontSize: "0.9rem",
            cursor: "pointer", transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          🔗 Join with Code
        </button>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: "flex", gap: "1.5rem", minHeight: "500px" }}>

        {/* Left panel — task list */}
        <div style={{
          width: "280px", flexShrink: 0,
          display: "flex", flexDirection: "column", gap: "1rem",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", gap: "4px", padding: "4px",
            backgroundColor: "var(--color-subtle)",
            borderRadius: "10px",
          }}>
            <button style={tabStyle(activeTab === "mine")}   onClick={() => setActiveTab("mine")}>
              My Tasks
            </button>
            <button style={tabStyle(activeTab === "shared")} onClick={() => setActiveTab("shared")}>
              Shared ({sharedList.length})
            </button>
          </div>

          {/* Task list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
            {displayTasks.length === 0 ? (
              <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  {activeTab === "mine"
                    ? "No tasks yet — create one in My Tasks"
                    : "No shared tasks yet — join one with a code!"}
                </p>
              </div>
            ) : (
              displayTasks.map((task) => {
                if (!task) return null;
                const isSelected = selectedTask?.id === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "0.875rem 1rem", borderRadius: "10px",
                      border: `1px solid ${isSelected ? "rgba(91,140,255,0.3)" : "var(--color-border)"}`,
                      backgroundColor: isSelected
                        ? "rgba(91,140,255,0.1)"
                        : "var(--color-surface)",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-surface)";
                    }}
                  >
                    <p style={{
                      fontFamily: "var(--font-body)", fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isSelected ? "#5B8CFF" : "var(--color-muted)",
                      marginBottom: "0.2rem",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {task.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      {task.priority} priority
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — collaboration detail */}
        <div style={{ flex: 1 }} ref={detailRef}>
          {!selectedTask ? (
            <div className="glass-card" style={{
              height: "100%", minHeight: "400px",
              display: "flex", alignItems: "center",
              justifyContent: "center", flexDirection: "column", gap: "1rem",
            }}>
              <div style={{ fontSize: "3rem" }}>👥</div>
              <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                Select a task to collaborate
              </h3>
              <p style={{
                fontFamily: "var(--font-body)", color: "var(--color-muted)",
                fontSize: "0.9rem", textAlign: "center", maxWidth: "300px",
              }}>
                Pick a task from the left to manage collaborators and comments,
                or click <strong style={{ color: "#5B8CFF" }}>Join with Code</strong> to join a teammate's task.
              </p>
              <button
                onClick={() => setShowJoin(true)}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "10px",
                  border: "1px solid rgba(91,140,255,0.3)",
                  backgroundColor: "rgba(91,140,255,0.1)",
                  color: "#5B8CFF", fontFamily: "var(--font-body)",
                  fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                }}
              >
                🔗 Join with Code
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Task header */}
              <div className="glass-card" style={{ padding: "1.25rem" }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: "var(--font-heading)", fontSize: "1.1rem",
                      fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.2rem",
                    }}>
                      {selectedTask.title}
                    </h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-muted)" }}>
                      Team leader:{" "}
                      <span style={{ color: "#5B8CFF", fontWeight: 700 }}>
                        {leaderProfile?.full_name || "Task creator"}
                      </span>
                      {isTaskLeader && (
                        <>
                          {" "}- Invite code:{" "}
                          <span style={{
                            fontFamily: "var(--font-mono)", color: "#5B8CFF",
                            fontWeight: 700, letterSpacing: "0.1em",
                          }}>
                            {generateInviteCode(selectedTask.id)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {isTaskLeader && (
                    <button
                      onClick={() => setShowInvite(true)}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: "10px", border: "none",
                        background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                        color: "white", fontFamily: "var(--font-body)",
                        fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                      }}
                    >
                      Share Invite Code
                    </button>
                  )}
                </div>
              </div>

              {/* Task team */}
              <div className="glass-card" style={{ padding: "1.25rem" }}>
                <h4 style={{
                  fontFamily: "var(--font-heading)", fontSize: "0.95rem",
                  fontWeight: 600, color: "var(--color-muted)", marginBottom: "1rem",
                }}>
                  Task Team {teamMembers.length > 0 && `(${teamMembers.length})`}
                </h4>
                {isTaskLeader && (
                  <>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 120px auto", gap: "0.5rem", marginBottom: "1rem" }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
                    placeholder="Add by registered email"
                    style={{
                      minWidth: 0,
                      padding: "0.65rem 0.85rem",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-hover)",
                      color: "var(--color-foreground)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{
                      padding: "0.65rem 0.75rem",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-hover)",
                      color: "var(--color-foreground)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                  </select>
                  <button
                    onClick={handleInviteByEmail}
                    disabled={inviting}
                    style={{
                      padding: "0.65rem 1rem",
                      borderRadius: "10px",
                      border: "none",
                      background: inviting
                        ? "rgba(91,140,255,0.5)"
                        : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                      color: "white",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: inviting ? "not-allowed" : "pointer",
                    }}
                  >
                    {inviting ? "Adding..." : "Add"}
                  </button>
                </div>
                {inviteError && (
                  <p style={{ margin: "0 0 1rem", color: "#EF4444", fontFamily: "var(--font-body)", fontSize: "0.82rem" }}>
                    {inviteError}
                  </p>
                )}
                {inviteStatus && (
                  <p style={{ margin: "0 0 1rem", color: "#10B981", fontFamily: "var(--font-body)", fontSize: "0.82rem" }}>
                    {inviteStatus}
                  </p>
                )}
                  </>
                )}
                <CollaboratorList
                  collaborators={teamMembers}
                  currentUserId={user.id}
                  canManageRoles={isTaskLeader}
                  onUpdateRole={updateRole}
                  onRemove={removeCollaborator}
                />
              </div>

              {/* Comments */}
              <div className="glass-card" style={{ padding: "1.25rem" }}>
                <CommentSection taskId={selectedTask.id} />
              </div>

              {/* Checklist */}
              <div className="glass-card" style={{ padding: "1.25rem" }}>
                <ChecklistSection taskId={selectedTask.id} />
              </div>

              {/* Files */}
              <div className="glass-card" style={{ padding: "1.25rem" }}>
                <FileSection taskId={selectedTask.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share invite modal */}
      {showInvite && selectedTask && (
        <InviteModal
          task={selectedTask}
          inviteCode={generateInviteCode(selectedTask.id)}
          onJoinByCode={joinByCode}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Standalone join modal */}
      {showJoin && (
        <JoinModal
          onJoinByCode={joinByCode}
          onClose={() => setShowJoin(false)}
        />
      )}
    </div>
  );
}


