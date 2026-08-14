CREATE TABLE "epoch_data_center_observations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "source_ids" JSONB NOT NULL DEFAULT '[]',
    "correlation_id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "epoch_data_center_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_epoch_dc_observations_scope_observed" ON "epoch_data_center_observations"("workspace_id", "project_id", "environment_id", "observed_at");

CREATE TABLE "epoch_outbox_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epoch_outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "epoch_outbox_events_idempotency_key_key" ON "epoch_outbox_events"("idempotency_key");
CREATE INDEX "idx_epoch_outbox_status_available" ON "epoch_outbox_events"("status", "available_at");
CREATE INDEX "idx_epoch_outbox_workspace_created" ON "epoch_outbox_events"("workspace_id", "created_at");

ALTER TABLE "epoch_data_center_observations" ADD CONSTRAINT "epoch_data_center_observations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_data_center_observations" ADD CONSTRAINT "epoch_data_center_observations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "epoch_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_data_center_observations" ADD CONSTRAINT "epoch_data_center_observations_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "epoch_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_outbox_events" ADD CONSTRAINT "epoch_outbox_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
