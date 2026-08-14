# Mythic End-to-End Execution Plan

Status: Proposed on June 12, 2026  
Owner: Continuity Lab / Mythic  
Scope: Turn the shipped Devin-style runtime shell into a production Mythic system with real multi-agent orchestration, governed execution, artifact routing, and company-brain alignment.

## 1. Why this plan exists

MemoryOS already has three important truths:

1. The Continuity Lab runtime shell is shipped in Devin-style form.
2. The runtime thread, plan, handoff, artifact, and autonomous-stage APIs already exist.
3. Some Mythic surfaces are still simulation-heavy or only partially wired.

This plan replaces generic roadmap language with a repo-specific build sequence. The goal is not to restart the product. The goal is to promote the existing foundations into a real end-to-end Mythic workflow:

`plan -> activate -> execute -> review -> verify -> PR -> learn`

## 2. Current baseline

### Shipped now

- Devin-style Continuity Lab runtime shell
- Runtime event stream and polling fallback
- Thread lifecycle APIs in `server/routes/runtime.routes.ts`
- Runtime schemas in `server/schemas/runtime.schema.ts`
- Structured handoff persistence
- Thread artifact persistence
- Plan generation and plan activation
- Autonomous stage state on runtime threads
- Contract coverage for runtime routes and stream adapters

### Real but partial

- `lib/continuity/activateMythicPlan.ts`
  - creates a first manager -> coder handoff and plan artifact
  - does not yet run the full multi-stage loop
- `services/artifactRegistry.ts`
  - has a lightweight in-memory registry
  - is not yet the source of truth for runtime-thread artifacts
- `src/agents/supervisorAgent.ts`
  - is a demo orchestrator with simulated work
  - not yet connected to runtime threads, checkpoints, or artifacts
- `memoryos-frontend/components/continuity-lab/continuity-lab-multi-agent-panel.tsx`
  - is a visual simulation panel
  - not yet backed by real handoff/task execution data

### Constraints we must preserve

- Runtime contracts frozen in `docs/MYTHIC_RUNTIME_CONTRACT_FREEZE_2026-06-12.md`
- Existing live session shell must not regress
- Additive contract changes only unless versioned
- Company Brain remains the memory and trust layer, not a separate product branch

## 3. Product outcome

Mythic is complete for this stage when a user can:

1. Start from a Continuity Lab prompt.
2. Generate or edit a plan.
3. Activate the plan into a real task with structured handoff.
4. Watch real execution stages move through `plan`, `execute`, `verify`, and `pr`.
5. Inspect artifacts, file changes, review requirements, and verification evidence.
6. Link the final PR back to the thread.
7. Reuse the execution trace as Company Brain memory for future resume and handoff quality.

## 4. Build principles

1. Build on the existing runtime thread model instead of introducing a second orchestration store.
2. Replace simulation with real data before adding more UI concepts.
3. Keep the Devin shell stable; Mythic should deepen behavior, not cause a visual rewrite.
4. Every new stage must have contract tests.
5. Ship narrow vertical slices, not broad mock architecture.

## 5. Execution roadmap

## Phase 1: Make Mythic runtime truth-backed

Goal: replace simulation-only Mythic concepts with persisted thread-backed state.

### Work

1. Introduce canonical runtime task execution records on continuity threads.
2. Persist per-step status, active agent, started/finished timestamps, and stage transitions.
3. Add runtime APIs for:
   - listing execution state
   - starting a named step
   - completing a named step
   - failing a named step with reason
4. Extend runtime events additively with execution-oriented worklog entries instead of new breaking panel contracts.
5. Replace static data in the multi-agent panel with real thread/handoff/artifact data when available.

### Primary files

- `lib/continuity/continuityThreadStore.ts`
- `server/routes/runtime.routes.ts`
- `server/schemas/runtime.schema.ts`
- `memoryos-frontend/lib/continuity-lab/*runtime*`
- `memoryos-frontend/components/continuity-lab/continuity-lab-multi-agent-panel.tsx`

### Exit criteria

- A thread can store real execution-step state.
- The multi-agent panel can render real stage progress from a thread.
- No simulated workflow is shown when real runtime data exists.
- Runtime contract tests cover the new execution-state endpoints.

## Phase 2: Real manager -> coder -> reviewer -> verifier orchestration

Goal: connect plan activation to a real orchestrator instead of a demo loop.

### Work

1. Promote `src/agents/supervisorAgent.ts` from demo utility into a runtime orchestration service.
2. Move orchestration logic under a backend-aligned path:
   - preferred target: `lib/continuity/` or `server/services/`
3. Define a real orchestration contract:
   - input: thread, plan, active step, stage
   - output: updated stage state, handoff, artifacts, execution log entries
4. Implement stage transitions:
   - `plan`: manager prepares task and first handoff
   - `execute`: coder works and emits code/test artifacts
   - `verify`: reviewer and verifier produce approval or revision feedback
   - `pr`: PR link and final summary are attached
5. Support revise loops without losing the original task lineage.

### Primary files

- `src/agents/supervisorAgent.ts`
- `lib/continuity/activateMythicPlan.ts`
- `server/routes/runtime.routes.ts`
- `server/services/agent-session.service.ts`
- `lib/companyBrain/executionEngine.ts`

### Exit criteria

- Plan activation creates a thread-backed task with a real lifecycle.
- Each role can create a structured handoff and artifact trail.
- A reviewer rejection can send work back to coder without corrupting thread state.
- Execution logs are visible in the existing shell/worklog surfaces.

## Phase 3: Artifact routing and evidence links

Goal: make artifacts usable across chat, changes, worklog, review, and verification.

