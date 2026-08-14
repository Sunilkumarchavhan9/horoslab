CREATE TABLE "epoch_failure_signals" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "interaction_id" TEXT NOT NULL, "mission_id" TEXT NOT NULL, "kind" TEXT NOT NULL, "severity" TEXT NOT NULL, "score" INTEGER NOT NULL, "evidence" JSONB NOT NULL DEFAULT '{}', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "epoch_failure_signals_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_failure_signals_workspace_kind_created" ON "epoch_failure_signals"("workspace_id", "kind", "created_at");
CREATE INDEX "idx_epoch_failure_signals_workspace_mission_created" ON "epoch_failure_signals"("workspace_id", "mission_id", "created_at");
ALTER TABLE "epoch_failure_signals" ADD CONSTRAINT "epoch_failure_signals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_root_cause_records" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "cluster_id" TEXT NOT NULL, "hypothesis" TEXT NOT NULL, "confidence" INTEGER NOT NULL, "evidence" JSONB NOT NULL DEFAULT '{}', "status" TEXT NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewed_at" TIMESTAMP(3), "reviewed_by" TEXT, CONSTRAINT "epoch_root_cause_records_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_root_causes_workspace_status_created" ON "epoch_root_cause_records"("workspace_id", "status", "created_at");
CREATE INDEX "idx_epoch_root_causes_workspace_cluster" ON "epoch_root_cause_records"("workspace_id", "cluster_id");
ALTER TABLE "epoch_root_cause_records" ADD CONSTRAINT "epoch_root_cause_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_regression_evaluations" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "cluster_id" TEXT NOT NULL, "input" TEXT NOT NULL, "expected" TEXT NOT NULL, "verification" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "approved_at" TIMESTAMP(3), "approved_by" TEXT, CONSTRAINT "epoch_regression_evaluations_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_regression_evaluations_workspace_status_created" ON "epoch_regression_evaluations"("workspace_id", "status", "created_at");
CREATE INDEX "idx_epoch_regression_evaluations_workspace_cluster" ON "epoch_regression_evaluations"("workspace_id", "cluster_id");
ALTER TABLE "epoch_regression_evaluations" ADD CONSTRAINT "epoch_regression_evaluations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_replay_sessions" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "mission_id" TEXT NOT NULL, "source_run_id" TEXT, "variant" JSONB NOT NULL DEFAULT '{}', "status" TEXT NOT NULL DEFAULT 'created', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMP(3), CONSTRAINT "epoch_replay_sessions_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_replay_sessions_workspace_status_created" ON "epoch_replay_sessions"("workspace_id", "status", "created_at");
CREATE INDEX "idx_epoch_replay_sessions_workspace_mission_created" ON "epoch_replay_sessions"("workspace_id", "mission_id", "created_at");
ALTER TABLE "epoch_replay_sessions" ADD CONSTRAINT "epoch_replay_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_replay_results" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "replay_session_id" TEXT NOT NULL, "baseline" JSONB NOT NULL DEFAULT '{}', "candidate" JSONB NOT NULL DEFAULT '{}', "comparison" JSONB NOT NULL DEFAULT '{}', "status" TEXT NOT NULL DEFAULT 'unknown', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "epoch_replay_results_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_replay_results_workspace_session" ON "epoch_replay_results"("workspace_id", "replay_session_id");
ALTER TABLE "epoch_replay_results" ADD CONSTRAINT "epoch_replay_results_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_fix_proposals" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "cluster_id" TEXT NOT NULL, "kind" TEXT NOT NULL, "proposal" TEXT NOT NULL, "risk" TEXT NOT NULL, "rollback" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "approved_at" TIMESTAMP(3), "approved_by" TEXT, CONSTRAINT "epoch_fix_proposals_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_fix_proposals_workspace_status_created" ON "epoch_fix_proposals"("workspace_id", "status", "created_at");
CREATE INDEX "idx_epoch_fix_proposals_workspace_cluster" ON "epoch_fix_proposals"("workspace_id", "cluster_id");
ALTER TABLE "epoch_fix_proposals" ADD CONSTRAINT "epoch_fix_proposals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_reliability_metrics" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "worker_id" TEXT, "window_start" TIMESTAMP(3) NOT NULL, "window_end" TIMESTAMP(3) NOT NULL, "sample_size" INTEGER NOT NULL, "success_rate" DOUBLE PRECISION NOT NULL, "failure_rate" DOUBLE PRECISION NOT NULL, "recovery_rate" DOUBLE PRECISION NOT NULL, "human_intervention_rate" DOUBLE PRECISION NOT NULL, "confidence" DOUBLE PRECISION NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "epoch_reliability_metrics_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_reliability_workspace_worker_window" ON "epoch_reliability_metrics"("workspace_id", "worker_id", "window_end");
ALTER TABLE "epoch_reliability_metrics" ADD CONSTRAINT "epoch_reliability_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_improvement_metrics" ("id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "cluster_id" TEXT NOT NULL, "baseline" JSONB NOT NULL DEFAULT '{}', "after" JSONB NOT NULL DEFAULT '{}', "delta" JSONB NOT NULL DEFAULT '{}', "verified" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "epoch_improvement_metrics_pkey" PRIMARY KEY ("id"));
CREATE INDEX "idx_epoch_improvement_workspace_cluster_created" ON "epoch_improvement_metrics"("workspace_id", "cluster_id", "created_at");
ALTER TABLE "epoch_improvement_metrics" ADD CONSTRAINT "epoch_improvement_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
