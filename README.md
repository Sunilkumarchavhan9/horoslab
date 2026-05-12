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
