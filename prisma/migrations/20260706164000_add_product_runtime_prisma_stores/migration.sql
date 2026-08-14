CREATE TABLE IF NOT EXISTS "product_agent_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "agent_id" TEXT NOT NULL,
  "project_id" TEXT,
  "goal" TEXT,
  "goal_id" TEXT,
  "status" TEXT NOT NULL,
  "model" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "product_agent_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_agent_sessions_user_id_org_id_updated_at_idx"
  ON "product_agent_sessions"("user_id", "org_id", "updated_at");

CREATE INDEX IF NOT EXISTS "product_agent_sessions_agent_id_status_idx"
  ON "product_agent_sessions"("agent_id", "status");

CREATE TABLE IF NOT EXISTS "connector_execution_proposals" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "connector_type" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "target_label" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "reviewed_at" TEXT,
  "executed_at" TEXT,
  "result_url" TEXT,
  "external_id" TEXT,
  "error" TEXT,
  CONSTRAINT "connector_execution_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "connector_execution_proposals_user_id_connector_type_created_at_idx"
  ON "connector_execution_proposals"("user_id", "connector_type", "created_at");

CREATE INDEX IF NOT EXISTS "connector_execution_proposals_status_idx"
  ON "connector_execution_proposals"("status");

CREATE TABLE IF NOT EXISTS "github_execution_proposals" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "repo" TEXT NOT NULL,
  "issue_number" INTEGER,
  "body" TEXT NOT NULL,
  "pull_title" TEXT,
  "head_branch" TEXT,
  "base_branch" TEXT,
  "file_path" TEXT,
  "status" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "reviewed_at" TEXT,
  "executed_at" TEXT,
  "github_comment_id" INTEGER,
  "github_pr_number" INTEGER,
  "github_result_url" TEXT,
  "error" TEXT,
  CONSTRAINT "github_execution_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "github_execution_proposals_user_id_created_at_idx"
  ON "github_execution_proposals"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "github_execution_proposals_owner_repo_idx"
  ON "github_execution_proposals"("owner", "repo");

CREATE INDEX IF NOT EXISTS "github_execution_proposals_status_idx"
  ON "github_execution_proposals"("status");
