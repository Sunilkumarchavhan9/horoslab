CREATE TABLE "epoch_architecture_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_stage" TEXT NOT NULL,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "evidence_ids" JSONB NOT NULL DEFAULT '[]',
    "verification_ids" JSONB NOT NULL DEFAULT '[]',
    "outcome_id" TEXT,
    "experience_id" TEXT,
    "correlation_id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_architecture_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_epoch_architecture_runs_workspace_mission"
  ON "epoch_architecture_runs"("workspace_id", "mission_id");
CREATE UNIQUE INDEX "epoch_architecture_runs_mission_id_key"
  ON "epoch_architecture_runs"("mission_id");
CREATE INDEX "idx_epoch_architecture_runs_workspace_status_updated"
  ON "epoch_architecture_runs"("workspace_id", "status", "updated_at");

ALTER TABLE "epoch_architecture_runs"
  ADD CONSTRAINT "epoch_architecture_runs_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_architecture_runs"
  ADD CONSTRAINT "epoch_architecture_runs_mission_id_fkey"
  FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
