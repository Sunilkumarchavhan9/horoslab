ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "enforcement" TEXT NOT NULL DEFAULT 'Enforce';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "domain" TEXT NOT NULL DEFAULT 'Security';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "owner_name" TEXT NOT NULL DEFAULT 'Policy Owner';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "owner_role" TEXT NOT NULL DEFAULT 'Governance';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "is_template" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "rule_logic" TEXT NOT NULL DEFAULT '';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "trigger_conditions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "allowed_actions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "blocked_action_names" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "required_approver" TEXT;
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "policy_checks" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "policy_id" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "allowed" BOOLEAN NOT NULL DEFAULT true,
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "result" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "policy_violations" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "policy_id" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'blocked',
  "outcome" TEXT NOT NULL DEFAULT 'blocked',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_violations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "policy_exceptions" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "policy_id" TEXT,
  "reason" TEXT NOT NULL,
  "requester" TEXT,
  "approver" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "expires_at" TIMESTAMP(3),
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "policy_audit_logs" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "policy_id" TEXT,
  "action" TEXT NOT NULL,
  "actor" TEXT,
  "summary" TEXT NOT NULL,
  "diff" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "policy_versions" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "policy_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_policies_workspace_domain_status" ON "policies"("workspace_id", "domain", "status");
CREATE INDEX IF NOT EXISTS "idx_policies_workspace_template" ON "policies"("workspace_id", "is_template");
CREATE INDEX IF NOT EXISTS "idx_policy_checks_workspace_checked" ON "policy_checks"("workspace_id", "checked_at");
CREATE INDEX IF NOT EXISTS "idx_policy_checks_policy_checked" ON "policy_checks"("policy_id", "checked_at");
CREATE INDEX IF NOT EXISTS "idx_policy_violations_workspace_occurred" ON "policy_violations"("workspace_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_policy_violations_workspace_status_occurred" ON "policy_violations"("workspace_id", "status", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_policy_violations_policy_occurred" ON "policy_violations"("policy_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_policy_exceptions_workspace_status_created" ON "policy_exceptions"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_policy_exceptions_policy_created" ON "policy_exceptions"("policy_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_policy_audit_logs_workspace_created" ON "policy_audit_logs"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_policy_audit_logs_policy_created" ON "policy_audit_logs"("policy_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_policy_versions_workspace_created" ON "policy_versions"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_policy_versions_policy_created" ON "policy_versions"("policy_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_checks_workspace_id_fkey') THEN
    ALTER TABLE "policy_checks" ADD CONSTRAINT "policy_checks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_checks_policy_id_fkey') THEN
    ALTER TABLE "policy_checks" ADD CONSTRAINT "policy_checks_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_violations_workspace_id_fkey') THEN
    ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_violations_policy_id_fkey') THEN
    ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_exceptions_workspace_id_fkey') THEN
    ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_exceptions_policy_id_fkey') THEN
    ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_audit_logs_workspace_id_fkey') THEN
    ALTER TABLE "policy_audit_logs" ADD CONSTRAINT "policy_audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_audit_logs_policy_id_fkey') THEN
    ALTER TABLE "policy_audit_logs" ADD CONSTRAINT "policy_audit_logs_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_versions_workspace_id_fkey') THEN
    ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_versions_policy_id_fkey') THEN
    ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
