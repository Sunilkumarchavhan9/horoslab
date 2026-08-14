# ADR-012: V12 Contract Convergence Without Rewrite

## Status

Accepted for Phase A.

## Decision

Epoch V12 is a contract and adapter boundary over the existing MemoryOS Epoch persistence. `EpochMission`, `EpochExecutionRun`, `EpochEvidence`, `EpochVerificationRun`, `EpochAuthorityPolicy`, and the existing realtime event store remain the canonical records. V12 readers use the adapters in `lib/epoch/v12/adapters.ts`; they do not create shadow tables, JSON stores, or a second evidence stream.

The V12 contract version is `epoch.runtime.v1`. New writes must use the state machine in `lib/epoch/missionStateMachine.ts` and carry `correlationId` and `traceId` in Epoch runtime events.

## Consequences

- Existing records remain readable while callers migrate incrementally.
- Legacy route names remain available during the compatibility window.
- New V12 contracts can evolve independently from Prisma field names.
- A future migration may add native worker and assignment persistence only after an explicit ADR; Phase A does not add those stores.
