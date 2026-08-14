import { Router } from "express";
import { getRuntimeHealth } from "../../lib/companyBrain/platform";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  res.status(200).json({
    status: "ok",
    companyBrain: await getRuntimeHealth(),
  });
});
