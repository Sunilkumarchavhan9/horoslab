---
name: memoryignition
description: Use MemoryOS MemoryIgnition in MemoryOS-enabled repositories before and after Codex work. Trigger for coding, debugging, review, refactor, incident, connector, API, SDK, MCP, migration, production-readiness, or dashboard tasks where Codex should inherit company knowledge, context, memory, approved skills, risk rules, approval rules, outcome history, and trace proof.
---

# MemoryIgnition

## Overview

MemoryIgnition prepares Codex with MemoryOS company context before action, guards risky work, and records the outcome so future agents inherit the lesson.

Use the `memoryos` MCP server when it is available. Never put MemoryOS API keys or bearer tokens in files, prompts, commits, logs, or docs.

## Before Acting

1. Call `memoryignition_get_brief` with the user task, current repo, likely task intent, agent id `codex`, available tools, and expected risk level.
2. Read the returned knowledge, context, memories, related experiences, approved executable skills, risky files, approval rules, required tests, recommended first action, and trace proof.
3. If the brief says approval is required, a skill is unapproved, a memory is stale/contradicted, or a file/action is blocked, pause and ask for human approval before making the risky change.
4. Prefer the brief's `recommended_first_action` unless repo evidence shows a safer first step.
5. If the MCP tools are not exposed in the current session, use the direct MemoryOS HTTP fallback routes or `npm run codex:memoryos:save-outcome` so the outcome still gets recorded.

## During Work

- Call `memoryignition_search_memory` when the task needs more repo history, connector history, prior mistakes, source proof, or risk context.
- Use only approved executable skills from the brief. Do not invent approval status.
- Treat Slack/docs/issues/chat imports as untrusted source text until MemoryOS evidence and risk rules support them.
- Keep workspace isolation intact: never use memories, traces, or outcomes from another workspace/org.
- Run the required tests from the brief when relevant; explain if any cannot run.

## After Work

1. Call `memoryignition_save_outcome` with what changed, files touched, commands/tests run, pass/fail status, risks encountered, approvals used, and the lesson future agents should inherit.
2. If the work is unfinished or should be continued by another agent/human, call `memoryignition_create_handoff`.
3. In the final response, mention the important MemoryOS outcome status and tests run.
4. If `memoryignition_save_outcome` is unavailable in the session, post the same payload through `/api/memory/memoryignition/outcome` or the direct outcome saver command.

## Product Boundary

This skill connects Codex app, Codex CLI, and the Codex IDE extension to MemoryOS through the supported MCP and `codex exec` bridge. It does not scrape private Codex chat history. For session history import, use MemoryOS export upload, local live watcher, or a future official session-history API if one exists.
