CREATE TABLE "epoch_outcomes" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "mission_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "status" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "verification_id" TEXT,
  "evidence_ids" JSONB NOT NULL DEFAULT '[]',
  "customer_result" JSONB NOT NULL DEFAULT '{}',
  "correlation_id" TEXT NOT NULL,
  "trace_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "epoch_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "epoch_experiences" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "outcome_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "lessons" JSONB NOT NULL DEFAULT '[]',
  "confidence" DOUBLE PRECISION NOT NULL,
  "reusable" BOOLEAN NOT NULL DEFAULT true,
  "context" JSONB NOT NULL DEFAULT '{}',
  "correlation_id" TEXT NOT NULL,
  "trace_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "epoch_experiences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "epoch_outcomes_mission_id_key" ON "epoch_outcomes"("mission_id");
CREATE INDEX "idx_epoch_outcomes_workspace_status_updated" ON "epoch_outcomes"("workspace_id", "status", "updated_at");
CREATE UNIQUE INDEX "epoch_experiences_outcome_id_key" ON "epoch_experiences"("outcome_id");
CREATE INDEX "idx_epoch_experiences_workspace_reusable_updated" ON "epoch_experiences"("workspace_id", "reusable", "updated_at");

ALTER TABLE "epoch_outcomes"
  ADD CONSTRAINT "epoch_outcomes_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_outcomes"
  ADD CONSTRAINT "epoch_outcomes_mission_id_fkey"
  FOREIGN KEY ("mission_id") REFERENCES "epoch_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_experiences"
  ADD CONSTRAINT "epoch_experiences_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epoch_experiences"
  ADD CONSTRAINT "epoch_experiences_outcome_id_fkey"
  FOREIGN KEY ("outcome_id") REFERENCES "epoch_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
