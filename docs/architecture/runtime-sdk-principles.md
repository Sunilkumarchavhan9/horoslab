# Runtime SDK Principles

This document defines the design contract for `RuntimeBase`.

`RuntimeBase` is a convenience layer, not a domain layer.

## Principles

1. `RuntimeBase` provides infrastructure convenience only.
2. `RuntimeBase` owns no domain logic.
3. `RuntimeBase` must not reference Reality, Mission, or any business runtime.
4. The Kernel remains the source of truth for shared infrastructure.
5. A runtime should remain architecturally valid if `RuntimeBase` were removed.
6. New functionality belongs in `RuntimeBase` only after demonstrating genuine cross-runtime reuse.
7. The Rule of Three is the default heuristic, while foundational infrastructure such as logging or context may live in `RuntimeBase` earlier when it is clearly shared.

## Intended Contents

The smallest useful `RuntimeBase` should focus on:

- Logger wiring
- Metrics access
- Context access
- Lifecycle hooks
- Repository registration helpers
- Bus registration helpers

## Non-Goals

`RuntimeBase` must not become a place for:

- Graph APIs
- Planning logic
- Decision logic
- Evidence logic
- Verification logic
- Settlement logic
- Domain models

## Review Question

Before adding anything to `RuntimeBase`, ask:

> Would this still make sense if three runtimes were already using it in the same way?

If the answer is no, keep the capability in the runtime until a broader pattern appears.