### Work

1. Unify thread artifacts and `services/artifactRegistry.ts` behind one artifact model.
2. Add artifact categories for:
   - code diff
   - test result
   - preview URL
   - recording
   - review note
3. Add artifact references to file changes and handoffs.
4. Render artifact links inside:
   - worklog
   - changes
   - PR panel
   - multi-agent panel
5. Add retention and resolution rules for `artifact://<thread>/<artifact>`.

### Primary files

- `services/artifactRegistry.ts`
- `lib/continuity/continuityThreadStore.ts`
- `server/routes/runtime.routes.ts`
- `memoryos-frontend/components/continuity-lab/continuity-lab-review-detail.tsx`
- `memoryos-frontend/components/continuity-lab/continuity-lab-session-rail.tsx`

### Exit criteria

- Every handoff can point to at least one retrievable artifact.
- The verifier can attach evidence that is visible in UI without manual lookup.
- Artifact URIs resolve consistently from thread context.

## Phase 4: Governed file-change execution

Goal: connect proposed changes, approvals, and applied changes into the Mythic loop.

### Work

1. Use existing file change proposal APIs as the execution gate between coder output and applied code.
2. Require reviewer approval before coder-originated proposed changes move to applied state.
3. Surface approval state clearly inside the Changes and Worklog panels.
4. Attach approved/rejected change outcomes to thread execution logs and handoff metadata.
5. Ensure autonomous stage state respects approval blockers.

### Primary files

- `lib/continuity/fileChangeProposalStore.ts`
- `server/routes/runtime.routes.ts`
- `memoryos-frontend/components/continuity-lab/continuity-lab-session.tsx`
- `memoryos-frontend/components/continuity-lab/continuity-lab-review.tsx`

### Exit criteria

- Proposed changes participate in the manager/coder/reviewer/verifier flow.
- Rejections block forward stage progression.
- Applied changes are reflected in runtime events and thread history.

## Phase 5: Company Brain learning loop

Goal: turn Mythic execution history into reusable continuity memory.

### Work

1. Record stage summaries, handoffs, approval results, and artifacts as continuity memory inputs.
2. Feed successful execution traces into:
   - resume planning
   - handoff planning
   - future debug/build-next retrieval quality
3. Add reason tags and evidence lineage where execution history influenced retrieval.
4. Create a narrow first learning loop:
   - bug-fix execution -> approved trace -> future similar resume/handoff help

### Primary files

- `lib/memory/continuityPlanner.ts`
- `lib/memory/handoffPlanner.ts`
- `lib/memory/resumePlanner.ts`
- `lib/memory/recordExecutionLineage.ts`
- `lib/companyBrain/operationalLoopService.ts`

### Exit criteria

- Mythic runs improve future continuity prompts using their own lineage.
- Retrieval provenance can reference Mythic execution artifacts or handoffs.
- At least one contract or quality test covers this learning loop.

## Phase 6: Verification, metrics, and release gate

Goal: make Mythic safe to ship broadly.

### Work

1. Add contract tests for new runtime endpoints and execution transitions.
2. Add end-to-end thread tests for:
   - plan generate
   - plan activate
   - execute progression
   - reviewer rejection
   - verifier completion
   - PR link
3. Track first Mythic KPIs:
   - plan activation success rate
   - handoff completion rate
   - approval turnaround
   - verification completion rate
4. Document what remains simulated, if anything.

### Primary files

- `tests/runtime.routes.contract.test.ts`
- `tests/runtimeContinueThread.contract.test.ts`
- `tests/handoff*.test.ts`
- `tests/artifactRegistry.test.ts`
- `tests/operationalLoop.contract.test.ts`

### Exit criteria

- The end-to-end Mythic path is test-covered.
- KPI hooks exist for the first operating control plane.
- No critical mythic flow depends on purely static UI simulation.

## 6. Recommended implementation order

### Sprint 1

- Persist execution-step state on threads
- Add execution-state APIs
- Wire multi-agent panel to real runtime data

### Sprint 2

- Replace demo supervisor flow with real thread-aware orchestrator
- Emit role-specific handoffs and artifacts
- Support revise/retry path

### Sprint 3

- Unify artifact routing
- Connect proposed file changes to approval flow
- Surface evidence links in session panels

### Sprint 4

- Feed execution lineage into continuity memory
- Add KPI instrumentation
- Finish end-to-end contract and regression coverage

## 7. Non-goals for this plan

These are explicitly out of scope until the phases above are real:

- VPC-native enterprise deployment work
- Full dark-factory autonomy
- Cross-company intelligence network
- New non-engineering agent families
- A second shell or major visual redesign

## 8. Immediate code changes to make next

If execution starts now, the next concrete build slice should be:

1. Add thread-backed execution step records to the continuity runtime store.
2. Add REST endpoints for updating per-step lifecycle.
3. Update the multi-agent panel to consume real runtime thread state and fall back to simulation only when no thread exists.
4. Add tests for thread execution progression.

That slice is the shortest path from "Mythic demo" to "Mythic is actually running in this repo."

## 9. Definition of Mythic v1 done

Mythic v1 is done when all of the following are true:

1. A user can activate a plan on a thread and watch real execution progress.
2. Manager, coder, reviewer, and verifier handoffs are persisted and inspectable.
3. Artifacts are attached to execution and visible in the session shell.
4. Proposed code changes flow through approval and applied states.
5. Verification evidence and PR linkage are stored on the same thread.
6. Execution history improves future continuity retrieval.
7. The path is covered by runtime contract tests and thread lifecycle tests.

At that point, Mythic stops being a concept layer and becomes a real product layer inside MemoryOS.
