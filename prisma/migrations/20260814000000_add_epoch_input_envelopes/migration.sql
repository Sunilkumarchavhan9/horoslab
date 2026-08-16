CREATE TABLE "epoch_input_envelopes" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "modality" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "trust" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "content_type" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "captured_at" TIMESTAMP(3) NOT NULL,
    "content_sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "epoch_input_envelopes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_input_envelopes_workspace_created" ON "epoch_input_envelopes"("workspace_id", "created_at");
CREATE INDEX "idx_epoch_input_envelopes_mission_captured" ON "epoch_input_envelopes"("mission_id", "captured_at");
CREATE INDEX "idx_epoch_input_envelopes_workspace_hash" ON "epoch_input_envelopes"("workspace_id", "content_sha256");

ALTER TABLE "epoch_input_envelopes" ADD CONSTRAINT "epoch_input_envelopes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_input_envelopes" ADD CONSTRAINT "epoch_input_envelopes_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
