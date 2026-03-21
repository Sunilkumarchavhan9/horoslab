import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  getExplain,
  getRevisions,
  getTimeline,
  processMemory,
  retrieveMemory,
} from "../controllers/memory.controller";

export const memoryRouter = Router();

memoryRouter.post("/process", asyncHandler(processMemory));
memoryRouter.post("/retrieve", asyncHandler(retrieveMemory));
memoryRouter.get("/revisions", getRevisions);
memoryRouter.get("/timeline", getTimeline);
memoryRouter.get("/explain", asyncHandler(getExplain));

memoryRouter.all("/*splat", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
