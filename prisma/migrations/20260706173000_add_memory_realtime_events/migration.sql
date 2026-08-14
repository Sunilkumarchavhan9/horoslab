CREATE TABLE IF NOT EXISTS "memory_realtime_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT,
  "kind" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "subject_json" TEXT,
  "payload_json" TEXT NOT NULL DEFAULT '{}',
  "occurred_at" TEXT NOT NULL,
  CONSTRAINT "memory_realtime_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_memory_realtime_events_user_occurred"
  ON "memory_realtime_events" ("user_id", "occurred_at");

CREATE INDEX IF NOT EXISTS "idx_memory_realtime_events_org_occurred"
  ON "memory_realtime_events" ("org_id", "occurred_at");

CREATE INDEX IF NOT EXISTS "idx_memory_realtime_events_kind_occurred"
  ON "memory_realtime_events" ("kind", "occurred_at");
