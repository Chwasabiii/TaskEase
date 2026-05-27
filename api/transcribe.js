import { Buffer } from "node:buffer";

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

const extractAudioBuffer = (body, contentType) => {
  if (!contentType.includes("multipart/form-data")) {
    return body;
  }

  const boundary = contentType.split("boundary=")[1];
  if (!boundary) return body;

  const parts = body.toString("binary").split(`--${boundary}`);
  const filePart = parts.find((part) => part.includes("filename=") && part.includes("Content-Type:"));
  if (!filePart) return body;

  const dataStart = filePart.indexOf("\r\n\r\n") + 4;
  const dataEnd = filePart.lastIndexOf("\r\n");

  if (dataStart <= 3 || dataEnd <= dataStart) {
    return body;
  }

  return Buffer.from(filePart.substring(dataStart, dataEnd), "binary");
};

const readDeepgramResponse = async (response) => {
  const responseText = await response.text();
  if (!responseText) return {};

  try {
    return JSON.parse(responseText);
  } catch {
    return { error: responseText };
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "DEEPGRAM_API_KEY is not configured." });
    return;
  }

  try {
    const body = await readRequestBody(req);
    const contentType = req.headers["content-type"] || "";
    const audioBuffer = extractAudioBuffer(body, contentType);

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "audio/webm",
        },
        body: audioBuffer,
      }
    );

    const result = await readDeepgramResponse(response);

    if (!response.ok) {
      res.status(response.status).json({
        error: result?.err_msg || result?.error || "Deepgram transcription failed.",
        details: result,
      });
      return;
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcript) {
      res.status(200).json({
        text: "",
        error: "No speech detected in audio.",
        debug: result,
      });
      return;
    }

    res.status(200).json({ text: transcript });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Transcription failed." });
  }
}
