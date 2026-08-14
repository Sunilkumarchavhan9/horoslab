-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ActionMemoryOutcome" AS ENUM ('success', 'failed', 'rolled_back');

-- CreateEnum
CREATE TYPE "public"."ActionMemorySourceType" AS ENUM ('github_execution', 'continuity', 'manual');

-- CreateEnum
CREATE TYPE "public"."ApprovalDecision" AS ENUM ('approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."MemoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED', 'PROMOTED');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('IDLE', 'RECORDING', 'PAUSED', 'VERIFYING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PASSED', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "public"."AgentSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "agentId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "task" TEXT,
    "mode" TEXT NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'IDLE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "preflightId" TEXT,
    "handoffId" TEXT,
    "verificationStatus" "public"."VerificationStatus",
    "summary" TEXT,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentSessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payloadJson" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProposedMemory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "status" "public"."MemoryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposedMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "public"."VerificationStatus" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "checksJson" JSONB NOT NULL,
    "warningsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."action_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "project_id" TEXT,
    "workspace" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TEXT,
    "files_changed_json" TEXT NOT NULL DEFAULT '[]',
    "outcome" "public"."ActionMemoryOutcome" NOT NULL,
    "follow_ups_json" TEXT NOT NULL DEFAULT '[]',
    "source_type" "public"."ActionMemorySourceType",
    "source_id" TEXT,
    "metadata_json" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "action_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "runtime" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "connected_at" TEXT NOT NULL,
    "last_heartbeat" TEXT NOT NULL,
    "threads24h" INTEGER NOT NULL DEFAULT 0,
    "resumeScore" INTEGER NOT NULL DEFAULT 0,
    "handoffs24h" INTEGER NOT NULL DEFAULT 0,
    "config_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_roles" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "allowed_memories" JSONB NOT NULL DEFAULT '[]',
    "allowed_tools" JSONB NOT NULL DEFAULT '[]',
    "allowed_domains" JSONB NOT NULL DEFAULT '[]',
    "allowed_actions" JSONB NOT NULL DEFAULT '[]',
    "blocked_actions" JSONB NOT NULL DEFAULT '[]',
    "approval_rules" JSONB NOT NULL DEFAULT '[]',
    "default_blueprints" JSONB NOT NULL DEFAULT '[]',
    "evaluation_requirements" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_run_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "agent_run_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "proof" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_run_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "package_id" TEXT,
    "agent_role_id" TEXT,
    "target_agent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Preparing',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "outcome_id" TEXT,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_skills" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "required_memories" JSONB NOT NULL DEFAULT '[]',
    "required_tools" JSONB NOT NULL DEFAULT '[]',
    "required_tests" JSONB NOT NULL DEFAULT '[]',
    "approval_rules" JSONB NOT NULL DEFAULT '[]',
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "endpoints_json" TEXT NOT NULL,
    "content_tag" TEXT NOT NULL,
    "expires" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "last_used_at" TEXT,
    "status" TEXT NOT NULL,
    "revoked_at" TEXT,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."approval_traces" (
    "id" TEXT NOT NULL,
    "action_memory_id" TEXT,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "approver_id" TEXT NOT NULL,
    "decision" "public"."ApprovalDecision" NOT NULL,
    "reason" TEXT,
    "risk_tier" TEXT,
    "proposal_id" TEXT,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "approval_traces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_accounts" (
    "user_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Free',
    "customer_id" TEXT,
    "subscription_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'unknown',
    "current_period_end" TEXT,
    "connector_sync_used" INTEGER NOT NULL DEFAULT 0,
    "token_used" INTEGER NOT NULL DEFAULT 0,
    "search_used" INTEGER NOT NULL DEFAULT 0,
    "usage_period_start" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."billing_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issued_at" TEXT NOT NULL,
    "hosted_invoice_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_brain_execution_proposals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "adapter" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "risk_tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL,
    "result_json" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "reviewed_at" TEXT,
    "reviewed_by_user_id" TEXT,
    "executed_at" TEXT,
    "rejection_reason" TEXT,
    "second_factor_verified" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,

    CONSTRAINT "company_brain_execution_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_brain_exports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "workspace" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'skills_markdown',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "generated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "company_brain_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_brain_funnel_states" (
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL DEFAULT '',
    "updated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "company_brain_funnel_states_pkey" PRIMARY KEY ("user_id","org_id")
);

-- CreateTable
CREATE TABLE "public"."company_brain_platform_states" (
    "user_id" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "org_id" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "company_brain_platform_states_pkey" PRIMARY KEY ("user_id","org_id")
);

-- CreateTable
CREATE TABLE "public"."company_brain_queue_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "company_brain_queue_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connector_sync_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "connector_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TEXT NOT NULL,
    "finished_at" TEXT,
    "items_synced" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata_json" TEXT,

    CONSTRAINT "connector_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connectors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_connected',
    "config_json" TEXT,
    "last_sync_at" TEXT,
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "org_id" TEXT,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."continuity_file_changes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "org_id" TEXT,

    CONSTRAINT "continuity_file_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."continuity_threads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "org_id" TEXT,

    CONSTRAINT "continuity_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."execution_outcomes" (
    "id" TEXT NOT NULL,
    "action_memory_id" TEXT,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "goal" TEXT,
    "plan_summary" TEXT,
    "result_summary" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "connector_adapter" TEXT,
    "external_ref" TEXT,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "execution_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."future_agent_instructions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "trigger_context" JSONB NOT NULL,
    "instruction" TEXT NOT NULL,
    "affected_files" JSONB NOT NULL DEFAULT '[]',
    "required_tests" JSONB NOT NULL DEFAULT '[]',
    "risk_level" TEXT NOT NULL DEFAULT 'low',
    "proof" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "future_agent_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inheritance_packages" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "target_agent" TEXT NOT NULL,
    "target_format" TEXT NOT NULL,
    "autonomy_level" TEXT NOT NULL,
    "safety_mode" TEXT NOT NULL,
    "agent_readiness_score" INTEGER NOT NULL DEFAULT 0,
    "memory_quality_score" INTEGER NOT NULL DEFAULT 0,
    "reliability_score" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "proof" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inheritance_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memories" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_item_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "proof" JSONB NOT NULL,
    "confidence_score" INTEGER NOT NULL DEFAULT 70,
    "freshness_score" INTEGER NOT NULL DEFAULT 70,
    "quality_score" INTEGER NOT NULL DEFAULT 70,
    "risk_level" TEXT NOT NULL DEFAULT 'low',
    "related_files" JSONB NOT NULL DEFAULT '[]',
    "related_tests" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "linked_workflow" TEXT,
    "linked_outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memory_embeddings" (
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "memory_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "embedding_json" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "memory_embeddings_pkey" PRIMARY KEY ("user_id","memory_id")
);

-- CreateTable
CREATE TABLE "public"."operational_loops" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "goal" TEXT NOT NULL,
    "project_id" TEXT,
    "current_state" TEXT NOT NULL,
    "linked_proposal_ids_json" TEXT NOT NULL DEFAULT '[]',
    "linked_action_memory_ids_json" TEXT NOT NULL DEFAULT '[]',
    "metadata_json" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "operational_loops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outcomes" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "agent_run_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "files_changed" JSONB NOT NULL DEFAULT '[]',
    "tests_passed" JSONB NOT NULL DEFAULT '[]',
    "tests_failed" JSONB NOT NULL DEFAULT '[]',
    "worked" TEXT NOT NULL,
    "failed" TEXT NOT NULL,
    "human_correction" BOOLEAN NOT NULL DEFAULT false,
    "future_lesson" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."policies" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recent_memories" (
    "user_id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "org_id" TEXT,

    CONSTRAINT "recent_memories_pkey" PRIMARY KEY ("user_id","memory_id")
);

-- CreateTable
CREATE TABLE "public"."revision_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changed_at" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changes_json" TEXT NOT NULL,

    CONSTRAINT "revision_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scoped_settings" (
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL DEFAULT '',
    "section" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "scoped_settings_pkey" PRIMARY KEY ("user_id","org_id","section")
);

-- CreateTable
CREATE TABLE "public"."service_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT,

    CONSTRAINT "service_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."source_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sources" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_connected',
    "permissions" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."timeline_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "metadata_json" TEXT,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_blueprints" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "required_memories" JSONB NOT NULL DEFAULT '[]',
    "required_tools" JSONB NOT NULL DEFAULT '[]',
    "risk_checks" JSONB NOT NULL DEFAULT '[]',
    "approval_rules" JSONB NOT NULL DEFAULT '[]',
    "success_criteria" JSONB NOT NULL DEFAULT '[]',
    "outcome_schema" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Free',
    "region" TEXT NOT NULL DEFAULT 'us',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentSession_agentId_status_idx" ON "public"."AgentSession"("agentId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "AgentSessionEvent_sessionId_timestamp_idx" ON "public"."AgentSessionEvent"("sessionId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "ProposedMemory_sessionId_status_idx" ON "public"."ProposedMemory"("sessionId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationResult_sessionId_key" ON "public"."VerificationResult"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "idx_action_memories_source_id" ON "public"."action_memories"("source_id" ASC);

-- CreateIndex
CREATE INDEX "idx_action_memories_user_org_created" ON "public"."action_memories"("user_id" ASC, "org_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "agent_profiles_user_id_idx" ON "public"."agent_profiles"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_agent_roles_workspace_name" ON "public"."agent_roles"("workspace_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "idx_agent_run_events_run_timestamp" ON "public"."agent_run_events"("agent_run_id" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "idx_agent_run_events_workspace_timestamp" ON "public"."agent_run_events"("workspace_id" ASC, "timestamp" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "agent_runs_outcome_id_key" ON "public"."agent_runs"("outcome_id" ASC);

-- CreateIndex
CREATE INDEX "idx_agent_runs_package" ON "public"."agent_runs"("package_id" ASC);

-- CreateIndex
CREATE INDEX "idx_agent_runs_workspace_status_started" ON "public"."agent_runs"("workspace_id" ASC, "status" ASC, "started_at" ASC);

-- CreateIndex
CREATE INDEX "idx_agent_skills_workspace_status" ON "public"."agent_skills"("workspace_id" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash" ASC);

-- CreateIndex
CREATE INDEX "idx_api_keys_hash_status" ON "public"."api_keys"("key_hash" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_api_keys_user_created" ON "public"."api_keys"("user_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_approval_traces_action_memory" ON "public"."approval_traces"("action_memory_id" ASC);

-- CreateIndex
CREATE INDEX "idx_approval_traces_proposal_id" ON "public"."approval_traces"("proposal_id" ASC);

-- CreateIndex
CREATE INDEX "idx_approval_traces_user_org_created" ON "public"."approval_traces"("user_id" ASC, "org_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_customer_id_key" ON "public"."billing_accounts"("customer_id" ASC);

-- CreateIndex
CREATE INDEX "idx_billing_account_plan" ON "public"."billing_accounts"("plan" ASC);

-- CreateIndex
CREATE INDEX "idx_billing_event_user_created" ON "public"."billing_events"("user_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_billing_invoice_user_issued" ON "public"."billing_invoices"("user_id" ASC, "issued_at" ASC);

-- CreateIndex
CREATE INDEX "idx_cb_exec_proposals_user_org_status_created" ON "public"."company_brain_execution_proposals"("user_id" ASC, "org_id" ASC, "status" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_cb_exec_proposals_user_status_created" ON "public"."company_brain_execution_proposals"("user_id" ASC, "status" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_exports_user_generated" ON "public"."company_brain_exports"("user_id" ASC, "generated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_exports_user_org_generated" ON "public"."company_brain_exports"("user_id" ASC, "org_id" ASC, "generated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_funnel_updated" ON "public"."company_brain_funnel_states"("updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_funnel_user_org" ON "public"."company_brain_funnel_states"("user_id" ASC, "org_id" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_platform_updated" ON "public"."company_brain_platform_states"("updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_platform_user_org" ON "public"."company_brain_platform_states"("user_id" ASC, "org_id" ASC);

-- CreateIndex
CREATE INDEX "idx_company_brain_queue_user_status_created" ON "public"."company_brain_queue_jobs"("user_id" ASC, "status" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_connector_sync_logs_user_org_started" ON "public"."connector_sync_logs"("user_id" ASC, "org_id" ASC, "started_at" ASC);

-- CreateIndex
CREATE INDEX "idx_connector_sync_logs_user_started" ON "public"."connector_sync_logs"("user_id" ASC, "started_at" ASC);

-- CreateIndex
CREATE INDEX "connectors_user_id_idx" ON "public"."connectors"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_connectors_user_org" ON "public"."connectors"("user_id" ASC, "org_id" ASC);

-- CreateIndex
CREATE INDEX "idx_continuity_file_changes_user_org_thread_created" ON "public"."continuity_file_changes"("user_id" ASC, "org_id" ASC, "thread_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_continuity_file_changes_user_status" ON "public"."continuity_file_changes"("user_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_continuity_file_changes_user_thread_created" ON "public"."continuity_file_changes"("user_id" ASC, "thread_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_continuity_threads_user_org_updated" ON "public"."continuity_threads"("user_id" ASC, "org_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_continuity_threads_user_status" ON "public"."continuity_threads"("user_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_continuity_threads_user_updated" ON "public"."continuity_threads"("user_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_execution_outcomes_action_memory" ON "public"."execution_outcomes"("action_memory_id" ASC);

-- CreateIndex
CREATE INDEX "idx_execution_outcomes_user_org_created" ON "public"."execution_outcomes"("user_id" ASC, "org_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_future_agent_instructions_workspace_status_created" ON "public"."future_agent_instructions"("workspace_id" ASC, "status" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_inheritance_packages_workspace_agent" ON "public"."inheritance_packages"("workspace_id" ASC, "target_agent" ASC);

-- CreateIndex
CREATE INDEX "idx_inheritance_packages_workspace_created" ON "public"."inheritance_packages"("workspace_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_memories_source_item" ON "public"."memories"("source_item_id" ASC);

-- CreateIndex
CREATE INDEX "idx_memories_workspace_quality" ON "public"."memories"("workspace_id" ASC, "quality_score" ASC);

-- CreateIndex
CREATE INDEX "idx_memories_workspace_type_status" ON "public"."memories"("workspace_id" ASC, "type" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_memory_embeddings_user_org_updated" ON "public"."memory_embeddings"("user_id" ASC, "org_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_memory_embeddings_user_updated" ON "public"."memory_embeddings"("user_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_operational_loops_user_org_updated" ON "public"."operational_loops"("user_id" ASC, "org_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_operational_loops_user_project_updated" ON "public"."operational_loops"("user_id" ASC, "project_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_outcomes_workspace_created" ON "public"."outcomes"("workspace_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "outcomes_agent_run_id_key" ON "public"."outcomes"("agent_run_id" ASC);

-- CreateIndex
CREATE INDEX "idx_policies_workspace_status" ON "public"."policies"("workspace_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_recent_memories_user_org_updated" ON "public"."recent_memories"("user_id" ASC, "org_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_recent_memories_user_updated" ON "public"."recent_memories"("user_id" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_revision_memory_version" ON "public"."revision_events"("memory_id" ASC, "version" ASC);

-- CreateIndex
CREATE INDEX "idx_revision_user_changed" ON "public"."revision_events"("user_id" ASC, "changed_at" ASC);

-- CreateIndex
CREATE INDEX "idx_scoped_settings_org_section_updated" ON "public"."scoped_settings"("org_id" ASC, "section" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_scoped_settings_user_section_updated" ON "public"."scoped_settings"("user_id" ASC, "section" ASC, "updated_at" ASC);

-- CreateIndex
CREATE INDEX "idx_service_users_org_created" ON "public"."service_users"("org_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_service_users_user_org_created" ON "public"."service_users"("user_id" ASC, "org_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_source_items_workspace_source_created" ON "public"."source_items"("workspace_id" ASC, "source_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_source_items_workspace_type" ON "public"."source_items"("workspace_id" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "idx_sources_workspace_provider" ON "public"."sources"("workspace_id" ASC, "provider" ASC);

-- CreateIndex
CREATE INDEX "idx_sources_workspace_status" ON "public"."sources"("workspace_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_timeline_user_ts" ON "public"."timeline_events"("user_id" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "idx_workflow_blueprints_workspace_name" ON "public"."workflow_blueprints"("workspace_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "idx_workspaces_owner_created" ON "public"."workspaces"("owner_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_workspaces_user_org" ON "public"."workspaces"("user_id" ASC, "org_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."AgentSessionEvent" ADD CONSTRAINT "AgentSessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposedMemory" ADD CONSTRAINT "ProposedMemory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerificationResult" ADD CONSTRAINT "VerificationResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_roles" ADD CONSTRAINT "agent_roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_run_events" ADD CONSTRAINT "agent_run_events_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_run_events" ADD CONSTRAINT "agent_run_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_runs" ADD CONSTRAINT "agent_runs_agent_role_id_fkey" FOREIGN KEY ("agent_role_id") REFERENCES "public"."agent_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_runs" ADD CONSTRAINT "agent_runs_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."inheritance_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_runs" ADD CONSTRAINT "agent_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_skills" ADD CONSTRAINT "agent_skills_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_traces" ADD CONSTRAINT "approval_traces_action_memory_id_fkey" FOREIGN KEY ("action_memory_id") REFERENCES "public"."action_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoices" ADD CONSTRAINT "billing_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."billing_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."execution_outcomes" ADD CONSTRAINT "execution_outcomes_action_memory_id_fkey" FOREIGN KEY ("action_memory_id") REFERENCES "public"."action_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."future_agent_instructions" ADD CONSTRAINT "future_agent_instructions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inheritance_packages" ADD CONSTRAINT "inheritance_packages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memories" ADD CONSTRAINT "memories_source_item_id_fkey" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memories" ADD CONSTRAINT "memories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outcomes" ADD CONSTRAINT "outcomes_agent_run_id_fkey" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outcomes" ADD CONSTRAINT "outcomes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."policies" ADD CONSTRAINT "policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."source_items" ADD CONSTRAINT "source_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."source_items" ADD CONSTRAINT "source_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sources" ADD CONSTRAINT "sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_blueprints" ADD CONSTRAINT "workflow_blueprints_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

