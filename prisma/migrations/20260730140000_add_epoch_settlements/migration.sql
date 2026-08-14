CREATE TABLE IF NOT EXISTS "epoch_settlements" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence_hash" TEXT NOT NULL,
  "learning_eligible" BOOLEAN NOT NULL DEFAULT false,
  "learning_payload" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_settlements_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_settlements_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_epoch_settlements_workspace_mission" ON "epoch_settlements" ("workspace_id", "mission_id");
CREATE INDEX IF NOT EXISTS "idx_epoch_settlements_workspace_status" ON "epoch_settlements" ("workspace_id", "status", "created_at");
