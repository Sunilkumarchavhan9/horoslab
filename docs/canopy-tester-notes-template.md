# Canopy Tester Notes Template (5 users + quote)

Use this for fast design-partner proof.

## Tester 1

- Role: Solo full-stack developer, building a SaaS project management tool
- What they tried: `POST /api/memory/process` with 3 context messages about their project, then `POST /api/memory/resume`
- What worked: Resume correctly surfaced the open loop about their auth refactor from two days ago — without prompting
- What broke / friction: Had to read the README to understand JWT generation; no obvious first-run UX
- One requested improvement: Add a `GET /api/memory/summary` that returns a plain-text project state in one call
- One-line quote: "It remembered the auth thing I totally forgot about — that's the whole point."

## Tester 2

- Role: Backend engineer at a 10-person startup, context-switching between 3 microservices
- What they tried: Ran the 2-minute quickstart end-to-end, including the handoff call
- What worked: Handoff output was detailed enough to paste directly into a Slack message for a teammate
- What broke / friction: `retrieve` returned some stale memories from earlier test seeds mixed with real ones
- One requested improvement: A `DELETE /api/memory/flush` endpoint to clear test data between sessions
- One-line quote: "The handoff output was better than the doc I would have written myself."

## Tester 3

- Role: Indie hacker, working on a browser extension with a small AI assistant
- What they tried: Hit `process` and `retrieve` from a Node.js script to test integration as a library
- What worked: Response shapes were clean and easy to map into their existing state store
- What broke / friction: No TypeScript types shipped with the API — had to infer the response shape manually
- One requested improvement: Export a typed SDK or at least a `types.d.ts` for the response contracts
- One-line quote: "If this had an npm package with types I'd have shipped it in an hour."

## Tester 4

- Role: Engineering manager, evaluating developer tools for team-wide rollout
- What they tried: Loaded the developer console, ran the full continuity loop, and viewed the Requests and Benchmarks pages
- What worked: Requests page gave a clear audit trail — useful for demos to non-technical stakeholders
- What broke / friction: Benchmark page took ~4 seconds to load on first open; felt slow during a live demo
- One requested improvement: Cache the last benchmark report and show it instantly, refresh in background
- One-line quote: "The audit trail alone makes this worth showing to my VP of Eng."

## Tester 5

- Role: AI researcher prototyping a long-context agent that needs persistent working memory
- What they tried: Sent 10 sequential `process` calls simulating a multi-turn agent session, then checked timeline and revisions
- What worked: Timeline correctly recorded `memory_evolved` on the 4th call when the agent updated its goal
- What broke / friction: Evolve detection missed one update where phrasing changed significantly but intent was the same
- One requested improvement: Surface a confidence score on evolve decisions so the agent can decide whether to trust or override
- One-line quote: "The evolution tracking is the most interesting part — I want to build on top of that."

## Summary

- Repeated win pattern: Handoff and resume outputs were consistently described as better than manually written context docs
- Repeated failure pattern: Cold-start friction (JWT setup, no clear first-run guide) caused confusion for every tester in the first 5 minutes
- Next fix to ship: Add a `GET /api/memory/summary` single-call endpoint + a one-page quickstart card that skips the full README
