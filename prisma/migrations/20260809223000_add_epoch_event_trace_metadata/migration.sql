ALTER TABLE "memory_realtime_events"
  ADD COLUMN "contract_version" TEXT NOT NULL DEFAULT 'epoch.event.v1',
  ADD COLUMN "correlation_id" TEXT,
  ADD COLUMN "causation_id" TEXT,
  ADD COLUMN "trace_id" TEXT;

CREATE INDEX "idx_memory_realtime_events_correlation_occurred"
  ON "memory_realtime_events"("correlation_id", "occurred_at");

CREATE INDEX "idx_memory_realtime_events_trace_occurred"
  ON "memory_realtime_events"("trace_id", "occurred_at");
