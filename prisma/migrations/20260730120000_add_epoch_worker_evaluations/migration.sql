CREATE TABLE IF NOT EXISTS "epoch_worker_evaluations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "worker_id" TEXT NOT NULL,
  "mission_id" TEXT,
  "outcome" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "latency_ms" INTEGER,
  "evidence" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_worker_evaluations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_worker_evaluations_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "epoch_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_epoch_worker_evaluations_worker_created" ON "epoch_worker_evaluations" ("workspace_id", "worker_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_worker_evaluations_mission" ON "epoch_worker_evaluations" ("workspace_id", "mission_id");
