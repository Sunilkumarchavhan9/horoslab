# MemoryOS SDK Examples

These examples use the published package:

```bash
npm install @epochtm/sdk
```

Set environment variables before running:

```bash
EPOCH_API_KEY=<your_epoch_bearer_token>
EPOCH_BASE_URL=http://localhost:3001
```

Examples:

- `node-quickstart.ts` saves context, retrieves it, resumes a project, and creates a handoff.
- `langgraph-continuity.ts` shows where to call MemoryOS around graph nodes.
- `agent-handoff.ts` shows a minimal next-agent handoff flow.
