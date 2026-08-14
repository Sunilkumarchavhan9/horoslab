ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "domain" TEXT NOT NULL DEFAULT 'Engineering';
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "quality_score" INTEGER NOT NULL DEFAULT 80;
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "usage_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "proof" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "source_type" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "source_ref" TEXT;
ALTER TABLE "agent_skills" ADD COLUMN IF NOT EXISTS "last_used_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "installed_agent_skills" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "repo_path" TEXT,
    "install_path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'installed',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installed_agent_skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_skill_quality_reports" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 80,
    "dimensions" JSONB NOT NULL DEFAULT '[]',
    "issues" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'passed',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skill_quality_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_skill_references" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'memory',
    "title" TEXT NOT NULL,
    "url" TEXT,
    "source_ref" TEXT,
    "content" TEXT,
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skill_references_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_skill_conflicts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "primary_skill_id" TEXT NOT NULL,
    "conflicting_skill_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'overlap',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reason" TEXT NOT NULL,
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skill_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_skill_router_rules" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'active',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skill_router_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_agent_skills_workspace_domain_status" ON "agent_skills"("workspace_id", "domain", "status");
CREATE INDEX IF NOT EXISTS "idx_installed_agent_skills_workspace_status_installed" ON "installed_agent_skills"("workspace_id", "status", "installed_at");
CREATE INDEX IF NOT EXISTS "idx_installed_agent_skills_skill_installed" ON "installed_agent_skills"("skill_id", "installed_at");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_quality_workspace_status_created" ON "agent_skill_quality_reports"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_quality_skill_created" ON "agent_skill_quality_reports"("skill_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_references_workspace_type_created" ON "agent_skill_references"("workspace_id", "type", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_references_skill_created" ON "agent_skill_references"("skill_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_conflicts_workspace_status_severity" ON "agent_skill_conflicts"("workspace_id", "status", "severity");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_conflicts_primary" ON "agent_skill_conflicts"("primary_skill_id");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_conflicts_conflicting" ON "agent_skill_conflicts"("conflicting_skill_id");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_router_workspace_status_priority" ON "agent_skill_router_rules"("workspace_id", "status", "priority");
CREATE INDEX IF NOT EXISTS "idx_agent_skill_router_skill" ON "agent_skill_router_rules"("skill_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'installed_agent_skills_workspace_id_fkey') THEN
        ALTER TABLE "installed_agent_skills"
            ADD CONSTRAINT "installed_agent_skills_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'installed_agent_skills_skill_id_fkey') THEN
        ALTER TABLE "installed_agent_skills"
            ADD CONSTRAINT "installed_agent_skills_skill_id_fkey"
            FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_quality_reports_workspace_id_fkey') THEN
        ALTER TABLE "agent_skill_quality_reports"
            ADD CONSTRAINT "agent_skill_quality_reports_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_quality_reports_skill_id_fkey') THEN
        ALTER TABLE "agent_skill_quality_reports"
            ADD CONSTRAINT "agent_skill_quality_reports_skill_id_fkey"
            FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_references_workspace_id_fkey') THEN
        ALTER TABLE "agent_skill_references"
            ADD CONSTRAINT "agent_skill_references_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_references_skill_id_fkey') THEN
        ALTER TABLE "agent_skill_references"
            ADD CONSTRAINT "agent_skill_references_skill_id_fkey"
            FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_conflicts_workspace_id_fkey') THEN
        ALTER TABLE "agent_skill_conflicts"
            ADD CONSTRAINT "agent_skill_conflicts_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_conflicts_primary_skill_id_fkey') THEN
        ALTER TABLE "agent_skill_conflicts"
            ADD CONSTRAINT "agent_skill_conflicts_primary_skill_id_fkey"
            FOREIGN KEY ("primary_skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_conflicts_conflicting_skill_id_fkey') THEN
        ALTER TABLE "agent_skill_conflicts"
            ADD CONSTRAINT "agent_skill_conflicts_conflicting_skill_id_fkey"
            FOREIGN KEY ("conflicting_skill_id") REFERENCES "agent_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_router_rules_workspace_id_fkey') THEN
        ALTER TABLE "agent_skill_router_rules"
            ADD CONSTRAINT "agent_skill_router_rules_workspace_id_fkey"
            FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_skill_router_rules_skill_id_fkey') THEN
        ALTER TABLE "agent_skill_router_rules"
            ADD CONSTRAINT "agent_skill_router_rules_skill_id_fkey"
            FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
