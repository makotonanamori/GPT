const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

let openai = null;

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    'Warning: OPENAI_API_KEY is not set. The chat endpoint will fail until the key is provided.'
  );
} else {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MODEL_ID_MAP = {
  'GPT-5': 'gpt-5',
  'GPT-5-mini': 'gpt-5-mini',
  'GPT-5-nano': 'gpt-5-nano',
  'GPT-4.1': 'gpt-4.1',
};

const FALLBACK_MODEL = 'gpt-5-mini';

function buildModelInput(messages, system) {
  const input = [];

  if (typeof system === 'string') {
    const trimmed = system.trim();
    if (trimmed) {
      input.push({ role: 'system', content: trimmed });
    }
  }

  if (Array.isArray(messages)) {
    for (const message of messages) {
      if (!message || typeof message !== 'object') continue;
      const { role, content } = message;
      if (typeof role !== 'string' || typeof content !== 'string') continue;
      input.push({ role, content });
    }
  }

  return input;
}

function resolveModel(model) {
  return MODEL_ID_MAP[model] ?? FALLBACK_MODEL;
}

app.post('/api/chat', async (req, res) => {
  if (!openai) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  try {
    const { messages, model, system } = req.body || {};

    const input = buildModelInput(messages, system);
    if (input.length === 0) {
      return res.status(400).json({ error: 'messages must contain at least one entry' });
    }

    const targetModel = resolveModel(model);

    const response = await openai.responses.create({
      model: targetModel,
      input,
    });

    const content = response.output_text ?? '';

    return res.json({ role: 'assistant', content });
  } catch (error) {
    console.error('Chat request failed:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(500).json({ error: 'Unknown error occurred' });
  }
});

async function handleStreamRequest(payload, res) {
  if (!openai) {
    res.status(500).end('API key missing');
    return;
  }

  try {
    const { messages, model, system } = payload || {};
    const targetModel = resolveModel(model);

    const input = buildModelInput(messages, system);
    if (input.length === 0) {
      res.status(400).end('messages must contain at least one entry');
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.responses.stream({
      model: targetModel,
      input,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
      }
      if (event.type === 'response.completed') {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      if (event.type === 'response.error') {
        res.write(`data: ${JSON.stringify({ error: event.error?.message || 'stream error' })}\n\n`);
      }
    }
    res.end();
  } catch (err) {
    console.error('SSE stream failed:', err);
    const message = err instanceof Error ? err.message : 'stream error';
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.status(500);
    }
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
}

app.get('/api/chat/stream', async (req, res) => {
  const { payload } = req.query;
  let parsed = {};

  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload);
    } catch (error) {
      res.status(400).end('Invalid payload');
      return;
    }
  } else {
    parsed = {
      messages: req.query.messages,
      model: req.query.model,
      system: req.query.system,
    };
  }

  await handleStreamRequest(parsed, res);
});

app.post('/api/chat/stream', async (req, res) => {
  await handleStreamRequest(req.body || {}, res);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
