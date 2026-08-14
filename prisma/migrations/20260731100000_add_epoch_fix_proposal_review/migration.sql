ALTER TABLE "epoch_fix_proposals"
ADD COLUMN IF NOT EXISTS "proposed_by" TEXT;

CREATE INDEX IF NOT EXISTS "idx_epoch_fix_proposals_workspace_proposed_by"
ON "epoch_fix_proposals"("workspace_id", "proposed_by");
