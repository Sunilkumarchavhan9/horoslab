import { z } from "zod";

export const ListThreadsQuerySchema = z.object({
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  status: z.enum(["active", "archived", "blocked"]).optional(),
});

export const CreateThreadSchema = z.object({
  title: z.string().min(1, "title is required").max(200),
  goal: z.string().max(2000).optional(),
  workspace: z.string().min(1).default("default"),
  project: z.string().min(1).default("default"),
  repoPath: z.string().max(500).optional(),
});

export const UpdateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  goal: z.string().max(2000).optional(),
  status: z.enum(["active", "archived", "blocked"]).optional(),
  blockers: z.array(z.string().max(500)).max(30).optional(),
  plan: z.array(z.string().max(500)).max(40).optional(),
  runtimeState: z.enum(["idle", "running", "paused", "blocked"]).optional(),
  autonomousStage: z.enum(["plan", "execute", "verify", "pr"]).optional(),
  autonomousStageStatus: z
    .enum(["idle", "running", "blocked", "completed"])
    .optional(),
  linkedPrs: z.array(z.string().max(200)).max(20).optional(),
  repoPath: z.string().max(500).optional(),
});

export const SetAutonomousStageSchema = z.object({
  stage: z.enum(["plan", "execute", "verify", "pr"]),
  status: z.enum(["idle", "running", "blocked", "completed"]),
});

export const CheckpointSchema = z.object({
  label: z.string().min(1).max(200),
  summary: z.string().max(4000).optional(),
});

export const ApproveCheckpointSchema = z.object({
  checkpointId: z.string().min(1),
  approved: z.boolean(),
});

export const SetPlanSchema = z.object({
  steps: z.array(z.string().min(1).max(500)).min(1).max(30),
});

export const AdvanceStepSchema = z.object({
  status: z.enum(["done", "failed", "skipped"]),
});

export const LinkPrSchema = z.object({
  url: z.string().url().max(500),
});

export const PrReadyArtifactSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.literal("pr_ready"),
  url: z.string().url().max(500),
  number: z.number().int().positive().optional(),
  title: z.string().min(1).max(200),
  branch: z.string().min(1).max(200).optional(),
  baseBranch: z.string().min(1).max(120).optional(),
  ciStatus: z.enum(["pending", "passed", "failed", "merged"]),
  filesChanged: z.number().int().nonnegative().optional(),
  additions: z.number().int().nonnegative().optional(),
  deletions: z.number().int().nonnegative().optional(),
  timestamp: z.string().datetime(),
});

export const GeneratePlanSchema = z.object({
  question: z.string().min(1).max(2000).optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
});

export const ActivatePlanSchema = z.object({
  question: z.string().min(1).max(2000).optional(),
  steps: z.array(z.string().min(1).max(500)).min(1).max(30).optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
});

const HandoffPayloadSchema = z.object({
  codeChanges: z.array(z.string().min(1).max(500)).max(50).optional(),
  testResults: z.array(z.string().min(1).max(1000)).max(30).optional(),
  artifacts: z.array(z.string().min(1).max(500)).max(40).optional(),
  proposalIds: z.array(z.string().min(1).max(120)).max(30).optional(),
  reviewOutcomes: z.array(z.string().min(1).max(1000)).max(20).optional(),
  revisionReason: z.string().min(1).max(2000).optional(),
});

const HandoffMetadataSchema = z.object({
  confidence: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  notes: z.string().min(1).max(2000),
});

const ArtifactMetadataSchema = z.object({
  tags: z.array(z.string().min(1).max(80)).max(20).default([]),
  expiresAt: z.string().datetime().optional(),
  stage: z.enum(["plan", "execute", "verify", "pr"]).optional(),
  verificationRequired: z.boolean().optional(),
  sourceChangeId: z.string().min(1).max(120).optional(),
  sourceProvider: z.enum(["preview", "browser", "vscode", "playwright", "custom"]).optional(),
  recordingArtifactId: z.string().min(1).max(120).optional(),
});

export const CreateHandoffSchema = z.object({
  source: z.enum(["manager", "coder", "reviewer", "verifier"]),
  target: z.enum(["manager", "coder", "reviewer", "verifier"]),
  taskId: z.string().min(1).max(120),
  payload: HandoffPayloadSchema.default({}),
  metadata: HandoffMetadataSchema,
  requirements: z.array(z.string().min(1).max(500)).max(40).default([]),
  compressedContext: z.string().min(1).max(4000),
});

export const ListHandoffsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateArtifactSchema = z.object({
  type: z.enum(["code", "test", "preview", "recording", "log", "review_note"]),
  producer: z.enum(["manager", "coder", "reviewer", "verifier"]),
  consumers: z.array(z.enum(["manager", "coder", "reviewer", "verifier"])).max(8).default([]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  content: z.string().max(20000).optional(),
  metadata: ArtifactMetadataSchema.default({ tags: [] }),
  sourceHandoffId: z.string().min(1).max(120).optional(),
});

export const StartExecutionTaskSchema = z.object({
  taskId: z.string().min(1).max(120).optional(),
  activeRole: z.enum(["manager", "coder", "reviewer", "verifier"]).optional(),
});

export const StartExecutionStepSchema = z.object({
  stepId: z.string().min(1).max(120),
  role: z.enum(["manager", "coder", "reviewer", "verifier"]).optional(),
});

export const CompleteExecutionStepSchema = z.object({
  stepId: z.string().min(1).max(120),
  artifactIds: z.array(z.string().min(1).max(500)).max(40).default([]),
  proposalIds: z.array(z.string().min(1).max(120)).max(30).default([]),
  handoffId: z.string().min(1).max(120).optional(),
  approvalStatus: z
    .enum(["not_required", "pending", "approved", "rejected"])
    .optional(),
  note: z.string().min(1).max(2000).optional(),
});

export const FailExecutionStepSchema = z.object({
  stepId: z.string().min(1).max(120),
  reason: z.string().min(1).max(2000),
});

export const RequestExecutionRevisionSchema = z.object({
  reason: z.string().min(1).max(2000),
  targetRole: z.enum(["manager", "coder", "reviewer", "verifier"]).optional(),
});

export const OrchestrateExecutionSchema = z.object({
  reviewDecision: z.enum(["approve", "reject"]).optional(),
  note: z.string().min(1).max(2000).optional(),
});

export const EnqueueMythicWorkerSchema = z.object({
  reviewDecision: z.enum(["approve", "reject"]).optional(),
  note: z.string().min(1).max(2000).optional(),
});

export const SubmitReviewDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().min(1).max(2000).optional(),
});

