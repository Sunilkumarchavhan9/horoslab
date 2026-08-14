CREATE TABLE IF NOT EXISTS "epoch_queue_jobs" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT,
  "mission_id" TEXT,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'queued',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leased_at" TIMESTAMP(3),
  "lease_owner" TEXT,
  "error" TEXT,
  "last_error" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "next_retry_at" TIMESTAMP(3),
  "last_failed_at" TIMESTAMP(3),
  "dead_lettered_at" TIMESTAMP(3),
  "dead_letter_reason" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_queue_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "epoch_queue_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_epoch_queue_jobs_workspace_status_created"
  ON "epoch_queue_jobs"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_queue_jobs_mission_type_status"
  ON "epoch_queue_jobs"("workspace_id", "mission_id", "type", "status");
