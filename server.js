diff --git a//dev/null b/server.js
index 0000000000000000000000000000000000000000..c2855e775b01f9fcc0f53b225883ce25817879f8 100644
--- a//dev/null
+++ b/server.js
@@ -0,0 +1,211 @@
+const path = require('path');
+const crypto = require('crypto');
+const express = require('express');
+const cors = require('cors');
+const dotenv = require('dotenv');
+const { OpenAI } = require('openai');
+
+dotenv.config();
+
+const app = express();
+const port = process.env.PORT || 3000;
+
+let openai = null;
+
+if (!process.env.OPENAI_API_KEY) {
+  console.warn(
+    'Warning: OPENAI_API_KEY is not set. The chat endpoint will fail until the key is provided.'
+  );
+} else {
+  openai = new OpenAI({
+    apiKey: process.env.OPENAI_API_KEY,
+  });
+}
+
+app.use(cors());
+app.use(express.json());
+app.use(express.static(path.join(__dirname, 'public')));
+
+const MODEL_ID_MAP = {
+  'GPT-5': 'gpt-5',
+  'GPT-5-mini': 'gpt-5-mini',
+  'GPT-5-nano': 'gpt-5-nano',
+  'GPT-4.1': 'gpt-4.1',
+};
+
+const FALLBACK_MODEL = 'gpt-5-mini';
+
+const STREAM_TIMEOUT_MS = 60 * 1000;
+const pendingStreams = new Map();
+
+function buildModelInput(messages, system) {
+  const input = [];
+
+  if (typeof system === 'string') {
+    const trimmed = system.trim();
+    if (trimmed) {
+      input.push({ role: 'system', content: trimmed });
+    }
+  }
+
+  if (Array.isArray(messages)) {
+    for (const message of messages) {
+      if (!message || typeof message !== 'object') continue;
+      const { role, content } = message;
+      if (typeof role !== 'string' || typeof content !== 'string') continue;
+      input.push({ role, content });
+    }
+  }
+
+  return input;
+}
+
+function resolveModel(model) {
+  return MODEL_ID_MAP[model] ?? FALLBACK_MODEL;
+}
+
+function prepareChatInput(payload) {
+  const { messages, model, system } = payload || {};
+  const input = buildModelInput(messages, system);
+
+  if (input.length === 0) {
+    return { error: 'messages must contain at least one entry' };
+  }
+
+  const targetModel = resolveModel(model);
+  return { input, targetModel };
+}
+
+app.post('/api/chat', async (req, res) => {
+  if (!openai) {
+    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
+  }
+
+  try {
+    const prepared = prepareChatInput(req.body || {});
+    if (prepared.error) {
+      return res.status(400).json({ error: prepared.error });
+    }
+
+    const response = await openai.responses.create({
+      model: prepared.targetModel,
+      input: prepared.input,
+    });
+
+    const content = response.output_text ?? '';
+
+    return res.json({ role: 'assistant', content });
+  } catch (error) {
+    console.error('Chat request failed:', error);
+
+    if (error instanceof Error) {
+      return res.status(500).json({
+        error: error.message,
+      });
+    }
+
+    return res.status(500).json({ error: 'Unknown error occurred' });
+  }
+});
+
+async function handleStreamRequest(prepared, res) {
+  if (!openai) {
+    res.status(500).end('API key missing');
+    return;
+  }
+
+  try {
+    res.setHeader('Content-Type', 'text/event-stream');
+    res.setHeader('Cache-Control', 'no-cache');
+    res.setHeader('Connection', 'keep-alive');
+
+    const stream = await openai.responses.stream({
+      model: prepared.targetModel,
+      input: prepared.input,
+      stream: true,
+    });
+
+    for await (const event of stream) {
+      if (event.type === 'response.output_text.delta') {
+        res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
+      }
+      if (event.type === 'response.completed') {
+        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
+      }
+      if (event.type === 'response.error') {
+        res.write(`data: ${JSON.stringify({ error: event.error?.message || 'stream error' })}\n\n`);
+      }
+    }
+    res.end();
+  } catch (err) {
+    console.error('SSE stream failed:', err);
+    const message = err instanceof Error ? err.message : 'stream error';
+    if (!res.headersSent) {
+      res.setHeader('Content-Type', 'text/event-stream');
+      res.status(500);
+    }
+    if (!res.writableEnded) {
+      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
+      res.end();
+    }
+  }
+}
+
+app.post('/api/chat/stream', async (req, res) => {
+  const prepared = prepareChatInput(req.body || {});
+  if (prepared.error) {
+    res.status(400).end(prepared.error);
+    return;
+  }
+
+  await handleStreamRequest(prepared, res);
+});
+
+app.post('/api/chat/stream/init', (req, res) => {
+  if (!openai) {
+    res.status(500).json({ error: 'API key missing' });
+    return;
+  }
+
+  const prepared = prepareChatInput(req.body || {});
+  if (prepared.error) {
+    res.status(400).json({ error: prepared.error });
+    return;
+  }
+
+  const streamId = crypto.randomUUID();
+  const timeout = setTimeout(() => {
+    pendingStreams.delete(streamId);
+  }, STREAM_TIMEOUT_MS);
+
+  timeout.unref?.();
+
+  pendingStreams.set(streamId, { prepared, timeout });
+  res.json({ streamId });
+});
+
+app.get('/api/chat/stream', async (req, res) => {
+  const { streamId } = req.query;
+
+  if (typeof streamId !== 'string' || !streamId) {
+    res.status(400).end('streamId query parameter is required');
+    return;
+  }
+
+  const stored = pendingStreams.get(streamId);
+  if (!stored) {
+    res.status(404).end('stream not found or expired');
+    return;
+  }
+
+  pendingStreams.delete(streamId);
+  if (stored.timeout) {
+    clearTimeout(stored.timeout);
+  }
+
+  await handleStreamRequest(stored.prepared, res);
+});
+
+app.listen(port, () => {
+  console.log(`Server is running on http://localhost:${port}`);
+});
