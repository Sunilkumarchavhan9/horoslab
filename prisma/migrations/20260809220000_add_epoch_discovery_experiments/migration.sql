CREATE TABLE "epoch_unknowns" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT,
    "environment_id" TEXT,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_unknowns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "epoch_discovery_programs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "unknown_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "hypothesis_ids" JSONB NOT NULL DEFAULT '[]',
    "experiment_ids" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_discovery_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "epoch_hypotheses" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "discovery_program_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_hypotheses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "epoch_experiments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "discovery_program_id" TEXT NOT NULL,
    "hypothesis_id" TEXT,
    "mission_id" TEXT,
    "simulation_run_id" TEXT,
    "name" TEXT NOT NULL,
    "design" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "result" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_experiments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "epoch_observations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "experiment_id" TEXT,
    "mission_id" TEXT,
    "kind" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "evidence_ids" JSONB NOT NULL DEFAULT '[]',
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "epoch_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_unknowns_workspace_status_updated" ON "epoch_unknowns"("workspace_id", "status", "updated_at");
CREATE INDEX "idx_epoch_discovery_programs_workspace_status_updated" ON "epoch_discovery_programs"("workspace_id", "status", "updated_at");
CREATE INDEX "idx_epoch_hypotheses_workspace_status_updated" ON "epoch_hypotheses"("workspace_id", "status", "updated_at");
CREATE INDEX "idx_epoch_experiments_workspace_status_updated" ON "epoch_experiments"("workspace_id", "status", "updated_at");
CREATE INDEX "idx_epoch_observations_workspace_observed" ON "epoch_observations"("workspace_id", "observed_at");
CREATE INDEX "idx_epoch_observations_experiment" ON "epoch_observations"("experiment_id");

ALTER TABLE "epoch_unknowns" ADD CONSTRAINT "epoch_unknowns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_discovery_programs" ADD CONSTRAINT "epoch_discovery_programs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_hypotheses" ADD CONSTRAINT "epoch_hypotheses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_experiments" ADD CONSTRAINT "epoch_experiments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_observations" ADD CONSTRAINT "epoch_observations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
