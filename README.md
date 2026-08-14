# MemoryOS

MemoryOS is a company-brain infrastructure layer for reliable AI execution.

It provides memory ingestion, retrieval, governance, evaluation, and agent interoperability through API, SDK, and MCP surfaces.

## Repository Structure

- `server/`: Express API server and core memory endpoints
- `memoryos-frontend/`: Next.js frontend (landing + console UI)
- `packages/sdk/`: MemoryOS Node SDK
- `packages/mcp-server/`: MCP server package
- `docs/`: product, API, onboarding, and execution docs
- `scripts/`: evaluation, benchmarking, and utility scripts

## Epoch Architecture

The repository now contains a frozen Epoch kernel and the first runtime built on top of it.

Current milestone: `Epoch Kernel v1.0`.

```text
Epoch
├── Kernel
│   ├── RuntimeBus
│   ├── RuntimeContext
│   ├── RuntimeEvent
│   └── Repository Contracts
│
├── SDK
│   └── RuntimeBase
│
└── Runtimes
    ├── Reality
    ├── Mission
    ├── Execution
    ├── Evidence
    ├── Verification
    └── Settlement
```

Architecture references:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [RuntimeBus v1](./docs/architecture/runtime-bus-v1.md)
- [Runtime SDK principles](./docs/architecture/runtime-sdk-principles.md)
- [Runtime SDK design review](./docs/architecture/runtime-sdk-design-review.md)
- [Runtime SDK audit](./docs/architecture/audits/runtime-sdk-v1.md)
- [Reality Runtime audit](./docs/architecture/audits/reality-runtime-v1.md)
- ADRs in [docs/architecture/adr](./docs/architecture/adr)

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- (Optional) Bun for frontend local workflows

### 1. Install dependencies

```bash
npm install
cd memoryos-frontend && npm install
cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill required values in `.env` before running the app.

### 3. Start development

Backend only:

```bash
npm run dev
```

Backend + frontend:

```bash
npm run dev:full
```

## Core Scripts

- `npm run dev`: run backend server
- `npm run dev:full`: run backend + frontend concurrently
- `npm run lint`: lint codebase
- `npm run test`: run test suite
- `npm run eval:benchmark`: run benchmark script
- `npm run perf:smoke`: run smoke perf test

## Product vision

The canonical **product phase roadmap** lives in [Product Phase Vision & What We Built](./docs/PRODUCT_PHASES_VISION_AND_BUILT.md). MemoryOS is focused on one wedge first: **engineering continuity**. The product turns scattered company work into structured memory, then into experience, then into executable skills that future agents inherit through **MemoryIgnition**.

Today’s execution priority is:

- GitHub-first continuity and traceable resume/handoff flows
- MemoryIgnition before/after model context capture
- Strong Company Brain structure for decisions, incidents, architecture, and process
- Connector expansion only where it compounds the wedge

The first success metric remains 10 engineering teams using MemoryOS weekly. The next moat is **Company Brain → Experience → Skills → Inheritance → MemoryIgnition → Humans + Agents → Organizational Learning**.

Connector expansion plan:

- Phase 1 core: GitHub, Slack, Jira, Linear, docs, local files
- Developer surfaces: Cursor, VS Code, Windsurf, Codex, Claude Code
- Ops signals: Sentry, CI/CD, cloud logs, Vercel, DigitalOcean
- Support and business systems: Zendesk, email, meetings, CRM, tickets

## Company sources

MemoryOS connects the tools where company knowledge, engineering work, customer issues, infrastructure events, and AI-agent sessions already live.

These sources are not the product. They are the raw signal that MemoryOS converts into Company Brain memory, experience records, executable skills, and future-agent inheritance through MemoryIgnition.

### P0 sources

- GitHub
- Linear
- Slack
- Cursor chats
- VS Code / Codex chats
- Docs
- Vercel / DigitalOcean deployment logs
- Sentry
- CI/CD logs

### P1 sources

- Jira
- Windsurf chats
- Zendesk
- Gmail / Outlook
- Notion / Confluence
- AWS
- Cloudflare
- PostHog
- PagerDuty

### P2 sources

- Azure
- GCP
- Intercom
- Datadog
- Figma
- Zoom transcripts
- Salesforce / HubSpot
- Kubernetes
- Terraform

The source layer is:

```text
Company tools
  ↓
Company Brain
  ↓
Experience
  ↓
Executable Skills
  ↓
MemoryIgnition
  ↓
Future-agent inheritance
```

## API and Integration Docs

- [Memory API](./docs/memory-api.md)
- [MCP API](./docs/mcp-api.md)
- [Design Partner Onboarding](./docs/design-partner-onboarding.md)
- [Pipecat Integration](./docs/pipecat-memoryos-integration.md)
- [SDK README](./packages/sdk/README.md)

## Deployment Notes

- Configure DNS and SSL before production traffic.
- For Cloudflare, keep DNS proxy enabled and use `Full (strict)` once origin SSL is valid.
- Verify OAuth callback URLs match your production domain.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.

## Security

Please report vulnerabilities using the process in [SECURITY.md](./SECURITY.md).
