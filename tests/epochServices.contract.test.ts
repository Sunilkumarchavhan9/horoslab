import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { runEpochWorkerTick } from "../lib/epoch/epochWorker";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetPrismaRuntimeDataStores } from "./helpers/resetDataDir";

describe("Epoch service catalog", () => {
  const app = createMemoryOsApp();

  beforeEach(async () => {
    await resetPrismaRuntimeDataStores();
    await prisma.webhookDelivery.deleteMany();
    await prisma.webhookEndpoint.deleteMany();
    await prisma.mCPConnection.deleteMany();
    await prisma.agentAccessKey.deleteMany();
    await prisma.epochMemoryRecord.deleteMany();
    await prisma.epochCertificate.deleteMany();
    await prisma.epochVerificationRun.deleteMany();
    await prisma.epochEvidence.deleteMany();
    await prisma.epochExecutionRun.deleteMany();
    await prisma.epochAuthorityPolicy.deleteMany();
    await prisma.epochMission.deleteMany();
    await prisma.epochInstitutionVersion.deleteMany();
    await prisma.epochInstitution.deleteMany();
    await prisma.epochInstitutionTemplate.deleteMany();
    await prisma.workspace.deleteMany();
  });

  it("returns the ten service surfaces for a workspace", async () => {
    const userId = "epoch-services-test";
    const token = await makeToken(userId);
    const workspace = await prisma.workspace.create({
      data: {
        userId,
        ownerId: userId,
        name: "Epoch Service Catalog Workspace",
        plan: "Free",
        region: "us",
      },
    });

    const institution = await prisma.epochInstitution.create({
      data: {
        workspaceId: workspace.id,
        userId,
        name: "Catalog Institution",
        summary: "Seed institution for service catalog testing.",
      },
    });

    await prisma.epochMission.create({
      data: {
        workspaceId: workspace.id,
        institutionId: institution.id,
        userId,
        title: "Catalog mission",
        objective: "Seed mission for service catalog testing.",
      },
    });

    const response = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/services`)
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.catalog).toEqual(expect.objectContaining({
      version: "epoch_service_catalog.v1",
      workspaceId: workspace.id,
      services: expect.any(Array),
      remaining: expect.any(Array),
    }));
    expect(response.body.data.catalog.services.map((service: { id: string }) => service.id)).toEqual([
      "institution-service",
      "mission-service",
      "authority-service",
      "execution-service",
      "verification-service",
      "evidence-service",
      "certificate-service",
      "memory-service",
      "integration-service",
      "developer-service",
    ]);
    expect(response.body.data.catalog.services).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "institution-service",
        metrics: expect.objectContaining({ institutions: expect.any(Number) }),
      }),
      expect.objectContaining({
        id: "mission-service",
        metrics: expect.objectContaining({ missions: expect.any(Number) }),
      }),
    ]));

    const createInstitution = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/institutions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "Route Institution",
        summary: "Created through the new runtime router.",
      });

    expect(createInstitution.status).toBe(201);
    const createdInstitutionId = createInstitution.body.data.institution.id as string;

    const institutionDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/institutions/${createdInstitutionId}`)
      .set("authorization", `Bearer ${token}`);

    expect(institutionDetail.status).toBe(200);
    expect(institutionDetail.body.data.institution).toEqual(expect.objectContaining({
      id: createdInstitutionId,
      name: "Route Institution",
    }));

    const createMission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: createdInstitutionId,
        title: "Route Mission",
        objective: "Validate the new epoch runtime router.",
        authority: {
          canExecute: true,
          needsApproval: false,
          blocked: false,
        },
      });

    expect(createMission.status).toBe(201);
    const createdMissionId = createMission.body.data.mission.id as string;

    const missionAuthority = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${createdMissionId}/authority`)
      .set("authorization", `Bearer ${token}`);

    expect(missionAuthority.status).toBe(200);
    expect(missionAuthority.body.data.gate).toEqual(expect.objectContaining({
      mission: expect.objectContaining({ id: createdMissionId }),
      explanation: expect.objectContaining({
        summary: expect.any(String),
        recommendation: expect.any(String),
      }),
    }));

    const runMission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${createdMissionId}/run`)
      .set("authorization", `Bearer ${token}`)
      .send({
        humanApproval: "approved",
        confidence: 100,
        approvals: ["test"],
      });

    expect(runMission.status).toBe(201);
    expect(runMission.body.data.result).toEqual(expect.objectContaining({
      mission: expect.objectContaining({ id: createdMissionId }),
      execution: expect.objectContaining({ id: expect.any(String) }),
      verification: expect.objectContaining({ id: expect.any(String) }),
      certificate: expect.objectContaining({ id: expect.any(String) }),
      memoryRecord: expect.objectContaining({ id: expect.any(String) }),
    }));

    const executionId = runMission.body.data.result.execution.id as string;
    const certificateId = runMission.body.data.result.certificate.id as string;
    const memoryRecordId = runMission.body.data.result.memoryRecord.id as string;

    const queuedJob = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${createdMissionId}/queue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        type: "execute",
        payload: {
          approvals: ["test"],
        },
      });

    expect(queuedJob.status).toBe(201);
    expect(queuedJob.body.data.job).toEqual(expect.objectContaining({
      id: expect.any(String),
      missionId: createdMissionId,
      type: "execute",
    }));

    const missionQueueStatus = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/status`)
      .set("authorization", `Bearer ${token}`);

    expect(missionQueueStatus.status).toBe(200);
    expect(missionQueueStatus.body.data.status).toEqual(expect.objectContaining({
      queued: expect.any(Number),
      leased: expect.any(Number),
      done: expect.any(Number),
      failed: expect.any(Number),
      deadLettered: expect.any(Number),
    }));

    const executionDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/executions/${executionId}`)
      .set("authorization", `Bearer ${token}`);

    expect(executionDetail.status).toBe(200);
    expect(executionDetail.body.data.execution).toEqual(expect.objectContaining({
      id: executionId,
      missionId: createdMissionId,
    }));

    const certificateDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/certificates/${certificateId}`)
      .set("authorization", `Bearer ${token}`);

    expect(certificateDetail.status).toBe(200);
    expect(certificateDetail.body.data.certificate).toEqual(expect.objectContaining({
      id: certificateId,
      missionId: createdMissionId,
    }));

    const memoryDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/memory/${memoryRecordId}`)
      .set("authorization", `Bearer ${token}`);

    expect(memoryDetail.status).toBe(200);
    expect(memoryDetail.body.data.memory).toEqual(expect.objectContaining({
      id: memoryRecordId,
      missionId: createdMissionId,
    }));

    const integrationCreate = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/integrations`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "GitHub connection",
        provider: "github",
        status: "connected",
      });

    expect(integrationCreate.status).toBe(201);
    const integrationId = integrationCreate.body.data.integration.id as string;

    const integrationDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/integrations/${integrationId}`)
      .set("authorization", `Bearer ${token}`);

    expect(integrationDetail.status).toBe(200);
    expect(integrationDetail.body.data.integration).toEqual(expect.objectContaining({
      id: integrationId,
      provider: "github",
    }));
    expect(integrationDetail.body.data.profile).toEqual(expect.objectContaining({
      provider: "github",
      name: "GitHub",
    }));
    expect(integrationDetail.body.data.missionGuide).toEqual(expect.objectContaining({
      provider: "github",
      missionPatterns: expect.arrayContaining([expect.any(String)]),
      authorityNeeds: expect.arrayContaining([expect.any(String)]),
      evidenceKinds: expect.arrayContaining([expect.any(String)]),
    }));

    const providerSummary = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/integrations/providers`)
      .set("authorization", `Bearer ${token}`);

    expect(providerSummary.status).toBe(200);
    expect(providerSummary.body.data.supportedConnectors).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "github" }),
      expect.objectContaining({ provider: "slack" }),
      expect.objectContaining({ provider: "openai" }),
    ]));
    expect(providerSummary.body.data.providerSummary).toEqual(expect.objectContaining({
      github: expect.objectContaining({
        profile: expect.objectContaining({ provider: "github" }),
        missionGuide: expect.objectContaining({ provider: "github" }),
      }),
    }));
    expect(providerSummary.body.data.connectorGuides).toEqual(expect.objectContaining({
      github: expect.objectContaining({
        provider: "github",
      }),
      slack: expect.objectContaining({
        provider: "slack",
      }),
    }));

    const workerInstitution = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/institutions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "Worker Institution",
        summary: "Created to validate the queue-driven worker pipeline.",
      });

    expect(workerInstitution.status).toBe(201);
    const workerInstitutionId = workerInstitution.body.data.institution.id as string;

    const workerMission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: workerInstitutionId,
        title: "Worker Mission",
        objective: "Validate the queue-driven Epoch worker pipeline.",
        authority: {
          canExecute: true,
          needsApproval: false,
          blocked: false,
        },
      });

    expect(workerMission.status).toBe(201);
    const workerMissionId = workerMission.body.data.mission.id as string;

    const approvalMission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: workerInstitutionId,
        title: "Approval Mission",
        objective: "Validate approval-gated execute jobs stay queued until approved.",
        authority: {
          canExecute: true,
          needsApproval: true,
          blocked: false,
        },
      });

    expect(approvalMission.status).toBe(201);
    const approvalMissionId = approvalMission.body.data.mission.id as string;

    const approvalQueued = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${approvalMissionId}/queue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        type: "execute",
      });

    expect(approvalQueued.status).toBe(201);

    const queuedPlan = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${workerMissionId}/queue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        type: "plan",
      });

    expect(queuedPlan.status).toBe(201);

    const workerTick = await runEpochWorkerTick();
    expect(workerTick.processed).toBeGreaterThan(0);

    const approvalJobDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/jobs/${approvalQueued.body.data.job.id}`)
      .set("authorization", `Bearer ${token}`);

    expect(approvalJobDetail.status).toBe(200);
    expect(approvalJobDetail.body.data.job).toEqual(expect.objectContaining({
      id: approvalQueued.body.data.job.id,
      status: "queued",
      error: "human_approval_required",
    }));

    const workerMissionDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${workerMissionId}`)
      .set("authorization", `Bearer ${token}`);

    expect(workerMissionDetail.status).toBe(200);
    expect(workerMissionDetail.body.data.mission).toEqual(expect.objectContaining({
      id: workerMissionId,
      state: "completed",
      currentStep: "closed",
    }));
    expect(workerMissionDetail.body.data.mission.executionRun).toEqual(expect.objectContaining({
      missionId: workerMissionId,
    }));
    expect(workerMissionDetail.body.data.mission.verificationRun).toEqual(expect.objectContaining({
      missionId: workerMissionId,
      finalDecision: "PASS",
    }));
    expect(workerMissionDetail.body.data.mission.certificate).toEqual(expect.objectContaining({
      missionId: workerMissionId,
    }));
    expect(workerMissionDetail.body.data.mission.memoryRecord).toEqual(expect.objectContaining({
      missionId: workerMissionId,
    }));

    const workerLifecycle = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/missions/${workerMissionId}/lifecycle`)
      .set("authorization", `Bearer ${token}`);

    expect(workerLifecycle.status).toBe(200);
    expect(workerLifecycle.body.data).toEqual(expect.objectContaining({
      mission: expect.objectContaining({
        id: workerMissionId,
        state: "completed",
      }),
      queue: expect.objectContaining({
        status: expect.objectContaining({
          queued: expect.any(Number),
        }),
        jobs: expect.any(Array),
      }),
      stageHistory: expect.any(Array),
    }));

    expect(workerLifecycle.body.data.gate.explanation).toEqual(expect.objectContaining({
      decision: expect.any(String),
      riskLevel: expect.any(String),
      blockingPolicies: expect.any(Array),
      approvalPolicies: expect.any(Array),
      signals: expect.objectContaining({
        hasPlan: true,
        hasExecutionRun: true,
        hasVerificationRun: true,
        hasCertificate: true,
        hasMemoryRecord: true,
      }),
    }));

    const observabilityMission = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions`)
      .set("authorization", `Bearer ${token}`)
      .send({
        institutionId: workerInstitutionId,
        title: "Observability Mission",
        objective: "Validate queue job observability endpoints.",
        authority: {
          canExecute: true,
          needsApproval: false,
          blocked: false,
        },
      });

    expect(observabilityMission.status).toBe(201);
    const observabilityMissionId = observabilityMission.body.data.mission.id as string;

    const observabilityQueued = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/missions/${observabilityMissionId}/queue`)
      .set("authorization", `Bearer ${token}`)
      .send({
        type: "execute",
      });

    expect(observabilityQueued.status).toBe(201);
    const observabilityJobId = observabilityQueued.body.data.job.id as string;

    const queueJobDetail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/jobs/${observabilityJobId}`)
      .set("authorization", `Bearer ${token}`);

    expect(queueJobDetail.status).toBe(200);
    expect(queueJobDetail.body.data.job).toEqual(expect.objectContaining({
      id: observabilityJobId,
      missionId: observabilityMissionId,
      type: "execute",
    }));

    const queueStatus = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/status`)
      .set("authorization", `Bearer ${token}`);

    expect(queueStatus.status).toBe(200);
    expect(queueStatus.body.data.status).toEqual(expect.objectContaining({
      byType: expect.objectContaining({
        execute: expect.any(Number),
      }),
      byStatus: expect.objectContaining({
        dead_lettered: expect.any(Number),
      }),
      deadLetterReasons: expect.any(Array),
    }));

    const deadLetteredJob = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/jobs/${observabilityJobId}/dead-letter`)
      .set("authorization", `Bearer ${token}`)
      .send({
        error: "manual dead letter for observability",
      });

    expect(deadLetteredJob.status).toBe(200);
    expect(deadLetteredJob.body.data.job).toEqual(expect.objectContaining({
      id: observabilityJobId,
      status: "dead_lettered",
    }));

    const deadLetters = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/queue/dead-letters`)
      .set("authorization", `Bearer ${token}`);

    expect(deadLetters.status).toBe(200);
    expect(deadLetters.body.data.deadLetters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: observabilityJobId,
        deadLetterReason: "manual dead letter for observability",
      }),
    ]));

    const retryJob = await request(app)
      .post(`/api/epoch/workspaces/${workspace.id}/queue/jobs/${observabilityJobId}/retry`)
      .set("authorization", `Bearer ${token}`)
      .send({
        delayMs: 0,
        reason: "retrying observability job",
      });

    expect(retryJob.status).toBe(200);
    expect(retryJob.body.data.job).toEqual(expect.objectContaining({
      id: observabilityJobId,
      status: "queued",
    }));

    const detail = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/services/mission-service`)
      .set("authorization", `Bearer ${token}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data.service).toEqual(expect.objectContaining({
      id: "mission-service",
      name: "Mission Service",
      status: "present",
    }));

    const legacySummary = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/summary`)
      .set("authorization", `Bearer ${token}`);

    expect(legacySummary.status).toBe(200);
    expect(legacySummary.headers["x-epoch-router"]).toBe("legacy");
    expect(legacySummary.headers.deprecation).toBe("true");

    const verificationSummary = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/services/verification-service/summary`)
      .set("authorization", `Bearer ${token}`);

    expect(verificationSummary.status).toBe(200);
    expect(verificationSummary.body.data.summary).toEqual(expect.objectContaining({
      workspaceId: workspace.id,
      counts: expect.objectContaining({
        verifications: expect.any(Number),
      }),
    }));

    const summaries = await request(app)
      .get(`/api/epoch/workspaces/${workspace.id}/service-summaries`)
      .set("authorization", `Bearer ${token}`);

    expect(summaries.status).toBe(200);
    expect(summaries.body.data.services).toEqual(expect.objectContaining({
      institution: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          institutions: expect.any(Number),
        }),
      }),
      mission: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          missions: expect.any(Number),
        }),
      }),
      authority: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          policies: expect.any(Number),
        }),
      }),
      execution: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          executions: expect.any(Number),
        }),
      }),
      verification: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          verifications: expect.any(Number),
        }),
      }),
      evidence: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          evidence: expect.any(Number),
        }),
      }),
      certificate: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          certificates: expect.any(Number),
        }),
      }),
      memory: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          memories: expect.any(Number),
        }),
      }),
      integration: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          integrations: expect.any(Number),
        }),
      }),
      developer: expect.objectContaining({
        workspaceId: workspace.id,
        counts: expect.objectContaining({
          apiKeys: expect.any(Number),
        }),
      }),
    }));
  }, 30000);
});
