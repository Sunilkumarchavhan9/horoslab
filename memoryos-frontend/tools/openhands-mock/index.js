const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.OPENHANDS_MOCK_PORT || 3013;

app.use(express.json());

// Simple in-memory mapping for conversation IDs -> conversation_url/session_api_key
const conversations = new Map();
const startTasks = new Map();
const events = new Map();
// Example: set a default entry for development
conversations.set('4c05645e-db57-4833-86e5-e36569c96662', {
  id: '4c05645e-db57-4833-86e5-e36569c96662',
  title: 'Mock session',
  selected_repository: null,
  selected_branch: null,
  llm_model: null,
  sandbox_status: 'RUNNING',
  execution_status: 'idle',
  conversation_url: `http://127.0.0.1:${port}/api/conversations/4c05645e-db57-4833-86e5-e36569c96662`,
  session_api_key: 'mock-session-key',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

app.get('/api/v1/app-conversations', (req, res) => {
  const ids = (req.query.ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  const result = ids.map((id) => conversations.get(id) || null);
  res.json(result);
});

app.get('/api/v1/app-conversations/search', (req, res) => {
  const limit = Number(req.query.limit || 20);
  res.json({ items: Array.from(conversations.values()).slice(0, limit), next_page_id: null });
});

app.post('/api/v1/app-conversations', (req, res) => {
  const id = crypto.randomUUID();
  const taskId = crypto.randomUUID();
  const now = new Date().toISOString();
  const conversation = {
    id,
    title: req.body.title || req.body.initial_message?.content?.[0]?.text?.slice(0, 80) || 'Mock session',
    selected_repository: req.body.selected_repository || null,
    selected_branch: req.body.selected_branch || null,
    llm_model: req.body.llm_model || null,
    sandbox_status: 'RUNNING',
    execution_status: 'running',
    conversation_url: `http://127.0.0.1:${port}/api/conversations/${id}`,
    session_api_key: 'mock-session-key',
    created_at: now,
    updated_at: now,
  };
  conversations.set(id, conversation);
  const text = req.body.initial_message?.content?.[0]?.text;
  if (text) {
    events.set(id, [{
      id: `${id}-user-1`,
      timestamp: now,
      source: 'user',
      llm_message: { role: 'user', content: [{ type: 'text', text }] },
    }]);
  }
  startTasks.set(taskId, {
    id: taskId,
    status: 'READY',
    detail: null,
    app_conversation_id: id,
    sandbox_id: `sandbox-${id}`,
    agent_server_url: conversation.conversation_url,
  });
  res.json(startTasks.get(taskId));
});

app.get('/api/v1/app-conversations/start-tasks', (req, res) => {
  const ids = (req.query.ids || '').split(',').map((s) => s.trim()).filter(Boolean);
  res.json(ids.map((id) => startTasks.get(id) || null));
});

app.post('/api/v1/app-conversations/:id/send-message', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) return res.status(404).json({ detail: 'Conversation not found' });
  const text = req.body.content?.[0]?.text || '';
  const now = new Date().toISOString();
  const list = events.get(req.params.id) || [];
  list.push({
    id: `${req.params.id}-user-${list.length + 1}`,
    timestamp: now,
    source: 'user',
    llm_message: { role: 'user', content: [{ type: 'text', text }] },
  });
  events.set(req.params.id, list);
  res.json({ success: true, sandbox_status: 'RUNNING' });
});

app.get('/api/v1/conversation/:id/events/search', (req, res) => {
  res.json({ items: events.get(req.params.id) || [], next_page_id: null });
});

app.get('/api/vscode/url', (req, res) => {
  // Return a mock VSCode sandbox URL. Frontend expects { url: string }
  const url = process.env.MOCK_VSCODE_URL || 'http://127.0.0.1:3020/?sandbox=dev';
  res.json({ url });
});

app.get('/desktop', (req, res) => {
  res.redirect('/desktop-sandbox.html');
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`OpenHands mock running at http://127.0.0.1:${port}`);
});
