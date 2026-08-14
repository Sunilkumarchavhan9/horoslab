# Epoch V12 Route Compatibility Map

| Existing route family | V12 contract | Phase A status | Migration rule |
| --- | --- | --- | --- |
| `/api/epoch/:workspaceId/missions` | Mission | supported | Keep existing CRUD; validate lifecycle transitions. |
| `/api/epoch/:workspaceId/missions/:missionId/run` | Execution + Evidence | supported | Keep route; emit correlated runtime events. |
| `/api/epoch/:workspaceId/missions/:missionId/evidence` | Evidence | supported | Existing Epoch evidence store is canonical. |
| `/api/epoch/:workspaceId/missions/:missionId/verify` | Verification | supported | Normalize legacy review decisions to `PASS`, `FAIL`, or `UNKNOWN`. |
| `/api/epoch/:workspaceId/authority-policies` | PolicyDecision | supported | Read through the V12 policy adapter. |
| `/api/epoch/:workspaceId/events` | RuntimeEvent | supported | Existing realtime event stream, now correlated. |
| `/api/epoch/:workspaceId/queue/*` | Assignment + Execution | supported | Queue remains the execution handoff; no duplicate queue store. |
| `/api/mcp/setup` and GitHub setup entry flows | none in V12 Mission Control | deprecated | Keep outside active Mission Control navigation; do not use as a runtime dependency. |

## Deprecation policy

No route is removed in Phase A solely because its name is legacy. A route is deprecated only when an equivalent V12 contract reader exists and its replacement is documented. Deprecation responses and removal dates require a later ADR.
