CREATE TABLE IF NOT EXISTS "skills_rules_cache" (
  "org_id" TEXT NOT NULL,
  "repo" TEXT NOT NULL,
  "repo_key" TEXT NOT NULL,
  "ref" TEXT NOT NULL,
  "items_json" TEXT NOT NULL,
  "skill_count" INTEGER NOT NULL DEFAULT 0,
  "rule_count" INTEGER NOT NULL DEFAULT 0,
  "discovered_at" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "error" TEXT,

  CONSTRAINT "skills_rules_cache_pkey" PRIMARY KEY ("org_id", "repo_key")
);

CREATE INDEX IF NOT EXISTS "idx_skills_rules_cache_org_expires"
  ON "skills_rules_cache"("org_id", "expires_at");

CREATE TABLE IF NOT EXISTS "wiki_diagram_cache" (
  "cache_key" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "project_id" TEXT NOT NULL,
  "repo_full_name" TEXT NOT NULL,
  "branch" TEXT NOT NULL,
  "diagram_type" TEXT NOT NULL,
  "mermaid" TEXT NOT NULL,
  "sources_json" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "generated_at" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,

  CONSTRAINT "wiki_diagram_cache_pkey" PRIMARY KEY ("cache_key")
);

CREATE INDEX IF NOT EXISTS "idx_wiki_diagram_cache_user_expires"
  ON "wiki_diagram_cache"("user_id", "expires_at");

CREATE INDEX IF NOT EXISTS "idx_wiki_diagram_cache_org_expires"
  ON "wiki_diagram_cache"("org_id", "expires_at");

CREATE TABLE IF NOT EXISTS "benchmark_scenarios" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "case_ids_json" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,

  CONSTRAINT "benchmark_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_benchmark_scenarios_updated"
  ON "benchmark_scenarios"("updated_at");

CREATE TABLE IF NOT EXISTS "benchmark_runs" (
  "run_id" TEXT NOT NULL,
  "generated_at" TEXT NOT NULL,
  "completed_at" TEXT,
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_json" TEXT NOT NULL,

  CONSTRAINT "benchmark_runs_pkey" PRIMARY KEY ("run_id")
);

CREATE INDEX IF NOT EXISTS "idx_benchmark_runs_generated"
  ON "benchmark_runs"("generated_at");

CREATE INDEX IF NOT EXISTS "idx_benchmark_runs_status"
  ON "benchmark_runs"("status");
