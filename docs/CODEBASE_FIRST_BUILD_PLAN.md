# MemoryOS Codebase First Build Plan

This plan is based on the code that exists in this repository today, not on the aspirational full master plan in `docs/postman/masterplan.md`.

## What the codebase already is

MemoryOS is already a continuity product with several real layers:

- Backend API in `server/`
- Root Next.js app in `app/`
- Rich continuity console in `memoryos-frontend/`
- SDK in `packages/sdk/`
- MCP server in `packages/mcp-server/`
- Evaluation, trust, and connector tooling in `scripts/`, `tests/`, and `lib/`

The repo is not empty scaffolding. It already contains:

- GitHub, Slack, Jira, Notion, Sentry, and other connector code
- Memory ingestion, retrieval, resume, and handoff flows
- Company Brain state, execution proposals, operational loops, and action memory
- Continuity Lab UI for asking work to continue, injecting brief context, and starting sessions
- Agent session, runtime, and trace-proof style surfaces
- Benchmark, trust, and smoke-test machinery

## What the repo is actually centered on

The current product wedge is engineering continuity:

- "Resume work without re-explaining the codebase"
- "Continue a task with retrieved company memory"
- "Generate a brief, run a session, capture the outcome"
- "Use that outcome as future-agent inheritance"

That wedge is much smaller and more shippable than the full master plan.

## What is already strong

### Continuity and memory

- Root landing redirects to the continuity experience.
- Continuity Lab is the main product shell.
- Resume, handoff, and brief-generation paths already exist.
- Memory retrieval and connector sync are real, not mock-only.

### Company Brain and governance

- The codebase already has Company Brain state, funnel state, and execution proposal objects.
- There is a real action-memory / execution-outcome / approval-trace trail.
- The repo has trust and benchmark tooling rather than just UI screens.

### Platform surfaces

- The SDK exists.
- The MCP server exists.
- The server exposes a meaningful set of API routes.
- The frontend has a fairly large design system and product shell already in place.

## What is still incomplete relative to the master plan

The master plan describes a much broader operating system than the repo currently ships.

Still mostly incomplete:

- Full company-wide agent workforce layer
- Universal inheritance package as a first-class product object
- Deep experience-to-skills compiler from real work loops
- Cross-functional agents beyond engineering
- Broad policy runtime across every tool surface
- Compliance evidence room and enterprise deployment modes
- Model-router / cost-governor depth
- Robot / machine / universal network layers

## Recommended next build order

### Phase A: Stabilize the current wedge

Goal: make the continuity flow dependable and obvious.

Build:

- Clean GitHub sync and connector parity
- Stronger resume/handoff correctness
- Memory contract validation at the API boundary
- Remove or reduce placeholder fallback behavior when live data exists
- Make the Continuity Lab clearly reflect real backend state

Why this first:

- It protects the product wedge that already exists.
- It improves trust without widening scope.
- It makes every later layer depend on a stable foundation.

### Phase B: Deepen Company Brain

Goal: turn memory into structured company knowledge.

Build:

- Decision memory with who, why, and alternatives
- Incident memory with root cause, fix, and lessons
- Architecture memory with tradeoffs and constraints
- Process memory for deploy, escalation, onboarding, and support
- Stronger provenance and contradiction handling

Why this next:

- This is the moat behind continuity.
- It turns scattered records into usable knowledge.
- It sets up skill generation later.

### Phase C: Ship one narrow Experience-to-Skills loop

Goal: create a real learning loop from actual work.

Build one workflow only:

- GitHub bug fix
- Capture problem, context, actions, and outcome
- Convert the successful run into a reusable skill
- Reuse that skill in a future session

Why narrow:

- A single working loop beats a broad but fake skills system.
- It gives us a testable inheritance story.
- It creates evidence for the next product phase.

### Phase D: Turn inheritance into a visible product surface

Goal: make future work visibly benefit from past work.

Build:

- Show what was inherited
- Show why it was selected
- Show what proof supports it
- Show what changed in the next run
- Show the outcome that was captured

Why this matters:

- Inheritance is the differentiator, not just stored memory.
- Users need to see the compounding effect.

### Phase E: Expand governance and evaluation

Goal: make execution safe enough to trust more broadly.

Build:

- Approval queue
- Risk policy checks
- Trace proof and audit history
- Per-flow benchmark comparisons
- Failure and correction history

Why this last in the near term:

- Governance only matters once the wedge is being used.
- Evaluation is strongest when tied to a real workflow.

## Anti-scope for this cycle

Do not start with:

- Robots or universal intelligence network work
- Broad multi-department agent expansion
- New dashboard surfaces that do not strengthen continuity
- Temporary demo-only flows that are not backed by live product paths
- Model-router or enterprise-compliance work before the core wedge is repeatable

## The first real product loop

This is the loop the repo should optimize for next:

1. User creates or selects a workspace.
2. User connects GitHub and other source systems.
3. MemoryOS extracts structured memories.
4. User opens Continuity Lab.
5. User asks MemoryOS to continue or fix work.
6. MemoryOS generates a brief or inheritance package.
7. User starts the session.
8. The agent run produces events and an outcome.
9. The outcome becomes future instruction or skill material.
10. The next session inherits the lesson.

## Files that define the current truth

- `README.md`
- `docs/PRODUCT_PHASES_VISION_AND_BUILT.md`
- `docs/startup-execution-status.md`
- `docs/COMPANY_BRAIN_CORE_PRODUCT.md`
- `docs/EXECUTION_PLAN_LOCK.md`
- `docs/COMPANY_BRAIN_P0_P1_P2_BACKLOG.md`
- `docs/postman/masterplan.md`
- `app/page.tsx`
- `server/app.ts`
- `memoryos-frontend/app/continuity-lab/page.tsx`
- `memoryos-frontend/components/continuity-lab/continuity-lab-home.tsx`
- `prisma/schema.prisma`
- `lib/companyBrain/`
- `lib/memory/`
- `lib/integrations/`
- `server/routes/`
- `packages/sdk/`
- `packages/mcp-server/`

## Working rule

When a new idea comes up, ask:

1. Does this strengthen continuity?
2. Does this improve structured memory?
3. Does this create proof or learning?
4. Does this help the next agent work better?

If the answer is no, keep it out of the build queue for now.
