ALTER TABLE "epoch_reality_entities" ADD COLUMN "conflict_status" TEXT NOT NULL DEFAULT 'unresolved';
ALTER TABLE "epoch_reality_entities" ADD COLUMN "refresh_after" TIMESTAMP(3);
ALTER TABLE "epoch_reality_relationships" ADD COLUMN "conflict_status" TEXT NOT NULL DEFAULT 'unresolved';
ALTER TABLE "epoch_reality_relationships" ADD COLUMN "refresh_after" TIMESTAMP(3);

CREATE INDEX "idx_epoch_reality_entities_refresh" ON "epoch_reality_entities"("workspace_id", "status", "refresh_after");
CREATE INDEX "idx_epoch_reality_relationships_refresh" ON "epoch_reality_relationships"("workspace_id", "status", "refresh_after");
