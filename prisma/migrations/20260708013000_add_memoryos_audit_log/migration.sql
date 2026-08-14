CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "workspace_id" TEXT,
  "actor_type" TEXT NOT NULL DEFAULT 'user',
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'success',
  "risk_level" TEXT NOT NULL DEFAULT 'low',
  "ip_hash" TEXT,
  "user_agent" TEXT,
  "request_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_org_created"
  ON "audit_logs"("user_id", "org_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_workspace_created"
  ON "audit_logs"("workspace_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_created"
  ON "audit_logs"("action", "created_at");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource_created"
  ON "audit_logs"("resource_type", "resource_id", "created_at");
