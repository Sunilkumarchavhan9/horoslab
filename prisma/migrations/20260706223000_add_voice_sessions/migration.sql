CREATE TABLE IF NOT EXISTS "voice_sessions" (
  "user_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "workspace" TEXT,
  "project" TEXT,
  "thread_id" TEXT,
  "started_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "last_chunk_at" TEXT,
  "ended_at" TEXT,
  "chunk_count" INTEGER NOT NULL DEFAULT 0,
  "total_characters" INTEGER NOT NULL DEFAULT 0,
  "metadata_json" TEXT,

  CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("user_id", "session_id")
);

CREATE INDEX IF NOT EXISTS "idx_voice_sessions_user_updated"
  ON "voice_sessions"("user_id", "updated_at");

CREATE INDEX IF NOT EXISTS "idx_voice_sessions_user_status"
  ON "voice_sessions"("user_id", "status");
