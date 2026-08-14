# MemoryOS Company Brain — Core Product

## Positioning

MemoryOS is **persistent company intelligence infrastructure** and the **Inheritance Runtime for AI-native companies** — not a chatbot, RAG wrapper, or generic AI control plane.

It is:

- organizational memory runtime
- agent operating system for company knowledge
- executable intelligence layer across GitHub, Notion, Jira, Slack, APIs, repos, and operational logs

**One-line:** MemoryOS connects the tools companies already use, transforms scattered knowledge into structured memory (`memoryos.contract.v1`), and turns that memory into **executable intelligence** for developers and agents — with continuity, traceability, governance, and inheritance through MemoryIgnition.

## Five pillars (every console section maps here)

| Pillar | Meaning |
|--------|---------|
| **Ingest** | Connect tools; sync; webhooks; contract-category counts |
| **Structure** | Memory contracts, graph, lineage, evolution |
| **Execute** | Retrieval, runtime APIs, agent skills, tool actions |
| **Continue** | Cross-model handoff; resume brief; living workspace |
| **Operate safely** | Governance, billing limits, privacy, audit |

Section mapping lives in `memoryos-frontend/lib/company-brain.ts` (`CONSOLE_SECTION_BRAIN`).

## Mission Control — section audit

| Section | Supports vision? | Tier |
|---------|----------------|------|
| Overview | Control center — live memory, connectors, continuity | Live |
| Connected Intelligence Sources | Ingest from GitHub, Jira, Slack, files, … | Partial |
| Continuity Lab | Living memory workspace; multi-agent; live chat | Partial |
| Memory Graph | Structured relationships from live memories | Partial |
| Playground | Agent runtime sandbox; trace proof | Live |
| Runtime Activity | Live API / retrieval monitor | Live |
| Agent Activity Timeline | Traceable agent/API actions | Partial |
| Memory Evolution Timeline | How intelligence changed over time | Partial |
| Security + Governance | Review gates, retention, redaction | Partial |
| Integrations & SDK | Wire agents and CI | Live |
| Team / Billing / Settings / API Keys | Production operation | Live |

## Core workspace

| Surface | Foundation |
|---------|------------|
| **Continuity Labs** | OpenHands fork — Codex-class execution workspace with Company Brain layers |

## Continuity Labs

**Product name:** Company operational memory layer for autonomous engineering agents

**Foundation:**

- Fork OpenHands as the core workspace/runtime
- Keep task threads, terminal, file explorer, browser automation, sandbox handling, and agent execution loop from OpenHands
- Add Company Brain layers on top: memory graph, connectors, risk intelligence, executable skills, context injection, deployment intelligence, incident memory, and LangGraph orchestration

**Do not fork initially:**

- LangGraph — use as package/service
- Continue.dev — use as editor integration inspiration
- SWE-agent — use for workflow patterns
- OpenDevin — use for planning loop inspiration

Capabilities matrix: `CONTINUITY_LAB_CAPABILITIES` in `company-brain.ts`.

## Executable skills

MemoryOS turns workflows, decisions, repositories, and operational knowledge into **reusable executable intelligence**:

- memory contracts at ingest
- retrieval + continue + handoff APIs
- agent runtime hooks (SDK / MCP)
- governance on high-risk writes

## Privacy & enterprise

- Workspace-scoped memory and tokens
- Governance modes (balanced / strict / enterprise)
- Plan-gated connectors and usage meters
- Private deployment and model choice — positioning; full tenant isolation is roadmap

## Ship tracks A → B (in progress)

### Track A — Connect → brief → OpenHands workspace funnel

- Overview **Company Brain setup** panel (4 steps)
- Onboarding activates funnel; defaults toward Developer Continuity
- Connected Sources highlights GitHub when funnel active
- Continuity Labs opens the OpenHands fork workspace from funnel CTAs

### Track B — Governed GitHub execution (write-back)

- `GET /api/connector/github/repos` — repo picker (Octokit)
- `POST /api/connector/github/execution/propose` — kinds: `issue_comment`, `brief_file_commit`, `pull_request`
- `POST /api/connector/github/execution/:id/approve` — executes approved proposal on GitHub
- `GET /api/connector/github/execution/proposals`
- OpenHands workspace: repo select → propose → approve → run
- `GET/PATCH /api/memory/company-brain/funnel` — server-persisted onboarding progress

## Phases (Codex ship order)

1. **Phase 1** — Auth, connectors, ingestion, storage, retrieval → **~75%**
2. **Phase 2** — Continuity Lab, graph, agent runtime → **~45%**
3. **Phase 3** — Execution write-back to tools → **~15%**
4. **Phase 4** — Enterprise governance, audit, multi-tenant → **~35%**

Phase 1 focus is intentionally narrow:

- start with the highest-signal engineering sources
- prove resume/handoff/trace value end to end
- only add connectors that improve continuity, trust, or execution
- avoid expanding into generic control-surface behavior before the wedge is repeatable

Connector ladder:

- Core engineering: GitHub, Slack, Jira, Linear, docs, local files
- Developer workflow: Cursor, VS Code, Windsurf, Codex, Claude Code
- Observability and ops: Sentry, CI/CD, Vercel, DigitalOcean, cloud logs
- Customer and business systems: Zendesk, email, meetings, CRM, tickets

See also: `docs/COMPANY_BRAIN_P0_P1_P2_BACKLOG.md`, `docs/BILLING_TUNING.md`.

## UI principle

Every section must answer:

- what memory exists
- what systems are connected
- what agents can do
- what actions happened
- what intelligence was learned
- what can be executed next

Pillar strip component: `CompanyBrainPillarStrip` — shown on intelligence sections and Overview.
