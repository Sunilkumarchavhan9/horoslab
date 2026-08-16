ALTER TABLE "epoch_reality_entities" ADD COLUMN "source_observation_id" TEXT;
ALTER TABLE "epoch_reality_relationships" ADD COLUMN "source_observation_id" TEXT;

CREATE INDEX "idx_epoch_reality_entities_source_observation" ON "epoch_reality_entities"("source_observation_id");
CREATE INDEX "idx_epoch_reality_relationships_source_observation" ON "epoch_reality_relationships"("source_observation_id");

ALTER TABLE "epoch_reality_entities" ADD CONSTRAINT "epoch_reality_entities_source_observation_id_fkey" FOREIGN KEY ("source_observation_id") REFERENCES "epoch_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_relationships" ADD CONSTRAINT "epoch_reality_relationships_source_observation_id_fkey" FOREIGN KEY ("source_observation_id") REFERENCES "epoch_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
