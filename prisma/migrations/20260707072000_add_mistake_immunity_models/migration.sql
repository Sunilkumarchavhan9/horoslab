CREATE TABLE IF NOT EXISTS "mistake_immunity_rules" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "risk_category" TEXT NOT NULL DEFAULT 'Reliability',
    "risk_level" TEXT NOT NULL DEFAULT 'medium',
    "trigger_context" JSONB NOT NULL,
    "prevention_instruction" TEXT NOT NULL,
    "risky_files" JSONB NOT NULL DEFAULT '[]',
    "required_tests" JSONB NOT NULL DEFAULT '[]',
    "approval_requirement" TEXT,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "source_ref" TEXT,
    "proof" JSONB NOT NULL,
    "mistakes_avoided" INTEGER NOT NULL DEFAULT 0,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mistake_immunity_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mistake_rule_triggers" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "agent_run_id" TEXT,
    "outcome_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'runtime',
    "matched_context" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'matched',
    "proof" JSONB NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mistake_rule_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mistake_replay_tests" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "command" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSONB NOT NULL DEFAULT '{}',
    "proof" JSONB NOT NULL,
    "run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mistake_replay_tests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_mistake_rules_workspace_status_created" ON "mistake_immunity_rules"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_mistake_rules_workspace_risk" ON "mistake_immunity_rules"("workspace_id", "risk_level");
CREATE INDEX IF NOT EXISTS "idx_mistake_triggers_workspace_triggered" ON "mistake_rule_triggers"("workspace_id", "triggered_at");
CREATE INDEX IF NOT EXISTS "idx_mistake_triggers_rule_triggered" ON "mistake_rule_triggers"("rule_id", "triggered_at");
CREATE INDEX IF NOT EXISTS "idx_mistake_triggers_agent_run" ON "mistake_rule_triggers"("agent_run_id");
CREATE INDEX IF NOT EXISTS "idx_mistake_triggers_outcome" ON "mistake_rule_triggers"("outcome_id");
CREATE INDEX IF NOT EXISTS "idx_mistake_replay_tests_workspace_status_created" ON "mistake_replay_tests"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_mistake_replay_tests_rule_created" ON "mistake_replay_tests"("rule_id", "created_at");

ALTER TABLE "mistake_immunity_rules"
    ADD CONSTRAINT "mistake_immunity_rules_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mistake_rule_triggers"
    ADD CONSTRAINT "mistake_rule_triggers_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mistake_rule_triggers"
    ADD CONSTRAINT "mistake_rule_triggers_rule_id_fkey"
    FOREIGN KEY ("rule_id") REFERENCES "mistake_immunity_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mistake_replay_tests"
    ADD CONSTRAINT "mistake_replay_tests_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mistake_replay_tests"
    ADD CONSTRAINT "mistake_replay_tests_rule_id_fkey"
    FOREIGN KEY ("rule_id") REFERENCES "mistake_immunity_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
