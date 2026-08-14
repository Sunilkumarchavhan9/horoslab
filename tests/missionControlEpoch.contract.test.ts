import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetPrismaRuntimeDataStores } from "./helpers/resetDataDir";

const app = createMemoryOsApp();

async function seedWorkspace(userId: string) {
  return prisma.workspace.create({
    data: {
      userId,
      ownerId: userId,
      name: `Mission Control Workspace ${userId}`,
      plan: "Free",
      region: "us",
    },
  });
}

describe("Mission Control Epoch backend", () => {
  beforeEach(async () => {
    await resetPrismaRuntimeDataStores();
    await prisma.webhookDelivery.deleteMany();
    await prisma.webhookEndpoint.deleteMany();
    await prisma.workspace.deleteMany();
  });

  it("bootstraps the sales research institution runtime", async () => {
    const userId = "mission-control-bootstrap";
    const token = await makeToken(userId);
    const workspace = await seedWorkspace(userId);

    const bootstrap = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/mission-control/bootstrap`)
      .set("authorization", `Bearer ${token}`)
      .send({
        useCase: "sales_research",
      });

    expect(bootstrap.status).toBe(201);
    expect(bootstrap.body.ok).toBe(true);
    expect(bootstrap.body.data.bootstrap.useCase).toBe("sales_research");
    expect(bootstrap.body.data.bootstrap.template.name).toBe("Sales Research Institution");
    expect(bootstrap.body.data.bootstrap.institution.name).toBe("Sales Research Institution");
    expect(bootstrap.body.data.bootstrap.mission.title).toBe("Find 50 qualified accounts matching this ICP");
    expect(bootstrap.body.data.bootstrap.authorityPolicy).not.toBeNull();
    expect(Array.isArray(bootstrap.body.data.bootstrap.missionFlow)).toBe(true);

    const snapshot = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/mission-control/snapshot`)
      .set("authorization", `Bearer ${token}`);

    expect(snapshot.status).toBe(200);
    expect(snapshot.body.ok).toBe(true);
    expect(snapshot.body.data.snapshot.overview.institutions).toBeGreaterThanOrEqual(1);
    expect(snapshot.body.data.snapshot.overview.missions).toBeGreaterThanOrEqual(1);
  });

  it("runs smoke missions and exposes smoke history", async () => {
    const userId = "mission-control-smoke";
    const token = await makeToken(userId);
    const workspace = await seedWorkspace(userId);

    const firstRun = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/developer/smoke/run`)
      .set("authorization", `Bearer ${token}`)
      .send({
        missionTitle: "Mission Control Smoke",
        reuseExisting: false,
      });

    expect(firstRun.status).toBe(201);
    expect(firstRun.body.ok).toBe(true);
    expect(firstRun.body.data.smoke).toMatchObject({
      workspaceId: workspace.id,
      missionCreated: true,
    });

    const secondRun = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/developer/smoke/run`)
      .set("authorization", `Bearer ${token}`)
      .send({
        missionTitle: "Mission Control Smoke",
        reuseExisting: false,
      });

    expect(secondRun.status).toBe(201);
    expect(secondRun.body.data.smoke).toMatchObject({
      workspaceId: workspace.id,
    });

    const smokeMissionId = firstRun.body.data.smoke.missionId as string;

    const control = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${smokeMissionId}/control`)
      .set("authorization", `Bearer ${token}`);

    expect(control.status).toBe(200);
    expect(control.body.ok).toBe(true);
    expect(control.body.data.control.mission.id).toBe(smokeMissionId);
    expect(control.body.data.control.execution).not.toBeNull();
    expect(control.body.data.control.verification).not.toBeNull();
    expect(control.body.data.control.certificate).not.toBeNull();
    expect(control.body.data.control.authorityPolicies.length).toBeGreaterThanOrEqual(1);

    const history = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${smokeMissionId}/history?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(history.status).toBe(200);
    expect(history.body.ok).toBe(true);
    expect(history.body.data.missionId).toBe(smokeMissionId);
    expect(Array.isArray(history.body.data.timeline)).toBe(true);
    expect(history.body.data.timeline.length).toBeGreaterThan(0);
    expect(Array.isArray(history.body.data.runtimeEvents)).toBe(true);

    const executionRunId = control.body.data.control.execution.id as string;
    const verificationRunId = control.body.data.control.verification.id as string;
    const certificateId = control.body.data.control.certificate.id as string;

    const executionsPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/executions?missionId=${smokeMissionId}&limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(executionsPage.status).toBe(200);
    expect(executionsPage.body.data.executions.length).toBeGreaterThanOrEqual(1);

    const executionDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/executions/${executionRunId}`)
      .set("authorization", `Bearer ${token}`);

    expect(executionDetail.status).toBe(200);
    expect(executionDetail.body.data.execution.id).toBe(executionRunId);
    expect(executionDetail.body.data.execution.mission.id).toBe(smokeMissionId);

    const executionHistory = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/executions/${executionRunId}/history?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(executionHistory.status).toBe(200);
    expect(executionHistory.body.ok).toBe(true);
    expect(executionHistory.body.data.executionId).toBe(executionRunId);
    expect(executionHistory.body.data.missionId).toBe(smokeMissionId);
    expect(Array.isArray(executionHistory.body.data.logs)).toBe(true);
    expect(Array.isArray(executionHistory.body.data.runtimeEvents)).toBe(true);

    const verificationsPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/verifications?missionId=${smokeMissionId}&limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(verificationsPage.status).toBe(200);
    expect(verificationsPage.body.data.verifications.length).toBeGreaterThanOrEqual(1);

    const verificationDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/verifications/${verificationRunId}`)
      .set("authorization", `Bearer ${token}`);

    expect(verificationDetail.status).toBe(200);
    expect(verificationDetail.body.data.verification.id).toBe(verificationRunId);

    const verificationHistory = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/verifications/${verificationRunId}/history?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(verificationHistory.status).toBe(200);
    expect(verificationHistory.body.ok).toBe(true);
    expect(verificationHistory.body.data.verificationId).toBe(verificationRunId);
    expect(verificationHistory.body.data.missionId).toBe(smokeMissionId);
    expect(Array.isArray(verificationHistory.body.data.checklist)).toBe(true);
    expect(Array.isArray(verificationHistory.body.data.runtimeEvents)).toBe(true);

    const certificateDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/certificates/${certificateId}`)
      .set("authorization", `Bearer ${token}`);

    expect(certificateDetail.status).toBe(200);
    expect(certificateDetail.body.data.certificate.id).toBe(certificateId);

    const certificateHistory = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/certificates/${certificateId}/history?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(certificateHistory.status).toBe(200);
    expect(certificateHistory.body.ok).toBe(true);
    expect(certificateHistory.body.data.certificateId).toBe(certificateId);
    expect(certificateHistory.body.data.missionId).toBe(smokeMissionId);
    expect(Array.isArray(certificateHistory.body.data.auditTrail)).toBe(true);
    expect(Array.isArray(certificateHistory.body.data.runtimeEvents)).toBe(true);

    const certificateExport = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/certificates/${certificateId}/export`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "mission-certificate-export-test",
      });

    expect(certificateExport.status).toBe(201);
    expect(certificateExport.body.ok).toBe(true);
    expect(certificateExport.body.data.certificateExport.certificate.id).toBe(certificateId);
    expect(certificateExport.body.data.artifact.name).toBe("mission-certificate-export-test");
    expect(certificateExport.body.data.artifact.data.category).toBe("export");

    const memoryRecordsByMission = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/memory-records?missionId=${smokeMissionId}&limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(memoryRecordsByMission.status).toBe(200);
    expect(memoryRecordsByMission.body.data.memoryRecords.length).toBeGreaterThanOrEqual(1);

    const memoryRecordId = memoryRecordsByMission.body.data.memoryRecords[0].id as string;

    const memoryRecordDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/memory-records/${memoryRecordId}`)
      .set("authorization", `Bearer ${token}`);

    expect(memoryRecordDetail.status).toBe(200);
    expect(memoryRecordDetail.body.data.memoryRecord.id).toBe(memoryRecordId);

    const institutionMemoryRecords = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/institutions/${control.body.data.control.mission.institutionId}/memory-records?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(institutionMemoryRecords.status).toBe(200);
    expect(institutionMemoryRecords.body.data.memoryRecords.length).toBeGreaterThanOrEqual(1);

    const connectorHealth = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/integrations/health`)
      .set("authorization", `Bearer ${token}`);

    expect([200, 404]).toContain(connectorHealth.status);
    if (connectorHealth.status === 200) {
      expect(connectorHealth.body.ok).toBe(true);
      expect(Array.isArray(connectorHealth.body.data.freshness)).toBe(true);
    }

    const connectorLogs = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/integrations/logs`)
      .set("authorization", `Bearer ${token}`);

    expect([200, 404]).toContain(connectorLogs.status);
    if (connectorLogs.status === 200) {
      expect(connectorLogs.body.ok).toBe(true);
      expect(Array.isArray(connectorLogs.body.data.logs)).toBe(true);
    }

    const integrationCreate = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/integrations`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "Slack Bridge",
        provider: "slack",
        status: "connected",
        config: { channel: "#epoch" },
      });

    expect(integrationCreate.status).toBe(201);
    expect(integrationCreate.body.ok).toBe(true);
    const integrationId = integrationCreate.body.data.integration.id as string;

    const integrationDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/integrations/${integrationId}`)
      .set("authorization", `Bearer ${token}`);

    expect(integrationDetail.status).toBe(200);
    expect(integrationDetail.body.data.integration.id).toBe(integrationId);

    const disconnected = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/integrations/${integrationId}/disconnect`)
      .set("authorization", `Bearer ${token}`)
      .send({
        reason: "operator_disconnect",
        notes: "pausing the connector during backend MVP work",
      });

    expect(disconnected.status).toBe(200);
    expect(disconnected.body.data.integration.status).toBe("disconnected");

    const refreshed = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/integrations/${integrationId}/refresh`)
      .set("authorization", `Bearer ${token}`)
      .send({
        reason: "operator_refresh",
        notes: "bringing the connector back online",
        config: { channel: "#epoch-ops" },
      });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.integration.status).toBe("connected");
    expect(refreshed.body.data.integration.lastSyncAt).toEqual(expect.any(String));

    const auditTrail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/audit?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(auditTrail.status).toBe(200);
    expect(auditTrail.body.ok).toBe(true);
    expect(Array.isArray(auditTrail.body.data.auditLogs)).toBe(true);
    expect(Array.isArray(auditTrail.body.data.runtimeEvents)).toBe(true);

    const auditExport = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/audit/export`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "mission-control-audit-export-test",
        limit: 10,
      });

    expect(auditExport.status).toBe(201);
    expect(auditExport.body.ok).toBe(true);
    expect(auditExport.body.data.auditExport.workspaceId).toBe(workspace.id);
    expect(auditExport.body.data.auditExport.summary.auditLogs).toBeGreaterThanOrEqual(0);
    expect(auditExport.body.data.artifact.name).toBe("mission-control-audit-export-test");
    expect(auditExport.body.data.artifact.data.category).toBe("audit_trail");

    const auditArtifacts = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/artifacts?category=audit_trail&limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(auditArtifacts.status).toBe(200);
    expect(auditArtifacts.body.ok).toBe(true);
    expect(auditArtifacts.body.data.artifacts.length).toBeGreaterThanOrEqual(1);
    expect(auditArtifacts.body.data.artifacts.every((artifact: { data: { category: string } }) => artifact.data.category === "audit_trail")).toBe(true);

    const auditArtifactId = auditExport.body.data.artifact.id as string;
    const auditArtifactDownload = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/artifacts/${auditArtifactId}/download`)
      .set("authorization", `Bearer ${token}`);

    expect(auditArtifactDownload.status).toBe(200);
    expect(auditArtifactDownload.headers["content-disposition"]).toContain("attachment");
    expect(auditArtifactDownload.body.artifact.id).toBe(auditArtifactId);
    expect(auditArtifactDownload.body.artifact.data.category).toBe("audit_trail");

    const authorityUpdate = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${smokeMissionId}/authority`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "Smoke mission locked down",
        canExecute: false,
        needsApproval: true,
        blocked: true,
        permissions: ["mission.execute"],
        budgets: { maxCents: 0 },
        approvals: ["human"],
        checks: ["authority", "execution", "verification", "certificate"],
      });

    expect(authorityUpdate.status).toBe(201);
    expect(authorityUpdate.body.ok).toBe(true);

    const blockedGate = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${smokeMissionId}/authority`)
      .set("authorization", `Bearer ${token}`);

    expect(blockedGate.status).toBe(200);
    expect(blockedGate.body.data.gate.blocked).toBe(true);

    const policyHistory = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${smokeMissionId}/authority/policies?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(policyHistory.status).toBe(200);
    expect(policyHistory.body.data.policies.length).toBeGreaterThanOrEqual(2);

    const policyId = policyHistory.body.data.policies[0].id as string;
    const policyDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${smokeMissionId}/authority/policies/${policyId}`)
      .set("authorization", `Bearer ${token}`);

    expect(policyDetail.status).toBe(200);
    expect(policyDetail.body.data.policy.id).toBe(policyId);
    expect(policyDetail.body.data.policy.mission.id).toBe(smokeMissionId);

    const historyPage1 = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/smoke/history?limit=1`)
      .set("authorization", `Bearer ${token}`);

    expect(historyPage1.status).toBe(200);
    expect(historyPage1.body.ok).toBe(true);
    expect(historyPage1.body.data.smokeRuns).toHaveLength(1);
    expect(historyPage1.body.data.page.total).toBe(2);
    expect(historyPage1.body.data.page.hasMore).toBe(true);
    expect(historyPage1.body.data.page.nextCursor).toEqual(expect.any(String));

    const historyPage2 = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/smoke/history?limit=1&cursor=${encodeURIComponent(historyPage1.body.data.page.nextCursor)}`)
      .set("authorization", `Bearer ${token}`);

    expect(historyPage2.status).toBe(200);
    expect(historyPage2.body.data.smokeRuns).toHaveLength(1);
    expect(historyPage2.body.data.page.total).toBe(2);
    expect(historyPage2.body.data.page.hasMore).toBe(false);
  }, 15000);

  it("paginates queue jobs and webhook deliveries", async () => {
    const userId = "mission-control-ops";
    const token = await makeToken(userId);
    const workspace = await seedWorkspace(userId);

    const smoke = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/developer/smoke/run`)
      .set("authorization", `Bearer ${token}`)
      .send({
        missionTitle: "Mission Control Collections",
        reuseExisting: false,
      });

    expect(smoke.status).toBe(201);

    await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/enqueue`)
      .set("authorization", `Bearer ${token}`)
      .send({ type: "plan" });

    await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/enqueue`)
      .set("authorization", `Bearer ${token}`)
      .send({ type: "execute" });

    const queuePage1 = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue?limit=1`)
      .set("authorization", `Bearer ${token}`);

    expect(queuePage1.status).toBe(200);
    expect(queuePage1.body.ok).toBe(true);
    expect(queuePage1.body.data.jobs).toHaveLength(1);
    expect(queuePage1.body.data.page.total).toBe(2);
    expect(queuePage1.body.data.page.hasMore).toBe(true);
    expect(queuePage1.body.data.page.nextCursor).toEqual(expect.any(String));

    const queueJobId = queuePage1.body.data.jobs[0].id as string;

    const queueJobDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/${queueJobId}`)
      .set("authorization", `Bearer ${token}`);

    expect(queueJobDetail.status).toBe(200);
    expect(queueJobDetail.body.data.job.id).toBe(queueJobId);

    const deadLetterJob = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/${queueJobId}/dead-letter`)
      .set("authorization", `Bearer ${token}`)
      .send({ error: "manual_dead_letter_for_mvp" });

    expect(deadLetterJob.status).toBe(200);
    expect(deadLetterJob.body.data.job.status).toBe("dead_lettered");

    const deadLetterDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/dead-letter/${queueJobId}`)
      .set("authorization", `Bearer ${token}`);

    expect(deadLetterDetail.status).toBe(200);
    expect(deadLetterDetail.body.data.job.status).toBe("dead_lettered");

    const requeueDeadLetter = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/dead-letter/${queueJobId}/requeue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        reason: "operator_requeue",
        notes: "retrying dead-lettered job",
        delayMs: 0,
      });

    expect(requeueDeadLetter.status).toBe(200);
    expect(requeueDeadLetter.body.data.job.status).toBe("queued");

    const queuePage2 = await request(app)
      .get(
        `/api/epoch/workspaces/${workspace.id}/queue?limit=1&cursor=${encodeURIComponent(queuePage1.body.data.page.nextCursor)}`,
      )
      .set("authorization", `Bearer ${token}`);

    expect(queuePage2.status).toBe(200);
    expect(queuePage2.body.data.jobs).toHaveLength(1);
    expect(queuePage2.body.data.page.total).toBe(2);
    expect(queuePage2.body.data.page.hasMore).toBe(false);

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        workspaceId: workspace.id,
        url: "https://example.com/mission-control-webhook",
        events: ["epoch.mission.*"],
        status: "active",
        proof: {},
      },
    });

    await prisma.webhookDelivery.create({
      data: {
        workspaceId: workspace.id,
        endpointId: endpoint.id,
        eventType: "epoch.mission.completed",
        eventId: "epoch:test:1",
        status: "pending",
        attemptCount: 0,
        maxAttempts: 8,
        requestBody: {
          version: "epoch_webhook.v1",
          deliveryId: "whd_test_1",
          eventId: "epoch:test:1",
        },
        requestHeaders: {
          "Content-Type": "application/json",
        },
        createdAt: new Date("2026-07-21T10:00:00.000Z"),
        nextRetryAt: new Date("2026-07-21T10:00:00.000Z"),
      },
    });

    await prisma.webhookDelivery.create({
      data: {
        workspaceId: workspace.id,
        endpointId: endpoint.id,
        eventType: "epoch.mission.failed",
        eventId: "epoch:test:2",
        status: "delivered",
        attemptCount: 1,
        maxAttempts: 8,
        requestBody: {
          version: "epoch_webhook.v1",
          deliveryId: "whd_test_2",
          eventId: "epoch:test:2",
        },
        requestHeaders: {
          "Content-Type": "application/json",
        },
        responseStatus: 200,
        deliveredAt: new Date("2026-07-21T10:05:00.000Z"),
        createdAt: new Date("2026-07-21T10:05:00.000Z"),
      },
    });

    const deliveriesPage1 = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/${endpoint.id}/deliveries?limit=1`)
      .set("authorization", `Bearer ${token}`);

    expect(deliveriesPage1.status).toBe(200);
    expect(deliveriesPage1.body.ok).toBe(true);
    expect(deliveriesPage1.body.data.deliveries).toHaveLength(1);
    expect(deliveriesPage1.body.data.page.total).toBe(2);
    expect(deliveriesPage1.body.data.page.hasMore).toBe(true);
    expect(deliveriesPage1.body.data.page.nextCursor).toEqual(expect.any(String));

    const webhookDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/${endpoint.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(webhookDetail.status).toBe(200);
    expect(webhookDetail.body.data.webhook.id).toBe(endpoint.id);

    const deliveryId = deliveriesPage1.body.data.deliveries[0].id as string;
    const deliveryDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/${endpoint.id}/deliveries/${deliveryId}`)
      .set("authorization", `Bearer ${token}`);

    expect(deliveryDetail.status).toBe(200);
    expect(deliveryDetail.body.data.delivery.id).toBe(deliveryId);
    expect(deliveryDetail.body.data.webhookId).toBe(endpoint.id);

    const eventsPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/events?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(eventsPage.status).toBe(200);
    expect(eventsPage.body.ok).toBe(true);
    expect(eventsPage.body.data.events).toHaveLength(2);
    expect(eventsPage.body.data.page.total).toBe(2);

    const deliveriesWorkspacePage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/deliveries?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(deliveriesWorkspacePage.status).toBe(200);
    expect(deliveriesWorkspacePage.body.ok).toBe(true);
    expect(deliveriesWorkspacePage.body.data.deliveries).toHaveLength(2);
    expect(deliveriesWorkspacePage.body.data.page.total).toBe(2);

    const retryQueuePage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/retry-queue?limit=10`)
      .set("authorization", `Bearer ${token}`);

    expect(retryQueuePage.status).toBe(200);
    expect(retryQueuePage.body.ok).toBe(true);
    expect(retryQueuePage.body.data.retryQueue).toHaveLength(1);
    expect(retryQueuePage.body.data.page.total).toBe(1);

    const originalFetch = global.fetch;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    let testDelivery: { status: number; body: { ok?: boolean; data?: { delivery?: { eventType?: string } } } } | null = null;
    try {
      global.fetch = fetchMock as typeof fetch;
      testDelivery = await request(app)
        .post(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/${endpoint.id}/test`)
        .set("authorization", `Bearer ${token}`)
        .send({
          label: "Webhook smoke test",
          eventType: "webhook.test",
          payload: { source: "contract-test" },
        });
    } finally {
      global.fetch = originalFetch;
    }

    expect(testDelivery).not.toBeNull();
    expect(testDelivery!.status).toBe(201);
    expect(testDelivery!.body.ok).toBe(true);
    expect(testDelivery!.body.data!.delivery!.eventType).toBe("webhook.test");
    expect(fetchMock).toHaveBeenCalled();

    const endpointRetry = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/developer/webhooks/${endpoint.id}/retry`)
      .set("authorization", `Bearer ${token}`)
      .send({ deliveryId });

    expect(endpointRetry.status).toBe(200);
    expect(endpointRetry.body.ok).toBe(true);
    expect(endpointRetry.body.data.delivery.id).toBe(deliveryId);

    const snapshot = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/mission-control/snapshot`)
      .set("authorization", `Bearer ${token}`);

    expect(snapshot.status).toBe(200);
    expect(snapshot.body.ok).toBe(true);
    expect(snapshot.body.data.snapshot.workspaceId).toBe(workspace.id);
    expect(snapshot.body.data.snapshot.overview.missions).toBeGreaterThanOrEqual(0);

    const exportRes = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/mission-control/export`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "mission-control-export-test" });

    expect(exportRes.status).toBe(201);
    expect(exportRes.body.ok).toBe(true);
    expect(exportRes.body.data.artifact).toMatchObject({
      name: "mission-control-export-test",
      status: expect.any(String),
    });
    expect(exportRes.body.data.snapshot.workspaceId).toBe(workspace.id);

    const artifactId = exportRes.body.data.artifact.id as string;
    const artifactDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/artifacts/${artifactId}`)
      .set("authorization", `Bearer ${token}`);

    expect(artifactDetail.status).toBe(200);
    expect(artifactDetail.body.data.artifact.id).toBe(artifactId);

    const restoredWorkspace = await seedWorkspace(userId);
    const restoreRes = await request(app)
      .post(`/api/epoch/workspaces/${restoredWorkspace.id}/mission-control/restore`)
      .set("authorization", `Bearer ${token}`)
      .send({
        artifactId: exportRes.body.data.artifact.id,
      });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.ok).toBe(true);
    expect(restoreRes.body.data.restored.templates).toBeGreaterThanOrEqual(0);
    expect(restoreRes.body.data.restored.institutions).toBeGreaterThanOrEqual(1);
    expect(restoreRes.body.data.restored.missions).toBeGreaterThanOrEqual(1);

    const restoredSnapshot = await request(app)
      .get(`/api/epoch/workspaces/${restoredWorkspace.id}/mission-control/snapshot`)
      .set("authorization", `Bearer ${token}`);
    expect(restoredSnapshot.status).toBe(200);
    expect(restoredSnapshot.body.data.snapshot.workspaceId).toBe(restoredWorkspace.id);
    expect(restoredSnapshot.body.data.snapshot.overview.institutions).toBeGreaterThanOrEqual(1);

    const institutionsPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/institutions?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(institutionsPage.status).toBe(200);
    expect(institutionsPage.body.data.institutions).toHaveLength(1);
    expect(institutionsPage.body.data.page.total).toBeGreaterThanOrEqual(1);

    const institutionId = institutionsPage.body.data.institutions[0].id as string;
    const versionPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/institutions/${institutionId}/versions?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(versionPage.status).toBe(200);
    expect(versionPage.body.data.versions).toHaveLength(1);
    expect(versionPage.body.data.page.total).toBeGreaterThanOrEqual(1);

    const templateId = institutionsPage.body.data.institutions[0].templateId as string | undefined;
    if (templateId) {
      const templateDetail = await request(app)
        .get(`/api/epoch/workspaces/${workspace.id}/templates/${templateId}`)
        .set("authorization", `Bearer ${token}`);
      expect(templateDetail.status).toBe(200);
      expect(templateDetail.body.data.template.id).toBe(templateId);
    }

    const institutionHistory = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/institutions/${institutionId}/history?limit=10`)
      .set("authorization", `Bearer ${token}`);
    expect(institutionHistory.status).toBe(200);
    expect(institutionHistory.body.ok).toBe(true);
    expect(institutionHistory.body.data.institutionId).toBe(institutionId);
    expect(Array.isArray(institutionHistory.body.data.versions)).toBe(true);
    expect(Array.isArray(institutionHistory.body.data.missions)).toBe(true);
    expect(Array.isArray(institutionHistory.body.data.runtimeEvents)).toBe(true);

    const missionsPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(missionsPage.status).toBe(200);
    expect(missionsPage.body.data.missions).toHaveLength(1);
    expect(missionsPage.body.data.page.total).toBeGreaterThanOrEqual(1);

    const evidencePage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/evidence?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(evidencePage.status).toBe(200);
    expect(evidencePage.body.data.evidence.length).toBeGreaterThanOrEqual(1);

    const certificatePage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/certificates?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(certificatePage.status).toBe(200);
    expect(certificatePage.body.data.certificates.length).toBeGreaterThanOrEqual(1);

    const memoryRecordsPage = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/memory-records?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(memoryRecordsPage.status).toBe(200);
    expect(memoryRecordsPage.body.data.memoryRecords.length).toBeGreaterThanOrEqual(1);
  }, 15000);

  it("handles mission approval and lifecycle actions", async () => {
    const userId = "mission-control-actions";
    const token = await makeToken(userId);
    const workspace = await seedWorkspace(userId);

    const bootstrap = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/mission-control/bootstrap`)
      .set("authorization", `Bearer ${token}`)
      .send({
        useCase: "sales_research",
        reuseExisting: true,
      });

    expect(bootstrap.status).toBe(201);
    expect(bootstrap.body.ok).toBe(true);
    const institutionId = bootstrap.body.data.bootstrap.institution.id as string;

    const mission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId,
        title: "Approval Mission",
        objective: "Needs human approval before execution",
        authority: {
          canExecute: false,
          needsApproval: true,
          blocked: false,
          permissions: ["mission.execute"],
          budgets: { maxCents: 1000 },
          approvals: ["human"],
          checks: ["authority", "review"],
        },
      });

    expect(mission.status).toBe(201);
    const missionId = mission.body.data.mission.id as string;

    const gatedRun = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${missionId}/run`)
      .set("authorization", `Bearer ${token}`)
      .send({
        notes: "waiting on approval",
      });

    expect(gatedRun.status).toBe(409);
    expect(gatedRun.body.error?.details?.approvalRequired ?? true).toBe(true);

    const approved = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${missionId}/approval`)
      .set("authorization", `Bearer ${token}`)
      .send({
        decision: "approved",
        confidence: 88,
        checklist: ["human approval", "authority check"],
        approvals: ["human"],
        notes: "approved by operator",
      });

    expect(approved.status).toBe(201);
    expect(approved.body.ok).toBe(true);

    const approvedControl = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${missionId}/control`)
      .set("authorization", `Bearer ${token}`);

    expect(approvedControl.status).toBe(200);
    expect(approvedControl.body.data.control.mission.state).toBe("completed");
    expect(approvedControl.body.data.control.verification).not.toBeNull();
    expect(approvedControl.body.data.control.certificate).not.toBeNull();

    const cancelMission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId,
        title: "Cancelable Mission",
        objective: "Can be cancelled and retried",
      });

    expect(cancelMission.status).toBe(201);
    const cancelMissionId = cancelMission.body.data.mission.id as string;

    const cancelled = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${cancelMissionId}/cancel`)
      .set("authorization", `Bearer ${token}`)
      .send({
        reason: "operator_cancelled",
        notes: "cancelled during backend MVP build",
      });

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.mission.state).toBe("failed");

    const retried = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${cancelMissionId}/retry`)
      .set("authorization", `Bearer ${token}`)
      .send({
        reason: "operator_replayed",
        notes: "retry after cancellation",
      });

    expect(retried.status).toBe(201);
    expect(retried.body.data.mission.state).toBe("draft");
    expect(retried.body.data.job.type).toBe("plan");

    const retryQueueJob = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/${retried.body.data.job.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(retryQueueJob.status).toBe(200);
    expect(retryQueueJob.body.data.job.type).toBe("plan");
  }, 15000);
});
