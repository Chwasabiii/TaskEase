/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const MODES = [
  { id: "pomodoro", label: "Focus Session", minutes: 25, accent: "#5B8CFF" },
  { id: "short", label: "Short Break", minutes: 5, accent: "#10B981" },
  { id: "long", label: "Long Break", minutes: 15, accent: "#F59E0B" },
];

const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const [mode, setMode] = useState("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(() => MODES.find((item) => item.id === "pomodoro").minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [message, setMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);

  const audioContextRef = useRef(null);
  const lastTickRef = useRef(null);
  const completionTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const currentMode = useMemo(
    () => MODES.find((item) => item.id === mode) || MODES[0],
    [mode]
  );

  const prepareAudioContext = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContextRef.current = new AudioCtx();
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  const playPomodoroSound = useCallback(async () => {
    if (!soundEnabled) return;
    const audioCtx = await prepareAudioContext();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.25);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }, [prepareAudioContext, soundEnabled]);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
    setMessage("Session complete! Save it once you finish.");
    setShowCompleteAlert(true);

    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    completionTimeoutRef.current = setTimeout(() => {
      setShowCompleteAlert(false);
      completionTimeoutRef.current = null;
    }, 3000);

    playPomodoroSound();
  }, [playPomodoroSound]);

  const updateMode = useCallback(
    (nextMode) => {
      setMode(nextMode);
      const next = MODES.find((item) => item.id === nextMode) || MODES[0];
      setSecondsLeft(next.minutes * 60);
      setIsRunning(false);
      setMessage("");
      setShowCompleteAlert(false);
    },
    []
  );

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    if (lastTickRef.current === null) {
      lastTickRef.current = Date.now();
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - lastTickRef.current) / 1000);
      if (delta <= 0) return;
      lastTickRef.current = now;
      setSecondsLeft((prev) => {
        if (prev <= delta) {
          handleComplete();
          return 0;
        }
        return prev - delta;
      });
    }, 1000);

    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [handleComplete, isRunning]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        setMode: updateMode,
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
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export const usePomodoro = () => useContext(PomodoroContext);


