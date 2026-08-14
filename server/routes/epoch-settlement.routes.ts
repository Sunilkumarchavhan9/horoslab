import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiSuccess } from "./api-response";
import { prisma } from "../../lib/storage/prismaClient";

export const epochSettlementRouter = Router();

epochSettlementRouter.get("/memories", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();

  const memories = await prisma.memory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  sendApiSuccess(res, 200, memories, buildApiMeta(req, startedAt));
}));

epochSettlementRouter.get("/outcomes", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();

  const outcomes = await prisma.epochMemoryRecord.findMany({
    include: {
      mission: true,
      institution: true
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  sendApiSuccess(res, 200, outcomes, buildApiMeta(req, startedAt));
}));

epochSettlementRouter.get("/learnings", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();

  const learnings = await prisma.epochSettlement.findMany({
    where: { 
      learningEligible: true
    },
    include: {
      mission: true
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  sendApiSuccess(res, 200, learnings, buildApiMeta(req, startedAt));
}));

epochSettlementRouter.get("/settlements", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();

  const settlements = await prisma.epochSettlement.findMany({
    include: {
      mission: true
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  sendApiSuccess(res, 200, settlements, buildApiMeta(req, startedAt));
}));

epochSettlementRouter.get("/certificates", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();

  const certificates = await prisma.epochCertificate.findMany({
    include: {
      mission: true
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  sendApiSuccess(res, 200, certificates, buildApiMeta(req, startedAt));
}));

