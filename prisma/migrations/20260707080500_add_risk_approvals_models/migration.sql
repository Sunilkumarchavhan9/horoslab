ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "proof" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "risk_records" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "type" TEXT NOT NULL,
    "affected_area" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "required_approver" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agent_run_id" TEXT,
    "related_run" TEXT,
    "artifacts" JSONB NOT NULL DEFAULT '[]',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "reasoning" TEXT NOT NULL DEFAULT '',
    "potential_impact" JSONB NOT NULL DEFAULT '[]',
    "mitigation" TEXT NOT NULL DEFAULT '',
    "risky_files" JSONB NOT NULL DEFAULT '[]',
    "source_type" TEXT NOT NULL DEFAULT 'runtime',
    "source_ref" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "approvals" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "risk_record_id" TEXT,
    "policy_id" TEXT,
    "title" TEXT NOT NULL,
    "requester" TEXT,
    "approver" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "response" JSONB NOT NULL DEFAULT '{}',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sensitive_systems" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'system',
    "severity" TEXT NOT NULL DEFAULT 'high',
    "risk_count" INTEGER NOT NULL DEFAULT 0,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensitive_systems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "blocked_actions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "risk_record_id" TEXT,
    "policy_id" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'blocked',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "risk_records_display_id_key" ON "risk_records"("display_id");
CREATE INDEX IF NOT EXISTS "idx_risk_records_workspace_status_detected" ON "risk_records"("workspace_id", "status", "detected_at");
CREATE INDEX IF NOT EXISTS "idx_risk_records_workspace_severity_detected" ON "risk_records"("workspace_id", "severity", "detected_at");
CREATE INDEX IF NOT EXISTS "idx_risk_records_policy" ON "risk_records"("policy_id");
CREATE INDEX IF NOT EXISTS "idx_approvals_workspace_status_requested" ON "approvals"("workspace_id", "status", "requested_at");
CREATE INDEX IF NOT EXISTS "idx_approvals_risk_record" ON "approvals"("risk_record_id");
CREATE INDEX IF NOT EXISTS "idx_approvals_policy" ON "approvals"("policy_id");
CREATE INDEX IF NOT EXISTS "idx_sensitive_systems_workspace_severity_status" ON "sensitive_systems"("workspace_id", "severity", "status");
CREATE INDEX IF NOT EXISTS "idx_blocked_actions_workspace_status_blocked" ON "blocked_actions"("workspace_id", "status", "blocked_at");
CREATE INDEX IF NOT EXISTS "idx_blocked_actions_risk_record" ON "blocked_actions"("risk_record_id");
CREATE INDEX IF NOT EXISTS "idx_blocked_actions_policy" ON "blocked_actions"("policy_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'risk_records_workspace_id_fkey') THEN
        ALTER TABLE "risk_records"
            ADD CONSTRAINT "risk_records_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'risk_records_policy_id_fkey') THEN
        ALTER TABLE "risk_records"
            ADD CONSTRAINT "risk_records_policy_id_fkey"
            FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approvals_workspace_id_fkey') THEN
        ALTER TABLE "approvals"
            ADD CONSTRAINT "approvals_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approvals_risk_record_id_fkey') THEN
        ALTER TABLE "approvals"
            ADD CONSTRAINT "approvals_risk_record_id_fkey"
            FOREIGN KEY ("risk_record_id") REFERENCES "risk_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approvals_policy_id_fkey') THEN
        ALTER TABLE "approvals"
            ADD CONSTRAINT "approvals_policy_id_fkey"
            FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensitive_systems_workspace_id_fkey') THEN
        ALTER TABLE "sensitive_systems"
            ADD CONSTRAINT "sensitive_systems_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocked_actions_workspace_id_fkey') THEN
        ALTER TABLE "blocked_actions"
            ADD CONSTRAINT "blocked_actions_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocked_actions_risk_record_id_fkey') THEN
        ALTER TABLE "blocked_actions"
            ADD CONSTRAINT "blocked_actions_risk_record_id_fkey"
            FOREIGN KEY ("risk_record_id") REFERENCES "risk_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocked_actions_policy_id_fkey') THEN
        ALTER TABLE "blocked_actions"
            ADD CONSTRAINT "blocked_actions_policy_id_fkey"
            FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
