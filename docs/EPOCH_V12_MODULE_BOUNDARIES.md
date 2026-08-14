# Epoch V12 Module Boundaries

| Module | Owns | Must not own |
| --- | --- | --- |
| `lib/epoch/v12` | Frozen contract schemas, types, and read adapters | Prisma writes, UI state, route registration |
| `lib/epoch/epochStore.ts` | Canonical mission and Epoch record persistence | Contract definitions or UI projections |
| `lib/epoch/epochQueue.ts` | Queue lease and retry behavior | A second mission or evidence store |
| `lib/epoch/epochEvents.ts` | Runtime event emission and correlation envelope | Mission state mutation |
| `server/routes/epoch*.routes.ts` | HTTP compatibility and request validation | Direct UI rendering |
| `memoryos-frontend/components/mission-control` | Mission Control projections and navigation | Backend persistence or onboarding/auth flow |

Account Home and Organization Account remain protected Mission Control surfaces. The restored root landing page remains outside this runtime boundary.
