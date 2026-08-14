CREATE TABLE "epoch_automations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL DEFAULT '{}',
    "level" TEXT NOT NULL DEFAULT 'A0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "policy_id" TEXT NOT NULL,
    "action_ids" JSONB NOT NULL DEFAULT '[]',
    "verification_required" BOOLEAN NOT NULL DEFAULT true,
    "budget_cents" INTEGER NOT NULL DEFAULT 0,
    "spent_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_automations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_automations_workspace_status_updated" ON "epoch_automations"("workspace_id", "status", "updated_at");

CREATE TABLE "epoch_automation_actions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "automation_id" TEXT NOT NULL,
    "mission_id" TEXT,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "environment" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "policy_decision_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_automation_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_automation_actions_scope_status" ON "epoch_automation_actions"("workspace_id", "automation_id", "status");

CREATE TABLE "epoch_automation_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "automation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "trigger_type" TEXT NOT NULL,
    "trigger_payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_cents" INTEGER NOT NULL DEFAULT 0,
    "spent_cents" INTEGER NOT NULL DEFAULT 0,
    "mission_id" TEXT,
    "action_ids" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "epoch_automation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_automation_runs_scope_created" ON "epoch_automation_runs"("workspace_id", "automation_id", "created_at");

ALTER TABLE "epoch_automations" ADD CONSTRAINT "epoch_automations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_automation_actions" ADD CONSTRAINT "epoch_automation_actions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_automation_actions" ADD CONSTRAINT "epoch_automation_actions_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "epoch_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_automation_runs" ADD CONSTRAINT "epoch_automation_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_automation_runs" ADD CONSTRAINT "epoch_automation_runs_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "epoch_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
