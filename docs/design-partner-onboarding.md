# Design Partner Onboarding

## Goal

Show value in one session:
- MemoryOS retrieves useful continuity before a model call
- MemoryOS saves durable context after the call
- a second human or agent can pick up the same thread with a clean handoff

## Recommended first integration

Use the MCP HTTP endpoints:
- `GET /api/mcp/tools`
- `POST /api/mcp/invoke`

Start with these tools only:
- `memory.before_model`
- `memory.after_model`
- `memory.handoff`

## 30-minute setup

1. Generate a test JWT:

```bash
bun run token -- partner_demo_user
```

2. Confirm the MCP surface:

```bash
curl -X GET "http://localhost:3001/api/mcp/tools" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

3. Inject continuity before a model turn:

```bash
curl -X POST "http://localhost:3001/api/mcp/invoke" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "memory.before_model",
    "input": {
      "question": "what should I build next?",
      "project": "MemoryOS"
    }
  }'
```

4. Save new context after the turn:

```bash
curl -X POST "http://localhost:3001/api/mcp/invoke" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "memory.after_model",
    "input": {
      "message": "I finished the MCP HTTP contract tests.",
      "modelResponse": "Next ship integration docs and onboarding."
    }
  }'
```

5. Produce a handoff package:

```bash
curl -X POST "http://localhost:3001/api/mcp/invoke" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "memory.handoff",
    "input": {
      "project": "MemoryOS",
      "question": "prepare a handoff"
    }
  }'
```

## Success criteria

Your design partner should see:
- relevant context returned before a turn
- accepted memory counts after a turn
- a readable handoff package with current state and next actions

## Questions to ask the partner

- Did the retrieved context reduce repeated explanation?
- Did the handoff capture the right open loops?
- Which missed context would have made the result more useful?
- Which tools or thread dimensions should MemoryOS track next?
