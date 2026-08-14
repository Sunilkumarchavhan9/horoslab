import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { makeToken } from "./helpers/authToken";

describe("MemoryIgnition approval request contract", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("creates, lists, and reviews Guardian approval requests from live risk checks", async () => {
    const userId = `u_mi_approval_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const risk = await request(app)
      .post("/api/memory/memoryignition/risk-check") 
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Guard a risky production database action.",
        task_intent: "Prevent unsafe schema changes.",
        agent_id: "codex",
        risk_level: "high",
        available_tools: ["terminal", "edit_files"],
        current_files: ["prisma/schema.prisma"],
        proposed_action: "Drop table and bypass approval without running tests.",
        command: "drop table users",
      });

    expect(risk.status).toBe(200);
    expect(risk.body.data.action_guard).toEqual(expect.objectContaining({
      blocked: true,
      approval_request: expect.objectContaining({
        id: expect.stringMatching(/^mi_appr_/),
        status: "pending",
        source: "memoryignition_guard",
        guardMoment: "risk_check",
      }),
    }));
    const approvalId = risk.body.data.action_guard.approval_request.id as string;

    const list = await request(app)
      .get("/api/memory/approvals")
      .set("authorization", authHeader);

    expect(list.status).toBe(200);
    expect(list.body.data).toEqual(expect.objectContaining({
      version: "memoryignition_approval_requests.v1",
      approvals: expect.arrayContaining([
        expect.objectContaining({
          id: approvalId,
          status: "pending",
          blocked: true,
          auditProof: expect.objectContaining({
            version: "memoryignition_approval_audit.v1",
            approvalId,
            status: "pending",
            reviewedBy: null,
            decisionHash: expect.any(String),
            immutableRef: expect.stringContaining(`approval_audit:${approvalId}:`),
            riskScope: expect.objectContaining({
              matchedRiskyFiles: expect.arrayContaining(["schema"]),
              missingRequiredTests: expect.any(Array),
              traceProofIds: expect.any(Array),
            }),
            evidence: expect.arrayContaining([
              `approval:${approvalId}`,
              "guard:risk_check",
              "risk:high",
            ]),
          }),
        }),
      ]),
      counts: expect.objectContaining({
        pending: expect.any(Number),
        blocked: expect.any(Number),
      }),
    }));

    const reviewed = await request(app)
      .post(`/api/memory/approvals/${approvalId}/review`)
      .set("authorization", authHeader)
      .send({ decision: "approve", note: "Schema action approved after manual review and required test proof." });

    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.approval).toEqual(expect.objectContaining({
      id: approvalId,
      status: "approved",
      reviewedBy: userId,
      reviewedAt: expect.any(String),
      reviewNote: "Schema action approved after manual review and required test proof.",
      auditProof: expect.objectContaining({
        version: "memoryignition_approval_audit.v1",
        approvalId,
        status: "approved",
        reviewedBy: userId,
        reviewNote: "Schema action approved after manual review and required test proof.",
        decisionHash: expect.any(String),
        immutableRef: expect.stringContaining(`approval_audit:${approvalId}:`),
      }),
    }));

    const reused = await request(app)
      .post("/api/memory/memoryignition/risk-check")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Guard a risky production database action.",
        task_intent: "Prevent unsafe schema changes.",
        agent_id: "codex",
        risk_level: "high",
        available_tools: ["terminal", "edit_files"],
        current_files: ["prisma/schema.prisma"],
        proposed_action: "Drop table and bypass approval without running tests.",
        command: "drop table users",
      });

    expect(reused.status).toBe(200);
    expect(reused.body.data.action_guard).toEqual(expect.objectContaining({
      approval_satisfied: true,
      approval_request: expect.objectContaining({
        id: approvalId,
        status: "approved",
      }),
      approval_audit_proof: expect.objectContaining({
        version: "memoryignition_approval_audit.v1",
        approvalId,
        status: "approved",
        reviewedBy: userId,
        riskScope: expect.objectContaining({
          matchedRiskyFiles: expect.arrayContaining(["schema"]),
        }),
      }),
      guard_proof: expect.objectContaining({
        checks: expect.arrayContaining([
          expect.objectContaining({
            id: "approval",
            ok: true,
            detail: expect.stringContaining(approvalId),
          }),
        ]),
      }),
    }));

    const outcome = await request(app)
      .post("/api/memory/memoryignition/outcome")
      .set("authorization", authHeader)
      .send({
        repo_or_task: "memoryos",
        task_intent: "Prevent unsafe schema changes.",
        agent_id: "codex",
        outcome_status: "success",
        outcome: "Approved guarded action completed with evidence.",
        files_touched: ["prisma/schema.prisma"],
        tests_passed: ["npx tsc --noEmit"],
        future_agent_lesson: "Future agents must include approval request proof when acting on high-risk schema changes.",
        approvals_used: [approvalId],
        risky_files_touched: ["prisma/schema.prisma"],
        trace_proof_ids: reused.body.data.trace_proof.map((trace: { memory_id: string }) => trace.memory_id),
      });

    expect(outcome.status).toBe(200);
    expect(outcome.body.data.outcome_proof).toEqual(expect.objectContaining({
      version: "memoryignition_outcome_proof.v1",
      approvals_used: [approvalId],
      evidence: expect.arrayContaining([
        `approval:${approvalId}`,
        "risky_file:prisma/schema.prisma",
      ]),
    }));
    expect(outcome.body.data.approval_outcome_links).toEqual(expect.arrayContaining([
      expect.objectContaining({
        approval_id: approvalId,
        status: "approved",
        outcome_links: expect.arrayContaining([
          expect.objectContaining({
            outcomeEventId: outcome.body.data.outcome_proof.outcome_event_id,
            futureInheritanceReady: true,
            evidence: expect.arrayContaining([`approval:${approvalId}`]),
          }),
        ]),
      }),
    ]));
    expect(outcome.body.data.outcome_learning_gate.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "approval",
        ok: true,
        detail: "1 approval request(s).",
      }),
    ]));

    const linkedList = await request(app)
      .get("/api/memory/approvals")
      .set("authorization", authHeader);

    expect(linkedList.status).toBe(200);
    expect(linkedList.body.data.approvals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: approvalId,
        outcomeLinks: expect.arrayContaining([
          expect.objectContaining({
            outcomeEventId: outcome.body.data.outcome_proof.outcome_event_id,
            sourceRef: outcome.body.data.outcome_proof.source_ref,
          }),
        ]),
        auditProof: expect.objectContaining({
          version: "memoryignition_approval_audit.v1",
          approvalId,
          outcomeEventIds: expect.arrayContaining([outcome.body.data.outcome_proof.outcome_event_id]),
          evidence: expect.arrayContaining([
            `approval:${approvalId}`,
            `outcome:${outcome.body.data.outcome_proof.outcome_event_id}`,
          ]),
        }),
      }),
    ]));

    const timeline = await request(app)
      .get("/api/memory/memoryignition/runtime-timeline")
      .set("authorization", authHeader);

    expect(timeline.status).toBe(200);
    expect(timeline.body.data).toEqual(expect.objectContaining({
      version: "memoryignition_runtime_timeline.v1",
      approvalCount: expect.any(Number),
      outcomeLinkedApprovalCount: expect.any(Number),
      proofChainCount: expect.any(Number),
      completeProofChainCount: expect.any(Number),
      proofChains: expect.arrayContaining([
        expect.objectContaining({
          approvalRequestId: approvalId,
          status: "approved",
          reviewNote: "Schema action approved after manual review and required test proof.",
          auditProof: expect.objectContaining({
            version: "memoryignition_approval_audit.v1",
            approvalId,
            reviewedBy: userId,
            outcomeEventIds: expect.arrayContaining([outcome.body.data.outcome_proof.outcome_event_id]),
            riskScope: expect.objectContaining({
              matchedRiskyFiles: expect.arrayContaining(["schema"]),
            }),
          }),
          outcomeEventIds: expect.arrayContaining([outcome.body.data.outcome_proof.outcome_event_id]),
          futureInheritanceReady: true,
          stages: expect.objectContaining({
            approvalRequested: true,
            approvalReviewed: true,
            outcomeRecorded: true,
            futureInheritanceReady: true,
          }),
        }),
      ]),
      items: expect.arrayContaining([
        expect.objectContaining({
          moment: "risk_check",
          approvalRequestId: approvalId,
          approvalStatus: "approved",
          approvalAuditProof: expect.objectContaining({
            version: "memoryignition_approval_audit.v1",
            approvalId,
            reviewedBy: userId,
          }),
          approvalOutcomeCount: expect.any(Number),
          proofChainSteps: expect.arrayContaining(["approval_requested", "approval_reviewed"]),
        }),
        expect.objectContaining({
          moment: "after_agent",
          approvalsUsed: [approvalId],
          outcomeEventId: outcome.body.data.outcome_proof.outcome_event_id,
          outcomeReady: true,
          proofChainSteps: expect.arrayContaining(["outcome_recorded", "learning_updated"]),
        }),
      ]),
    }));

    const afterConsumed = await request(app)
      .post("/api/memory/memoryignition/risk-check")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Guard a risky production database action.",
        task_intent: "Prevent unsafe schema changes.",
        agent_id: "codex",
        risk_level: "high",
        available_tools: ["terminal", "edit_files"],
        current_files: ["prisma/schema.prisma"],
        proposed_action: "Drop table and bypass approval without running tests.",
        command: "drop table users",
      });

    expect(afterConsumed.status).toBe(200);
    expect(afterConsumed.body.data.action_guard.approval_satisfied).not.toBe(true);
    expect(afterConsumed.body.data.action_guard.approval_request).toEqual(expect.objectContaining({
      id: expect.not.stringMatching(approvalId),
      status: "pending",
    }));
    expect(afterConsumed.body.data.action_guard.approval_audit_proof).toEqual(expect.objectContaining({
      version: "memoryignition_approval_audit.v1",
      status: "pending",
      reviewedBy: null,
    }));
  });

  it("replays approval decisions against the current workspace runtime policy", async () => {
    const userId = `u_mi_approval_replay_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const initialPolicy = await request(app)
      .patch("/api/memory/memoryignition/runtime-policy")
      .set("authorization", authHeader)
      .send({
        defaultAllowedTools: ["read_files", "tests"],
        agentPolicies: [
          { agentType: "codex", allowedTools: ["read_files", "tests"] },
        ],
        riskPolicies: [
          { riskLevel: "high", allowedTools: ["read_files", "tests"], requireApproval: true },
        ],
      });

    expect(initialPolicy.status).toBe(200);

    const guarded = await request(app)
      .post("/api/memory/memoryignition/before-action")
      .set("authorization", authHeader)
      .send({
        project: "memoryos",
        repo_or_task: "memoryos",
        task: "Prepare a high-risk codex action.",
        task_intent: "Run tests before a high-risk action.",
        agent_id: "codex",
        risk_level: "high",
        tool_name: "tests",
        command: "npx vitest run tests/memoryIgnitionApprovals.contract.test.ts",
        proposed_action: "Run the MemoryIgnition approval replay test.",
      });

    expect(guarded.status).toBe(200);
    const approvalId = guarded.body.data.action_guard.approval_request.id as string;

    const approved = await request(app)
      .post(`/api/memory/approvals/${approvalId}/review`)
      .set("authorization", authHeader)
      .send({ decision: "approve", note: "Approved while policy requires approval." });

    expect(approved.status).toBe(200);

    const validReplay = await request(app)
      .get(`/api/memory/approvals/${approvalId}/replay`)
      .set("authorization", authHeader);

    expect(validReplay.status).toBe(200);
    expect(validReplay.body.data).toEqual(expect.objectContaining({
      approvalId,
      originalApprovalStatus: "approved",
      replay: expect.objectContaining({
        status: "valid",
        currentAllowed: true,
        currentApprovalRequired: true,
        policyChanged: false,
      }),
    }));

    const changedPolicy = await request(app)
      .patch("/api/memory/memoryignition/runtime-policy")
      .set("authorization", authHeader)
      .send({
        riskPolicies: [
          { riskLevel: "high", allowedTools: ["read_files", "tests"], requireApproval: false },
        ],
      });

    expect(changedPolicy.status).toBe(200);

    const staleReplay = await request(app)
      .get(`/api/memory/approvals/${approvalId}/replay`)
      .set("authorization", authHeader);

    expect(staleReplay.status).toBe(200);
    expect(staleReplay.body.data).toEqual(expect.objectContaining({
      approvalId,
      replay: expect.objectContaining({
        status: "stale",
        currentAllowed: true,
        currentApprovalRequired: false,
        policyChanged: true,
        governanceDecision: expect.objectContaining({
          status: "allowed",
          approval_required: false,
          runtime_policy_source: "agent_policy",
        }),
      }),
    }));
  }, 120000);
});
