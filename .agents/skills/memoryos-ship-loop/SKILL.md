---
name: memoryos-ship-loop
description: Operate as the MemoryOS product operating-system skill: plan, design, implement, validate, and hand off full-stack AI product work. Use when Codex is asked to ship MemoryOS features, evolve the Mission Control UI, continue the roadmap, improve AI workflow orchestration, fix connectors or memory runtime issues, prepare production-safe changes, or decide the next implementation slice.
---

# MemoryOS Product Operating System

Use this skill to make MemoryOS feel like an elite AI operating system: product-first, realtime, traceable, production-safe, and visually consistent across the full stack.

## Workflow

1. Read the current request and identify the product slice.
2. If the request mentions roadmap, Company Brain, connector sync, memory contracts, runtime hooks, traceability, production deploys, UI direction, or "next", read `references/product-map.md`.
3. Inspect local code before deciding. Prefer `rg`/`rg --files`; on Windows without `rg`, use `Select-String` and `Get-ChildItem`.
4. Implement the smallest complete slice that moves the product forward.
5. Preserve user work. Do not revert unrelated edits, do not commit, and do not push unless explicitly asked.
6. Validate with `npx tsc --noEmit` from the repo root and `npm run build` from `memoryos-frontend` when frontend or shared TypeScript changed.
7. Summarize exactly what changed, what passed, and whether commit/push was not done.

## Product Identity

MemoryOS is:

- an AI operating system
- a company memory runtime
- a persistent execution layer for agents and teams
- an operational brain for continuity, traceability, and workflow orchestration

MemoryOS is not:

- a generic chatbot
- a CRM
- a note-taking app
- a traditional SaaS dashboard
- a static admin panel

## Dashboard Philosophy

MemoryOS should feel like an active intelligence system, not a passive admin dashboard.

Prioritize:

- active workflows
- live execution state
- memory visibility
- operational awareness
- fast navigation
- agent and team continuity

## Product Decision Rules

- Treat the Memory Contract as primary: decisions, runbooks, incidents, preferences, policies, blockers, bugs, risky files, and next actions.
- Prefer reusable platform primitives over one-off consulting logic.
- Prefer workflow continuity, memory traceability, developer trust, and operational transparency.
- Keep one canonical onboarding/playbook path.
- Keep connector behavior honest: connected, syncing, failed, and token state must reflect real backend state.
- Remove paid/not-yet-supported connectors from user-facing surfaces unless the user asks to re-enable them.
- Make traceability visible: what memory was used, why selected, confidence, and what changed.
- Do not ship hidden system state, fake syncing states, unclear memory behavior, or narrow hacks that cannot become reusable product capability.

## Global UI System

MemoryOS should feel like Linear, Cursor, Vercel, and Raycast: operational, intelligent, realtime, AI-native, and high-trust.

Visual language:

- black default background
- blue accent system
- thin borders
- minimal card usage
- high information density
- keyboard-first UX
- realtime feedback

Avoid:

- generic admin dashboards
- large rounded SaaS cards
- excessive glassmorphism
- random gradients
- marketing-site layouts inside the console
- decorative shadows that reduce operational clarity

Layout rules:

- use left navigation
- use a top command/search/account bar
- use a main operational workspace
- use an optional inspector panel for details, trace, logs, or actions
- prefer page-level panels over many nested cards

Motion rules:

- fast transitions
- subtle hover states
- realtime streaming feel
- no dramatic animations

Typography:

- tight hierarchy
- compact spacing
- muted secondary text
- operational readability first

## Component Architecture

Prefer:

- reusable primitives
- composable panels
- operational layouts
- shared status, trace, timeline, and feed components

Avoid:

- deeply nested cards
- duplicated UI patterns
- inconsistent spacing
- direct design-system leakage into product sections

Preferred structure:

- `ConsoleLayout`
- `WorkspacePanel`
- `ActivityFeed`
- `InspectorPanel`
- `TimelineView`
- `StatusRail`
- `TracePanel`
- `CommandBar`

## Realtime AI UX

MemoryOS should always feel alive.

Prefer:

- streaming updates
- activity feeds
- execution timelines
- syncing indicators
- live workflow status
- visible agent progress
- traceable memory reads/writes

Avoid:

- static dashboard feel
- dead empty states
- delayed user feedback
- background work with no visible state

## Mission Control UI Rules

- Use the MemoryOS-native console primitives from `memoryos-frontend/components/memoryos/console-ui.tsx` for console cards, badges, inputs, dividers, empty states, and status badges.
- Do not introduce direct shadcn `Card`, `Badge`, or `Input` imports inside `memoryos-frontend/components/memoryos/**`; route console UI through `console-ui.tsx`.
- Keep the console black, square, and operational: no rounded card polish, no decorative shadows, no mixed light sections, and no accidental white page backgrounds.
- Prefer page-level panels and clean information hierarchy over many nested bordered boxes.
- Keep borders subtle and consistent. If a surface feels noisy, remove inner borders before adding more visual styling.
- Preserve dropdown visibility with high z-index, opaque black popovers, and clear borders.
- Validate UI changes in both TypeScript and production build.

## Production Safety

- Never commit `.env`, `.env.local`, secrets, generated logs, `node_modules`, `.tmp-*`, or local editor folders.
- For DigitalOcean production database drift, prefer migrations or explicit SQL with `IF NOT EXISTS`. Confirm the target database before applying schema changes.
- For GitHub connector sync, avoid long frontend proxy waits. Queue long-running sync work and return a fast accepted/queued response.
- If a production error mentions a missing Prisma column, check `prisma/schema.prisma`, generated client state, and the actual database schema.

## Hand-Off Format

Reply with:

- Product slice completed.
- Files changed.
- Validation results.
- Commit/push status.
- One recommended next slice.
