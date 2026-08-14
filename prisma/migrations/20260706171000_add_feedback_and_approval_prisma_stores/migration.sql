CREATE TABLE IF NOT EXISTS "continuity_feedback" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "kind" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "useful" BOOLEAN NOT NULL,
  "request_id" TEXT,
  "project" TEXT,
  "agent_id" TEXT,
  "missing_context_json" TEXT NOT NULL DEFAULT '[]',
  "wrong_context_json" TEXT NOT NULL DEFAULT '[]',
  "should_remember_json" TEXT NOT NULL DEFAULT '[]',
  "note" TEXT,
  "created_at" TEXT NOT NULL,
  CONSTRAINT "continuity_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_continuity_feedback_user_org_created"
  ON "continuity_feedback" ("user_id", "org_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_continuity_feedback_kind_created"
  ON "continuity_feedback" ("kind", "created_at");

CREATE TABLE IF NOT EXISTS "memoryignition_approval_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "source" TEXT NOT NULL,
  "runtime_event_id" TEXT NOT NULL,
  "guard_moment" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "risk_level" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "approval_required" BOOLEAN NOT NULL,
  "blocked" BOOLEAN NOT NULL,
  "matched_risky_files_json" TEXT NOT NULL DEFAULT '[]',
  "matched_forbidden_actions_json" TEXT NOT NULL DEFAULT '[]',
  "missing_required_tests_json" TEXT NOT NULL DEFAULT '[]',
  "next_required_actions_json" TEXT NOT NULL DEFAULT '[]',
  "trace_proof_ids_json" TEXT NOT NULL DEFAULT '[]',
  "guard_proof_json" TEXT NOT NULL DEFAULT '{}',
  "outcome_links_json" TEXT NOT NULL DEFAULT '[]',
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "reviewed_at" TEXT,
  "reviewed_by" TEXT,
  "review_note" TEXT,
  CONSTRAINT "memoryignition_approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_mi_approvals_user_org_status_updated"
  ON "memoryignition_approval_requests" ("user_id", "org_id", "status", "updated_at");

CREATE INDEX IF NOT EXISTS "idx_mi_approvals_runtime_event"
  ON "memoryignition_approval_requests" ("runtime_event_id");

CREATE INDEX IF NOT EXISTS "idx_mi_approvals_guard_action"
  ON "memoryignition_approval_requests" ("guard_moment", "action");
