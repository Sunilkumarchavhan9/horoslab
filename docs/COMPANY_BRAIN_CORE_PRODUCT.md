# MemoryOS Company Brain — Core Product

## Positioning

MemoryOS is **persistent company intelligence infrastructure** — not a chatbot, RAG wrapper, or generic AI dashboard.

It is:

- organizational memory runtime
- agent operating system for company knowledge
- executable intelligence layer across GitHub, Notion, Jira, Slack, APIs, and repos

**One-line:** MemoryOS connects the tools companies already use, transforms scattered knowledge into structured memory (`memoryos.contract.v1`), and turns that memory into **executable intelligence** for developers and agents — with continuity, traceability, and governance.

## Five pillars (every console section maps here)

| Pillar | Meaning |
|--------|---------|
| **Ingest** | Connect tools; sync; webhooks; contract-category counts |
| **Structure** | Memory contracts, graph, lineage, evolution |
| **Execute** | Retrieval, runtime APIs, agent skills, tool actions |
| **Continue** | Cross-model handoff; resume brief; living workspace |
| **Operate safely** | Governance, billing limits, privacy, audit |

Section mapping lives in `memoryos-frontend/lib/company-brain.ts` (`CONSOLE_SECTION_BRAIN`).

## Developer Console — section audit

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

## Continuity Lab

**Product name:** Living Memory Workspace / Persistent Agent Workspace

**Today (live):**

- Live chat with backend retrieval and company-brain skills (`useCompanyBrain`)
- Multi-agent / multi-model handoff with memory injection
- Continue project brief (`POST /api/memory/resume/brief`)
- Risky-signal retrieve pass
- Connected-source intelligence strip (connectors + memory list from APIs)
- IDE handoff packet export
- **Agent / Editor layout** in Continuity Lab (toggle in header)
- **Agent Window** (Cursor-style): dedicated column with project plan, chat, composer — visible in both layouts
- **Project plan panel:** auto-load continue brief; **Explain plan** sends agent narration
- **Editor workbench:** GitHub repo explorer, Monaco (or fallback editor), local dirty files
- **4-column Editor layout:** Threads | Agent | Explorer+Editor | Review
- **Agents ↗** opens agent-focused tab (`?layout=agent`); `?layout=editor` opens IDE layout
- **Review:** propose governed file commits (`brief_file_commit`) before push

**Roadmap (honest):**

- Deep repo debug inside connected GitHub repos
- Write-back: commits, PRs, Jira/Notion updates — **with approval gates**
- Full execution layer (Phase 3 in ship loop)

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

### Track A — Connect → brief → Lab funnel

- Overview **Company Brain setup** panel (4 steps)
- Onboarding activates funnel; defaults toward Developer Continuity
- Connected Sources highlights GitHub when funnel active
- Continuity Lab opens with `?autostart=1&autobrief=1` from funnel CTAs

### Track B — Governed GitHub execution (write-back)

- `GET /api/connector/github/repos` — repo picker (Octokit)
- `POST /api/connector/github/execution/propose` — kinds: `issue_comment`, `brief_file_commit`, `pull_request`
- `POST /api/connector/github/execution/:id/approve` — executes approved proposal on GitHub
- `GET /api/connector/github/execution/proposals`
- Continuity Lab UI: repo select → propose → approve → run
- `GET/PATCH /api/memory/company-brain/funnel` — server-persisted onboarding progress

## Phases (Codex ship order)

1. **Phase 1** — Auth, connectors, ingestion, storage, retrieval → **~75%**
2. **Phase 2** — Continuity Lab, graph, agent runtime → **~45%**
3. **Phase 3** — Execution write-back to tools → **~15%**
4. **Phase 4** — Enterprise governance, audit, multi-tenant → **~35%**

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
