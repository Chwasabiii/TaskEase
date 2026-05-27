import { Buffer } from "node:buffer";
import { extractAudioFile, transcribeWithDeepgram } from "../../api/transcribe-core.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const requestBody = event.body || "";
    const body = Buffer.from(requestBody, event.isBase64Encoded ? "base64" : "utf8");
    const audioFile = extractAudioFile(body, event.headers["content-type"] || event.headers["Content-Type"] || "");
    const result = await transcribeWithDeepgram({
      audioBuffer: audioFile.buffer,
      audioContentType: audioFile.contentType,
      apiKey: process.env.DEEPGRAM_API_KEY,
    });

    return {
      statusCode: result.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.body),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error?.message || "Transcription failed." }),
    };
  }
};
