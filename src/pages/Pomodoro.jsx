import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { usePomodoro } from "../context/PomodoroContext";
import { useTasks } from "../hooks/useTasks";
import { useCollaboration } from "../hooks/useCollaboration";
import { PomodoroTimer, PomodoroControls, PomodoroModeSelector, PomodoroSessionSummary } from "../components/pomodoro";
import { ADHDTipsPanel } from "../components/adhd";

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
  const {
    mode,
    setMode,
    secondsLeft,
    setSecondsLeft,
    isRunning,
    setIsRunning,
    selectedTaskId,
    setSelectedTaskId,
    message,
    setMessage,
    soundEnabled,
    setSoundEnabled,
    showCompleteAlert,
    currentMode,
  } = usePomodoro();
  const { tasks, loading: tasksLoading } = useTasks();
  const { sharedTasks, loading: sharedLoading } = useCollaboration();
  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const mergedTasks = useMemo(
    () => {
      const sharedTaskItems = (sharedTasks || []).map((item) => item.task).filter(Boolean);
      return Array.from(
        new Map(
          [...tasks, ...sharedTaskItems].map((task) => [task.id, task])
        ).values()
      );
    },
    [sharedTasks, tasks]
  );
  const selectedTask = useMemo(
    () => mergedTasks.find((task) => task.id === selectedTaskId) || null,
    [mergedTasks, selectedTaskId]
  );

  useEffect(() => {
    if (mergedTasks.length && !selectedTaskId) {
      setSelectedTaskId(mergedTasks[0].id);
    }
  }, [mergedTasks, selectedTaskId, setSelectedTaskId]);

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
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.25rem" }}>
          Pomodoro Timer
        </h2>
        <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Focus on one task at a time and log completed sessions automatically.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "1.5rem" }}>
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <PomodoroModeSelector modes={MODES} activeMode={mode} onSelectMode={setMode} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem", borderRadius: "20px", backgroundColor: "var(--color-subtle)" }}>
            <PomodoroTimer
              time={formatTime(secondsLeft)}
              modeLabel={`${currentMode.minutes}-minute session`}
              progress={progress}
              accent={currentMode.accent}
            />

            <PomodoroControls
              isRunning={isRunning}
              onStartPause={handleStartPause}
              onReset={handleReset}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onSave={handleSaveSession}
              saving={saving}
            />

            {showCompleteAlert && (
              <div style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "14px",
                backgroundColor: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.35)",
                color: "#047857",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                textAlign: "center",
              }}>
                {currentMode.label} complete! Great work.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
              <label style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontSize: "0.9rem" }}>
                Task to focus on
              </label>
              <select
                value={selectedTaskId || ""}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-strong)",
                  color: "var(--color-foreground)",
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

            {message && (
              <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "1rem" }}>
              Recent Pomodoro Sessions
            </h3>
            <PomodoroSessionSummary sessions={sessions} loading={loadingSessions} />
          </div>
          <ADHDTipsPanel />
        </div>
      </div>
    </div>
  );
}


