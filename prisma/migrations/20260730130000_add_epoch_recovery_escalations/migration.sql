CREATE TABLE IF NOT EXISTS "epoch_recovery_escalations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "execution_run_id" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "resolution" TEXT,
  "resolved_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "epoch_recovery_escalations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_recovery_escalations_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_epoch_recovery_escalations_workspace_status" ON "epoch_recovery_escalations" ("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_recovery_escalations_mission_created" ON "epoch_recovery_escalations" ("workspace_id", "mission_id", "created_at");
