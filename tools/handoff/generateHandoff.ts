import fs from "fs";
import { telemetryEvent } from "../..//src/lib/telemetry";
import path from "path";
import { randomUUID } from "node:crypto";

export type AgentRole = "manager" | "coder" | "reviewer" | "verifier";

export interface FileDiff {
  path: string;
  diff: string;
  language?: string;
}

export interface TestReport {
  runner: string;
  passed: number;
  failed: number;
  coverage?: number;
  reportUri?: string;
}

export interface ArtifactReference {
  id: string;
  type: string;
  uri: string;
}

export interface Handoff {
  handoffId: string;
  source: AgentRole;
  target: AgentRole;
  taskId: string;
  timestamp: number;
  payload: {
    codeChanges?: FileDiff[];
    testResults?: TestReport;
    artifacts?: ArtifactReference[];
  };
  metadata: {
    confidence: number;
    completeness: number;
    notes?: string;
  };
  requirements?: string[];
  compressedContext?: string;
}

export function generateHandoff(h: Partial<Handoff>): Handoff {
  const now = Date.now();
  const handoff: Handoff = {
    handoffId: h.handoffId || randomUUID(),
    source: (h.source as AgentRole) || "manager",
    target: (h.target as AgentRole) || "coder",
    taskId: h.taskId || "TASK-000",
    timestamp: h.timestamp || now,
    payload: h.payload || {},
    metadata: h.metadata || { confidence: 0.8, completeness: 0.9 },
    requirements: h.requirements || [],
    compressedContext: h.compressedContext || "",
  };
  // emit telemetry for handoff creation
  try {
    telemetryEvent("handoff.generate", {
      handoffId: handoff.handoffId,
      taskId: handoff.taskId,
      source: handoff.source,
      target: handoff.target,
    });
  } catch {
    // noop
  }

  return handoff;
}

export function writeHandoffToFile(handoff: Handoff, outDir = process.cwd()) {
  const file = path.join(
    outDir,
    `HANDOFF-${handoff.taskId}-${handoff.handoffId}.json`,
  );
  fs.writeFileSync(file, JSON.stringify(handoff, null, 2), "utf8");
  return file;
}

// If invoked directly, create a sample handoff
if (require.main === module) {
  const sample = generateHandoff({
    source: "manager",
    target: "coder",
    taskId: "MYTHIC-007",
    payload: {
      codeChanges: [
        {
          path: "app/api/feedback/route.ts",
          diff: "@@ -23,7 +23,11 @@\n- throw emailError\n+ try { await sendEmail() } catch (e) { console.error(e) }",
          language: "typescript",
        },
      ],
      artifacts: [
        {
          id: "uuid-123",
          type: "test-report",
          uri: "artifact://uuid-123/test-report",
        },
      ],
    },
    metadata: {
      confidence: 0.92,
      completeness: 1.0,
      notes: "Repro tests included",
    },
    requirements: [
      "wrap sendEmail call in try/catch",
      "add unit test for failure case",
    ],
    compressedContext: "Feedback endpoint 500 on email send; reproduction steps: ...",
  });

  const out = writeHandoffToFile(
    sample,
    path.join(process.cwd(), "tools", "handoff"),
  );
  console.log("Wrote handoff to", out);
}
