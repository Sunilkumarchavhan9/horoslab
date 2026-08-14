CREATE TABLE IF NOT EXISTS "epoch_ai_execution_caches" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "cache_key" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "privacy" TEXT NOT NULL DEFAULT 'tenant',
  "response" TEXT NOT NULL,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "provenance" JSONB NOT NULL DEFAULT '{}',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "hit_count" INTEGER NOT NULL DEFAULT 0,
  "last_hit_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_ai_execution_caches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "epoch_ai_execution_caches_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_epoch_ai_cache_workspace_key" ON "epoch_ai_execution_caches"("workspace_id", "cache_key");
CREATE INDEX IF NOT EXISTS "idx_epoch_ai_cache_workspace_expires" ON "epoch_ai_execution_caches"("workspace_id", "expires_at");
