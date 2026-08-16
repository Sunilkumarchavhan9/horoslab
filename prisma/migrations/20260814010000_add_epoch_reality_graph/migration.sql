CREATE TABLE "epoch_reality_entities" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "mission_id" TEXT,
    "source_input_id" TEXT,
    "canonical_key" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "provenance" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "observed_at" TIMESTAMP(3) NOT NULL,
    "integrity_sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_reality_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "epoch_reality_relationships" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "mission_id" TEXT,
    "source_input_id" TEXT,
    "from_entity_id" TEXT NOT NULL,
    "to_entity_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "provenance" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "observed_at" TIMESTAMP(3) NOT NULL,
    "integrity_sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_reality_relationships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_reality_entities_key_valid" ON "epoch_reality_entities"("workspace_id", "canonical_key", "valid_from");
CREATE INDEX "idx_epoch_reality_entities_type_status" ON "epoch_reality_entities"("workspace_id", "entity_type", "status");
CREATE INDEX "idx_epoch_reality_entities_mission_observed" ON "epoch_reality_entities"("mission_id", "observed_at");
CREATE INDEX "idx_epoch_reality_entities_source_input" ON "epoch_reality_entities"("source_input_id");
CREATE INDEX "idx_epoch_reality_relationships_type_observed" ON "epoch_reality_relationships"("workspace_id", "relation_type", "observed_at");
CREATE INDEX "idx_epoch_reality_relationships_from_type" ON "epoch_reality_relationships"("from_entity_id", "relation_type");
CREATE INDEX "idx_epoch_reality_relationships_to_type" ON "epoch_reality_relationships"("to_entity_id", "relation_type");
CREATE INDEX "idx_epoch_reality_relationships_source_input" ON "epoch_reality_relationships"("source_input_id");

ALTER TABLE "epoch_reality_entities" ADD CONSTRAINT "epoch_reality_entities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_entities" ADD CONSTRAINT "epoch_reality_entities_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_entities" ADD CONSTRAINT "epoch_reality_entities_source_input_id_fkey" FOREIGN KEY ("source_input_id") REFERENCES "epoch_input_envelopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_relationships" ADD CONSTRAINT "epoch_reality_relationships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_relationships" ADD CONSTRAINT "epoch_reality_relationships_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_relationships" ADD CONSTRAINT "epoch_reality_relationships_source_input_id_fkey" FOREIGN KEY ("source_input_id") REFERENCES "epoch_input_envelopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_relationships" ADD CONSTRAINT "epoch_reality_relationships_from_entity_id_fkey" FOREIGN KEY ("from_entity_id") REFERENCES "epoch_reality_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_reality_relationships" ADD CONSTRAINT "epoch_reality_relationships_to_entity_id_fkey" FOREIGN KEY ("to_entity_id") REFERENCES "epoch_reality_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
