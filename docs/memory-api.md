 # MemoryOS API Reference

Base URL:

```text
http://localhost:3001
```

Versioned base (recommended):

```text
http://localhost:3001/api/v1
```

Auth:
- All `/api/memory/*` endpoints require:
  - `Authorization: Bearer <JWT_TOKEN>`
- `/api/health` does not require auth.

Generate a token:

```bash
bun run token -- u_demo_1
```

## Health

### `GET /api/health`

Response `200`:

```json
{
  "status": "ok"
}
```

### `GET /api/v1/health`

Same response as `/api/health`.

### `GET /api/metrics`

Prometheus metrics endpoint.

Response `200` (text/plain):

```text
# HELP memoryos_http_requests_total Total number of HTTP requests handled by MemoryOS API
# TYPE memoryos_http_requests_total counter
```

If `METRICS_TOKEN` is set, send either:
- `Authorization: Bearer <METRICS_TOKEN>`
- `x-metrics-token: <METRICS_TOKEN>`

## Memory Ingest

### `POST /api/memory/process`

Body:

```json
{
  "threadId": "t1",
  "message": "I am learning transformers"
}
```

## Voice Streaming (Pipecat)

### `POST /api/memory/voice/sessions/start`

Body:

```json
{
  "sessionId": "pc-session-001",
  "source": "pipecat",
  "workspace": "support-team",
  "project": "voice-assistant",
  "threadId": "voice:pc-session-001"
}
```

Response `200`:

```json
{
  "session": {
    "sessionId": "pc-session-001",
    "userId": "u_demo_1",
    "source": "pipecat",
    "status": "active",
    "chunkCount": 0,
    "totalCharacters": 0
  }
}
```

### `POST /api/memory/voice/chunk`

Body:

```json
{
  "sessionId": "pc-session-001",
  "chunkIndex": 3,
  "speaker": "user",
  "chunk": "I am debugging audio latency in our support bot.",
  "tags": ["latency", "support"],
  "sentiment": "neutral"
}
```

Response `200`:

```json
{
  "session": {},
  "acceptedMemories": [],
  "rejectedMemories": [],
  "timelineEvents": []
}
```

### `GET /api/memory/voice/sessions/:sessionId`

Response `200`:

```json
{
  "session": {}
}
```

### `POST /api/memory/voice/sessions/end`

Body:

```json
{
  "sessionId": "pc-session-001",
  "finalSummary": "Call ended with next steps to improve latency monitoring."
}
```

Response `200`:

```json
{
  "session": {},
  "summaryIngestResult": {
    "acceptedMemories": [],
    "rejectedMemories": [],
    "timelineEvents": []
  }
}
```

Response `200`:

```json
{
  "acceptedMemories": [],
  "rejectedMemories": [],
  "timelineEvents": []
}
```

Validation error `400`:

```json
{
  "error": "Invalid request body",
  "details": {}
}
```

## Memory Retrieval

### `POST /api/memory/retrieve`

Body:

```json
{
  "question": "what should I build next?",
  "topK": 5,
  "includeArchived": false
}
```

Response `200`:

```json
{
  "memories": [],
  "debug": []
}
```

### `GET /api/memory/retrieve/explain?question=<QUESTION>&topK=5`

Response `200`:

```json
{
  "intent": "build_next",
  "weightsUsed": {
    "semantic": 0.4,
    "typeRelevance": 0.25,
    "importance": 0.2,
    "recency": 0.15
  },
  "ranked": [
    {
      "id": "memory-id",
      "memory": "User is building MemoryOS",
      "memoryType": "project",
      "finalScore": 0.95,
      "semanticScore": 0.9,
      "typeRelevanceScore": 1,
      "importanceScore": 0.84,
      "recencyScore": 1,
      "continuityBoost": 0.12,
      "updatedAt": "2026-04-06T00:00:00.000Z",
      "intent": "build_next",
      "weightsUsed": {
        "semantic": 0.4,
        "typeRelevance": 0.25,
        "importance": 0.2,
        "recency": 0.15
      }
    }
  ],
  "whyTop1": "Top memory ranked highest because it matched intent/type..."
}
```

