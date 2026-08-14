CREATE TABLE IF NOT EXISTS "operational_artifacts" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_json" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,

  CONSTRAINT "operational_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_operational_artifact_kind_scope_name"
  ON "operational_artifacts"("kind", "scope", "name");

CREATE INDEX IF NOT EXISTS "idx_operational_artifacts_kind_scope_updated"
  ON "operational_artifacts"("kind", "scope", "updated_at");

CREATE INDEX IF NOT EXISTS "idx_operational_artifacts_status_updated"
  ON "operational_artifacts"("status", "updated_at");
