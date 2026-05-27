import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import process from 'node:process'

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

          // Extract audio from multipart form data
          const contentType = req.headers['content-type'] || ''
          let audioBuffer = body

          // If it's multipart, extract the audio file
          if (contentType.includes('multipart/form-data')) {
            const boundary = contentType.split('boundary=')[1]
            if (boundary) {
              const parts = body.toString('binary').split(`--${boundary}`)
              for (const part of parts) {
                if (part.includes('filename=') && part.includes('Content-Type:')) {
                  // Find where the actual file data starts (after double CRLF)
                  const dataStart = part.indexOf('\r\n\r\n') + 4
                  const dataEnd = part.lastIndexOf('\r\n')
                  if (dataStart > 3 && dataEnd > dataStart) {
                    audioBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary')
                    break
                  }
                }
              }
            }
          }

          console.log(`[Deepgram] Sending ${audioBuffer.length} bytes to Deepgram API`)

          // Send to Deepgram with better parameters
          const response = await fetch(
            'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en&punctuate=true',
            {
              method: 'POST',
              headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'audio/webm',
              },
              body: audioBuffer,
            }
          )

          const responseText = await response.text()
          let result = {}

          if (responseText) {
            try {
              result = JSON.parse(responseText)
            } catch {
              result = { error: responseText }
            }
          }

          console.log('[Deepgram] Response:', JSON.stringify(result, null, 2))

          if (!response.ok) {
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              error: result?.err_msg || result?.error || 'Deepgram transcription failed',
              details: result
            }))
            return
          }

          const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
          
          if (!transcript) {
            console.log('[Deepgram] Empty transcript. Full response:', result)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              text: '',
              error: 'No speech detected in audio',
              debug: result
            }))
            return
          }

          console.log('[Deepgram] Transcript:', transcript)
          
          // Return in OpenAI-compatible format
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ text: transcript }))
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
