import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useCollaboration } from "../hooks/useCollaboration";

const MODES = [
  { id: "pomodoro", label: "Focus Session", minutes: 25, accent: "#5B8CFF" },
  { id: "short", label: "Short Break", minutes: 5, accent: "#10B981" },
  { id: "long", label: "Long Break", minutes: 15, accent: "#F59E0B" },
];

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export default function Pomodoro({ onNotify }) {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const { sharedTasks, loading: sharedLoading } = useCollaboration();
  const [mode, setMode] = useState("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const currentMode = MODES.find((item) => item.id === mode) || MODES[0];

  const sharedTaskItems = (sharedTasks || []).map((item) => item.task).filter(Boolean);
  const mergedTasks = Array.from(
    new Map(
      [...tasks, ...sharedTaskItems].map((task) => [task.id, task])
    ).values()
  );
  const selectedTask = mergedTasks.find((task) => task.id === selectedTaskId) || null;

  useEffect(() => {
    setSecondsLeft(currentMode.minutes * 60);
    setIsRunning(false);
    setMessage("");
  }, [mode]);

  useEffect(() => {
    if (mergedTasks.length && !selectedTaskId) {
      setSelectedTaskId(mergedTasks[0].id);
    }
  }, [mergedTasks, selectedTaskId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setMessage("Session complete! Save it once you finish.");
          onNotify?.({
            title: "Pomodoro complete",
            message: `Your ${currentMode.label.toLowerCase()} is finished.`,
            type: "pomodoro",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*, task:tasks(title)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Could not fetch pomodoro sessions:", error);
      } else {
        setSessions(data || []);
      }
      setLoadingSessions(false);
    };

    fetchSessions();
  }, [user]);

  const handleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(currentMode.minutes * 60);
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(currentMode.minutes * 60);
    setMessage("");
  };

  const handleSaveSession = async () => {
    if (!user) {
      setMessage("Sign in to save Pomodoro sessions.");
      return;
    }
    if (!selectedTask) {
      setMessage("Select a task to log this session.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("pomodoro_sessions").insert([
      {
        user_id: user.id,
        task_id: selectedTask.id,
        duration_mins: currentMode.minutes,
        completed: true,
      },
    ]);
    setSaving(false);

    if (error) {
      console.error("Could not save session:", error);
      setMessage(error.message || "Unable to save session.");
      return;
    }

    setMessage("Pomodoro session saved.");
    setSecondsLeft(currentMode.minutes * 60);
    setIsRunning(false);

    const { data, error: fetchError } = await supabase
      .from("pomodoro_sessions")
      .select("*, task:tasks(title)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(5);

    if (!fetchError) {
      setSessions(data || []);
    }

    onNotify?.({
      title: "Pomodoro logged",
      message: `${selectedTask.title} was logged for ${currentMode.minutes} minutes.`,
      type: "pomodoro",
    });
  };

  const progress = Math.round(((currentMode.minutes * 60 - secondsLeft) / (currentMode.minutes * 60)) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.25rem" }}>
          Pomodoro Timer
        </h2>
        <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Focus on one task at a time and log completed sessions automatically.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "1.5rem" }}>
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            {MODES.map((item) => {
              const active = item.id === mode;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  style={{
                    flex: 1,
                    padding: "0.75rem 0.9rem",
                    borderRadius: "12px",
                    border: active ? `1px solid ${item.accent}` : "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: active ? "rgba(255,255,255,0.04)" : "transparent",
                    color: active ? "#F8FAFC" : "#94A3B8",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div style={{ width: "160px", height: "160px", borderRadius: "50%", border: `8px solid rgba(255,255,255,0.08)`, display: "grid", placeItems: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(${currentMode.accent} ${progress}%, rgba(255,255,255,0.08) 0)` }} />
              <div style={{ position: "relative", width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "rgba(15,23,42,0.95)", display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "2.75rem", fontWeight: 700, color: "#F1F5F9" }}>
                    {formatTime(secondsLeft)}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#94A3B8", marginTop: "0.25rem" }}>
                    {currentMode.minutes}-minute session
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", backgroundColor: currentMode.accent, transition: "width 0.2s ease" }} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={handleStartPause}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderRadius: "999px",
                  border: "none",
                  background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                  color: "white",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "transparent",
                  color: "#F1F5F9",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
              <label style={{ fontFamily: "var(--font-body)", color: "#94A3B8", fontSize: "0.9rem" }}>
                Task to focus on
              </label>
              <select
                value={selectedTaskId || ""}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(15,23,42,0.95)",
                  color: "#F1F5F9",
                  fontFamily: "var(--font-body)",
                }}
              >
                {tasksLoading || sharedLoading ? (
                  <option value="">Loading tasks...</option>
                ) : mergedTasks.length === 0 ? (
                  <option value="">No tasks available</option>
                ) : (
                  mergedTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}{task.user_id !== user?.id ? " (Shared)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={handleSaveSession}
              disabled={saving || !selectedTask}
              style={{
                width: "100%",
                padding: "0.95rem 1rem",
                borderRadius: "14px",
                border: "none",
                backgroundColor: selectedTask ? "#5B8CFF" : "rgba(91,140,255,0.35)",
                color: "white",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                cursor: selectedTask ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Saving..." : "Save Session"}
            </button>

            {message && (
              <p style={{ color: "#94A3B8", fontFamily: "var(--font-body)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "1rem" }}>
            Recent Pomodoro Sessions
          </h3>
          {loadingSessions ? (
            <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
              Loading session history...
            </p>
          ) : sessions.length === 0 ? (
            <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
              No recent sessions yet. Start a focus session to log your progress.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {sessions.map((session) => (
                <div key={session.id} style={{ padding: "1rem", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#F1F5F9" }}>
                      {session.task?.title || "Task"}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#94A3B8" }}>
                      {session.duration_mins} min
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#94A3B8" }}>
                    {new Date(session.started_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
