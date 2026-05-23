import { useCallback, useState } from "react";
import { usePomodoro } from "../../context/PomodoroContext";
import { useTheme } from "../../context/theme";
import { useTasks } from "../../hooks/useTasks";
import {
  findTaskByVoiceTitle,
  parseVoiceCommand,
  VOICE_COMMAND_EXAMPLES,
  VOICE_COMMAND_GROUPS,
} from "./voiceCommands";
import { useVoiceRecognition } from "./useVoiceRecognition";

const pageLabels = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  pomodoro: "Pomodoro",
  focus: "Focus Mode",
  archive: "Archive",
  collaboration: "Collaboration",
};

const assistantStates = {
  idle: {
    title: "How can I help?",
    subtitle: "Tap the mic and speak naturally.",
  },
  listening: {
    title: "Listening",
    subtitle: "Say a task, page, timer, or theme command.",
  },
  thinking: {
    title: "Working on it",
    subtitle: "Matching your command.",
  },
  transcribing: {
    title: "Transcribing",
    subtitle: "Sending your recording to speech-to-text.",
  },
  done: {
    title: "Done",
    subtitle: "Ready for another command.",
  },
  error: {
    title: "Try that again",
    subtitle: "I need a clearer command.",
  },
};

export default function VoiceCommandButton({ setActivePage, onNotify, onTaskDraft }) {
  const { tasks, updateTask } = useTasks();
  const { theme, setTheme, toggleTheme } = useTheme();
  const {
    currentMode,
    setMode,
    setIsRunning,
    setSecondsLeft,
    setMessage,
  } = usePomodoro();

  const [open, setOpen] = useState(false);
  const [assistantState, setAssistantState] = useState("idle");
  const [response, setResponse] = useState("Try: add task finish report.");
  const [lastCommand, setLastCommand] = useState("");

  const respond = useCallback((message, options = {}) => {
    setResponse(message);
    setAssistantState(options.error ? "error" : "done");
    if (options.notify) {
      onNotify?.({
        title: "Voice command",
        message,
        type: "voice",
      });
    }
  }, [onNotify]);

  const executeCommand = useCallback(async (spokenText) => {
    setAssistantState("thinking");
    setLastCommand(spokenText);

    const command = parseVoiceCommand(spokenText);

    if (command.type === "help") {
      respond(`Try saying: ${VOICE_COMMAND_EXAMPLES.join(", ")}.`);
      return;
    }

    if (command.type === "navigate") {
      setActivePage(command.page);
      respond(`Opened ${pageLabels[command.page] || command.page}.`);
      return;
    }

    if (command.type === "theme") {
      if (command.theme === "toggle") {
        toggleTheme();
        respond("Theme changed.");
        return;
      }
      if (theme !== command.theme) {
        setTheme(command.theme);
      }
      respond(`Switched to ${command.theme} mode.`);
      return;
    }

    if (command.type === "pomodoro") {
      setActivePage("pomodoro");

      if (command.action === "start") {
        setIsRunning(true);
        setMessage("Started by voice command.");
        respond("Pomodoro started.");
        return;
      }

      if (command.action === "pause") {
        setIsRunning(false);
        setMessage("Paused by voice command.");
        respond("Pomodoro paused.");
        return;
      }

      if (command.action === "reset") {
        setIsRunning(false);
        setSecondsLeft(currentMode.minutes * 60);
        setMessage("Reset by voice command.");
        respond("Pomodoro reset.");
        return;
      }

      if (command.action === "mode") {
        setMode(command.mode);
        respond("Timer mode changed.");
        return;
      }
    }

    if (command.type === "task") {
      if (command.action === "create") {
        const title = command.title.trim();
        if (!title) {
          respond("I need a task title.", { error: true });
          return;
        }

        onTaskDraft?.({
          title,
          description: "",
          priority: command.priority,
          category: "",
          due_date: null,
          status: "todo",
        });

        respond(`Review task details: ${title}.`, { notify: true });
        return;
      }

      const task = findTaskByVoiceTitle(tasks, command.title);
      if (!task) {
        respond(`I could not find a task matching "${command.title}".`, { error: true });
        return;
      }

      const nextStatus = command.action === "complete" ? "done" : "todo";
      const { error } = await updateTask(task.id, { status: nextStatus });
      if (error) {
        respond(error.message || "I could not update that task.", { error: true });
        return;
      }

      setActivePage("tasks");
      respond(
        command.action === "complete"
          ? `Marked ${task.title} complete.`
          : `Reopened ${task.title}.`,
        { notify: true }
      );
      return;
    }

    respond("I did not recognize that yet. Try one of the examples below.", { error: true });
  }, [
    currentMode.minutes,
    onTaskDraft,
    respond,
    setActivePage,
    setIsRunning,
    setMessage,
    setMode,
    setSecondsLeft,
    setTheme,
    tasks,
    theme,
    toggleTheme,
    updateTask,
  ]);

  const {
    supported,
    speechSupported,
    listening,
    transcribing,
    transcript,
    finalTranscript,
    confidence,
    audioLevel,
    micReceiving,
    error,
    permissionState,
    diagnostic,
    start,
    stop,
  } = useVoiceRecognition({ onResult: executeCommand });

  const handleMicClick = async () => {
    setOpen(true);
    if (listening) {
      setAssistantState("transcribing");
      setResponse("Transcribing your voice...");
      stop();
      return;
    }
    if (transcribing) return;
    setAssistantState("listening");
    setResponse("Recording... speak now.");
    const didStart = await start();
    if (!didStart) {
      setAssistantState("error");
    }
  };

  const handleClose = () => {
    if (listening) stop();
    setOpen(false);
    setAssistantState("idle");
  };

  const handleExample = (example) => {
    setOpen(true);
    executeCommand(example);
  };

  const status = transcribing
    ? assistantStates.transcribing
    : listening
      ? assistantStates.listening
      : assistantStates[assistantState];
  const displayText = transcript || finalTranscript || response;
  const confidencePercent = confidence == null ? null : Math.round(confidence * 100);
  const hasSpeechText = Boolean(transcript || finalTranscript);
  const meterLevel = Math.max(0.08, audioLevel);

  return (
    <>
      {open && (
        <div
          className="voice-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
            backgroundColor: "var(--color-backdrop)",
            backdropFilter: "blur(10px)",
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
        >
          <section
            className="voice-sheet"
            style={{
              width: "min(620px, 100%)",
              borderRadius: "28px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-strong)",
              boxShadow: "0 30px 90px var(--color-glow)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1rem 0",
              }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 800, color: "var(--color-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                TaskEase Voice
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close voice command"
                className="interactive-pop"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-subtle)",
                  color: "var(--color-muted)",
                  cursor: "pointer",
                }}
              >
                x
              </button>
            </div>

            <div style={{ padding: "1rem 2rem 1.5rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={!supported || transcribing}
                className={`voice-orb interactive-pop${listening ? " is-listening" : ""}`}
                style={{
                  width: "116px",
                  height: "116px",
                  margin: "0 auto",
                  borderRadius: "999px",
                  border: listening ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: listening
                    ? "radial-gradient(circle at 35% 30%, #7dd3fc, #5B8CFF 42%, #7C5CFF 100%)"
                    : "linear-gradient(135deg, var(--color-surface), var(--color-subtle))",
                  color: listening ? "white" : "var(--color-foreground)",
                  cursor: supported ? "pointer" : "not-allowed",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: listening
                    ? "0 26px 60px var(--color-glow)"
                    : "0 18px 38px rgba(15, 23, 42, 0.18)",
                  opacity: supported ? 1 : 0.58,
                }}
              >
                {listening ? (
                  <span className="voice-wave" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      width: "22px",
                      height: "34px",
                      border: "3px solid currentColor",
                      borderRadius: "999px",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "-13px",
                        width: "3px",
                        height: "11px",
                        transform: "translateX(-50%)",
                        backgroundColor: "currentColor",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "-16px",
                        width: "22px",
                        height: "3px",
                        transform: "translateX(-50%)",
                        backgroundColor: "currentColor",
                        borderRadius: "999px",
                      }}
                    />
                  </span>
                )}
              </button>

              <h2 style={{ margin: "1.35rem 0 0", fontFamily: "var(--font-heading)", fontSize: "1.65rem", color: "var(--color-foreground)" }}>
                {supported ? status.title : "Mic test is unavailable"}
              </h2>
              <p style={{ margin: "0.35rem auto 0", maxWidth: "420px", fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                {supported
                  ? speechSupported
                    ? status.subtitle
                    : "Mic meter can run, but API speech-to-text is not available."
                  : "Use Chrome or Edge on localhost or HTTPS."}
              </p>

              <div
                style={{
                  marginTop: "1.25rem",
                  minHeight: "150px",
                  padding: "1rem",
                  borderRadius: "18px",
                  border: listening ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  backgroundColor: listening ? "var(--color-primary-soft)" : "var(--color-subtle)",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.35rem 0.6rem",
                        borderRadius: "999px",
                        backgroundColor: micReceiving ? "rgba(16,185,129,0.14)" : "var(--color-subtle)",
                        border: micReceiving ? "1px solid rgba(16,185,129,0.36)" : "1px solid var(--color-border)",
                        color: micReceiving ? "#10B981" : "var(--color-muted)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.76rem",
                        fontWeight: 800,
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor: "currentColor",
                          boxShadow: micReceiving ? "0 0 0 4px rgba(16,185,129,0.12)" : "none",
                        }}
                      />
                      Mic signal {micReceiving ? "active" : "waiting"}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.35rem 0.6rem",
                        borderRadius: "999px",
                        backgroundColor: hasSpeechText ? "var(--color-primary-soft)" : "var(--color-subtle)",
                        border: hasSpeechText ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                        color: hasSpeechText ? "var(--color-primary)" : "var(--color-muted)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.76rem",
                        fontWeight: 800,
                      }}
                    >
                      <span
                        className={listening && !hasSpeechText ? "stt-dot" : ""}
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor: "currentColor",
                        }}
                      />
                      Speech-to-text {transcribing ? "transcribing" : hasSpeechText ? "typing" : "waiting"}
                    </span>
                  </div>

                  <div
                    aria-label="Live microphone level"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(18, 1fr)",
                      alignItems: "end",
                      gap: "4px",
                      height: "42px",
                      padding: "0.55rem",
                      borderRadius: "14px",
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {Array.from({ length: 18 }).map((_, index) => {
                      const threshold = (index + 1) / 18;
                      const active = meterLevel >= threshold || (micReceiving && index < 2);
                      return (
                        <span
                          key={index}
                          style={{
                            height: `${Math.max(14, Math.min(100, (audioLevel * 96) + ((index % 5) * 7)))}%`,
                            borderRadius: "999px",
                            backgroundColor: active ? "var(--color-primary)" : "var(--color-ring)",
                            opacity: active ? 0.95 : 0.42,
                            transform: `scaleY(${active ? 1 : 0.55})`,
                            transition: "height 80ms linear, opacity 120ms ease, transform 120ms ease",
                          }}
                        />
                      );
                    })}
                  </div>

                  <p
                    className={(transcribing || (listening && hasSpeechText)) ? "speech-text-active" : ""}
                    style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-foreground)", lineHeight: 1.55 }}
                  >
                    {displayText}
                    {(listening || transcribing) && <span className="stt-caret" />}
                  </p>
                  {listening && !micReceiving && (
                    <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-muted)", lineHeight: 1.45 }}>
                      The mic stream is on. If the meter does not move while you speak, check Chrome's selected microphone for this site.
                    </p>
                  )}
                </div>
                {(lastCommand || confidencePercent != null || error) && (
                  <p style={{ margin: "0.6rem 0 0", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: error ? "#EF4444" : "var(--color-muted)" }}>
                    {error || (confidencePercent != null ? `Heard with ${confidencePercent}% confidence` : `Last command: ${lastCommand}`)}
                  </p>
                )}
                <p style={{ margin: "0.6rem 0 0", fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "var(--color-muted)" }}>
                  {diagnostic} Mic permission: {permissionState}. API STT: {speechSupported ? "available" : "unavailable"}.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                padding: "1rem",
                backgroundColor: "var(--color-subtle)",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {VOICE_COMMAND_GROUPS.map((group) => (
                <div key={group.label} style={{ display: "grid", gridTemplateColumns: "86px 1fr", gap: "0.65rem", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", fontWeight: 800, color: "var(--color-muted)" }}>
                    {group.label}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                    {group.examples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        className="interactive-pop"
                        onClick={() => handleExample(example)}
                        style={{
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-foreground)",
                          borderRadius: "999px",
                          padding: "0.42rem 0.7rem",
                          fontFamily: "var(--font-body)",
                          fontSize: "0.76rem",
                          cursor: "pointer",
                        }}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <button
        type="button"
        className={`voice-orb interactive-pop${listening ? " is-listening" : ""}`}
        onClick={handleMicClick}
        disabled={!supported || transcribing}
        aria-label={listening ? "Stop and transcribe voice command" : "Start voice command"}
        style={{
          position: "fixed",
          right: "1.5rem",
          bottom: "1.5rem",
          zIndex: 80,
          width: "58px",
          height: "58px",
          borderRadius: "19px",
          border: listening ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
          background: listening
            ? "linear-gradient(135deg, #5B8CFF, #7C5CFF)"
            : "var(--color-surface-strong)",
          color: listening ? "var(--color-on-primary)" : "var(--color-foreground)",
          cursor: supported && !transcribing ? "pointer" : "not-allowed",
          display: "grid",
          placeItems: "center",
          boxShadow: listening
            ? "0 18px 36px var(--color-glow)"
            : "0 14px 32px rgba(15, 23, 42, 0.18)",
          opacity: supported ? (transcribing ? 0.72 : 1) : 0.55,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "15px",
            height: "23px",
            border: "2px solid currentColor",
            borderRadius: "999px",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-8px",
              width: "2px",
              height: "7px",
              transform: "translateX(-50%)",
              backgroundColor: "currentColor",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-10px",
              width: "14px",
              height: "2px",
              transform: "translateX(-50%)",
              backgroundColor: "currentColor",
              borderRadius: "999px",
            }}
          />
        </span>
      </button>
    </>
  );
}
