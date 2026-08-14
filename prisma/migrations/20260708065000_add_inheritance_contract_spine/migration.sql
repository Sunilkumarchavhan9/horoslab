-- First-launch/full-plan spine: make the Inheritance Contract a first-class product object.
-- Guarded for existing local/dev databases that may already have partial masterplan tables.

CREATE TABLE IF NOT EXISTS "inheritance_contracts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "target_agent" TEXT NOT NULL,
  "target_format" TEXT NOT NULL,
  "memory" JSONB NOT NULL DEFAULT '[]',
  "rules" JSONB NOT NULL DEFAULT '[]',
  "risks" JSONB NOT NULL DEFAULT '[]',
  "required_tests" JSONB NOT NULL DEFAULT '[]',
  "permissions" JSONB NOT NULL DEFAULT '{}',
  "approved_skills" JSONB NOT NULL DEFAULT '[]',
  "blocked_actions" JSONB NOT NULL DEFAULT '[]',
  "proof" JSONB NOT NULL DEFAULT '{}',
  "outcome_schema" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "readiness_score" INTEGER NOT NULL DEFAULT 0,
  "memory_quality" INTEGER NOT NULL DEFAULT 0,
  "risk_level" TEXT NOT NULL DEFAULT 'low',
  "source_type" TEXT NOT NULL DEFAULT 'memoryignition',
  "source_ref" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inheritance_contracts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "inheritance_packages" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "agent_black_box_records" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "evaluation_runs" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inheritance_packages_contract_id_fkey'
  ) THEN
    ALTER TABLE "inheritance_packages"
      ADD CONSTRAINT "inheritance_packages_contract_id_fkey"
      FOREIGN KEY ("contract_id") REFERENCES "inheritance_contracts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_contract_id_fkey'
  ) THEN
    ALTER TABLE "agent_runs"
      ADD CONSTRAINT "agent_runs_contract_id_fkey"
      FOREIGN KEY ("contract_id") REFERENCES "inheritance_contracts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_black_box_records_contract_id_fkey'
  ) THEN
    ALTER TABLE "agent_black_box_records"
      ADD CONSTRAINT "agent_black_box_records_contract_id_fkey"
      FOREIGN KEY ("contract_id") REFERENCES "inheritance_contracts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evaluation_runs_contract_id_fkey'
  ) THEN
    ALTER TABLE "evaluation_runs"
      ADD CONSTRAINT "evaluation_runs_contract_id_fkey"
      FOREIGN KEY ("contract_id") REFERENCES "inheritance_contracts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_inheritance_contracts_workspace_status_created" ON "inheritance_contracts"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_inheritance_contracts_workspace_agent" ON "inheritance_contracts"("workspace_id", "target_agent");
CREATE INDEX IF NOT EXISTS "idx_inheritance_packages_contract" ON "inheritance_packages"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_agent_runs_contract" ON "agent_runs"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_agent_black_box_contract" ON "agent_black_box_records"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_evaluation_runs_contract" ON "evaluation_runs"("contract_id");
