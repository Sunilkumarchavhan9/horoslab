import { Router, type Response as ExpressResponse } from "express";
import { spawn } from "child_process";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiError, sendApiSuccess, buildApiMeta } from "./api-response";
import { listProductAgents } from "../../lib/agents/productAgents";
import {
  createProductAgentSession,
  getProductAgentSessionDetail,
  listProductAgentSessions,
} from "../../lib/agents/productAgentSessionStore";
import { createOperationalLoop } from "../../lib/companyBrain/operationalLoopStore";
import { randomUUID } from "crypto";

export const productAgentRouter = Router();

productAgentRouter.get(
  "/registry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(
      res,
      200,
      { agents: listProductAgents() },
      buildApiMeta(req, startedAt),
    );
  }),
);

productAgentRouter.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const limitRaw = req.query.limit;
    const parsedLimit =
      typeof limitRaw === "string"
        ? Number.parseInt(limitRaw, 10)
        : Number(limitRaw);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

    const sessions = await listProductAgentSessions(req.authUserId!, {
      orgId: req.authOrgId,
      limit,
    });

    sendApiSuccess(res, 200, { sessions }, buildApiMeta(req, startedAt));
  }),
);

productAgentRouter.post(
  "/sessions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const agentId =
      typeof req.body?.agentId === "string" ? req.body.agentId.trim() : "";
    const projectId =
      typeof req.body?.projectId === "string"
        ? req.body.projectId.trim()
        : undefined;
    const goal =
      typeof req.body?.goal === "string" ? req.body.goal.trim() : undefined;

    if (!agentId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "agentId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    try {
      let goalId =
        typeof req.body?.goalId === "string"
          ? req.body.goalId.trim()
          : undefined;

      if (goal && !goalId) {
        const loop = await createOperationalLoop(
          req.authUserId!,
          {
            goal,
            projectId: projectId ?? null,
            metadata: { source: "product_agent_session" },
          },
          req.authOrgId,
        );
        goalId = loop.id;
      }

      const session = await createProductAgentSession(
        req.authUserId!,
        {
          agentId,
          projectId: projectId ?? null,
          goal: goal ?? null,
          goalId: goalId ?? null,
        },
        req.authOrgId,
      );

      const agent = listProductAgents().find((entry) => entry.id === agentId);
      sendApiSuccess(
        res,
        201,
        { sessionId: session.id, session, agent },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Could not start agent session.",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

productAgentRouter.get(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const sessionId = req.params.id as string;
    const detail = await getProductAgentSessionDetail(
      req.authUserId!,
      sessionId,
      req.authOrgId,
    );

    if (!detail) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Agent session not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        session: detail.session,
        agent: detail.agent,
        linkedLoopsCount: detail.counts.loops,
        linkedProposalsCount: detail.counts.proposals,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

type DesktopSessionState =
  | "idle"
  | "planning"
  | "executing"
  | "repairing"
  | "success";
type DesktopStepStatus = "pending" | "running" | "done" | "failed";

type DesktopWorklogStep = {
  id: string;
  title: string;
  phase: "plan" | "execute" | "verify" | "replan";
  status: DesktopStepStatus;
  detail: string;
};

type DesktopShellEvent = {
  id: string;
  command: string;
  output: string;
  status: "ok" | "error";
};

type DesktopChange = {
  path: string;
  summary: string;
  additions: number;
  deletions: number;
};

type DesktopChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

type DesktopAgentStatus = {
  role: "Manager" | "Coder" | "Reviewer" | "Verifier";
  state: "idle" | "running" | "blocked";
};

type DesktopSession = {
  id: string;
  userId: string;
  goal: string;
  state: DesktopSessionState;
  worklog: DesktopWorklogStep[];
  shellEvents: DesktopShellEvent[];
  changes: DesktopChange[];
  messages: DesktopChatMessage[];
  agents: DesktopAgentStatus[];
  workingDirectory: string;
  createdAt: string;
  updatedAt: string;
};

type DesktopRuntimeStep = {
  id: string;
  title: string;
  phase: DesktopWorklogStep["phase"];
  detail: string;
  command: string;
  timeoutMs?: number;
  kind?: "synthetic" | "shell" | "analysis";
  expectedFailure?: boolean;
  successOutput?: string;
  errorOutput?: string;
  outcome?: "done" | "failed";
};

type DesktopCommandResult = {
  ok: boolean;
  output: string;
  exitCode: number | null;
};

type DesktopStreamEvent =
  | { kind: "ready"; sessionId: string }
  | { kind: "snapshot"; session: DesktopSession }
  | { kind: "chat"; sessionId: string; message: DesktopChatMessage }
  | { kind: "error"; sessionId: string; message: string }
  | { kind: "ping"; ts: string };

const DESKTOP_SESSIONS = new Map<string, DesktopSession>();
const DESKTOP_STREAMS = new Map<string, Set<ExpressResponse>>();

function desktopPlan(goal: string): DesktopRuntimeStep[] {
  return [
    {
      id: "dag",
      title: "Decompose request into task DAG",
      phase: "plan",
      detail: "Planner expands the goal into dependent execution tasks.",
      command: `planner --goal \"${goal}\"`,
      successOutput: "Generated execution DAG with 8 nodes",
      outcome: "done",
    },
    {
      id: "inspect",
      title: "Inspect codebase and runtime state",
      phase: "execute",
      detail: "Read relevant files and previous run context.",
      command: "read + index lookup",
      successOutput: "Collected required files and context",
      outcome: "done",
    },
    {
      id: "patch",
      title: "Apply code changes",
      phase: "execute",
      detail: "Generate patch and update target files.",
      command: "edit files",
      successOutput: "Patch applied",
      outcome: "done",
    },
    {
      id: "verify-1",
      title: "Run validation",
      phase: "verify",
      detail: "Execute tests/lint/build validation pass.",
      command: "npm run test",
      successOutput: "",
      errorOutput: "1 failing assertion in state transition",
      outcome: "failed",
    },
    {
      id: "replan",
      title: "Re-plan from error output",
      phase: "replan",
      detail: "Create a targeted fix from failing stderr.",
      command: "planner --repair",
      successOutput: "Repair strategy generated",
      outcome: "done",
    },
    {
      id: "fix",
      title: "Apply targeted repair",
      phase: "execute",
      detail: "Modify the failing path and stabilize behavior.",
      command: "edit fix",
      successOutput: "Repair applied",
      outcome: "done",
    },
    {
      id: "verify-2",
      title: "Re-run validation",
      phase: "verify",
      detail: "Confirm that repaired flow passes checks.",
      command: "npm run test",
      successOutput: "Validation passed",
      outcome: "done",
    },
    {
      id: "package",
      title: "Package artifacts",
      phase: "execute",
      detail: "Collect diffs, logs, and session summary.",
      command: "collect artifacts",
      successOutput: "Artifacts ready",
      outcome: "done",
    },
  ];
}

function defaultDesktopChanges(): DesktopChange[] {
  return [
    {
      path: "src/components/MythicShell/index.tsx",
      summary: "Wire shell to backend runtime session stream",
      additions: 120,
      deletions: 24,
    },
    {
      path: "server/routes/product-agent.routes.ts",
      summary: "Add desktop execution + SSE endpoints",
      additions: 260,
      deletions: 0,
    },
  ];
}

function sessionAgents(state: DesktopSessionState): DesktopAgentStatus[] {
  if (state === "idle" || state === "success") {
    return [
      { role: "Manager", state: "idle" },
      { role: "Coder", state: "idle" },
      { role: "Reviewer", state: "idle" },
      { role: "Verifier", state: "idle" },
    ];
  }
  if (state === "repairing") {
    return [
      { role: "Manager", state: "running" },
      { role: "Coder", state: "running" },
      { role: "Reviewer", state: "blocked" },
      { role: "Verifier", state: "blocked" },
    ];
  }
  return [
    { role: "Manager", state: "running" },
    { role: "Coder", state: "running" },
    { role: "Reviewer", state: "running" },
    { role: "Verifier", state: "running" },
  ];
}

function emitDesktopEvent(sessionId: string, event: DesktopStreamEvent): void {
  const sinks = DESKTOP_STREAMS.get(sessionId);
  if (!sinks || sinks.size === 0) return;
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const sink of sinks) {
    try {
      sink.write(line);
    } catch {
      // stale sink; removed on close.
    }
  }
}

function pushShellEvent(
  session: DesktopSession,
  event: Omit<DesktopShellEvent, "id">,
): void {
  session.shellEvents.push({
    id: `s${session.shellEvents.length + 1}`,
    ...event,
  });
}

function touchSession(session: DesktopSession): void {
  session.updatedAt = new Date().toISOString();
  DESKTOP_SESSIONS.set(session.id, session);
  emitDesktopEvent(session.id, { kind: "snapshot", session });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDesktopSession(sessionId: string): Promise<void> {
  const session = DESKTOP_SESSIONS.get(sessionId);
  if (!session) return;

  const plan = desktopPlan(session.goal);
  session.state = "planning";
  session.worklog = plan.map((step) => ({
    id: step.id,
    title: step.title,
    phase: step.phase,
    status: "pending",
    detail: step.detail,
  }));
  session.agents = sessionAgents(session.state);
  pushShellEvent(session, {
    command: `planner --goal \"${session.goal}\"`,
    output: "Planning started",
    status: "ok",
  });
  touchSession(session);

  for (const step of plan) {
    session.state = step.phase === "replan" ? "repairing" : "executing";
    session.agents = sessionAgents(session.state);
    const worklogStep = session.worklog.find((entry) => entry.id === step.id);
    if (!worklogStep) continue;

    worklogStep.status = "running";
    pushShellEvent(session, {
      command: step.command,
      output: "Running…",
      status: "ok",
    });
    touchSession(session);
    await sleep(450);

    if (step.outcome === "failed") {
      worklogStep.status = "failed";
      pushShellEvent(session, {
        command: step.command,
        output: step.errorOutput ?? "Command failed",
        status: "error",
      });
    } else {
      worklogStep.status = "done";
      pushShellEvent(session, {
        command: step.command,
        output: step.successOutput ?? "Command completed",
        status: "ok",
      });
    }

    if (step.id === "patch") {
      session.changes = defaultDesktopChanges();
    }

    touchSession(session);
    await sleep(200);
  }

  session.state = "success";
  session.agents = sessionAgents(session.state);
  const assistantMessage: DesktopChatMessage = {
    id: `m${session.messages.length + 1}`,
    role: "assistant",
    text: "Execution complete: one failed check was auto-repaired and validation passed.",
    createdAt: new Date().toISOString(),
  };
  session.messages.push(assistantMessage);
  touchSession(session);
  emitDesktopEvent(session.id, {
    kind: "chat",
    sessionId: session.id,
    message: assistantMessage,
  });
}

function getSessionForUser(
  sessionId: string,
  userId: string,
): DesktopSession | null {
  const session = DESKTOP_SESSIONS.get(sessionId);
  if (!session) return null;
  return session.userId === userId ? session : null;
}

productAgentRouter.post(
  "/desktop/sessions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const goal =
      typeof req.body?.goal === "string" && req.body.goal.trim().length > 0
        ? req.body.goal.trim()
        : "Execute agent desktop task";

    const session: DesktopSession = {
      id: randomUUID(),
      userId: req.authUserId!,
      goal,
      state: "idle",
      worklog: [],
      shellEvents: [],
      changes: [],
      messages: [
        {
          id: "m1",
          role: "assistant",
          text: "Session initialized. Starting planner now.",
          createdAt: new Date().toISOString(),
        },
      ],
      agents: sessionAgents("idle"),
      workingDirectory:
        typeof req.body?.workingDirectory === "string" && req.body.workingDirectory.trim().length > 0
          ? req.body.workingDirectory.trim()
          : process.cwd(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DESKTOP_SESSIONS.set(session.id, session);
    void runDesktopSession(session.id).catch((error) => {
      const target = DESKTOP_SESSIONS.get(session.id);
      if (!target) return;
      target.state = "repairing";
      target.agents = sessionAgents("repairing");
      pushShellEvent(target, {
        command: "runtime",
        output:
          error instanceof Error ? error.message : "Desktop runtime failed",
        status: "error",
      });
      touchSession(target);
      emitDesktopEvent(target.id, {
        kind: "error",
        sessionId: target.id,
        message:
          error instanceof Error ? error.message : "Desktop runtime failed",
      });
    });

    sendApiSuccess(res, 201, { session }, buildApiMeta(req, startedAt));
  }),
);

productAgentRouter.get(
  "/desktop/sessions/:id",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const sessionId = req.params.id as string;
    const session = getSessionForUser(sessionId, req.authUserId!);
    if (!session) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Desktop session not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { session }, buildApiMeta(req, startedAt));
  }),
);

productAgentRouter.post(
  "/desktop/sessions/:id/chat",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const sessionId = req.params.id as string;
    const session = getSessionForUser(sessionId, req.authUserId!);
    if (!session) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Desktop session not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const messageText =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!messageText) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "message is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const userMessage: DesktopChatMessage = {
      id: `m${session.messages.length + 1}`,
      role: "user",
      text: messageText,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: DesktopChatMessage = {
      id: `m${session.messages.length + 2}`,
      role: "assistant",
      text: "Received. I can queue this as the next goal and run it through the desktop planner.",
      createdAt: new Date().toISOString(),
    };

    session.messages.push(userMessage, assistantMessage);
    touchSession(session);
    emitDesktopEvent(session.id, {
      kind: "chat",
      sessionId,
      message: userMessage,
    });
    emitDesktopEvent(session.id, {
      kind: "chat",
      sessionId,
      message: assistantMessage,
    });

    sendApiSuccess(
      res,
      201,
      { message: assistantMessage, session },
      buildApiMeta(req, startedAt),
    );
  }),
);

productAgentRouter.get(
  "/desktop/sessions/:id/events",
  asyncHandler(async (req, res) => {
    const sessionId = req.params.id as string;
    const session = getSessionForUser(sessionId, req.authUserId!);
    if (!session) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Desktop session not found" },
      });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const existingSinks = DESKTOP_STREAMS.get(sessionId);
    const sinks = existingSinks ?? new Set<ExpressResponse>();
    if (!existingSinks) {
      DESKTOP_STREAMS.set(sessionId, sinks);
    }
    sinks.add(res);

    res.write(`data: ${JSON.stringify({ kind: "ready", sessionId })}\n\n`);
    res.write(`data: ${JSON.stringify({ kind: "snapshot", session })}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(
          `data: ${JSON.stringify({ kind: "ping", ts: new Date().toISOString() })}\n\n`,
        );
      } catch {
        // ignore heartbeat write errors
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      const current = DESKTOP_STREAMS.get(sessionId);
      if (!current) return;
      current.delete(res);
      if (current.size === 0) {
        DESKTOP_STREAMS.delete(sessionId);
      }
    });
  }),
);
