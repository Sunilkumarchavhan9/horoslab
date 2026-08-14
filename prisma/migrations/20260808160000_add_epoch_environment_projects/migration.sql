ALTER TABLE "epoch_environments" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

CREATE INDEX IF NOT EXISTS "idx_epoch_environments_project_updated"
  ON "epoch_environments"("project_id", "updated_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'epoch_environments_project_id_fkey'
  ) THEN
    ALTER TABLE "epoch_environments"
      ADD CONSTRAINT "epoch_environments_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "epoch_projects"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
