import { Buffer } from "node:buffer";

export const extractAudioFile = (body, contentType = "") => {
  if (!contentType.includes("multipart/form-data")) {
    return {
      buffer: body,
      contentType: contentType || "audio/webm",
    };
  }

  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    return {
      buffer: body,
      contentType: "audio/webm",
    };
  }

  const parts = body.toString("binary").split(`--${boundary}`);
  const filePart = parts.find((part) => part.includes("filename=") && part.includes("Content-Type:"));
  if (!filePart) {
    return {
      buffer: body,
      contentType: "audio/webm",
    };
  }

  const dataStart = filePart.indexOf("\r\n\r\n") + 4;
  const dataEnd = filePart.lastIndexOf("\r\n");
  const audioContentType = filePart.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim() || "audio/webm";

  if (dataStart <= 3 || dataEnd <= dataStart) {
    return {
      buffer: body,
      contentType: audioContentType,
    };
  }

  return {
    buffer: Buffer.from(filePart.substring(dataStart, dataEnd), "binary"),
    contentType: audioContentType,
  };
};

export const extractAudioBuffer = (body, contentType = "") => extractAudioFile(body, contentType).buffer;

export const transcribeWithDeepgram = async ({ audioBuffer, audioContentType = "audio/webm", apiKey }) => {
  if (!apiKey) {
    return {
      status: 500,
      body: { error: "DEEPGRAM_API_KEY is not configured." },
    };
  }

  if (!audioBuffer?.length) {
    return {
      status: 400,
      body: { error: "No audio was captured. Try again and speak after the mic turns on." },
    };
  }

  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en&punctuate=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioContentType,
      },
      body: audioBuffer,
    }
  );

  const responseText = await response.text();
  let result = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { error: responseText };
    }
  }

  if (!response.ok) {
    return {
      status: response.status,
      body: {
        error: result?.err_msg || result?.error || "Deepgram transcription failed.",
        details: result,
      },
    };
  }

  const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

  if (!transcript) {
    return {
      status: 200,
      body: {
        text: "",
        error: "No speech detected in audio.",
        debug: result,
      },
    };
  }

  return {
    status: 200,
    body: { text: transcript },
  };
};
