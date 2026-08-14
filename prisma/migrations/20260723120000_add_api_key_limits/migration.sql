-- Add API key limit metadata for the Epoch runtime create dialog.
ALTER TABLE "public"."api_keys"
  ADD COLUMN IF NOT EXISTS "credit_limit" INTEGER,
  ADD COLUMN IF NOT EXISTS "reset_limit_every" TEXT;
