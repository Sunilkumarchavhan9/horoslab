import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";
import { resetMemoryStoreAdapter, setMemoryStoreAdapter } from "../lib/adapters/registry";
import { listMemories } from "../lib/memory/listMemory";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";

describe("Company Brain Phase 2 contract", () => {
  const app = createMemoryOsApp();
  let userId = "u_company_brain_phase2_contract";
  let authHeader = "";

  beforeEach(async () => {
    userId = `u_company_brain_phase2_contract_${randomUUID().slice(0, 8)}`;
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    setMemoryStoreAdapter(new TestMemoryStoreAdapter());
    authHeader = `Bearer ${await makeToken(userId)}`;
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  it("captures full-taxonomy structured memories with trace proof, freshness, conflict, and graph metadata", async () => {
    const res = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send({
        workspace: "phase2-contract-workspace",
        project: "phase2-contract-project",
        threadId: "phase2-contract-thread",
        memories: [
          {
            type: "risk",
            title: "Production schema migrations need approval",
            whatHappened: "A risky migration can affect production data in Sunilkumarchavhan9/MemoryOS. Run npm test before touching prisma/schema.prisma.",
            whyItMatters: "Future agents must request approval before schema changes.",
            evidence: ["github:pull/42", "Sunilkumarchavhan9/MemoryOS", "prisma/schema.prisma", "npm test"],
            source: "github:pull/42",
            confidence: 0.94,
            freshness: "fresh",
            conflictsWith: ["memory:old-schema-policy"],
            shouldInheritBy: ["Codex", "Cursor"],
          },
          {
            type: "context",
            title: "Phase 2 graph context",
            whatHappened: "Company Brain links structured memories to project and agent inheritance.",
            whyItMatters: "Future agents need traceable context before acting.",
            evidence: ["docs/phase2.md"],
            source: "docs:phase2",
            shouldInheritBy: ["Codex"],
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.acceptedCount).toBe(2);
    expect(res.body.breakdown.byType).toMatchObject({
      risk: 1,
      context: 1,
    });
    expect(res.body.acceptedMemories[0]).toMatchObject({
      companyBrainType: "risk",
      freshness: expect.objectContaining({ status: "fresh" }),
      conflict: expect.objectContaining({ status: "possible_conflict" }),
      traceProof: expect.objectContaining({
        sourceRef: expect.stringContaining("phase2:risk"),
        evidence: expect.arrayContaining(["github:pull/42"]),
      }),
      graph: expect.objectContaining({
        nodeType: "risk",
        edgeRefs: expect.arrayContaining(["agent:Codex"]),
      }),
      entities: expect.arrayContaining([
        expect.objectContaining({ kind: "pull_request" }),
        expect.objectContaining({ kind: "file" }),
        expect.objectContaining({ kind: "test" }),
      ]),
      relations: expect.arrayContaining([
        expect.objectContaining({ relationType: "evidenced_by" }),
      ]),
      proofQuality: expect.objectContaining({
        status: "blocked",
        productionReady: false,
        gaps: expect.arrayContaining(["unresolved_conflict_blocks_inheritance"]),
      }),
      retrievalIndexed: true,
    });
  });

  it("exposes Phase 2 overview with trace coverage and graph proof", async () => {
    await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send({
        project: "phase2-overview-project",
        memories: [
          {
            type: "decision",
            title: "Use structured Company Brain memory",
            whatHappened: "Phase 2 uses typed memories with trace proof.",
            whyItMatters: "Agents inherit cleaner company context.",
            evidence: ["strong.md"],
            source: "docs:strong",
          },
          {
            type: "risk",
            title: "Conflicted production deploy policy",
            whatHappened: "A prior policy conflicts with unrestricted deploy behavior.",
            whyItMatters: "Future agents must see conflicted risk memory before acting.",
            evidence: ["security-policy"],
            source: "policy:risk",
            conflictsWith: ["memory:unrestricted-deploy-policy"],
          },
        ],
      });

    const res = await request(app)
      .get("/api/memory/company-brain/phase2/overview?project=phase2-overview-project")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body.totalStructuredMemories).toBeGreaterThanOrEqual(2);
    expect(res.body.moatCoverage.traceProofCoverage).toBeGreaterThan(0);
    expect(res.body.moatCoverage.conflictedCount).toBeGreaterThanOrEqual(1);
    expect(res.body.moatCoverage.productionReadyCount).toBeGreaterThanOrEqual(1);
    expect(res.body.moatCoverage.blockedProofCount).toBeGreaterThanOrEqual(1);
    expect(res.body.moatCoverage.averageProofQuality).toBeGreaterThan(0);
    expect(res.body.moatCoverage.inheritanceReadyCount).toEqual(expect.any(Number));
    expect(res.body.moatCoverage.inheritanceReviewCount).toEqual(expect.any(Number));
    expect(res.body.moatCoverage.inheritanceBlockedCount).toEqual(expect.any(Number));
    expect(res.body.moatCoverage.inheritanceReadyRatio).toEqual(expect.any(Number));
    expect(res.body.inheritanceReadiness).toMatchObject({
      version: "inheritance_readiness.v1",
      total: expect.any(Number),
      ready: expect.any(Number),
      review: expect.any(Number),
      blocked: expect.any(Number),
      readyRatio: expect.any(Number),
      status: expect.stringMatching(/^(ready|review|blocked)$/),
      nextActions: expect.any(Array),
      memories: expect.any(Array),
    });
    expect(res.body.inheritanceReadiness.memories[0]).toMatchObject({
      memoryId: expect.any(String),
      sourceRef: expect.any(String),
      status: expect.stringMatching(/^(ready|review|blocked)$/),
      readyCount: expect.any(Number),
      totalCount: expect.any(Number),
      steps: expect.arrayContaining([
        expect.objectContaining({ id: "source" }),
        expect.objectContaining({ id: "memory" }),
        expect.objectContaining({ id: "contract" }),
        expect.objectContaining({ id: "brief" }),
      ]),
    });
    expect(res.body.extractionReadiness).toMatchObject({
      readyForMemoryIgnition: expect.any(Boolean),
      score: expect.any(Number),
      blockers: expect.any(Array),
      stages: expect.arrayContaining([
        expect.objectContaining({ id: "extract", label: "Extracted" }),
        expect.objectContaining({ id: "contract", label: "Contract validated" }),
        expect.objectContaining({ id: "dedupe", label: "Deduped" }),
        expect.objectContaining({ id: "freshness", label: "Freshness checked" }),
        expect.objectContaining({ id: "conflict", label: "Contradiction checked" }),
        expect.objectContaining({ id: "graph", label: "Graph indexed" }),
        expect.objectContaining({ id: "proof", label: "Trace proof" }),
        expect.objectContaining({ id: "inheritance", label: "Inheritance ready" }),
      ]),
    });
    expect(res.body.search).toMatchObject({
      indexedCount: expect.any(Number),
      endpoint: "/api/memory/company-brain/phase2/search",
      detailEndpoint: "/api/memory/company-brain/phase2/memory/:id",
      searchableFields: expect.arrayContaining(["summary", "content", "type", "source", "evidence", "entity", "graph"]),
      suggestedQueries: expect.any(Array),
    });
    expect(res.body.pillars.decision.count).toBeGreaterThanOrEqual(1);
    expect(res.body.pillars.risk.count).toBeGreaterThanOrEqual(1);
    expect(res.body.graph.nodes.length).toBeGreaterThanOrEqual(2);
    expect(res.body.graph.edges.length).toBeGreaterThanOrEqual(1);
    expect(res.body.entities.length).toBeGreaterThanOrEqual(1);
    expect(res.body.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "source",
          evidenceCount: expect.any(Number),
          memoryIds: expect.any(Array),
        }),
      ]),
    );
    expect(res.body.conflictReviewQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyBrainType: "risk",
          conflictsWith: expect.arrayContaining(["memory:unrestricted-deploy-policy"]),
        }),
      ]),
    );
    expect(res.body.monitoring).toMatchObject({
      deployEnvironment: expect.any(String),
      checks: expect.arrayContaining([
        expect.objectContaining({ name: "trace_proof_coverage" }),
        expect.objectContaining({ name: "conflict_review_queue" }),
        expect.objectContaining({ name: "entity_resolution" }),
        expect.objectContaining({ name: "proof_quality" }),
      ]),
    });
    expect(res.body.pillars.risk.latest[0]).toMatchObject({
      traceProof: expect.objectContaining({
        sourceRef: expect.stringContaining("phase2:risk"),
      }),
      freshness: expect.objectContaining({
        status: expect.any(String),
      }),
      conflict: expect.objectContaining({
        status: "possible_conflict",
      }),
      graph: expect.objectContaining({
        nodeType: "risk",
      }),
      proofQuality: expect.objectContaining({
        status: "blocked",
      }),
    });

    const search = await request(app)
      .get("/api/memory/company-brain/phase2/search?project=phase2-overview-project&q=deploy")
      .set("authorization", authHeader);

    expect(search.status).toBe(200);
    expect(search.body.totalIndexed).toBeGreaterThanOrEqual(2);
    expect(search.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          summary: expect.stringContaining("deploy"),
          traceProof: expect.objectContaining({
            sourceRef: expect.stringContaining("phase2:"),
          }),
          retrieval: expect.objectContaining({
            indexed: expect.any(Boolean),
            searchableText: expect.any(Array),
          }),
          traceLineage: expect.arrayContaining([
            expect.objectContaining({ step: "Source" }),
            expect.objectContaining({ step: "Memory" }),
          ]),
        }),
      ]),
    );

    const detailId = search.body.results[0].id;
    const detail = await request(app)
      .get(`/api/memory/company-brain/phase2/memory/${detailId}`)
      .set("authorization", authHeader);

    expect(detail.status).toBe(200);
    expect(detail.body.memory).toMatchObject({
      id: detailId,
      content: expect.any(String),
      whyItMatters: expect.any(String),
      traceProof: expect.objectContaining({
        sourceRef: expect.stringContaining("phase2:"),
      }),
      graph: expect.objectContaining({
        nodeId: expect.any(String),
      }),
      entities: expect.any(Array),
      relations: expect.any(Array),
      proofQuality: expect.objectContaining({
        score: expect.any(Number),
        productionReady: expect.any(Boolean),
      }),
    });
  });

  it("lets a human resolve a Phase 2 conflict before future agents inherit it", async () => {
    const capture = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send({
        project: "phase2-human-conflict-workflow",
        memories: [
          {
            type: "risk",
            title: "Production deploy conflicts with old policy",
            whatHappened: "The old deploy note conflicts with the new approval requirement.",
            whyItMatters: "Future agents must not inherit unresolved deploy policy conflicts.",
            evidence: ["policy:deploy-approval"],
            source: "policy:deploy-approval",
            conflictsWith: ["memory:old-deploy-policy"],
          },
        ],
      });

    expect(capture.status).toBe(200);
    const memoryId = capture.body.acceptedMemories[0].id;
    const stale = await request(app)
      .post("/api/memory/conflicts/mark-stale")
      .set("authorization", authHeader)
      .send({ memoryId });

    expect(stale.status).toBe(200);
    expect(stale.body.memory.status).toBe("stale");

    const overview = await request(app)
      .get("/api/memory/company-brain/phase2/overview?project=phase2-human-conflict-workflow")
      .set("authorization", authHeader);

    expect(overview.status).toBe(200);
    expect(overview.body.moatCoverage.staleCount).toBeGreaterThanOrEqual(1);
    expect(overview.body.monitoring.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "staleness_watch",
          status: "warn",
        }),
      ]),
    );
  });

  it("supports pinning and merging conflicted Phase 2 memories before inheritance", async () => {
    const capture = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send({
        project: "phase2-pin-merge-workflow",
        memories: [
          {
            type: "decision",
            title: "Keep the old deploy rule as canonical",
            whatHappened: "An older policy should remain visible, but the newer policy may supersede it.",
            whyItMatters: "Future agents need the pinned version when deciding on deploy behavior.",
            evidence: ["policy:legacy-deploy"],
            source: "policy:legacy-deploy",
            conflictsWith: ["memory:new-deploy-policy"],
          },
        ],
      });

    expect(capture.status).toBe(200);
    const memoryId = capture.body.acceptedMemories[0].id;

    const pinned = await request(app)
      .post("/api/memory/conflicts/pin")
      .set("authorization", authHeader)
      .send({ memoryId });

    expect(pinned.status).toBe(200);
    expect(pinned.body.memory.summary).toContain("[PINNED]");
    expect(pinned.body.memory.id).toBe(memoryId);

    const mergedCapture = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send({
        project: "phase2-merge-workflow",
        memories: [
          {
            type: "risk",
            title: "Merge two related risk memories",
            whatHappened: "The duplicate memory should be merged into one inherited record.",
            whyItMatters: "Future agents should not see duplicate risk records.",
            evidence: ["policy:merge-risk"],
            source: "policy:merge-risk",
            conflictsWith: ["memory:merge-risk-duplicate"],
          },
        ],
      });

    expect(mergedCapture.status).toBe(200);
    const mergeMemoryId = mergedCapture.body.acceptedMemories[0].id;

    const merged = await request(app)
      .post("/api/memory/conflicts/merge")
      .set("authorization", authHeader)
      .send({ memoryId: mergeMemoryId });

    expect(merged.status).toBe(200);
    expect(merged.body.memory.status).toBe("merged");
    expect(merged.body.memory.id).toBe(mergeMemoryId);
  });

  it("extracts raw tool signals, redacts secrets, infers staleness, and rejects duplicates", async () => {
    const oldDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      project: "phase2-raw-pipeline-project",
      workspace: "phase2-raw-workspace",
      rawSignals: [
        {
          sourceType: "slack",
          sourceRef: "thread/raw-risk-1",
          title: "Production deploy approval policy",
          body: "Production schema migration must require approval. leaked key sk-1234567890abcdef1234567890abcdef",
          occurredAt: oldDate,
          author: "security-team",
        },
      ],
    };

    const first = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send(payload);

    expect(first.status).toBe(200);
    expect(first.body.acceptedCount).toBe(1);
    expect(first.body.rejectedCount).toBe(0);
    expect(first.body.acceptedMemories[0]).toMatchObject({
      companyBrainType: "risk",
      freshness: expect.objectContaining({ status: "stale" }),
      retrievalIndexed: true,
    });

    const stored = await listMemories({
      userId,
      limit: 20,
    });
    const rawRisk = stored.memories.find((memory) => memory.summary.includes("Production deploy approval policy"));
    expect(rawRisk?.content).toContain("[REDACTED]");
    expect(rawRisk?.content).not.toContain("sk-1234567890abcdef1234567890abcdef");
    expect(rawRisk?.graph?.edgeRefs.some((edgeRef) => edgeRef.startsWith("dedupe:"))).toBe(true);

    const duplicate = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send(payload);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.acceptedCount).toBe(0);
    expect(duplicate.body.rejectedCount).toBe(1);
    expect(duplicate.body.rejectedMemories[0]).toMatchObject({
      type: "risk",
      reason: "duplicate",
    });
  });

  it("extracts Slack and Jira connector signals with PII redaction", async () => {
    const res = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .send({
        project: "phase2-connectors-project",
        slackSignals: [
          {
            channelId: "C123",
            channelName: "incidents",
            messageTs: "1710000000.000100",
            userId: "U123",
            text: "P1 incident: customer email jane@example.com saw production outage. Call +1 415 555 1212. token sk-abcdefabcdefabcdef12",
            permalink: "https://slack.example/archives/C123/p1710000000000100",
          },
        ],
        jiraSignals: [
          {
            issueId: "10001",
            issueKey: "MEM-42",
            summary: "Decision: require approval for production migrations",
            description: "We agreed production schema migration must require approval.",
            status: "Approved",
            priority: "High",
            labels: ["decision", "production"],
            updatedAt: new Date().toISOString(),
            url: "https://jira.example/browse/MEM-42",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.acceptedCount).toBe(2);
    expect(res.body.breakdown).toMatchObject({
      slackSignals: 1,
      jiraSignals: 1,
    });
    expect(res.body.breakdown.byType.incident).toBeGreaterThanOrEqual(1);
    expect(res.body.breakdown.byType.decision).toBeGreaterThanOrEqual(1);

    const stored = await listMemories({ userId, limit: 20 });
    const corpus = stored.memories
      .filter((memory) => memory.summary.includes("Slack") || memory.summary.includes("Decision"))
      .map((memory) => memory.content)
      .join("\n");
    expect(corpus).toContain("[REDACTED_EMAIL]");
    expect(corpus).toContain("[REDACTED_PHONE]");
    expect(corpus).toContain("[REDACTED]");
    expect(corpus).not.toContain("jane@example.com");
    expect(corpus).not.toContain("+1 415 555 1212");
    expect(corpus).not.toContain("sk-abcdefabcdefabcdef12");
  });

  it("keeps Phase 2 Company Brain memories isolated by organization", async () => {
    const project = "phase2-org-isolation-project";
    const alpha = await request(app)
      .post("/api/memory/company-brain/phase2/capture")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_phase2_alpha")
      .send({
        project,
        memories: [
          {
            type: "decision",
            title: "Alpha org deploy rule",
            whatHappened: "Alpha organization requires approval for deploys.",
            whyItMatters: "Future agents in alpha should inherit this rule.",
            evidence: ["alpha-policy"],
            source: "policy:alpha",
          },
        ],
      });

    expect(alpha.status).toBe(200);
    expect(alpha.body.acceptedCount).toBe(1);

    const alphaOverview = await request(app)
      .get(`/api/memory/company-brain/phase2/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_phase2_alpha");
    const betaOverview = await request(app)
      .get(`/api/memory/company-brain/phase2/overview?project=${project}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_phase2_beta");

    expect(alphaOverview.status).toBe(200);
    expect(betaOverview.status).toBe(200);
    expect(alphaOverview.body.totalStructuredMemories).toBeGreaterThanOrEqual(1);
    expect(betaOverview.body.totalStructuredMemories).toBe(0);
  });
});
