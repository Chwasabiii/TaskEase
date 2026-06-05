import { Buffer } from "node:buffer";
import { extractAudioFile, transcribeWithDeepgram } from "../../api/transcribe-core.js";

const jsonResponse = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = Buffer.from(await req.arrayBuffer());
    const contentType = req.headers.get("content-type") || "";
    const audioFile = extractAudioFile(body, contentType);
    const result = await transcribeWithDeepgram({
      audioBuffer: audioFile.buffer,
      audioContentType: audioFile.contentType,
      apiKey: process.env.DEEPGRAM_API_KEY,
    });

    return jsonResponse(result.body, result.status);
  } catch (error) {
    return jsonResponse({ error: error?.message || "Transcription failed." }, 500);
  }
};

export const config = {
  path: "/api/transcribe",
};
