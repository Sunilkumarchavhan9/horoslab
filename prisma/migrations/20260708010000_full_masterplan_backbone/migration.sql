-- Full memoryosTM masterplan backbone tables.
-- Guarded for deploy safety because this branch is building on an existing dirty migration history.

CREATE TABLE IF NOT EXISTS "agent_black_box_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "agent_run_id" TEXT NOT NULL,
  "package_id" TEXT,
  "task" TEXT NOT NULL,
  "context_used" JSONB NOT NULL DEFAULT '[]',
  "memories_used" JSONB NOT NULL DEFAULT '[]',
  "files_touched" JSONB NOT NULL DEFAULT '[]',
  "tools_called" JSONB NOT NULL DEFAULT '[]',
  "commands_run" JSONB NOT NULL DEFAULT '[]',
  "tests_run" JSONB NOT NULL DEFAULT '[]',
  "policy_checks" JSONB NOT NULL DEFAULT '[]',
  "mistakes" JSONB NOT NULL DEFAULT '[]',
  "human_corrections" JSONB NOT NULL DEFAULT '[]',
  "outcome_id" TEXT,
  "future_instruction_id" TEXT,
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_black_box_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "agent_black_box_records_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "agent_experience_graph_nodes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "ref_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_experience_graph_nodes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "agent_experience_graph_edges" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "from_node_id" TEXT NOT NULL,
  "to_node_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "proof" JSONB NOT NULL DEFAULT '{}',
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_experience_graph_edges_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "agent_experience_graph_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "agent_experience_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "agent_experience_graph_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "agent_experience_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "evaluation_runs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "agent" TEXT NOT NULL,
  "baseline_prompt" TEXT NOT NULL,
  "inheritance_package_id" TEXT,
  "baseline_agent_run_id" TEXT,
  "inherited_agent_run_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "metrics" JSONB NOT NULL DEFAULT '{}',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluation_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "evaluation_runs_baseline_agent_run_id_fkey" FOREIGN KEY ("baseline_agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "evaluation_runs_inherited_agent_run_id_fkey" FOREIGN KEY ("inherited_agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "evaluation_results" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "evaluation_run_id" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "inheritance_lift" INTEGER NOT NULL DEFAULT 0,
  "tests_remembered_score" INTEGER NOT NULL DEFAULT 0,
  "risk_detection_score" INTEGER NOT NULL DEFAULT 0,
  "human_correction_required" BOOLEAN NOT NULL DEFAULT false,
  "mistakes_repeated" INTEGER NOT NULL DEFAULT 0,
  "cost_per_successful_task" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quality_score" INTEGER NOT NULL DEFAULT 0,
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluation_results_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "evaluation_results_evaluation_run_id_fkey" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "model_providers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "auth_type" TEXT NOT NULL DEFAULT 'api_key',
  "encrypted_credential_ref" TEXT,
  "base_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'not_connected',
  "default_model" TEXT,
  "allowed_agents" JSONB NOT NULL DEFAULT '[]',
  "allowed_runtimes" JSONB NOT NULL DEFAULT '[]',
  "monthly_budget" DOUBLE PRECISION,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "model_providers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "model_usage_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "provider_id" TEXT,
  "agent_run_id" TEXT,
  "task_type" TEXT NOT NULL DEFAULT 'agent_run',
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "latency_ms" INTEGER NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "model_usage_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "model_usage_events_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "model_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "model_usage_events_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "cost_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "agent_run_id" TEXT,
  "category" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "saved_by_inheritance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cost_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cost_events_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "compliance_evidence_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "source_ref" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ready',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "compliance_evidence_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_agent_black_box_workspace_created" ON "agent_black_box_records"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_black_box_run_created" ON "agent_black_box_records"("agent_run_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_experience_graph_node_workspace_type_ref" ON "agent_experience_graph_nodes"("workspace_id", "type", "ref_id");
CREATE INDEX IF NOT EXISTS "idx_experience_graph_nodes_workspace_type" ON "agent_experience_graph_nodes"("workspace_id", "type");
CREATE INDEX IF NOT EXISTS "idx_experience_graph_edges_workspace_type" ON "agent_experience_graph_edges"("workspace_id", "type");
CREATE INDEX IF NOT EXISTS "idx_experience_graph_edges_from" ON "agent_experience_graph_edges"("from_node_id");
CREATE INDEX IF NOT EXISTS "idx_experience_graph_edges_to" ON "agent_experience_graph_edges"("to_node_id");
CREATE INDEX IF NOT EXISTS "idx_evaluation_runs_workspace_status_created" ON "evaluation_runs"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_evaluation_results_workspace_created" ON "evaluation_results"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_evaluation_results_run" ON "evaluation_results"("evaluation_run_id");
CREATE INDEX IF NOT EXISTS "idx_model_providers_workspace_provider_status" ON "model_providers"("workspace_id", "provider", "status");
CREATE INDEX IF NOT EXISTS "idx_model_usage_workspace_created" ON "model_usage_events"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_model_usage_provider_created" ON "model_usage_events"("provider_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_model_usage_agent_run" ON "model_usage_events"("agent_run_id");
CREATE INDEX IF NOT EXISTS "idx_cost_events_workspace_created" ON "cost_events"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_cost_events_agent_run" ON "cost_events"("agent_run_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_evidence_workspace_domain_status" ON "compliance_evidence_items"("workspace_id", "domain", "status");
