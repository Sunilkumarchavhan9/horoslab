CREATE TABLE IF NOT EXISTS "epoch_workers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "protocol_version" TEXT NOT NULL DEFAULT 'epoch.worker.v1',
  "status" TEXT NOT NULL DEFAULT 'available',
  "capabilities" JSONB NOT NULL DEFAULT '[]',
  "project_scope" JSONB NOT NULL DEFAULT '{}',
  "max_concurrency" INTEGER NOT NULL DEFAULT 1,
  "active_leases" INTEGER NOT NULL DEFAULT 0,
  "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "history" JSONB NOT NULL DEFAULT '[]',
  "retired_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_workers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_epoch_workers_workspace_status_heartbeat" ON "epoch_workers"("workspace_id", "status", "last_heartbeat");
CREATE INDEX IF NOT EXISTS "idx_epoch_workers_workspace_kind_status" ON "epoch_workers"("workspace_id", "kind", "status");

CREATE TABLE IF NOT EXISTS "epoch_worker_leases" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "worker_id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL UNIQUE,
  "fencing_token" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "leased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "released_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epoch_worker_leases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "epoch_worker_leases_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "epoch_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_epoch_worker_leases_worker_status" ON "epoch_worker_leases"("workspace_id", "worker_id", "status");
CREATE INDEX IF NOT EXISTS "idx_epoch_worker_leases_expiry_status" ON "epoch_worker_leases"("workspace_id", "expires_at", "status");
