CREATE TABLE "epoch_simulation_environments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'replay',
    "status" TEXT NOT NULL DEFAULT 'configured',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_simulation_environments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_sim_env_workspace_project_updated"
  ON "epoch_simulation_environments"("workspace_id", "project_id", "updated_at");

ALTER TABLE "epoch_simulation_environments"
  ADD CONSTRAINT "epoch_simulation_environments_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_simulation_environments"
  ADD CONSTRAINT "epoch_simulation_environments_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "epoch_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_simulation_environments"
  ADD CONSTRAINT "epoch_simulation_environments_environment_id_fkey"
  FOREIGN KEY ("environment_id") REFERENCES "epoch_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_simulation_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "simulation_environment_id" TEXT NOT NULL,
    "mission_id" TEXT,
    "worker_id" TEXT,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'configured',
    "seed" INTEGER NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "faults" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_simulation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_sim_runs_workspace_status_updated"
  ON "epoch_simulation_runs"("workspace_id", "status", "updated_at");
CREATE INDEX "idx_epoch_sim_runs_mission_created"
  ON "epoch_simulation_runs"("mission_id", "created_at");

ALTER TABLE "epoch_simulation_runs"
  ADD CONSTRAINT "epoch_simulation_runs_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_simulation_runs"
  ADD CONSTRAINT "epoch_simulation_runs_simulation_environment_id_fkey"
  FOREIGN KEY ("simulation_environment_id") REFERENCES "epoch_simulation_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_simulation_runs"
  ADD CONSTRAINT "epoch_simulation_runs_mission_id_fkey"
  FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "epoch_simulation_observations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'SIMULATED',
    "value" JSONB NOT NULL DEFAULT '{}',
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "epoch_simulation_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_sim_observations_workspace_run_observed"
  ON "epoch_simulation_observations"("workspace_id", "run_id", "observed_at");

ALTER TABLE "epoch_simulation_observations"
  ADD CONSTRAINT "epoch_simulation_observations_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_simulation_observations"
  ADD CONSTRAINT "epoch_simulation_observations_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "epoch_simulation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "epoch_simulation_verifications" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "decision" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "output" JSONB NOT NULL DEFAULT '{}',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "epoch_simulation_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "epoch_simulation_verifications_run_id_key"
  ON "epoch_simulation_verifications"("run_id");
CREATE INDEX "idx_epoch_sim_verifications_workspace_decision_created"
  ON "epoch_simulation_verifications"("workspace_id", "decision", "created_at");

ALTER TABLE "epoch_simulation_verifications"
  ADD CONSTRAINT "epoch_simulation_verifications_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_simulation_verifications"
  ADD CONSTRAINT "epoch_simulation_verifications_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "epoch_simulation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
