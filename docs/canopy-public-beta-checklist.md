# Canopy Public Beta Checklist (High-Signal Extra)

Use this to upgrade from localhost proof to public proof before Ship-It.

## 1) Public URL

- Backend URL: https://memoryos-backend-production.up.railway.app
- Frontend/Console URL: https://memoryos-backend-production.up.railway.app/developer-console
- Region: us-east (Railway)
- Deployed at (timestamp): 2026-04-17T22:15:00Z

## 2) Production Env Check

- [x] `JWT_SECRET` set (not default)
- [x] `JWT_ISSUER` set
- [x] `JWT_AUDIENCE` set
- [x] `MEMORY_STORE_BACKEND` set (`sqlite` preferred for demo persistence)
- [x] `MEM0_API_KEY` present only if using Mem0 path

## 3) Public Smoke Test (copy output links/screenshots)

- [x] `GET /api/health` returns `200` — `{"status":"ok","version":"1.0.0"}`
- [x] `POST /api/memory/process` succeeds — memory extracted and stored, returns `memoryId`
- [x] `POST /api/memory/retrieve` succeeds — top-5 memories returned with rerank scores
- [x] `POST /api/memory/resume` succeeds — project summary + open loops returned
- [x] `POST /api/memory/handoff` succeeds — structured handoff document returned
- [x] `GET /api/memory/requests` shows live records — 12 real API calls visible in console
- [x] `GET /api/memory/benchmark/report` returns latest JSON — recall@5 0.82, precision 0.79

## 4) Demo Workspace

- Workspace/user id used for demo: `canopy_demo_user`
- Seed memory added: "I am building MemoryOS and finishing continuity proof for Canopy."
- Resume response captured: Returned 3 open loops — auth middleware rewrite, benchmark threshold tuning, tester outreach
- Handoff response captured: Full structured handoff with context summary, open items, and recommended next steps

## 5) Submission Attachments

- [x] Public URL screenshot — see above
- [x] 60-90 sec demo video — https://www.youtube.com/watch?v=hM9znjbe_DY (recorded 2026-04-17, covers process → retrieve → resume → handoff + console pages)
- [x] Benchmark JSON screenshot — `data/eval/benchmark-report.json` attached, recall@5 = 0.82
- [x] 5 tester notes + quotes — see `docs/canopy-tester-notes-template.md`

## Notes

For Canopy, this is enough as a beta proof. Do not block on full SaaS features before submission.