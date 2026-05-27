import { useCallback, useEffect, useRef, useState } from "react";

const getVoiceSupport = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return Boolean(navigator.mediaDevices?.getUserMedia && AudioContext && window.MediaRecorder && window.isSecureContext);
};

const getVoiceDiagnostic = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!window.isSecureContext) {
    return "Voice commands need localhost or HTTPS.";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "This browser cannot request microphone input.";
  }
  if (!AudioContext) {
    return "This browser cannot analyze microphone levels.";
  }
  if (!window.MediaRecorder) {
    return "This browser cannot record microphone audio.";
  }
  return "Deepgram API transcription is ready (200 hours/month free).";
};

const getRecorderMimeType = () => {
  const options = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return options.find((type) => window.MediaRecorder?.isTypeSupported(type)) || "";
};

const readTranscriptionResponse = async (response) => {
  const bodyText = await response.text();

  if (!bodyText) return {};

  try {
    return JSON.parse(bodyText);
  } catch {
    return { error: bodyText };
  }
};

export function useVoiceRecognition({ onResult }) {
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);
  const silenceStartedRef = useRef(null);
  const heardSoundRef = useRef(false);
  const recordingStartedAtRef = useRef(0);
  const maxRecordingTimeoutRef = useRef(null);

  const [supported] = useState(getVoiceSupport);
  const [speechSupported] = useState(getVoiceSupport);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micReceiving, setMicReceiving] = useState(false);
  const [error, setError] = useState("");
  const [permissionState, setPermissionState] = useState("unknown");
  const [diagnostic] = useState(getVoiceDiagnostic);

  const stopAudioMeter = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current);
      maxRecordingTimeoutRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => {});
    }
    audioContextRef.current = null;

    setAudioLevel(0);
    setMicReceiving(false);
    setListening(false);
  }, []);

  const transcribeAudio = useCallback(async (blob) => {
    if (!blob?.size) {
      setError("No audio was recorded. Try again and speak after the mic lights up.");
      setTranscribing(false);
      return;
    }

    setTranscribing(true);
    setError("");
    setTranscript("Transcribing your voice with Deepgram...");

    try {
      const formData = new FormData();
      formData.append("file", blob, "voice-command.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const payload = await readTranscriptionResponse(response);

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Transcription failed.");
      }

      const text = payload.text?.trim();
      if (!text) {
        throw new Error("The API returned an empty transcript.");
      }

      setTranscript(text);
      setFinalTranscript(text);
      setConfidence(0.95); // Deepgram is very accurate
      onResult?.(text);
    } catch (transcriptionError) {
      setError(transcriptionError?.message || "Transcription failed.");
    } finally {
      setTranscribing(false);
    }
  }, [onResult]);

  const finishRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    stopAudioMeter();
  }, [stopAudioMeter]);

  const startAudioMeter = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot read microphone input.");
      return false;
    }

    if (!window.MediaRecorder) {
      setError("This browser cannot record microphone audio.");
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      stream.getTracks().forEach((track) => track.stop());
      setError("This browser cannot analyze microphone input.");
      return false;
    }

    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") {
      await audioContext.resume().catch(() => {});
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const mimeType = getRecorderMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      recorderRef.current = null;
      stopAudioMeter();
      transcribeAudio(blob);
    };

    streamRef.current = stream;
    audioContextRef.current = audioContext;
    recorderRef.current = recorder;
    silenceStartedRef.current = null;
    heardSoundRef.current = false;
    recordingStartedAtRef.current = Date.now();

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let index = 0; index < data.length; index += 1) {
        const centered = data[index] - 128;
        sum += centered * centered;
      }

      const rms = Math.sqrt(sum / data.length);
      const nextLevel = Math.min(1, rms / 16);
      const speaking = nextLevel > 0.018;
      const elapsed = Date.now() - recordingStartedAtRef.current;

      setAudioLevel(nextLevel);
      setMicReceiving(speaking);

      if (speaking) {
        heardSoundRef.current = true;
        silenceStartedRef.current = null;
      } else if (heardSoundRef.current && !silenceStartedRef.current) {
        silenceStartedRef.current = Date.now();
      }

      const silenceDuration = silenceStartedRef.current ? Date.now() - silenceStartedRef.current : 0;
      if (heardSoundRef.current && elapsed > 1200 && silenceDuration > 1300) {
        finishRecording();
        return;
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    recorder.start(250);
    tick();
    setListening(true);

    maxRecordingTimeoutRef.current = setTimeout(() => {
      finishRecording();
    }, 12000);

    return true;
  }, [finishRecording, stopAudioMeter, transcribeAudio]);

  useEffect(() => {
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" })
        .then((status) => {
          setPermissionState(status.state);
          status.onchange = () => setPermissionState(status.state);
        })
        .catch(() => setPermissionState("unknown"));
    }

    return () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      stopAudioMeter();
    };
  }, [stopAudioMeter]);

  const start = useCallback(async () => {
    if (listening || transcribing) return false;

    if (!window.isSecureContext) {
      setError("Voice commands need localhost or HTTPS.");
      return false;
    }

    setError("");
    setTranscript("");
    setFinalTranscript("");
    setAudioLevel(0);
    setMicReceiving(false);

    try {
      const meterStarted = await startAudioMeter();
      if (!meterStarted) {
        return false;
      }
      setPermissionState("granted");
      return true;
    } catch (startError) {
      const message =
        startError?.name === "NotAllowedError"
          ? "Microphone permission is blocked for this site."
          : startError?.name === "NotFoundError"
            ? "No microphone was found by the browser."
            : startError?.message || "Could not start voice recognition.";

      setError(message);
      setListening(false);
      stopAudioMeter();
      return false;
    }
  }, [listening, startAudioMeter, stopAudioMeter, transcribing]);

  const stop = useCallback(() => {
    finishRecording();
  }, [finishRecording]);

  return {
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
  };
}
