# MemoryOS Codebase Analysis And Next Plan

This document is the working plan for the current repository. It is based on the actual codebase surface, not the aspirational master plan in `docs/postman/masterplan.md`.

## What the repo already is

The repository is already a multi-surface MemoryOS product:

- Backend API in `server/`
- Main Next.js landing app in `app/`
- Rich product console in `memoryos-frontend/`
- SDK in `packages/sdk/`
- MCP package in `packages/mcp-server/`
- Evaluation, trust, and continuity tooling in `scripts/`, `tests/`, and `docs/`

## Current product shape

The codebase is centered on the engineering-continuity wedge:

- GitHub-first memory ingestion and connector sync
- Resume and handoff flows
- MemoryIgnition / continuity brief generation
- Company Brain control-plane surfaces
- Governed execution proposals and audit trails
- Agent session and timeline records
- Evaluation and benchmark gates

That is a much narrower and more shippable product than the final master plan, which includes broader company-wide agent workforce infrastructure.

## What is already real

### Strongest shipped pillars

- Continuity Lab user flow in `memoryos-frontend/app/continuity-lab/`
- Backend routes for memory, runtime, connectors, company brain, and MCP in `server/routes/`
- Prisma models for memory, connectors, agent sessions, approvals, billing, operational loops, and proposals in `prisma/schema.prisma`
- SDK package in `packages/sdk/`
- MCP adapter in `packages/mcp-server/`
- Trust, benchmark, and smoke-test tooling in `tests/` and `scripts/`

### Strong supporting evidence

- Root redirect already lands on the continuity experience in `app/page.tsx`
- The product landing page is positioned around company brain and continuity in `memoryos-frontend/app/page.tsx`
- The repository README describes the wedge as engineering continuity, not the full master plan
- The phase mapping docs already call out what is built, partial, planned, or not started

## Gaps vs the master plan

The master plan describes a much bigger operating system. In this repo, these areas are still mostly incomplete:

- Full company-wide agent workforce layer
- Deep Experience-to-Skills compiler
- Inheritance package as a first-class product object
- Cross-function agents beyond engineering
- Universal policy runtime and permission model across every tool
- Enterprise compliance export room
- Robot, machine, and global learning network layers

## Recommended build order

### 1. Stabilize the current wedge

Focus on the flows that already exist:

- GitHub sync reliability
- Resume and handoff correctness
- Memory contract validation
- Continuity Lab live-data parity
- Eliminate placeholder or static fallback behavior when API data exists

### 2. Deepen Company Brain

Add richer structure to the memory model:

- Decisions
- Incidents
- Architecture notes
- Process / runbook objects

### 3. Ship one narrow Experience-to-Skills loop

Start with a single repeatable workflow:

- GitHub bug fix
- Capture problem, context, actions, outcome
- Produce an approved reusable skill
- Reuse that skill in a future run

### 4. Turn inheritance into a product surface

Make future runs visibly inherit prior experience:

- Show what was learned
- Show what was reused
- Show why it was selected
- Show outcome proof

### 5. Expand governance and evaluation

Add stronger trust mechanics around the existing execution surfaces:

- Approval queue
- Risk policy checks
- Trace proof
- Per-flow benchmarking
- Failure and correction history

## Anti-scope for this cycle

Do not start with:

- Robots or universal intelligence network work
- Broad multi-department agent expansion
- New control surfaces that do not strengthen continuity
- Feature demos that are not backed by live product flows

## Files that define the current truth

- [Root README](/C:/projects/MemoryOS/README.md)
- [Phase map](/C:/projects/MemoryOS/docs/PRODUCT_PHASES_VISION_AND_BUILT.md)
- [Startup status](/C:/projects/MemoryOS/docs/startup-execution-status.md)
- [Master plan](/C:/projects/MemoryOS/docs/postman/masterplan.md)
- [Backend schema](/C:/projects/MemoryOS/prisma/schema.prisma)
- [Root landing page](/C:/projects/MemoryOS/app/page.tsx)
- [Continuity Lab home](/C:/projects/MemoryOS/memoryos-frontend/components/continuity-lab/continuity-lab-home.tsx)
- [Console primitives](/C:/projects/MemoryOS/memoryos-frontend/components/mission-control/os-dashboard-ui.tsx)

## Working rule

When a new idea comes up, ask first:

1. Does this strengthen continuity?
2. Does this improve structured memory?
3. Does this create proof or learning?
4. Does this help the next agent work better?

If the answer is no, it should stay out of the build queue for now.
