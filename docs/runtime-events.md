# Runtime Events Schema (v1)

This document freezes the current runtime event contracts used by panels (Chat, Worklog, Changes, Shell, Desktop, PR). Any change to these schemas must be versioned and accompanied by an adapter.

version: 1

Guidelines
- Use camelCase for property names
- Every event MUST include `eventId` (UUID v4) and `timestamp` (ms since epoch)
- Keep payload sizes small (< 100KB) for SSE
- Include `version` in event payloads for future migrations
- Deduplication: clients must dedupe on `eventId`

Event types

1) chat.message

{
  "type": "chat.message",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "sessionId": "session-...",
    "messageId": "msg-...",
    "author": { "id": "agent|user", "name": "Devin" },
    "text": "Hello world",
    "rich": null, // optional structured content (markdown/html safe subset)
    "attachments": [ { "type": "artifact", "uri": "artifact://..." } ]
  }
}

2) worklog.event

{
  "type": "worklog.event",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "sessionId": "session-...",
    "entryId": "wl-...",
    "level": "info|warning|error",
    "summary": "Ran tests",
    "details": "Optional longer text",
    "links": [ { "type": "pr|artifact|file", "uri": "..." } ]
  }
}

3) changes.diff

{
  "type": "changes.diff",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "repo": "repo-name",
    "commit": "sha",
    "files": [
      {
        "path": "src/foo.tsx",
        "diff": "@@ -1,3 +1,4 @@\n+added line\n",
        "hunks": [],
        "language": "typescript"
      }
    ],
    "author": { "id": "agent|user" }
  }
}

4) shell.output

{
  "type": "shell.output",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "sessionId": "session-...",
    "ptyId": "pty-...",
    "lines": [
      { "seq": 1, "text": "npm run test", "level": "out" },
      { "seq": 2, "text": "PASS  src/foo.test.ts", "level": "info" }
    ],
    "command": "npm run test",
    "exitCode": 0
  }
}

5) desktop.frame

{
  "type": "desktop.frame",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "sessionId": "session-...",
    "desktopId": "desktop-...",
    "frameUri": "https://.../frames/uuid.png", // or ephemeral token
    "cursor": { "x": 100, "y": 50 },
    "meta": { "fps": 12 }
  }
}

6) pr.update

{
  "type": "pr.update",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "repo": "repo-name",
    "prNumber": 123,
    "title": "Fix bug",
    "author": "user",
    "status": "open|merged|closed",
    "ci": { "status": "passing|failing|pending" }
  }
}

7) handoff.event

This event represents structured handoffs between agents (see HANDOFF spec).

{
  "type": "handoff.event",
  "version": "1",
  "eventId": "uuid-...",
  "timestamp": 1680000000000,
  "payload": {
    "handoffId": "uuid-...",
    "source": "manager",
    "target": "coder",
    "taskId": "MYTHIC-001",
    "payload": { /* structured payload per HANDOFF spec */ }
  }
}

Compatibility and adapters
- If you must change a field, create `version: 2` and provide an adapter to v1.
- Clients should log unknown `type` events and ignore them by default.

Deduplication
- Deduplicate events by `eventId`
- If events arrive out of order, use `timestamp` to reorder where possible


Appendix: Example SSE envelope

event: runtime
id: uuid-...
data: { "type": "chat.message", "payload": { ... } }

