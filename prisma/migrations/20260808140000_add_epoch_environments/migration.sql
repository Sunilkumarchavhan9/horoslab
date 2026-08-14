CREATE TABLE IF NOT EXISTS "epoch_environments" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "org_id" TEXT,
  "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'unknown',
  "region" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "epoch_environments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "epoch_integration_connections"
ADD COLUMN IF NOT EXISTS "environment_id" TEXT;

CREATE INDEX IF NOT EXISTS "idx_epoch_environments_workspace_kind_status"
  ON "epoch_environments"("workspace_id", "kind", "status");

CREATE INDEX IF NOT EXISTS "idx_epoch_environments_workspace_updated"
  ON "epoch_environments"("workspace_id", "updated_at");

CREATE INDEX IF NOT EXISTS "idx_epoch_integrations_environment_status"
  ON "epoch_integration_connections"("environment_id", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'epoch_environments_workspace_id_fkey'
  ) THEN
    ALTER TABLE "epoch_environments"
      ADD CONSTRAINT "epoch_environments_workspace_id_fkey"
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'epoch_integration_connections_environment_id_fkey'
  ) THEN
    ALTER TABLE "epoch_integration_connections"
      ADD CONSTRAINT "epoch_integration_connections_environment_id_fkey"
      FOREIGN KEY ("environment_id") REFERENCES "epoch_environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
