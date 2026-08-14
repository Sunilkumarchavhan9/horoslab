CREATE TABLE "epoch_copilot_drafts" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT,
  "kind" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{}',
  "risk" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "approved_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approved_at" TIMESTAMP(3),
  CONSTRAINT "epoch_copilot_drafts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_epoch_copilot_drafts_workspace_status_created" ON "epoch_copilot_drafts"("workspace_id", "status", "created_at");
CREATE INDEX "idx_epoch_copilot_drafts_workspace_mission" ON "epoch_copilot_drafts"("workspace_id", "mission_id");
ALTER TABLE "epoch_copilot_drafts" ADD CONSTRAINT "epoch_copilot_drafts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_copilot_drafts" ADD CONSTRAINT "epoch_copilot_drafts_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "epoch_marketplace_manifests" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "publisher_id" TEXT NOT NULL,
  "compatible_api" TEXT NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '[]',
  "content_hash" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "epoch_marketplace_manifests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_epoch_marketplace_workspace_asset_version" ON "epoch_marketplace_manifests"("workspace_id", "id", "version");
CREATE INDEX "idx_epoch_marketplace_workspace_status_created" ON "epoch_marketplace_manifests"("workspace_id", "status", "created_at");
ALTER TABLE "epoch_marketplace_manifests" ADD CONSTRAINT "epoch_marketplace_manifests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_production_interactions" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "execution_id" TEXT,
  "worker_id" TEXT,
  "input" TEXT NOT NULL,
  "output" TEXT NOT NULL,
  "latency_ms" INTEGER NOT NULL,
  "tool_failures" INTEGER NOT NULL DEFAULT 0,
  "retries" INTEGER NOT NULL DEFAULT 0,
  "user_feedback" TEXT,
  "turns" INTEGER NOT NULL DEFAULT 1,
  "abandoned" BOOLEAN NOT NULL DEFAULT false,
  "failure_score" INTEGER NOT NULL DEFAULT 0,
  "signals" JSONB NOT NULL DEFAULT '[]',
  "fingerprint" TEXT NOT NULL,
  "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_production_interactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_epoch_production_interactions_workspace_captured" ON "epoch_production_interactions"("workspace_id", "captured_at");
CREATE INDEX "idx_epoch_production_interactions_workspace_fingerprint" ON "epoch_production_interactions"("workspace_id", "fingerprint", "captured_at");
CREATE INDEX "idx_epoch_production_interactions_mission_captured" ON "epoch_production_interactions"("mission_id", "captured_at");
ALTER TABLE "epoch_production_interactions" ADD CONSTRAINT "epoch_production_interactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_production_interactions" ADD CONSTRAINT "epoch_production_interactions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_failure_clusters" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "interaction_ids" JSONB NOT NULL DEFAULT '[]',
  "count" INTEGER NOT NULL DEFAULT 0,
  "average_failure_score" INTEGER NOT NULL DEFAULT 0,
  "likely_cause" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "epoch_failure_clusters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_epoch_failure_clusters_workspace_fingerprint" ON "epoch_failure_clusters"("workspace_id", "fingerprint");
CREATE INDEX "idx_epoch_failure_clusters_workspace_status_score" ON "epoch_failure_clusters"("workspace_id", "status", "average_failure_score");
ALTER TABLE "epoch_failure_clusters" ADD CONSTRAINT "epoch_failure_clusters_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_regression_drafts" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "cluster_id" TEXT NOT NULL,
  "input" TEXT NOT NULL,
  "expected" TEXT NOT NULL,
  "verification" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approved_at" TIMESTAMP(3),
  "approved_by" TEXT,
  CONSTRAINT "epoch_regression_drafts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_epoch_regression_drafts_workspace_cluster" ON "epoch_regression_drafts"("workspace_id", "cluster_id");
CREATE INDEX "idx_epoch_regression_drafts_workspace_status_created" ON "epoch_regression_drafts"("workspace_id", "status", "created_at");
ALTER TABLE "epoch_regression_drafts" ADD CONSTRAINT "epoch_regression_drafts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
