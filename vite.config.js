import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { extractAudioFile, transcribeWithDeepgram } from './api/transcribe-core.js'

function deepgramTranscriptionPlugin() {
  return {
    name: 'taskease-deepgram-transcription',
    configureServer(server) {
      server.middlewares.use('/api/transcribe', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const apiKey = process.env.DEEPGRAM_API_KEY
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'DEEPGRAM_API_KEY is not set in .env' }))
          return
        }

        try {
          // Collect the entire request body
          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const body = Buffer.concat(chunks)

          const contentType = req.headers['content-type'] || ''
          const audioFile = extractAudioFile(body, contentType)

          console.log(`[Deepgram] Sending ${audioFile.buffer.length} bytes to Deepgram API as ${audioFile.contentType}`)

          const result = await transcribeWithDeepgram({
            audioBuffer: audioFile.buffer,
            audioContentType: audioFile.contentType,
            apiKey,
          })

          console.log('[Deepgram] Response:', JSON.stringify(result.body, null, 2))
          
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.body))
        } catch (error) {
          console.error('[Deepgram] Error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error?.message || 'Transcription failed' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY

  console.log('[Config] Deepgram API Key:', process.env.DEEPGRAM_API_KEY ? 'Set ✓' : 'Missing ✗')

  return {
    plugins: [react(), deepgramTranscriptionPlugin()],
  }
})
