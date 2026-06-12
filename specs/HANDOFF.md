# HANDOFF Spec (v1)

This document defines the structured handoff payload agents use to pass work between roles. The goal is to reduce ambiguity and enable reliable, machine-readable handoffs.

version: 1

Top-level fields

- handoffId: UUID
- source: AgentRole (manager|coder|reviewer|verifier)
- target: AgentRole
- taskId: string
- timestamp: number (ms since epoch)
- payload: object (structured payload)
- metadata: {
    confidence: number,      // 0-1
    completeness: number,    // 0-1
    notes: string            // human summary
  }
- requirements: string[]    // explicit requirements for target agent
- compressedContext: string // up to ~500 tokens

Payload schema (recommended)

payload:
  codeChanges?: FileDiff[]
  testResults?: TestReport
  artifacts?: ArtifactReference[]

FileDiff
- path: string
- diff: string (unified diff)
- language?: string

TestReport
- runner: string
- passed: number
- failed: number
- coverage?: number
- reportUri?: string

ArtifactReference
- id: string
- type: string
- uri: string

Example HANDOFF.md (auto-generated)

---
# HANDOFF: MYTHIC-007
From: manager → To: coder
Confidence: 0.92 | Completeness: 1.0

## ✅ Completed
- Identified root cause: throw emailError in route.ts
- Created reproduction test case

## 🚀 Payload
- codeChanges: [src/api/waitlist/route.ts diff]
- testResults: artifact://uuid-123/test-report
- artifacts:
  - artifact://uuid-456/original-bug

## 🎯 Next steps
1. Implement try/catch around email send
2. Add console.error logging
3. Write unit test for failure scenario

---

Best practices
- Always include compressedContext for target agent to avoid context loss.
- Keep payloads small; use artifacts to store large payloads (logs, recordings).
- Include clear `requirements` that state what the target must do.
- Use semantic versioning for HANDOFF spec; incompatible changes must increment major version.

