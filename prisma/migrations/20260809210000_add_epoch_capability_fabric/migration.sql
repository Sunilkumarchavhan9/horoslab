CREATE TABLE "epoch_capability_registries" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "capabilities" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_capability_registries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_epoch_capability_registry_scope_status" ON "epoch_capability_registries"("workspace_id", "status", "updated_at");

CREATE TABLE "epoch_capability_gaps" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required_capabilities" JSONB NOT NULL DEFAULT '[]',
    "available_capabilities" JSONB NOT NULL DEFAULT '[]',
    "missing_capabilities" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'identified',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_capability_gaps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_epoch_capability_gaps_scope_status" ON "epoch_capability_gaps"("workspace_id", "status", "updated_at");

CREATE TABLE "epoch_capability_plans" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "gap_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sandbox_result" JSONB NOT NULL DEFAULT '{}',
    "test_result" JSONB NOT NULL DEFAULT '{}',
    "verification_result" JSONB NOT NULL DEFAULT '{}',
    "promoted_registry_id" TEXT,
    "rollback_result" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_capability_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_epoch_capability_plans_scope_status" ON "epoch_capability_plans"("workspace_id", "status", "updated_at");

ALTER TABLE "epoch_capability_registries" ADD CONSTRAINT "epoch_capability_registries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_capability_gaps" ADD CONSTRAINT "epoch_capability_gaps_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_capability_plans" ADD CONSTRAINT "epoch_capability_plans_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_capability_plans" ADD CONSTRAINT "epoch_capability_plans_gap_id_fkey" FOREIGN KEY ("gap_id") REFERENCES "epoch_capability_gaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
