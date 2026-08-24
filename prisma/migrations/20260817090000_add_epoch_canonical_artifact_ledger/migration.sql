CREATE TABLE "epoch_canonical_artifacts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "mission_id" TEXT,
    "parent_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'active',
    "payload" JSONB NOT NULL,
    "provenance" JSONB NOT NULL DEFAULT '{}',
    "integrity_sha256" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "causation_id" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epoch_canonical_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_epoch_canonical_artifact_version"
    ON "epoch_canonical_artifacts"("workspace_id", "object_type", "object_id", "version");
CREATE INDEX "idx_epoch_canonical_artifact_type_state_updated"
    ON "epoch_canonical_artifacts"("workspace_id", "object_type", "state", "updated_at");
CREATE INDEX "idx_epoch_canonical_artifact_mission_type"
    ON "epoch_canonical_artifacts"("workspace_id", "mission_id", "object_type");
CREATE INDEX "idx_epoch_canonical_artifact_idempotency"
    ON "epoch_canonical_artifacts"("workspace_id", "idempotency_key");

ALTER TABLE "epoch_canonical_artifacts"
    ADD CONSTRAINT "epoch_canonical_artifacts_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
