/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const MODES = [
  { id: "pomodoro", label: "Focus Session", minutes: 25, accent: "#5B8CFF" },
  { id: "short", label: "Short Break", minutes: 5, accent: "#10B981" },
  { id: "long", label: "Long Break", minutes: 15, accent: "#F59E0B" },
];

export const ALARM_SOUNDS = [
  { id: "classic", label: "Classic alarm", type: "audio", src: "/pomodoro-alarm.mp3" },
  { id: "soft", label: "Soft chime", type: "tone" },
  { id: "bright", label: "Bright beep", type: "tone" },
  { id: "custom", label: "Custom upload", type: "custom" },
];

const PomodoroContext = createContext(null);

const getStoredValue = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
};

export function PomodoroProvider({ children }) {
  const [mode, setMode] = useState("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(() => MODES.find((item) => item.id === "pomodoro").minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [message, setMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alarmSoundId, setAlarmSoundId] = useState(() => getStoredValue("taskease-alarm-sound", "classic"));
  const [customAlarmSound, setCustomAlarmSound] = useState(() => getStoredValue("taskease-custom-alarm", ""));
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);

  const audioContextRef = useRef(null);
  const lastTickRef = useRef(null);
  const completionTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const alarmAudioRef = useRef(null);

  const currentMode = useMemo(
    () => MODES.find((item) => item.id === mode) || MODES[0],
    [mode]
  );

  const alarmSound = useMemo(
    () => ALARM_SOUNDS.find((sound) => sound.id === alarmSoundId) || ALARM_SOUNDS[0],
    [alarmSoundId]
  );

  useEffect(() => {
    localStorage.setItem("taskease-alarm-sound", alarmSoundId);
  }, [alarmSoundId]);

  useEffect(() => {
    if (customAlarmSound) {
      localStorage.setItem("taskease-custom-alarm", customAlarmSound);
    } else {
      localStorage.removeItem("taskease-custom-alarm");
    }
  }, [customAlarmSound]);

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

  const playToneSound = useCallback(async (soundId = "bright") => {
    const audioCtx = await prepareAudioContext();
    if (!audioCtx) return;

    const notes = soundId === "soft"
      ? [
          [523.25, 0],
          [659.25, 0.16],
          [783.99, 0.32],
        ]
      : [
          [880, 0],
          [1046.5, 0.18],
        ];

    notes.forEach(([frequency, offset]) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = soundId === "soft" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + offset);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + offset + 0.28);

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start(audioCtx.currentTime + offset);
      oscillator.stop(audioCtx.currentTime + offset + 0.32);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }, [prepareAudioContext]);

  const playAudioSound = useCallback(async (src) => {
    if (!src) {
      await playToneSound("bright");
      return;
    }

    if (!alarmAudioRef.current || alarmAudioRef.current.src !== src) {
      alarmAudioRef.current = new Audio(src);
      alarmAudioRef.current.preload = "auto";
    }

    try {
      alarmAudioRef.current.currentTime = 0;
      await alarmAudioRef.current.play();
    } catch {
      await playToneSound("bright");
    }
  }, [playToneSound]);

  const playAlarmSound = useCallback(async (sound = alarmSound) => {
    if (sound.type === "audio") {
      await playAudioSound(sound.src);
      return;
    }

    if (sound.type === "custom") {
      await playAudioSound(customAlarmSound);
      return;
    }

    await playToneSound(sound.id);
  }, [alarmSound, customAlarmSound, playAudioSound, playToneSound]);

  const previewAlarmSound = useCallback(async (soundId = alarmSoundId) => {
    const sound = ALARM_SOUNDS.find((item) => item.id === soundId) || ALARM_SOUNDS[0];
    await playAlarmSound(sound);
  }, [alarmSoundId, playAlarmSound]);

  const updateAlarmSoundId = useCallback((soundId) => {
    if (soundId === "custom" && !customAlarmSound) {
      setMessage("Upload a custom alarm sound first.");
      return;
    }
    setAlarmSoundId(soundId);
    setMessage("");
  }, [customAlarmSound]);

  const updateCustomAlarmSound = useCallback((dataUrl) => {
    setCustomAlarmSound(dataUrl);
    setAlarmSoundId("custom");
    setMessage("Custom alarm sound saved.");
  }, []);

  const clearCustomAlarmSound = useCallback(() => {
    setCustomAlarmSound("");
    if (alarmSoundId === "custom") {
      setAlarmSoundId("classic");
    }
    setMessage("Custom alarm sound removed.");
  }, [alarmSoundId]);

  const playPomodoroSound = useCallback(async () => {
    if (!soundEnabled) return;
    await playAlarmSound();
  }, [playAlarmSound, soundEnabled]);

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
        alarmSounds: ALARM_SOUNDS,
        alarmSoundId,
        setAlarmSoundId: updateAlarmSoundId,
        customAlarmSound,
        setCustomAlarmSound: updateCustomAlarmSound,
        clearCustomAlarmSound,
        previewAlarmSound,
        showCompleteAlert,
        currentMode,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export const usePomodoro = () => useContext(PomodoroContext);


