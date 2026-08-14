import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  getOverviewAttention,
  getOverviewInheritancePerformance,
  getOverviewMistakeImmunity,
  getOverviewOutcomeLearning,
  getOverviewRecentAgentRuns,
  getOverviewSources,
  getOverviewSummary,
} from "../../lib/overview/overviewStore";
import type { MasterplanScope } from "../../lib/masterplan/productLoopStore";

export const overviewRouter = Router();

function scope(req: Request): MasterplanScope {
  return {
    userId: req.authUserId,
    orgId: req.authOrgId,
  };
}

function rangeQuery(req: Request): string | undefined {
  return typeof req.query.range === "string" ? req.query.range : undefined;
}

overviewRouter.get("/summary", asyncHandler(async (req, res) => {
  res.json(await getOverviewSummary(scope(req)));
}));

overviewRouter.get("/attention", asyncHandler(async (req, res) => {
  res.json(await getOverviewAttention(scope(req)));
}));

overviewRouter.get("/mistake-immunity", asyncHandler(async (req, res) => {
  res.json(await getOverviewMistakeImmunity(scope(req)));
}));

overviewRouter.get("/inheritance-performance", asyncHandler(async (req, res) => {
  res.json(await getOverviewInheritancePerformance(scope(req), rangeQuery(req)));
}));

overviewRouter.get("/outcome-learning", asyncHandler(async (req, res) => {
  res.json(await getOverviewOutcomeLearning(scope(req), rangeQuery(req)));
}));

overviewRouter.get("/sources", asyncHandler(async (req, res) => {
  res.json(await getOverviewSources(scope(req)));
}));

overviewRouter.get("/recent-agent-runs", asyncHandler(async (req, res) => {
  res.json(await getOverviewRecentAgentRuns(scope(req)));
}));
