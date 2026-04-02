const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
require('dotenv').config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Inject Socket.io over the same port
  const io = new Server(server, { 
    path: '/api/socket.io',
    cors: { origin: '*' }
  });

  const WebSocket = require('ws');

  io.on('connection', (socket) => {
    console.log('[Socket] Client securely connected:', socket.id);
    
    // Initialize OpenAI Realtime WebSocket connection on the rolling 'latest' deployment, dodging the buggy October build.
    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";
    let openAiWs;
    let sessionReady = false;
    try {
      openAiWs = new WebSocket(url, {
        headers: {
          "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      openAiWs.on('open', () => {
        console.log("[OpenAI] Secure tunnel established.");
        socket.emit('openai-event', '[NODE SERVER CONNECTED TO OPENAI CORE]');
        // Configure strictly the audio transcript hook, padding with 'audio' modality and strict VAD architecture to prevent OpenAI 500 crashes
        openAiWs.send(JSON.stringify({
          type: "session.update",
          session: { 
            modalities: ["text", "audio"],
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            instructions: "You are an elite live transcriber. Listen carefully and transcribe all voice input.",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 800 }
          }
        }));
      });

      openAiWs.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          
          socket.emit('openai-event', `[OpenAI] ${response.type}`);
          
          if (response.type === 'session.updated') {
            sessionReady = true;
          }

          if (response.type === 'error') {
            socket.emit('openai-event', `[FATAL MODEL ERROR] ${JSON.stringify(response.error, null, 2)}`);
          }

          if (response.type === 'response.audio_transcript.delta') {
            socket.emit('live-transcript', response.delta);
          }
          if (response.type === 'conversation.item.input_audio_transcription.completed') {
            socket.emit('live-transcript-done', response.transcript);
          }
        } catch (parseErr) {
          socket.emit('openai-event', `[UNKNOWN RAW DATA] ${data.toString()}`);
        }
      });

      openAiWs.on('error', (err) => {
        console.error("[OpenAI Socket Error]", err);
        socket.emit('openai-event', `[OpenAI SOCKET ERROR] ${err.message || 'Unknown'}`);
      });

      openAiWs.on('close', (code, reason) => {
        socket.emit('openai-event', `[OpenAI CONNECTION CLOSED] Code: ${code} - Reason: ${reason.toString() || 'None'}`);
      });

      openAiWs.on('unexpected-response', (req, res) => {
        socket.emit('openai-event', `[OpenAI API REJECTED CONNECTION] HTTP ${res.statusCode} (Likely Invalid API Key)`);
      });

    } catch (err) {
      console.error("Failed to initialize OpenAI WebSocket:", err);
      socket.emit('openai-event', `[NODE FATAL ERROR] ${err.message || 'Failed to initialize'}`);
    }

    socket.on('audio-chunk', (chunk) => {
      // Receive binary blob arrays from the browser, base64 encode them and pipe to OpenAI
      // CRITICAL PROTECTOR: Never send binary before OpenAI acknowledges session configuration!
      if (openAiWs && openAiWs.readyState === WebSocket.OPEN && sessionReady) {
        openAiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: Buffer.from(chunk).toString('base64')
        }));
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
      if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
        openAiWs.close();
      }
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Websocket Live Streaming Engine Ready on http://${hostname}:${port}`);
    });
});
