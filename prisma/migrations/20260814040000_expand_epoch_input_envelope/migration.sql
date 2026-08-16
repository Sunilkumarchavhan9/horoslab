ALTER TABLE "epoch_input_envelopes" ADD COLUMN "sensitivity" TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE "epoch_input_envelopes" ADD COLUMN "classification" TEXT NOT NULL DEFAULT 'USER_ASSERTED';
ALTER TABLE "epoch_input_envelopes" ADD COLUMN "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "epoch_input_envelopes" ADD COLUMN "valid_until" TIMESTAMP(3);
ALTER TABLE "epoch_input_envelopes" ADD COLUMN "ingestion_version" TEXT NOT NULL DEFAULT 'epoch_input_ingestion.v1';
ALTER TABLE "epoch_input_envelopes" ADD COLUMN "integrity_sha256" TEXT NOT NULL DEFAULT '';

UPDATE "epoch_input_envelopes" SET "integrity_sha256" = "content_sha256" WHERE "integrity_sha256" = '';

CREATE INDEX "idx_epoch_input_envelopes_modality_classification" ON "epoch_input_envelopes"("workspace_id", "modality", "classification");
CREATE INDEX "idx_epoch_input_envelopes_validity" ON "epoch_input_envelopes"("workspace_id", "valid_from", "valid_until");
