-- CreateTable
CREATE TABLE "experience_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "proof" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "status" TEXT NOT NULL DEFAULT 'captured',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experience_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "human_corrections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "proof" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "human_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "outcome_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "proof" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_candidates" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "outcome_id" TEXT,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "required_tools" JSONB NOT NULL DEFAULT '[]',
    "required_tests" JSONB NOT NULL DEFAULT '[]',
    "proof" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_experience_records_workspace_created" ON "experience_records"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_experience_records_outcome" ON "experience_records"("outcome_id");

-- CreateIndex
CREATE INDEX "idx_human_corrections_workspace_status_created" ON "human_corrections"("workspace_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_human_corrections_outcome" ON "human_corrections"("outcome_id");

-- CreateIndex
CREATE INDEX "idx_lessons_workspace_status_created" ON "lessons"("workspace_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_lessons_outcome" ON "lessons"("outcome_id");

-- CreateIndex
CREATE INDEX "idx_skill_candidates_workspace_status_created" ON "skill_candidates"("workspace_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_skill_candidates_outcome" ON "skill_candidates"("outcome_id");

