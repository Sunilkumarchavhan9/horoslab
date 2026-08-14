import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

describe("Runtime API Route Contracts", () => {
  const originalDesktopProvider = process.env.MEMORYOSTM_DESKTOP_PROVIDER;
  const originalDesktopProviderBaseUrl =
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL;
  const runtimeEventKinds = new Set([
    "message",
    "file_change",
    "worklog",
    "shell",
    "pr_status",
    "pr_ready",
    "desktop_status",
    "desktop_preview_url",
  ]);
  const app = createMemoryOsApp();
  const authUserId = "u_auth_runtime";
  let authHeader = "";

  beforeEach(async () => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = "sandbox";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = "";
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  // Restore env to avoid leaking test overrides.
  afterAll(() => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = originalDesktopProvider;
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = originalDesktopProviderBaseUrl;
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/runtime/threads");
    expect(res.status).toBe(401);
  });

  it("creates, lists, updates, and checkpoints a thread", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({
        title: "OAuth Migration",
        goal: "Migrate auth to OAuth2",
        workspace: "default",
        project: "memoryos",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.ok).toBe(true);
    expect(createRes.body.data.thread.title).toBe("OAuth Migration");
    const threadId = createRes.body.data.thread.id as string;

    const listRes = await request(app)
      .get("/api/runtime/threads?project=memoryos")
      .set("authorization", authHeader);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.threads.some((t: { id: string }) => t.id === threadId)).toBe(true);

    const patchRes = await request(app)
      .patch(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader)
      .send({ runtimeState: "running", blockers: ["Waiting on security review"] });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.thread.runtimeState).toBe("running");

    const checkpointRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/checkpoint`)
      .set("authorization", authHeader)
      .send({ label: "Routes migrated", summary: "All OAuth routes behind feature flag" });
    expect(checkpointRes.status).toBe(201);
    expect(checkpointRes.body.data.thread.checkpoints.length).toBeGreaterThan(0);

    const retrievalRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/retrievals`)
      .set("authorization", authHeader)
      .send({
        question: "Why was auth changed?",
        memoryIds: ["mem-1"],
        provenance: [{ label: "Slack #platform", sourceType: "slack", snippet: "OAuth decision" }],
      });
    expect(retrievalRes.status).toBe(201);
    expect(retrievalRes.body.data.thread.retrievals[0].provenance[0].sourceType).toBe("slack");

    const archiveRes = await request(app)
      .patch(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader)
      .send({ status: "archived" });
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.thread.status).toBe("archived");

    const activeOnlyRes = await request(app)
      .get("/api/runtime/threads?status=active&project=memoryos")
      .set("authorization", authHeader);
    expect(activeOnlyRes.body.data.threads.some((t: { id: string }) => t.id === threadId)).toBe(false);
  });

  it("runs plan and execution step flow", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Exec flow", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    await request(app)
      .post(`/api/runtime/threads/${threadId}/plan`)
      .set("authorization", authHeader)
      .send({ steps: ["Update API", "Update UI", "Add tests"] });

    const threadAfterPlan = await request(app)
      .get(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader);
    expect(threadAfterPlan.status).toBe(200);
    expect(threadAfterPlan.body.data.thread.autonomousStage).toBe("plan");
    expect(threadAfterPlan.body.data.thread.autonomousStageStatus).toBe(
      "completed",
    );

    const startRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execute/start`)
      .set("authorization", authHeader);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.thread.runtimeState).toBe("running");
    expect(startRes.body.data.thread.autonomousStage).toBe("execute");
    expect(startRes.body.data.thread.autonomousStageStatus).toBe("running");

    const advanceRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execute/advance`)
      .set("authorization", authHeader)
      .send({ status: "done" });
    expect(advanceRes.status).toBe(200);
    expect(advanceRes.body.data.thread.executionSteps[0].status).toBe("done");
    expect(advanceRes.body.data.thread.executionSteps[1].status).toBe("running");

    const stageRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/autonomous-stage`)
      .set("authorization", authHeader)
      .send({ stage: "verify", status: "running" });
    expect(stageRes.status).toBe(200);
    expect(stageRes.body.data.thread.autonomousStage).toBe("verify");
    expect(stageRes.body.data.thread.autonomousStageStatus).toBe("running");

    const linkRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/link-pr`)
      .set("authorization", authHeader)
      .send({ url: "https://github.com/org/repo/pull/1" });
    expect(linkRes.status).toBe(200);
    expect(linkRes.body.data.thread.linkedPrs).toContain("https://github.com/org/repo/pull/1");
    expect(linkRes.body.data.thread.autonomousStage).toBe("pr");
    expect(linkRes.body.data.thread.autonomousStageStatus).toBe("running");
  });

  it("activates a mythic execution plan with a handoff and artifact", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({
        title: "Ship Mythic activation",
        goal: "Turn the thread into an actionable backend plan",
        workspace: "default",
        project: "memoryos",
      });
    const threadId = createRes.body.data.thread.id as string;

    const activateRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/plan/activate`)
      .set("authorization", authHeader)
      .send({
        steps: [
          "Freeze the plan steps",
          "Create the first manager to coder handoff",
          "Register a runtime artifact for the UI",
        ],
      });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.ok).toBe(true);
    expect(activateRes.body.data.thread.plan).toHaveLength(3);
    expect(activateRes.body.data.thread.autonomousStage).toBe("plan");
    expect(activateRes.body.data.handoff.source).toBe("manager");
    expect(activateRes.body.data.handoff.target).toBe("coder");
    expect(activateRes.body.data.handoff.payload.artifacts).toHaveLength(1);
    expect(activateRes.body.data.artifact.type).toBe("log");
    expect(activateRes.body.data.artifact.title).toBe("Mythic execution plan");
    expect(activateRes.body.data.taskId).toMatch(/^MYTHIC-/);
    expect(activateRes.body.data.thread.executionState.taskId).toMatch(/^MYTHIC-/);
    expect(activateRes.body.data.thread.executionState.steps.length).toBeGreaterThan(3);
  });

  it("supports execution lifecycle routes, approval blocking, and revision requests", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({
        title: "Mythic lifecycle",
        workspace: "default",
        project: "memoryos",
      });
    const threadId = createRes.body.data.thread.id as string;

    await request(app)
      .post(`/api/runtime/threads/${threadId}/plan/activate`)
      .set("authorization", authHeader)
      .send({
        steps: ["Implement guarded runtime API", "Add review coverage"],
      });

    const executionRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/execution`)
      .set("authorization", authHeader);
    expect(executionRes.status).toBe(200);
    expect(executionRes.body.data.execution.taskId).toMatch(/^MYTHIC-/);

    const coderStep = executionRes.body.data.execution.steps.find(
      (step: { role: string; stage: string }) =>
        step.role === "coder" && step.stage === "execute",
    );
    const reviewerStep = executionRes.body.data.execution.steps.find(
      (step: { role: string; stage: string }) =>
        step.role === "reviewer" && step.stage === "verify",
    );

    expect(coderStep).toBeTruthy();
    expect(reviewerStep).toBeTruthy();

    const startStepRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/start-step`)
      .set("authorization", authHeader)
      .send({ stepId: coderStep.id, role: "coder" });
    expect(startStepRes.status).toBe(200);
    expect(startStepRes.body.data.thread.executionState.activeRole).toBe("coder");

    const completeCoderRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/complete-step`)
      .set("authorization", authHeader)
      .send({
        stepId: coderStep.id,
        artifactIds: ["artifact-coder-1"],
        note: "Coder implementation finished",
      });
    expect(completeCoderRes.status).toBe(200);
    expect(
      completeCoderRes.body.data.thread.executionState.steps.find(
        (step: { id: string }) => step.id === coderStep.id,
      ).artifactIds,
    ).toContain("artifact-coder-1");

    const startReviewerRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/start-step`)
      .set("authorization", authHeader)
      .send({ stepId: reviewerStep.id, role: "reviewer" });
    expect(startReviewerRes.status).toBe(200);

    const rejectReviewerRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/complete-step`)
      .set("authorization", authHeader)
      .send({
        stepId: reviewerStep.id,
        approvalStatus: "rejected",
        note: "Reviewer blocked the current output",
      });
    expect(rejectReviewerRes.status).toBe(200);
    expect(rejectReviewerRes.body.data.thread.executionState.approvalBlocked).toBe(true);
    expect(rejectReviewerRes.body.data.thread.autonomousStageStatus).toBe("blocked");

    const revisionRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/request-revision`)
      .set("authorization", authHeader)
      .send({
        reason: "Fix the implementation before verification",
        targetRole: "coder",
      });
    expect(revisionRes.status).toBe(200);
    expect(revisionRes.body.data.thread.executionState.lastRevisionReason).toContain(
      "Fix the implementation",
    );
    expect(revisionRes.body.data.thread.executionState.activeRole).toBe("coder");
  });

  it("orchestrates manager, coder, reviewer, and verifier transitions", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({
        title: "Mythic orchestration",
        workspace: "default",
        project: "memoryos",
      });
    const threadId = createRes.body.data.thread.id as string;

    await request(app)
      .post(`/api/runtime/threads/${threadId}/plan/activate`)
      .set("authorization", authHeader)
      .send({
        steps: ["Ship runtime-backed multi-agent flow"],
      });

    const managerRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
      .set("authorization", authHeader)
      .send({});
    expect(managerRes.status).toBe(200);
    expect(managerRes.body.data.role).toBe("manager");
    expect(managerRes.body.data.handoff.target).toBe("coder");
    expect(managerRes.body.data.artifact.type).toBe("log");

    const coderRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
      .set("authorization", authHeader)
      .send({});
    expect(coderRes.status).toBe(200);
    expect(coderRes.body.data.role).toBe("coder");
    expect(coderRes.body.data.handoff.target).toBe("reviewer");
    expect(coderRes.body.data.artifact.type).toBe("code");

    const reviewerRejectRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
      .set("authorization", authHeader)
      .send({
        reviewDecision: "reject",
        note: "Need one more revision pass",
      });
    expect(reviewerRejectRes.status).toBe(200);
    expect(reviewerRejectRes.body.data.role).toBe("reviewer");
    expect(reviewerRejectRes.body.data.thread.executionState.lastRevisionReason).toContain(
      "Need one more revision pass",
    );

    const refreshThreadRes = await request(app)
      .get(`/api/runtime/threads/${threadId}`)
      .set("authorization", authHeader);
    const coderPending = refreshThreadRes.body.data.thread.executionState.steps.find(
      (step: { role: string; status: string }) =>
        step.role === "coder" && step.status === "pending",
    );
    expect(coderPending).toBeTruthy();
  });

  it("enqueues mythic worker execution and exposes worker metadata", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({
        title: "Mythic worker queue",
        workspace: "default",
        project: "memoryos",
      });
    const threadId = createRes.body.data.thread.id as string;

    await request(app)
      .post(`/api/runtime/threads/${threadId}/plan/activate`)
      .set("authorization", authHeader)
      .send({
        steps: ["Queue the first worker-backed step"],
      });

    const enqueueRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/execution/enqueue`)
      .set("authorization", authHeader)
      .send({});

    expect(enqueueRes.status).toBe(202);
    expect(enqueueRes.body.data.job.id).toMatch(/^mythic_job_/);
    expect(enqueueRes.body.data.thread.executionState.workerJobId).toBe(
      enqueueRes.body.data.job.id,
    );
    expect(
      [
        "queued",
        "running",
        "idle",
        "awaiting_review_decision",
        "awaiting_pr_result",
        "completed",
      ].includes(enqueueRes.body.data.thread.executionState.workerStatus),
    ).toBe(true);

    const jobRes = await request(app)
      .get(
        `/api/runtime/threads/${threadId}/execution/worker/${enqueueRes.body.data.job.id}`,
      )
      .set("authorization", authHeader);
    expect(jobRes.status).toBe(200);
    expect(jobRes.body.data.job.threadId).toBe(threadId);
  });

  it("resolves thread-scoped artifact URIs", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Artifact resolution", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const artifactRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/artifacts`)
      .set("authorization", authHeader)
      .send({
        type: "log",
        producer: "manager",
        consumers: ["coder"],
        title: "Manager brief",
        description: "Artifact URI test",
        content: "artifact body",
        metadata: { tags: ["mythic"], stage: "plan" },
      });

    expect(artifactRes.status).toBe(201);
    const uri = artifactRes.body.data.artifact.uri as string;

    const resolveRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/artifact-uri`)
      .query({ uri })
      .set("authorization", authHeader);

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.artifact.uri).toBe(uri);
  });

  it(
    "retries a blocked mythic worker job",
    async () => {
      const createRes = await request(app)
        .post("/api/runtime/threads")
        .set("authorization", authHeader)
        .send({
          title: "Blocked Mythic retry",
          workspace: "default",
          project: "memoryos",
          repoPath: "not-a-valid-github-ref",
        });
      const threadId = createRes.body.data.thread.id as string;

      await request(app)
        .post(`/api/runtime/threads/${threadId}/plan/activate`)
        .set("authorization", authHeader)
        .send({ steps: ["Drive PR stage"] });

      await request(app)
        .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
        .set("authorization", authHeader)
        .send({});
      await request(app)
        .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
        .set("authorization", authHeader)
        .send({});
      await request(app)
        .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
        .set("authorization", authHeader)
        .send({ reviewDecision: "approve" });
      await request(app)
        .post(`/api/runtime/threads/${threadId}/execution/orchestrate-next`)
        .set("authorization", authHeader)
        .send({});

      const enqueueRes = await request(app)
        .post(`/api/runtime/threads/${threadId}/execution/enqueue`)
        .set("authorization", authHeader)
        .send({});
      expect(enqueueRes.status).toBe(202);

      const blockedThreadRes = await request(app)
        .get(`/api/runtime/threads/${threadId}`)
        .set("authorization", authHeader);
      expect(blockedThreadRes.status).toBe(200);
      expect(blockedThreadRes.body.data.thread.executionState.workerStatus).toBe("blocked");
      expect(blockedThreadRes.body.data.thread.executionState.blockedReason).toBe("blocked_on_github");

      const failedJobId = blockedThreadRes.body.data.thread.executionState.workerJobId as string;
      const retryRes = await request(app)
        .post(`/api/runtime/threads/${threadId}/execution/worker/retry`)
        .set("authorization", authHeader)
        .send({ jobId: failedJobId });
      expect(retryRes.status).toBe(202);
      expect(retryRes.body.data.job.id).not.toBe(failedJobId);
    },
    15000,
  );

  it("governs file change proposals with checkpoint linkage", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Governed writes", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const proposeRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/changes`)
      .set("authorization", authHeader)
      .send({
        filepath: "src/auth.ts",
        instruction: "Add null check",
        originalText: "return token;",
        newText: "if (!token) return null;\nreturn token;",
        startLine: 0,
        startCharacter: 0,
        endLine: 0,
        endCharacter: 13,
      });
    expect(proposeRes.status).toBe(201);
    expect(proposeRes.body.data.change.status).toBe("pending");
    expect(proposeRes.body.data.change.checkpointId).toBeTruthy();

    const changeId = proposeRes.body.data.change.id as string;

    const approveRes = await request(app)
      .post(`/api/runtime/changes/${changeId}/approve`)
      .set("authorization", authHeader);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.change.status).toBe("approved");

    const appliedRes = await request(app)
      .post(`/api/runtime/changes/${changeId}/applied`)
      .set("authorization", authHeader);
    expect(appliedRes.status).toBe(200);
    expect(appliedRes.body.data.change.status).toBe("applied");

    const listRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/changes?status=pending`)
      .set("authorization", authHeader);
    expect(listRes.body.data.changes.some((c: { id: string }) => c.id === changeId)).toBe(false);
  });

  it("returns normalized runtime events for a thread", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Events thread", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    await request(app)
      .post(`/api/runtime/threads/${threadId}/retrievals`)
      .set("authorization", authHeader)
      .send({
        question: "Continue runtime event work",
        memoryIds: ["mem-events-1"],
        provenance: [{ label: "Wiki", sourceType: "wiki", snippet: "context" }],
      });

    await request(app)
      .post(`/api/runtime/threads/${threadId}/changes`)
      .set("authorization", authHeader)
      .send({
        filepath: "src/runtime.ts",
        instruction: "Normalize events",
        originalText: "old",
        newText: "new",
        startLine: 0,
        startCharacter: 0,
        endLine: 0,
        endCharacter: 3,
      });

    await request(app)
      .post(`/api/runtime/threads/${threadId}/link-pr`)
      .set("authorization", authHeader)
      .send({ url: "https://github.com/org/repo/pull/42" });

    await request(app)
      .post(`/api/runtime/threads/${threadId}/artifacts`)
      .set("authorization", authHeader)
      .send({
        type: "preview",
        producer: "verifier",
        consumers: ["manager", "reviewer"],
        title: "Live preview",
        description: "Desktop validation preview",
        content: "https://preview.memoryos.dev/thread-1",
        metadata: {
          tags: ["preview", "desktop"],
          stage: "verify",
        },
      });

    const eventsRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/events`)
      .set("authorization", authHeader);

    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.ok).toBe(true);
    expect(Array.isArray(eventsRes.body.data.events)).toBe(true);

    const kinds = (eventsRes.body.data.events as Array<{ kind?: string }>)
      .map((event) => event.kind)
      .filter(Boolean);

    expect(kinds.every((kind) => runtimeEventKinds.has(kind as string))).toBe(
      true,
    );

    expect(kinds).toContain("message");
    expect(kinds).toContain("worklog");
    expect(kinds).toContain("file_change");
    expect(kinds).toContain("pr_status");
    expect(kinds).toContain("pr_ready");
    expect(kinds).toContain("desktop_status");
    expect(kinds).toContain("desktop_preview_url");

    const prReadyEvent = (eventsRes.body.data.events as Array<{
      kind?: string;
      payload?: { type?: string; url?: string; number?: number; title?: string };
    }>).find((event) => event.kind === "pr_ready");
    expect(prReadyEvent?.payload?.type).toBe("pr_ready");
    expect(prReadyEvent?.payload?.url).toBe("https://github.com/org/repo/pull/42");
    expect(prReadyEvent?.payload?.number).toBe(42);

    const previewEvent = (eventsRes.body.data.events as Array<{
      kind?: string;
      payload?: { previewUrl?: string | null };
    }>).find((event) => event.kind === "desktop_preview_url");
    expect(previewEvent?.payload?.previewUrl).toBe(
      "https://preview.memoryos.dev/thread-1",
    );
  }, 15000);

  it("supports desktop lifecycle start/status/stop with os persistence", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Desktop lifecycle thread", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const startRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/start`)
      .set("authorization", authHeader)
      .send({ osType: "windows" });

    expect(startRes.status).toBe(200);
    expect(startRes.body.ok).toBe(true);
    expect(startRes.body.data.desktop.osType).toBe("windows");
    expect(startRes.body.data.desktop.state).toBe("live");
    expect(startRes.body.data.desktop.provider).toBe("browser");
    expect(startRes.body.data.desktop.providerSessionId).toBeTruthy();
    expect(typeof startRes.body.data.desktop.sessionAuthToken).toBe("string");
    expect(typeof startRes.body.data.desktop.sessionAuthExpiresAt).toBe("string");
    expect(startRes.body.data.desktop.resumeSupported).toBe(true);
    expect(startRes.body.data.thread.desktopSession.osType).toBe("windows");

    const statusRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/desktop/status`)
      .set("authorization", authHeader);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.ok).toBe(true);
    expect(statusRes.body.data.desktop.osType).toBe("windows");
    expect(statusRes.body.data.desktop.state).toBe("live");
    expect(statusRes.body.data.desktop.providerSessionId).toBe(
      startRes.body.data.desktop.providerSessionId,
    );
    expect(statusRes.body.data.thread.desktopSession.osType).toBe("windows");

    const inputRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/input`)
      .set("authorization", authHeader)
      .send({
        event: { type: "mouse_click", x: 120, y: 80, action: "click", button: "left" },
      });
    expect(inputRes.status).toBe(200);
    expect(inputRes.body.data.input.accepted).toBe(true);

    const streamRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/desktop/stream`)
      .set("authorization", authHeader);
    expect(streamRes.status).toBe(200);
    expect(typeof streamRes.body.data.stream.connected).toBe("boolean");
    expect(typeof streamRes.body.data.stream.mode).toBe("string");
    expect(typeof streamRes.body.data.stream.resumeSupported).toBe("boolean");

    const patchDesktopRes = await request(app)
      .patch(`/api/runtime/threads/${threadId}/desktop`)
      .set("authorization", authHeader)
      .send({
        previewArtifactId: "artifact-preview-123",
        recordingArtifactId: "artifact-recording-123",
      });
    expect(patchDesktopRes.status).toBe(200);
    expect(patchDesktopRes.body.data.thread.desktopSession.previewArtifactId).toBe(
      "artifact-preview-123",
    );
    expect(patchDesktopRes.body.data.thread.desktopSession.recordingArtifactId).toBe(
      "artifact-recording-123",
    );

    const stopRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/stop`)
      .set("authorization", authHeader)
      .send({});

    expect(stopRes.status).toBe(200);
    expect(stopRes.body.ok).toBe(true);
    expect(stopRes.body.data.desktop.osType).toBe("windows");
    expect(stopRes.body.data.desktop.state).toBe("idle");
    expect(stopRes.body.data.thread.desktopSession.osType).toBe("windows");
    expect(stopRes.body.data.thread.desktopSession.state).toBe("idle");
    expect(stopRes.body.data.thread.desktopSession.previewArtifactId).toBe(
      "artifact-preview-123",
    );
    expect(stopRes.body.data.thread.desktopSession.recordingArtifactId).toBe(
      "artifact-recording-123",
    );

    const wakeRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/wake`)
      .set("authorization", authHeader)
      .send({});

    expect(wakeRes.status).toBe(200);
    expect(wakeRes.body.ok).toBe(true);
    expect(wakeRes.body.data.desktop.state).toBe("live");
    expect(wakeRes.body.data.desktop.providerSessionId).toBe(
      startRes.body.data.desktop.providerSessionId,
    );
    expect(wakeRes.body.data.desktop.resumeToken).toBe(startRes.body.data.desktop.resumeToken);
    expect(wakeRes.body.data.thread.desktopSession.previewArtifactId).toBe(
      "artifact-preview-123",
    );
  }, 15000);

  it("returns desktop provider health details", async () => {
    const res = await request(app)
      .get("/api/runtime/desktop/provider-health")
      .set("authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.data.providerHealth.provider).toBe("string");
    expect(typeof res.body.data.providerHealth.healthy).toBe("boolean");
    expect(typeof res.body.data.providerHealth.detail).toBe("string");
    expect(typeof res.body.data.providerHealth.checkedAt).toBe("string");
  }, 15000);

  it("creates and lists structured agent handoffs", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Handoff thread", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const handoffRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/handoffs`)
      .set("authorization", authHeader)
      .send({
        source: "manager",
        target: "coder",
        taskId: "MYTHIC-007",
        payload: {
          codeChanges: ["server/routes/runtime.routes.ts"],
          testResults: ["runtime.routes.contract.test.ts passed"],
          artifacts: ["artifact://uuid-123/test-reproduction"],
        },
        metadata: {
          confidence: 0.92,
          completeness: 1,
          notes: "Root cause identified and validated.",
        },
        requirements: ["Implement fix", "Run lint", "Post verification summary"],
        compressedContext: "Feedback API returns 500 when email send fails.",
      });

    expect(handoffRes.status).toBe(201);
    expect(handoffRes.body.ok).toBe(true);
    expect(handoffRes.body.data.handoff.source).toBe("manager");
    expect(handoffRes.body.data.handoff.target).toBe("coder");
    expect(handoffRes.body.data.thread.handoffs.length).toBeGreaterThan(0);

    const listRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/handoffs?limit=10`)
      .set("authorization", authHeader);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data.handoffs)).toBe(true);
    expect(listRes.body.data.handoffs[0].taskId).toBe("MYTHIC-007");
    expect(listRes.body.data.handoffs[0].metadata.confidence).toBe(0.92);
  });

  it("creates, lists, and fetches artifacts with deep links", async () => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Artifact thread", workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const artifactRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/artifacts`)
      .set("authorization", authHeader)
      .send({
        type: "review_note",
        producer: "coder",
        consumers: ["reviewer", "manager"],
        title: "Reviewer note",
        description: "Review note for the login flow",
        content: "Check login empty state before merge",
        metadata: {
          tags: ["review", "login"],
          stage: "verify",
          verificationRequired: true,
          sourceChangeId: "change-123",
        },
      });

    expect(artifactRes.status).toBe(201);
    expect(artifactRes.body.ok).toBe(true);
    expect(artifactRes.body.data.artifact.type).toBe("review_note");
    expect(artifactRes.body.data.artifact.uri).toContain(`artifact://${threadId}/`);

    const artifactId = artifactRes.body.data.artifact.id as string;

    const listRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/artifacts?limit=10`)
      .set("authorization", authHeader);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data.artifacts)).toBe(true);
    expect(listRes.body.data.artifacts[0].id).toBe(artifactId);
    expect(listRes.body.data.artifacts[0].metadata.tags).toContain("review");
    expect(listRes.body.data.artifacts[0].metadata.stage).toBe("verify");

    const getRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/artifacts/${artifactId}`)
      .set("authorization", authHeader);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.artifact.uri).toBe(
      artifactRes.body.data.artifact.uri,
    );
  });

});
