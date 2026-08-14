ALTER TABLE "epoch_missions"
  ADD COLUMN IF NOT EXISTS "repository" TEXT,
  ADD COLUMN IF NOT EXISTS "base_branch" TEXT,
  ADD COLUMN IF NOT EXISTS "working_branch" TEXT;