Error `400` (missing question):

```json
{
  "error": "question is required"
}
```

## Continuity Planning

### `POST /api/memory/continue`

Body:

```json
{
  "question": "what should I do next on MemoryOS?",
  "mode": "build_next",
  "topK": 5,
  "includeArchived": false
}
```

Response `200`:

```json
{
  "nextActions": [],
  "usedMemories": [],
  "debug": {
    "mode": "build_next",
    "retrieval": []
  }
}
```

Modes:
- `build_next`
- `debug_next`
- `learn_next`

## Resume Planning

### `POST /api/memory/resume`

Body:

```json
{
  "project": "MemoryOS",
  "question": "where did I leave off?",
  "topK": 5,
  "includeArchived": false
}
```

Response `200`:

```json
{
  "summary": "",
  "lastKnownState": "",
  "openLoops": [],
  "recommendedNextStep": "",
  "usedMemories": [],
  "debug": {
    "project": "MemoryOS",
    "retrieval": []
  }
}
```

## Handoff Generation

### `POST /api/memory/handoff`

Body:

```json
{
  "project": "MemoryOS",
  "question": "create a handoff for another developer",
  "topK": 5,
  "includeArchived": false
}
```

Response `200`:

```json
{
  "handoffTitle": "MemoryOS continuity handoff",
  "summary": "",
  "lastKnownState": "",
  "nextRecommendedAction": "",
  "openLoops": [],
  "keyDecisions": [],
  "risks": [],
  "usedMemories": []
}
```

## Explainability

### `GET /api/memory/explain?memoryId=<MEMORY_ID>`

Response `200`:

```json
{
  "memory": {},
  "latestRevision": null,
  "timeline": [],
  "explanation": {
    "whySaved": "",
    "importanceScore": 0,
    "confidence": 0,
    "evidenceCount": 0,
    "lastUpdatedAt": "",
    "status": "active",
    "timelineCount": 0,
    "revisionCount": 0,
    "stalenessDays": 0,
    "stalenessBucket": "fresh"
  }
}
```

Error `400` (missing memoryId):

```json
{
  "error": "memoryId is required"
}
```

Error `404`:

```json
{
  "error": "Memory not found"
}
```

## Insights

### `GET /api/memory/insights`

Response `200`:

```json
{
  "totalsByType": {
    "profile": 0,
    "preference": 1,
    "learning": 1,
    "project": 1,
    "episodic": 0
  },
  "totalsByStatus": {
    "active": 3,
    "archived": 0,
    "merged": 0
  },
  "topSkills": ["typescript", "transformers", "memoryos"],
  "activeProjects": ["Building MemoryOS"],
  "recentMilestones": ["memory_created: passed score threshold 0.65"]
}
```

## Memory Management

### `GET /api/memory/list?status=active&type=project&limit=20`

Response `200`:

```json
{
  "memories": [],
  "count": 0
}
```

### `GET /api/memory/:memoryId`

Response `200`:

```json
{
  "memory": {}
}
```

Error `404`:

```json
{
  "error": "Memory not found"
}
```

### `PATCH /api/memory/:memoryId/status`

Body:

```json
{
  "status": "archived"
}
```

Allowed `status`:
- `active`
- `archived`
- `merged`

Response `200`:

```json
{
  "memory": {},
  "revisionEvent": null,
  "timelineEvent": null
}
```

### `PATCH /api/memory/:memoryId/archive`

Body:

```json
{}
```

Response `200`:

```json
{
  "memory": {},
  "revisionEvent": null,
  "timelineEvent": {}
}
```

### `PATCH /api/memory/:memoryId/unarchive`

Body:

```json
{}
```

Response `200`:

```json
{
  "memory": {},
  "revisionEvent": null,
  "timelineEvent": {}
}
```

## Timeline and Revisions

### `GET /api/memory/timeline`

Response `200`:

```json
{
  "events": [],
  "count": 0
}
```

### `GET /api/memory/revisions`

Response `200`:

```json
{
  "revisions": [],
  "count": 0
}
```

