import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const workspaceId = "test-workspace-1";

    // 1. Memory
    await prisma.memory.create({
        data: {
            workspaceId,
            type: "Policy Decision",
            title: "Policy decision seed",
            summary: "Policy memory content",
            content: "Policy memory content",
            proof: { source: "seed-settlement" },
            confidenceScore: 90,
        }
    });

    // 2. EpochMemoryRecord
    await prisma.epochMemoryRecord.create({
        data: {
            workspaceId,
            institutionId: "test-institution-1",
            userId: "test-user-1",
            history: [{ event: "seeded" }],
            lessons: ["Keep settlement records linked to verified outcomes."],
            mistakes: [],
            proof: { source: "seed-settlement" },
        }
    });

    // 3. EpochSettlement
    await prisma.epochSettlement.create({
        data: {
            workspaceId,
            missionId: "test-mission-1",
            decision: "approved",
            status: "finalized",
            reason: "Seeded settlement for local verification.",
            evidenceHash: "seed-evidence-hash",
            learningEligible: true,
            learningPayload: { target: "Agent Context" }
        }
    });

    // 4. EpochCertificate
    await prisma.epochCertificate.create({
        data: {
            workspaceId,
            missionId: "test-mission-1",
            userId: "test-user-1",
            status: "active",
            summary: "Seeded verification certificate.",
            evidenceSummary: { source: "seed-settlement" },
            approvals: ["admin"],
            proof: { version: "v1.0" },
            issuedAt: new Date()
        }
    });

    console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
