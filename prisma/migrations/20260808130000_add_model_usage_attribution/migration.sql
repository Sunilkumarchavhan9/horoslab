ALTER TABLE "model_usage_events"
ADD COLUMN IF NOT EXISTS "model" TEXT;
