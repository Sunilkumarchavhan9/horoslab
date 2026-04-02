import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  archiveMemoryById,
  continueWithMemory,
  getMemoryByIdApi,
  getExplain,
  listMemoryApi,
  getRevisions,
  getTimeline,
  patchRetrievalWeights,
  patchMemoryStatusById,
  processMemory,
  resumeWithMemory,
  retrieveMemory,
  unarchiveMemoryById,
} from "../controllers/memory.controller";

export const memoryRouter = Router();

memoryRouter.post("/process", asyncHandler(processMemory));
memoryRouter.post("/retrieve", asyncHandler(retrieveMemory));
memoryRouter.post("/continue", asyncHandler(continueWithMemory));
memoryRouter.post("/resume", asyncHandler(resumeWithMemory));
memoryRouter.patch("/config/retrieval-weights", patchRetrievalWeights);
memoryRouter.patch("/:memoryId/archive", asyncHandler(archiveMemoryById));
memoryRouter.patch("/:memoryId/unarchive", asyncHandler(unarchiveMemoryById));
memoryRouter.patch("/:memoryId/status", asyncHandler(patchMemoryStatusById));
memoryRouter.get("/revisions", getRevisions);
memoryRouter.get("/timeline", getTimeline);
memoryRouter.get("/explain", asyncHandler(getExplain));
memoryRouter.get("/list", asyncHandler(listMemoryApi));
memoryRouter.get("/:memoryId", asyncHandler(getMemoryByIdApi));

memoryRouter.all("/*splat", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
