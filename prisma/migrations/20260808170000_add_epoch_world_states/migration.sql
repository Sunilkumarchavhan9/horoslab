CREATE TABLE "epoch_world_states" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "snapshot" JSONB NOT NULL,
    "source_ids" JSONB NOT NULL DEFAULT '[]',
    "freshness" TEXT NOT NULL DEFAULT 'fresh',
    "correlation_id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epoch_world_states_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_world_states_scope_observed"
  ON "epoch_world_states"("workspace_id", "project_id", "environment_id", "observed_at");

ALTER TABLE "epoch_world_states"
  ADD CONSTRAINT "epoch_world_states_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "epoch_world_states"
  ADD CONSTRAINT "epoch_world_states_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "epoch_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "epoch_world_states"
  ADD CONSTRAINT "epoch_world_states_environment_id_fkey"
  FOREIGN KEY ("environment_id") REFERENCES "epoch_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
