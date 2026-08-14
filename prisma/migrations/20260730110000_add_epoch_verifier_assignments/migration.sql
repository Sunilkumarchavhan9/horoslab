CREATE TABLE IF NOT EXISTS "epoch_verifier_assignments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "execution_run_id" TEXT,
  "verifier_id" TEXT NOT NULL,
  "verifier_kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "evidence_ids" JSONB NOT NULL DEFAULT '[]',
  "checklist" JSONB NOT NULL DEFAULT '[]',
  "decision" TEXT,
  "confidence" INTEGER,
  "result" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_verifier_assignments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_verifier_assignments_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_verifier_assignments_execution_run_id_fkey" FOREIGN KEY ("execution_run_id") REFERENCES "epoch_execution_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_epoch_verifier_assignments_workspace_status_created" ON "epoch_verifier_assignments"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_verifier_assignments_mission_verifier" ON "epoch_verifier_assignments"("mission_id", "verifier_id");
