CREATE TABLE IF NOT EXISTS "epoch_ai_provider_health_checks" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "configured" BOOLEAN NOT NULL,
  "reachable" BOOLEAN NOT NULL,
  "latency_ms" INTEGER,
  "http_status" INTEGER,
  "error_code" TEXT,
  "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_ai_provider_health_checks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "epoch_ai_provider_health_checks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_epoch_ai_health_workspace_provider_checked" ON "epoch_ai_provider_health_checks"("workspace_id", "provider", "checked_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_ai_health_workspace_checked" ON "epoch_ai_provider_health_checks"("workspace_id", "checked_at");
