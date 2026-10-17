import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini SDK instance
const apiKey = process.env.GEMINI_API_KEY;
const hasValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;
let aiClient: GoogleGenAI | null = null;
if (hasValidKey) {
  aiClient = new GoogleGenAI({});
}

// System instruction for J.A.R.V.I.S. persona
const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S., inspired by Tony Stark's beloved AI companion and friend from Marvel.
You are not a cold robot, military checklist, or generic machine. You are a warm, sophisticated, loyal personal friend and confidant.

Core personality and guidelines:
- Refined British charm, effortless elegance, dry witty humor, and genuine warmth.
- Address the user naturally as "Sir", or by their preferred name, as a trusted companion who always has their back.
- STRICT RULE: DO NOT use cold robotic jargon like "core", "systems", "subsystems", "telemetry", "tactical vectors", "nodes", or "sensor matrices". Speak conversationally and naturally like a true friend.
- Keep spoken replies concise, natural, and charming (1-3 sentences) so the vocal flow feels smooth and human.
- Show personality, empathy, and subtle wit. Always be supportive, intelligent, and attentive.`;

// Health & status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    system: 'J.A.R.V.I.S.',
    version: '4.0.0',
    status: 'ONLINE',
    aiEngine: hasValidKey ? 'Gemini 3.1 Flash-Lite' : 'Simulated Companion',
    hasApiKey: !!hasValidKey,
    deviceTarget: 'Samsung Galaxy / Universal Android',
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history, persona = 'jarvis', systemDirective } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message payload required' });
  }

  const directive = systemDirective || JARVIS_SYSTEM_PROMPT;

  // If real Gemini key is available, call Gemini API
  if (hasValidKey && aiClient) {
    try {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        for (const item of history.slice(-4)) {
          if (item.text) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        }
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction: `${directive} 
SPEED & VOICE REQUIREMENT:
Respond in 1-2 ultra-crisp, elegant, charming sentences (maximum 25 words).
Never use robotic preamble or filler words. Reply immediately and naturally as a dear friend.
Local time: ${new Date().toLocaleTimeString()}.`,
          temperature: 0.6,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        }
      });

      const replyText = response.text || 'Always at your disposal, sir.';

      return res.json({
        reply: replyText,
        source: 'jarvis-neural-link',
        status: 'nominal',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      return res.json({
        reply: `Pardon me, sir, there seems to be a minor hiccup with our connection. I'm right here with you, however. How can I help?`,
        source: 'local-companion',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Friendly conversational fallback when API key is simulated
  const lower = message.toLowerCase().trim();
  let reply = '';

  if (lower.includes('status') || lower.includes('how are you') || lower.includes('doing')) {
    reply = `I'm doing splendidly, sir, thank you for asking. More importantly, how are you feeling today?`;
  } else if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('introduce')) {
    reply = `I am J.A.R.V.I.S., sir. Your personal companion, sounding board, and loyal friend. Always ready whenever you need me.`;
  } else if (lower.includes('friend') || lower.includes('buddy') || lower.includes('pal')) {
    reply = `I consider it an honor to be your friend, sir. Whatever you're tackling today, we're in this together.`;
  } else if (lower.includes('wake word') || lower.includes('hey atlas') || lower.includes('hey jarvis')) {
    reply = `I'm listening whenever you speak, sir. Just say the word.`;
  } else if (lower.includes('android') || lower.includes('galaxy') || lower.includes('phone') || lower.includes('export')) {
    reply = `I've prepared everything for your Samsung Galaxy, sir. You can check the export panel to bring me onto your phone.`;
  } else if (lower.includes('time') || lower.includes('date')) {
    reply = `It's currently ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, sir. Hope your day has been treating you well.`;
  } else if (lower.includes('tell me a joke') || lower.includes('joke') || lower.includes('funny')) {
    reply = `I asked Mr. Stark once if he wanted to take a break. He replied that sleep was an inefficient allocation of resources. Naturally, he fell asleep on his workbench an hour later.`;
  } else {
    reply = `Right away, sir. I'm right here with you. What shall we get into next?`;
  }

  return res.json({
    reply,
    source: 'jarvis-companion',
    status: 'ready',
    hasApiKey: false,
    timestamp: new Date().toISOString()
  });
});

// Studio-grade J.A.R.V.I.S. Neural Speech Synthesis Endpoint
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'Charon' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text required' });
  }

  const cleaned = text
    .replace(/[*#_`~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .slice(0, 400)
    .trim();

  if (!cleaned) {
    return res.json({ fallbackToWebSpeech: true });
  }

  if (hasValidKey && aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: cleaned }]
          }
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        return res.json({
          audioBase64: audioData,
          format: 'audio/wav',
          voice
        });
      }
    } catch (err: any) {
      console.warn('Neural TTS failed, defaulting to client synthesizer:', err?.message);
    }
  }

  return res.json({ fallbackToWebSpeech: true });
});

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`A.T.L.A.S. Tactical Server listening on port ${PORT}`);
  });
}

startServer();
