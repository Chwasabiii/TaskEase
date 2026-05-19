import { useEffect, useRef, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useChecklist } from "../hooks/useChecklist";

const MOTIVATIONS = [
  "You're doing great — one step at a time 💪",
  "Focus on this task. Everything else can wait 🎯",
  "Progress, not perfection ✨",
  "You've got this. Stay present 🧠",
  "Small steps lead to big wins 🚀",
  "Breathe. Focus. Execute 🌊",
  "One task at a time — that's all it takes 🔥",
  "You started. That's already a win 🏆",
];

const BREAK_INTERVAL = 25 * 60;

export default function FocusMode({ onNotify }) {
  const { tasks, toggleComplete } = useTasks();
  const activeTasks = tasks.filter((t) => t.status !== "done");

  const [selectedTask, setSelectedTask]       = useState(null);
  const [started, setStarted]                 = useState(false);
  const [elapsed, setElapsed]                 = useState(0);
  const [showBreak, setShowBreak]           = useState(false);
  const [motivation, setMotivation]           = useState(MOTIVATIONS[0]);
  const [, setMotivationIndex]                 = useState(0);
  const [showTaskPicker, setShowTaskPicker]   = useState(false);

  const intervalRef = useRef(null);

  // Auto-select first task
  useEffect(() => {
    if (activeTasks.length > 0 && !selectedTask) {
      const timeoutId = window.setTimeout(() => {
        setSelectedTask(activeTasks[0]);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [activeTasks, selectedTask]);

  // Timer
  useEffect(() => {
    if (started) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next > 0 && next % BREAK_INTERVAL === 0) {
            setShowBreak(true);
            onNotify?.({
              title: "Break time! ☕",
              message: "You've been focusing for 25 minutes. Time for a short break!",
              type: "focus",
            });
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [started, onNotify]);

  // Rotate motivation every 30 seconds
  useEffect(() => {
    if (!started) return;
    const motInterval = setInterval(() => {
      setMotivationIndex((prev) => {
        const next = (prev + 1) % MOTIVATIONS.length;
        setMotivation(MOTIVATIONS[next]);
        return next;
      });
    }, 30000);
    return () => clearInterval(motInterval);
  }, [started]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStart = () => {
    if (!selectedTask) return;
    setStarted(true);
    setElapsed(0);
    onNotify?.({
      title: "Focus session started ⚡",
      message: `Now focusing on "${selectedTask.title}"`,
      type: "focus",
    });
  };

  const handleStop = () => {
    setStarted(false);
    setElapsed(0);
    onNotify?.({
      title: "Focus session stopped",
      message: "Your focus session was ended early.",
      type: "focus",
    });
  };

  const handleDone = async () => {
    if (!selectedTask) return;
    await toggleComplete(selectedTask.id, selectedTask.status);
    onNotify?.({
      title: "Task completed! 🎉",
      message: `"${selectedTask.title}" marked as done during focus session.`,
      type: "focus",
    });
    setStarted(false);
    setElapsed(0);
    setSelectedTask(null);
  };

  const handleBreakDone = () => {
    setShowBreak(false);
    onNotify?.({
      title: "Break over — back to it! 🚀",
      message: "Starting your next focus session.",
      type: "focus",
    });
  };

  const progressPercent = BREAK_INTERVAL > 0
    ? Math.min((elapsed % BREAK_INTERVAL) / BREAK_INTERVAL * 100, 100)
    : 0;

  // ── No tasks state ──
  if (activeTasks.length === 0) {
    return (
      <div style={{
        minHeight: "70vh", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h2 style={{
            fontFamily: "var(--font-heading)", fontSize: "1.5rem",
            fontWeight: 700, color: "#10B981", marginBottom: "0.5rem",
          }}>
            All caught up!
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontSize: "0.9rem" }}>
            You have no active tasks. Go add some in My Tasks!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "80vh", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>

      {/* Break reminder overlay */}
      {showBreak && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200,
        }}>
          <div className="glass-card" style={{ padding: "2.5rem", textAlign: "center", maxWidth: "380px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>☕</div>
            <h2 style={{
              fontFamily: "var(--font-heading)", fontSize: "1.5rem",
              fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.5rem",
            }}>
              Time for a break!
            </h2>
            <p style={{
              fontFamily: "var(--font-body)", color: "var(--color-muted)",
              fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6,
            }}>
              You've been focusing for 25 minutes. Step away, stretch,
              grab some water, and come back refreshed.
            </p>
            <button
              onClick={handleBreakDone}
              style={{
                width: "100%", padding: "0.75rem",
                borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, #10B981, #22D3EE)",
                color: "white", fontFamily: "var(--font-body)",
                fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
              }}
            >
              I'm back — keep going! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Main focus card */}
      <div style={{ width: "100%", maxWidth: "580px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--font-heading)", fontSize: "1.25rem",
            fontWeight: 700, color: "#5B8CFF", marginBottom: "0.25rem",
          }}>
            ⚡ Focus Mode
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontSize: "0.85rem" }}>
            One task. Full focus. No distractions.
          </p>
        </div>

        {/* Task card */}
        <div className="glass-card" style={{ padding: "2rem" }}>

          {/* Task selector */}
          {!started ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                color: "var(--color-muted)", marginBottom: "0.5rem",
              }}>
                Currently focusing on:
              </p>
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                style={{
                  width: "100%", padding: "0.875rem 1rem",
                  borderRadius: "10px", textAlign: "left",
                  border: "1px solid rgba(91,140,255,0.2)",
                  backgroundColor: "rgba(91,140,255,0.08)",
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "1rem",
                  fontWeight: 600, color: "var(--color-foreground)",
                }}>
                  {selectedTask?.title ?? "Select a task"}
                </span>
                <span style={{ color: "#5B8CFF", fontSize: "0.8rem" }}>
                  {showTaskPicker ? "▲" : "▼"}
                </span>
              </button>

              {/* Task picker dropdown */}
              {showTaskPicker && (
                <div style={{
                  marginTop: "0.5rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px", overflow: "hidden",
                  backgroundColor: "var(--color-surface-strong)",
                }}>
                  {activeTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => { setSelectedTask(task); setShowTaskPicker(false); }}
                      style={{
                        width: "100%", padding: "0.75rem 1rem",
                        textAlign: "left", border: "none",
                        borderBottom: "1px solid var(--color-subtle)",
                        backgroundColor: selectedTask?.id === task.id
                          ? "rgba(91,140,255,0.1)"
                          : "transparent",
                        cursor: "pointer", transition: "background 0.2s",
                        display: "flex", alignItems: "center", gap: "0.625rem",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor =
                        selectedTask?.id === task.id ? "rgba(91,140,255,0.1)" : "transparent"}
                    >
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                        backgroundColor:
                          task.priority === "urgent" ? "#7C5CFF" :
                          task.priority === "high"   ? "#EF4444" :
                          task.priority === "medium" ? "#F59E0B" : "#10B981",
                      }} />
                      <span style={{
                        fontFamily: "var(--font-body)", fontSize: "0.875rem",
                        color: "var(--color-muted)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <h3 style={{
                fontFamily: "var(--font-heading)", fontSize: "1.4rem",
                fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1.3,
              }}>
                {selectedTask?.title}
              </h3>
              {selectedTask?.description && (
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.875rem",
                  color: "var(--color-muted)", marginTop: "0.5rem",
                }}>
                  {selectedTask.description}
                </p>
              )}
            </div>
          )}

          {/* Timer display */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "4rem",
              fontWeight: 700, color: started ? "#5B8CFF" : "var(--color-muted)",
              letterSpacing: "0.05em", transition: "color 0.3s",
              lineHeight: 1,
            }}>
              {formatTime(elapsed)}
            </div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.75rem",
              color: "var(--color-muted)", marginTop: "0.375rem",
            }}>
              {started
                ? `Next break in ${formatTime(BREAK_INTERVAL - (elapsed % BREAK_INTERVAL))}`
                : "Timer ready"}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{
            width: "100%", height: "6px",
            backgroundColor: "var(--color-border)",
            borderRadius: "3px", overflow: "hidden",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              width: `${progressPercent}%`, height: "100%",
              background: "linear-gradient(90deg, #5B8CFF, #7C5CFF)",
              borderRadius: "3px", transition: "width 1s linear",
            }} />
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {!started ? (
              <button
                onClick={handleStart}
                disabled={!selectedTask}
                style={{
                  flex: 1, padding: "0.875rem",
                  borderRadius: "10px", border: "none",
                  background: !selectedTask
                    ? "rgba(91,140,255,0.3)"
                    : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                  color: "white", fontFamily: "var(--font-body)",
                  fontWeight: 700, fontSize: "1rem",
                  cursor: !selectedTask ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                ▶ Start Focus
              </button>
            ) : (
              <>
                <button
                  onClick={handleStop}
                  style={{
                    flex: 1, padding: "0.875rem",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-hover)",
                    color: "var(--color-muted)", fontFamily: "var(--font-body)",
                    fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                  }}
                >
                  ⏹ Stop
                </button>
                <button
                  onClick={handleDone}
                  style={{
                    flex: 2, padding: "0.875rem",
                    borderRadius: "10px", border: "none",
                    background: "linear-gradient(135deg, #10B981, #22D3EE)",
                    color: "white", fontFamily: "var(--font-body)",
                    fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                  }}
                >
                  ✓ Mark Complete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Checklist */}
        {selectedTask && (
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <FocusChecklist taskId={selectedTask.id} />
          </div>
        )}

        {/* Motivation */}
        {started && (
          <div style={{
            textAlign: "center", padding: "1rem",
            borderRadius: "10px",
            backgroundColor: "rgba(91,140,255,0.05)",
            border: "1px solid rgba(91,140,255,0.1)",
          }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.9rem",
              color: "var(--color-muted)", fontStyle: "italic",
            }}>
              {motivation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lightweight checklist inside focus mode ──
function FocusChecklist({ taskId }) {
  const {
    items, loading, updateItem,
    completedCount, totalCount, progress,
  } = useChecklist(taskId);

  if (loading) return (
    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-muted)" }}>
      Loading checklist...
    </p>
  );

  if (items.length === 0) return (
    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-muted)", textAlign: "center" }}>
      No checklist items for this task
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h4 style={{
          fontFamily: "var(--font-heading)", fontSize: "0.9rem",
          fontWeight: 600, color: "var(--color-muted)",
        }}>
          ☑ Checklist — {completedCount}/{totalCount}
        </h4>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.75rem",
          color: progress === 100 ? "#10B981" : "#5B8CFF",
        }}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", height: "4px",
        backgroundColor: "var(--color-border)",
        borderRadius: "2px", overflow: "hidden",
      }}>
        <div style={{
          width: `${progress}%`, height: "100%",
          background: progress === 100
            ? "#10B981"
            : "linear-gradient(90deg, #5B8CFF, #7C5CFF)",
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => updateItem(item.id, { is_done: !item.is_done })}
            style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              padding: "0.625rem 0.75rem",
              borderRadius: "8px", border: "none",
              backgroundColor: item.is_done
                ? "rgba(16,185,129,0.08)"
                : "var(--color-subtle)",
              cursor: "pointer", textAlign: "left",
              width: "100%", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: "18px", height: "18px", flexShrink: 0,
              borderRadius: "5px",
              border: `2px solid ${item.is_done ? "#10B981" : "rgba(255,255,255,0.2)"}`,
              backgroundColor: item.is_done ? "#10B981" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {item.is_done && (
                <span style={{ color: "white", fontSize: "10px", fontWeight: 700 }}>✓</span>
              )}
            </div>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.875rem",
              color: item.is_done ? "var(--color-muted)" : "var(--color-muted)",
              textDecoration: item.is_done ? "line-through" : "none",
            }}>
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