export const RetryWorkerJobSchema = z.object({
  jobId: z.string().min(1).max(120),
});

export const ResolveArtifactQuerySchema = z.object({
  uri: z.string().min(1).max(500),
});

export const ListArtifactsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateDesktopSessionSchema = z.object({
  provider: z.enum(["preview", "browser", "vscode", "playwright", "custom"]).optional(),
  state: z.enum(["idle", "starting", "live", "stale", "blocked", "error"]).optional(),
  osType: z.enum(["ubuntu", "windows"]).optional(),
  previewUrl: z.string().url().max(2000).optional(),
  controlUrl: z.string().url().max(2000).optional(),
  providerSessionId: z.string().min(1).max(200).optional(),
  runtimeMessage: z.string().max(2000).optional(),
  previewArtifactId: z.string().min(1).max(120).optional(),
  recordingArtifactId: z.string().min(1).max(120).optional(),
  lastFrameAt: z.string().datetime().optional(),
});

export const WakeDesktopSchema = z.object({
  osType: z.enum(["ubuntu", "windows"]).optional(),
});

export const StartDesktopSchema = WakeDesktopSchema;

export const StopDesktopSchema = z.object({
  osType: z.enum(["ubuntu", "windows"]).optional(),
});

export const CaptureDesktopSchema = z.object({
  osType: z.enum(["ubuntu", "windows"]).optional(),
});

const DesktopInputEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mouse_move"),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("mouse_click"),
    x: z.number(),
    y: z.number(),
    button: z.enum(["left", "middle", "right"]).optional(),
    action: z.enum(["down", "up", "click", "double_click"]).optional(),
  }),
  z.object({
    type: z.literal("scroll"),
    x: z.number().optional(),
    y: z.number().optional(),
    deltaX: z.number(),
    deltaY: z.number(),
  }),
  z.object({
    type: z.literal("key"),
    key: z.string().min(1).max(120),
    action: z.enum(["down", "up", "press"]).optional(),
    modifiers: z
      .array(z.enum(["ctrl", "alt", "shift", "meta"]))
      .max(4)
      .optional(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1).max(2000),
  }),
]);

export const DesktopInputSchema = z.object({
  osType: z.enum(["ubuntu", "windows"]).optional(),
  event: DesktopInputEventSchema,
});

export const ShellDimensionsSchema = z.object({
  cols: z.number().int().min(20).max(400).optional(),
  rows: z.number().int().min(10).max(200).optional(),
});

export const OpenShellSessionSchema = ShellDimensionsSchema;

export const RunShellCommandSchema = ShellDimensionsSchema.extend({
  command: z.string().min(1, "command is required").max(8000),
});

export const SubmitShellPromptSchema = ShellDimensionsSchema.extend({
  prompt: z.string().min(1, "prompt is required").max(4000),
  currentLine: z.string().max(4000).optional(),
  recentHistory: z.string().max(8000).optional(),
});

const FileChangeDraftSchema = z.object({
  filepath: z.string().min(1).max(500),
  instruction: z.string().max(2000).optional(),
  originalText: z.string().max(100000),
  newText: z.string().max(100000),
  startLine: z.number().int().nonnegative(),
  startCharacter: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  endCharacter: z.number().int().nonnegative(),
  checkpointId: z.string().min(1).optional(),
});

export const ContinueThreadSchema = z.object({
  question: z.string().min(1).max(4000),
  mode: z.enum(["build_next", "debug_next", "learn_next"]).optional(),
  topK: z.number().int().min(1).max(20).optional(),
  includeArchived: z.boolean().optional(),
  workspace: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
  environment: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  savePlan: z.boolean().default(true),
  checkpoint: z.boolean().default(true),
  proposedChange: FileChangeDraftSchema.optional(),
});

export const CreateFileChangeSchema = FileChangeDraftSchema;

export const ListFileChangesQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "applied", "failed"]).optional(),
});

export const MarkFileChangeAppliedSchema = z.object({
  error: z.string().max(2000).optional(),
});

export const RecordRetrievalSchema = z.object({
  question: z.string().min(1).max(4000),
  memoryIds: z.array(z.string().min(1)).max(40).default([]),
  provenance: z
    .array(
      z.object({
        label: z.string().min(1).max(300),
        sourceType: z.string().min(1).max(80),
        memoryId: z.string().optional(),
        snippet: z.string().max(2000).optional(),
        score: z.number().optional(),
      }),
    )
    .max(40)
    .default([]),
});
