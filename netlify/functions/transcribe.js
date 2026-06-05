import { Buffer } from "node:buffer";
import { extractAudioFile, transcribeWithDeepgram } from "../../api/transcribe-core.js";

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
    const contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"] || "";
    const audioFile = extractAudioFile(body, contentType);
    const result = await transcribeWithDeepgram({
      audioBuffer: audioFile.buffer,
      audioContentType: audioFile.contentType,
      apiKey: process.env.DEEPGRAM_API_KEY,
    });

    return jsonResponse(result.status, result.body);
  } catch (error) {
    return jsonResponse(500, { error: error?.message || "Transcription failed." });
  }
};
