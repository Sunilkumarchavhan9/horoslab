-- Epoch Autonomous Organization Infrastructure MVP
-- Workspace-scoped institution runtime tables for templates, missions, authority, execution, evidence, verification, certificates, memory, and integrations.

CREATE TABLE IF NOT EXISTS "epoch_institution_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT NOT NULL DEFAULT '',
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "definition" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'active',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_institution_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "epoch_institutions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "template_id" TEXT,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "status" TEXT NOT NULL DEFAULT 'active',
  "summary" TEXT NOT NULL DEFAULT '',
  "current_state" TEXT NOT NULL DEFAULT 'draft',
  "mission_count" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_institutions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_institutions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "epoch_institution_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "epoch_institution_versions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "template_id" TEXT,
  "version" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_by" TEXT,
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_institution_versions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_institution_versions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "epoch_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_institution_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "epoch_institution_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "epoch_missions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "title" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'draft',
  "timeline" JSONB NOT NULL DEFAULT '[]',
  "plan" JSONB NOT NULL DEFAULT '[]',
  "result" JSONB NOT NULL DEFAULT '{}',
  "budget_cents" INTEGER NOT NULL DEFAULT 0,
  "deadline_at" TIMESTAMP(3),
  "current_step" TEXT,
  "proof" JSONB NOT NULL DEFAULT '{}',
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_missions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_missions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "epoch_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "epoch_authority_policies" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "mission_id" TEXT,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "name" TEXT NOT NULL,
  "can_execute" BOOLEAN NOT NULL DEFAULT FALSE,
  "needs_approval" BOOLEAN NOT NULL DEFAULT TRUE,
  "blocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "permissions" JSONB NOT NULL DEFAULT '[]',
  "budgets" JSONB NOT NULL DEFAULT '{}',
  "approvals" JSONB NOT NULL DEFAULT '[]',
  "checks" JSONB NOT NULL DEFAULT '[]',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_authority_policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_authority_policies_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "epoch_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_authority_policies_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "epoch_execution_runs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'running',
  "planner" JSONB NOT NULL DEFAULT '{}',
  "executor" JSONB NOT NULL DEFAULT '{}',
  "reviewer" JSONB NOT NULL DEFAULT '{}',
  "human" JSONB NOT NULL DEFAULT '{}',
  "logs" JSONB NOT NULL DEFAULT '[]',
  "retries" INTEGER NOT NULL DEFAULT 0,
  "proof" JSONB NOT NULL DEFAULT '{}',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_execution_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_execution_runs_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "epoch_execution_runs_mission_id_key" ON "epoch_execution_runs"("mission_id");

CREATE TABLE IF NOT EXISTS "epoch_evidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "execution_run_id" TEXT,
  "user_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "url" TEXT,
  "file_path" TEXT,
  "content_type" TEXT,
  "summary" TEXT NOT NULL DEFAULT '',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_evidence_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_evidence_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_evidence_execution_run_id_fkey" FOREIGN KEY ("execution_run_id") REFERENCES "epoch_execution_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "epoch_verification_runs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "execution_run_id" TEXT,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "checklist" JSONB NOT NULL DEFAULT '[]',
  "evidence_ids" JSONB NOT NULL DEFAULT '[]',
  "evidence_validation" JSONB NOT NULL DEFAULT '{}',
  "policy_validation" JSONB NOT NULL DEFAULT '{}',
  "confidence" INTEGER NOT NULL DEFAULT 0,
  "final_decision" TEXT NOT NULL DEFAULT 'review',
  "output" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_verification_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_verification_runs_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_verification_runs_execution_run_id_fkey" FOREIGN KEY ("execution_run_id") REFERENCES "epoch_execution_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "epoch_verification_runs_mission_id_key" ON "epoch_verification_runs"("mission_id");
CREATE UNIQUE INDEX IF NOT EXISTS "epoch_verification_runs_execution_run_id_key" ON "epoch_verification_runs"("execution_run_id");

CREATE TABLE IF NOT EXISTS "epoch_certificates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "verification_run_id" TEXT,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'issued',
  "summary" TEXT NOT NULL DEFAULT '',
  "evidence_summary" JSONB NOT NULL DEFAULT '{}',
  "approvals" JSONB NOT NULL DEFAULT '[]',
  "audit_trail" JSONB NOT NULL DEFAULT '[]',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_certificates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_certificates_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_certificates_verification_run_id_fkey" FOREIGN KEY ("verification_run_id") REFERENCES "epoch_verification_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "epoch_certificates_mission_id_key" ON "epoch_certificates"("mission_id");
CREATE UNIQUE INDEX IF NOT EXISTS "epoch_certificates_verification_run_id_key" ON "epoch_certificates"("verification_run_id");

CREATE TABLE IF NOT EXISTS "epoch_memory_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "mission_id" TEXT,
  "certificate_id" TEXT,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "history" JSONB NOT NULL DEFAULT '[]',
  "lessons" JSONB NOT NULL DEFAULT '[]',
  "mistakes" JSONB NOT NULL DEFAULT '[]',
  "suggested_improvements" JSONB NOT NULL DEFAULT '[]',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_memory_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_memory_records_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "epoch_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_memory_records_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "epoch_memory_records_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "epoch_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "epoch_memory_records_mission_id_key" ON "epoch_memory_records"("mission_id");
CREATE UNIQUE INDEX IF NOT EXISTS "epoch_memory_records_certificate_id_key" ON "epoch_memory_records"("certificate_id");

CREATE TABLE IF NOT EXISTS "epoch_integration_connections" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "institution_id" TEXT,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'connected',
  "config" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "last_sync_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_integration_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_integration_connections_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "epoch_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_epoch_templates_workspace_status_updated" ON "epoch_institution_templates"("workspace_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_templates_workspace_category_status" ON "epoch_institution_templates"("workspace_id", "category", "status");
CREATE INDEX IF NOT EXISTS "idx_epoch_institutions_workspace_status_updated" ON "epoch_institutions"("workspace_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_institutions_workspace_template" ON "epoch_institutions"("workspace_id", "template_id");
CREATE INDEX IF NOT EXISTS "idx_epoch_institution_versions_workspace_created" ON "epoch_institution_versions"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_institution_versions_institution_version" ON "epoch_institution_versions"("institution_id", "version");
CREATE INDEX IF NOT EXISTS "idx_epoch_missions_workspace_state_updated" ON "epoch_missions"("workspace_id", "state", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_missions_institution_created" ON "epoch_missions"("institution_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_authority_workspace_status_updated" ON "epoch_authority_policies"("workspace_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_authority_institution_created" ON "epoch_authority_policies"("institution_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_executions_workspace_status_updated" ON "epoch_execution_runs"("workspace_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_evidence_workspace_created" ON "epoch_evidence"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_evidence_mission_created" ON "epoch_evidence"("mission_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_verifications_workspace_decision_created" ON "epoch_verification_runs"("workspace_id", "final_decision", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_certificates_workspace_status_issued" ON "epoch_certificates"("workspace_id", "status", "issued_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_memory_records_workspace_updated" ON "epoch_memory_records"("workspace_id", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_memory_records_institution_created" ON "epoch_memory_records"("institution_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_epoch_integrations_workspace_provider_status" ON "epoch_integration_connections"("workspace_id", "provider", "status");
