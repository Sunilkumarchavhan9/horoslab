-- Epoch webhook delivery runtime
-- Persist webhook delivery attempts and store the delivery secret on endpoints so outbound signatures can be verified.

ALTER TABLE "webhook_endpoints"
  ADD COLUMN IF NOT EXISTS "secret" TEXT;

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "endpoint_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "event_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 8,
  "request_body" JSONB NOT NULL,
  "request_headers" JSONB NOT NULL,
  "response_status" INTEGER,
  "response_body" JSONB,
  "error_message" TEXT,
  "next_retry_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_deliveries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_workspace_status_retry" ON "webhook_deliveries"("workspace_id", "status", "next_retry_at");
CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_endpoint_created" ON "webhook_deliveries"("endpoint_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_workspace_created" ON "webhook_deliveries"("workspace_id", "created_at");
