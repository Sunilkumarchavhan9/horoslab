-- CreateTable
CREATE TABLE "future_instruction_applications" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "instruction_id" TEXT NOT NULL,
    "agent_run_id" TEXT,
    "outcome_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "impact" JSONB NOT NULL,
    "proof" JSONB NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "future_instruction_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruction_transformations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "instruction_id" TEXT NOT NULL,
    "outcome_id" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'outcome',
    "raw_title" TEXT NOT NULL,
    "raw_ref" TEXT NOT NULL,
    "instruction_title" TEXT NOT NULL,
    "proof" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruction_transformations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_future_instruction_applications_workspace_applied" ON "future_instruction_applications"("workspace_id", "applied_at");

-- CreateIndex
CREATE INDEX "idx_future_instruction_applications_instruction_applied" ON "future_instruction_applications"("instruction_id", "applied_at");

-- CreateIndex
CREATE INDEX "idx_future_instruction_applications_agent_run" ON "future_instruction_applications"("agent_run_id");

-- CreateIndex
CREATE INDEX "idx_instruction_transformations_workspace_created" ON "instruction_transformations"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_instruction_transformations_instruction" ON "instruction_transformations"("instruction_id");

-- CreateIndex
CREATE INDEX "idx_instruction_transformations_outcome" ON "instruction_transformations"("outcome_id");

-- AddForeignKey
ALTER TABLE "future_instruction_applications" ADD CONSTRAINT "future_instruction_applications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "future_instruction_applications" ADD CONSTRAINT "future_instruction_applications_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "future_agent_instructions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruction_transformations" ADD CONSTRAINT "instruction_transformations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruction_transformations" ADD CONSTRAINT "instruction_transformations_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "future_agent_instructions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
