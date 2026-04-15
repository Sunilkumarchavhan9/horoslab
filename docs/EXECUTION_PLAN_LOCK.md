# MemoryOS Execution Plan Lock

Status: Locked on April 10, 2026
Owner: Founder (Product + Engineering)

## 1) Strategy

Category: Developer Continuity Infrastructure for humans and agents.

Positioning:
- Mem0 stores memory.
- Supermemory brings external context.
- LangGraph and LangChain orchestrate workflows.
- MemoryOS is the intelligence and trust layer.

Promise:
- Resume real work without re-explaining context.

## 2) Product Focus

MemoryOS wins on outcomes, not endpoint count:
1. Best "resume where I left off" quality.
2. Best bug/debug memory recall.
3. Best trust and explainability (why this memory, what changed, confidence).
4. Best agent handoff continuity across sessions and tools.

## 3) Company KPI Dashboard

Track and optimize:
1. `resume_success_rate`
2. `top3_retrieval_precision`
3. `wrong_merge_rate`
4. `contradiction_miss_rate`
5. `p95_retrieve_latency`
6. `weekly_active_teams`

Sprint rule:
- Every sprint must improve at least one KPI.

## 4) Architecture (Locked)

1. LangGraph: ingest, retrieve, continue, resume, handoff workflows + checkpointed state.
2. LangChain: retriever/tool interfaces + model abstraction.
3. Mem0 adapter: long-term memory persistence and search.
4. Supermemory adapter: connector + context ingestion.
5. MemoryOS Core:
   - extraction + scoring
   - merge + evolve + contradiction resolver
   - reranking + intent model
   - timeline + revisions + explainability

## 5) Phased Roadmap

### Phase A: Foundation Hardening
1. Add adapter contracts:
   - `MemoryStoreAdapter`
   - `ContextAdapter`
   - `WorkflowStateAdapter`
2. Remove provider coupling from route handlers and core services.
3. Standardize response contracts for `retrieve`, `explain`, `continue`, `resume`.

Definition of done:
- No direct provider imports in route handlers.
- Core memory logic depends on interfaces, not concrete providers.
- Contract tests pass for all target endpoints.

### Phase B: Graph-first Orchestration
1. Move retrieve/continue/resume into LangGraph nodes.
2. Persist graph state with key dimensions: `userId`, `workspace`, `project`, `thread`.
3. Add graph-level E2E tests for resumability and handoff.

Definition of done:
- Workflow entry points call graph executors.
- Checkpoint load/restore is verified in tests.

### Phase C: Intelligence v2 (Moat)
1. Entity-aware merge/evolve (repo, framework, feature, bug class).
2. Contradiction state machine:
   - `active`
   - `stale`
   - `contradicted`
   - `archived`
3. Intent-aware reranking:
   - `resume`
   - `debug`
   - `build_next`
   - `handoff`
   - `decision_recall`

### Phase D: Trust Layer
1. `reasonTags`, score contribution breakdown, evidence lineage.
2. "Why not retrieved" diagnostics endpoint.
3. Revision diff clarity and confidence history per memory.

### Phase E: Productization
1. SDK hooks: `beforeModel()`, `afterModel()`.
2. MCP interface for agent ecosystems.
3. Design partner onboarding flow with measurable time-to-value.

## 6) Solo Founder Weekly OS

Cadence:
1. Build days (4): core engineering only.
2. User day (1): demos, feedback calls, KPI review, sprint decisions.

Weekly output minimum:
1. One measurable quality improvement.
2. One reliability/trust improvement.
3. One benchmark run + report.

## 7) Immediate Priority Order

1. Adapter layer contracts.
2. Retrieve/continue/resume LangGraph refactor.
3. Contradiction resolver + lifecycle states.
4. Benchmark harness + CI quality gates.
5. SDK hooks + MCP surface.

## 8) Current Gap Snapshot (Repo-specific)

As of lock date:
- Ingest is graph-based.
- Retrieve/continue/resume are not fully graph-first yet.
- Mem0 coupling still exists in core memory modules.

Next engineering focus:
- Complete Phase A decoupling before expanding feature surface.
