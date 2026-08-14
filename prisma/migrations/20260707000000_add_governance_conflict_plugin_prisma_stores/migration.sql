CREATE TABLE IF NOT EXISTS "governance_policy_settings" (
    "user_id" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "saved_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "governance_policy_settings_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_governance_policy_settings_updated" ON "governance_policy_settings"("updated_at");

CREATE TABLE IF NOT EXISTS "conflict_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "conflict_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_conflict_actions_user_created" ON "conflict_actions"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_conflict_actions_user_type_created" ON "conflict_actions"("user_id", "type", "created_at");

CREATE TABLE IF NOT EXISTS "conflict_queue_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "conflict_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_conflict_queue_user_state_created" ON "conflict_queue_items"("user_id", "state", "created_at");
CREATE INDEX IF NOT EXISTS "idx_conflict_queue_user_severity_created" ON "conflict_queue_items"("user_id", "severity", "created_at");

CREATE TABLE IF NOT EXISTS "governance_review_queue_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,

    CONSTRAINT "governance_review_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_governance_review_user_state_created" ON "governance_review_queue_items"("user_id", "state", "created_at");

CREATE TABLE IF NOT EXISTS "plugin_user_state_settings" (
    "user_id" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "plugin_user_state_settings_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_plugin_user_state_settings_updated" ON "plugin_user_state_settings"("updated_at");