Filter by memory id:

```text
GET /api/memory/revisions?memoryId=<MEMORY_ID>
```

## MVP Readiness

### `GET /api/memory/mvp/status`

Response `200`:

```json
{
  "status": "on_track",
  "checkedAt": "2026-04-06T00:00:00.000Z",
  "checks": {
    "storesIntegrity": true,
    "retrievalConfigLoaded": true,
    "baselineReportPresent": true,
    "evalPassRateAtLeast90": true
  },
  "metrics": {
    "evalPassRate": 100,
    "totalEvalCases": 20
  },
  "completed": [
    "Runtime memory stores are valid JSON.",
    "Best retrieval config is present and valid."
  ],
  "pending": []
}
```

### `GET /api/memory/benchmark/report`

Returns the latest benchmark artifact from `data/eval/benchmark-report.json`.

Response `200`:

```json
{
  "generatedAt": "2026-04-16T07:53:36.452Z",
  "totalCases": 7,
  "passedCases": 7,
  "failedCases": 0,
  "passRate": 100,
  "kpis": {
    "top3_retrieval_precision": 100,
    "resume_success_rate": 100,
    "contradiction_miss_rate": 0,
    "wrong_merge_rate": null,
    "p95_retrieve_latency": null
  }
}
```

Error `404`:

```json
{
  "error": "Benchmark report not found",
  "hint": "Run bun run eval:benchmark first"
}
```

## Request History

### `GET /api/memory/requests`

Query params:
- `limit` (default 100, max 400)
- `type` (optional)
- `status` (`Success` or `Error`, optional)
- `range` (`1d`, `7d`, `30d`, `all`)

Response `200`:

```json
{
  "requests": [],
  "count": 0,
  "filters": {
    "limit": 100,
    "type": null,
    "status": null,
    "range": "all"
  }
}
```

## Retrieval Weights (Dev)

### `PATCH /api/memory/config/retrieval-weights`

Body:

```json
{
  "semantic": 0.4,
  "typeRelevance": 0.25,
  "importance": 0.2,
  "recency": 0.15
}
```

Response `200`:

```json
{
  "weights": {
    "semantic": 0.4,
    "typeRelevance": 0.25,
    "importance": 0.2,
    "recency": 0.15
  }
}
```

## Common Errors

Unauthorized `401`:

```json
{
  "error": "Unauthorized"
}
```

Route not found `404`:

```json
{
  "error": "Route not found"
}
```

## Backward Compatibility

- Prefer `/api/v1/memory/*` moving forward.
- Legacy `/api/memory/*` remains available for compatibility.
- Responses include `x-api-version: 1`.

## Company Brain Phase 2

### `POST /api/memory/company-brain/phase2/capture`

Stores structured company knowledge into four memory pillars:
- decision memory
- incident memory
- architecture memory
- process memory

Body example:

```json
{
  "project": "memoryos-core",
  "decisionMemories": [
    {
      "decision": "Use GitHub connector as default memory pipeline",
      "why": "Most engineering context already lives in repos and PRs",
      "who": ["Founder", "Platform Lead"],
      "alternatives": ["Generic connector order", "Local-first only"]
    }
  ],
  "incidentMemories": [
    {
      "rootCause": "Scoped retrieval returned empty due to strict metadata filtering",
      "fix": "Fallback to merged candidates when scoped filter returns none",
      "lessonsLearned": ["Do not hard-empty retrieval on incomplete metadata"]
    }
  ],
  "architectureMemories": [
    {
      "adr": "ADR-023: Contract-first continuity memory",
      "tradeoffs": ["Higher upfront structure work", "Better resume reliability"],
      "constraints": ["Must keep backward-compatible APIs"]
    }
  ],
  "processMemories": [
    {
      "workflowType": "deploy",
      "workflow": "Production release flow",
      "steps": ["Run gate", "Review failures", "Approve", "Deploy"]
    }
  ]
}
```

### `GET /api/memory/company-brain/phase2/overview?project=<project>`

Returns structured memory coverage and latest entries by pillar.
