CREATE TABLE IF NOT EXISTS "epoch_projects" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "org_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "epoch_projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_epoch_projects_workspace_name"
  ON "epoch_projects"("workspace_id", "name");

CREATE INDEX IF NOT EXISTS "idx_epoch_projects_workspace_org_updated"
  ON "epoch_projects"("workspace_id", "org_id", "updated_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'epoch_projects_workspace_id_fkey'
  ) THEN
    ALTER TABLE "epoch_projects"
      ADD CONSTRAINT "epoch_projects_workspace_id_fkey"
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
