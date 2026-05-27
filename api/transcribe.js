import { Buffer } from "node:buffer";
import { extractAudioFile, transcribeWithDeepgram } from "./transcribe-core.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const readRequestBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readRequestBody(req);
    const contentType = req.headers["content-type"] || "";
    const audioFile = extractAudioFile(body, contentType);
    const result = await transcribeWithDeepgram({
      audioBuffer: audioFile.buffer,
      audioContentType: audioFile.contentType,
      apiKey: process.env.DEEPGRAM_API_KEY,
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Transcription failed." });
  }
}
