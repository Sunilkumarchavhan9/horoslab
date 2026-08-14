#!/usr/bin/env node

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

const protocolVersion = "2025-06-18";
const serverInfo = {
  name: "epoch",
  version: "0.1.0",
};

const tools: ToolDefinition[] = [
  {
    name: "memory.before_model",
    title: "MemoryOS Before Model",
    description: "Retrieve MemoryOS continuity context before a model or agent turn.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "Question or task the model is about to answer." },
        mode: { type: "string", enum: ["retrieve", "resume"], description: "Use retrieve or resume context." },
        workspace: { type: "string", description: "Optional workspace scope." },
        project: { type: "string", description: "Optional project scope." },
        threadId: { type: "string", description: "Optional thread/session id." },
        topK: { type: "number", description: "Maximum memories to return." },
        includeArchived: { type: "boolean", description: "Include archived or lifecycle-filtered memories." },
      },
    },
  },
  {
    name: "memory.after_model",
    title: "MemoryOS After Model",
    description: "Persist useful MemoryOS context after a user/model turn.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "User message or context to remember." },
        modelResponse: { type: "string", description: "Optional assistant/model response to persist with the turn." },
        threadId: { type: "string", description: "Optional thread/session id." },
        contract: {
          type: "object",
          description: "Structured memory contract payload.",
          properties: {
            goal: { type: "string" },
            constraints: { type: "array", items: { type: "string" } },
            decisions: { type: "array", items: { type: "string" } },
            open_risks: { type: "array", items: { type: "string" } },
            next_actions: { type: "array", items: { type: "string" } },
          },
        },
        enforceContract: {
          type: "boolean",
          description: "When true, requires a sufficiently populated contract.",
        },
      },
    },
  },
  {
    name: "memory.handoff",
    title: "MemoryOS Handoff",
    description: "Create a handoff package for another human or agent.",
    inputSchema: {
      type: "object",
      required: ["project", "question"],
      properties: {
        project: { type: "string", description: "Project to prepare a handoff for." },
        question: { type: "string", description: "Handoff instruction or question." },
        workspace: { type: "string", description: "Optional workspace scope." },
        threadId: { type: "string", description: "Optional thread/session id." },
        topK: { type: "number", description: "Maximum memories to use." },
        includeArchived: { type: "boolean", description: "Include archived or lifecycle-filtered memories." },
      },
    },
  },
  {
    name: "memoryignition_get_brief",
    title: "MemoryIgnition Get Brief",
    description: "Get the standard MemoryIgnition inheritance package before an agent acts: task, reasoning, context, memories, experiences, approved skills, risk rules, approvals, outcome hooks, and trace proof.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "Task or question Codex is about to handle." },
        task: { type: "string", description: "Optional task alias." },
        task_intent: { type: "string", description: "Optional task intent." },
        workspace_id: { type: "string", description: "Optional MemoryOS workspace id." },
        agent_id: { type: "string", description: "Optional agent id." },
        repo: { type: "string", description: "Optional repository name." },
        risk_level: { type: "string", description: "Optional risk level." },
        available_tools: { type: "array", items: { type: "string" }, description: "Tools available to Codex." },
        mode: { type: "string", enum: ["retrieve", "resume"], description: "Use retrieve or resume context." },
        topK: { type: "number", description: "Maximum memories to return." },
      },
    },
  },
  {
    name: "memoryignition_search_memory",
    title: "MemoryIgnition Search Memory",
    description: "Search MemoryOS Company Brain memory for task-relevant context.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "Search question or task." },
        workspace: { type: "string", description: "Optional workspace scope." },
        project: { type: "string", description: "Optional project scope." },
        topK: { type: "number", description: "Maximum memories to return." },
      },
    },
  },
  {
    name: "memoryignition_search_experiences",
    title: "MemoryIgnition Search Experiences",
    description: "Search verified Mission Control experiences for lessons, root causes, and evidence-backed PR outcomes.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for verified experiences." },
        limit: { type: "number", description: "Maximum number of experiences to return." },
        verdict: { type: "string", enum: ["PASS", "FAIL", "UNKNOWN"], description: "Filter results by verdict." },
        orgId: { type: "string", description: "Optional organization scope." },
        org_id: { type: "string", description: "Optional organization scope." },
      },
    },
  },
  {
    name: "memoryignition_list_lessons",
    title: "MemoryIgnition List Lessons",
    description: "List reusable lessons extracted from verified pull request missions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filter lessons by query." },
        limit: { type: "number", description: "Maximum number of lessons to return." },
        orgId: { type: "string", description: "Optional organization scope." },
        org_id: { type: "string", description: "Optional organization scope." },
      },
    },
  },
  {
    name: "memoryignition_list_failure_patterns",
    title: "MemoryIgnition List Failure Patterns",
    description: "List recurring failure patterns from verified pull request missions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filter failure patterns by query." },
        limit: { type: "number", description: "Maximum number of patterns to return." },
        orgId: { type: "string", description: "Optional organization scope." },
        org_id: { type: "string", description: "Optional organization scope." },
      },
    },
  },
  {
    name: "memoryignition_list_root_causes",
    title: "MemoryIgnition List Root Causes",
    description: "List root causes extracted from verified pull request missions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filter root causes by query." },
        limit: { type: "number", description: "Maximum number of root causes to return." },
        orgId: { type: "string", description: "Optional organization scope." },
        org_id: { type: "string", description: "Optional organization scope." },
      },
    },
  },
  {
    name: "memoryignition_find_similar_experiences",
    title: "MemoryIgnition Find Similar Experiences",
    description: "Find similar verified experiences for a mission, repository, or query.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for similar experiences." },
        experienceId: { type: "string", description: "Target experience id to find neighbors for." },
        repository: { type: "string", description: "Optional repository filter." },
        limit: { type: "number", description: "Maximum number of similar experiences to return." },
        verdict: { type: "string", enum: ["PASS", "FAIL", "UNKNOWN"], description: "Filter results by verdict." },
        orgId: { type: "string", description: "Optional organization scope." },
        org_id: { type: "string", description: "Optional organization scope." },
      },
    },
  },
  {
    name: "memoryignition_get_experience_recommendations",
    title: "MemoryIgnition Experience Recommendations",
    description: "Build experience-backed recommendations for the next verification or fix.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for recommendations." },
        repository: { type: "string", description: "Optional repository filter." },
        limit: { type: "number", description: "Maximum number of recommendations to return." },
        verdict: { type: "string", enum: ["PASS", "FAIL", "UNKNOWN"], description: "Filter results by verdict." },
        orgId: { type: "string", description: "Optional organization scope." },
        org_id: { type: "string", description: "Optional organization scope." },
      },
    },
  },
  {
    name: "memoryignition_send_now",
    title: "MemoryIgnition Send Now",
    description: "Generate the final target-agent delivery payload from the standard MemoryIgnition inheritance package.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "Task or question the target agent should handle." },
        task: { type: "string", description: "Optional task alias." },
        task_intent: { type: "string", description: "Optional task intent." },
        workspace_id: { type: "string", description: "Optional MemoryOS workspace id." },
        agent_id: { type: "string", description: "Optional requesting agent id." },
        target_agent: { type: "string", description: "Agent that should receive the package." },
        target_format: {
          type: "string",
          enum: [
            "human_prompt",
            "agent_prompt",
            "codex_prompt",
            "cursor_prompt",
            "claude_prompt",
            "devin_task",
            "mcp_response",
            "api_json",
            "cli_output",
            "custom_json",
          ],
          description: "Delivery format to generate.",
        },
        safety_mode: { type: "string", enum: ["fast", "balanced", "strict"], description: "How strict the send-time safety guard should be." },
        repo: { type: "string", description: "Optional repository name." },
        risk_level: { type: "string", description: "Optional risk level." },
        available_tools: { type: "array", items: { type: "string" }, description: "Tools available to the target agent." },
        mode: { type: "string", enum: ["retrieve", "resume"], description: "Use retrieve or resume context." },
        topK: { type: "number", description: "Maximum memories to return." },
      },
    },
  },
  {
    name: "memoryignition_risk_check",
    title: "MemoryIgnition Risk Check",
    description: "Check risk, approvals, required tests, forbidden actions, and trace proof before an agent action.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "Task or action to check." },
        task: { type: "string", description: "Optional task alias." },
        task_intent: { type: "string", description: "Optional task intent." },
        workspace_id: { type: "string", description: "Optional MemoryOS workspace id." },
        agent_id: { type: "string", description: "Optional agent id." },
        repo: { type: "string", description: "Optional repository name." },
        risk_level: { type: "string", description: "Optional risk level." },
        available_tools: { type: "array", items: { type: "string" }, description: "Tools available to the agent." },
      },
    },
  },
  {
    name: "memoryignition_save_outcome",
    title: "MemoryIgnition Save Outcome",
    description: "Save Codex task outcome back to MemoryOS for future-agent inheritance.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Outcome, lesson, or context to remember." },
        modelResponse: { type: "string", description: "Codex final response." },
        outcome: { type: "string", description: "What happened after Codex acted." },
        outcome_status: { type: "string", description: "success, failed, partial, blocked, etc." },
        files_touched: { type: "array", items: { type: "string" }, description: "Files touched by Codex." },
        tests_passed: { type: "array", items: { type: "string" }, description: "Tests or checks that passed." },
        tests_failed: { type: "array", items: { type: "string" }, description: "Tests or checks that failed." },
        what_worked: { type: "string", description: "What worked and should be reinforced for future agents." },
        what_failed: { type: "string", description: "What failed or should be avoided by future agents." },
        future_agent_lesson: { type: "string", description: "Lesson future agents should inherit." },
        tool_calls: { type: "array", items: { type: "string" }, description: "Tools or commands used." },
        used_skill_ids: { type: "array", items: { type: "string" }, description: "Approved MemoryOS skill ids used by the agent." },
        send_event_id: { type: "string", description: "Send Now event id that produced the inherited package." },
        target_agent: { type: "string", description: "Agent that received the inherited package." },
        target_format: { type: "string", description: "Format used for the inherited package." },
        threadId: { type: "string", description: "Optional session id." },
      },
    },
  },
  {
    name: "memoryignition_get_trace_proof",
    title: "MemoryIgnition Get Trace Proof",
    description: "Get source-backed trace proof for a Company Brain memory by id.",
    inputSchema: {
      type: "object",
      required: ["memoryId"],
      properties: {
        memoryId: { type: "string", description: "Company Brain memory id." },
      },
    },
  },
  {
    name: "memoryignition_create_handoff",
    title: "MemoryIgnition Create Handoff",
    description: "Create a MemoryOS handoff package for another agent or future Codex session.",
    inputSchema: {
      type: "object",
      required: ["project", "question"],
      properties: {
        project: { type: "string", description: "Project to prepare a handoff for." },
        question: { type: "string", description: "Handoff instruction or question." },
        workspace: { type: "string", description: "Optional workspace scope." },
        threadId: { type: "string", description: "Optional thread/session id." },
        topK: { type: "number", description: "Maximum memories to use." },
      },
    },
  },
];

let inputBuffer = Buffer.alloc(0);

function getBaseUrl(): string {
  return (process.env.EPOCH_BASE_URL ?? "http://localhost:3001").replace(/\/+$/, "");
}

function getApiKey(): string {
  const apiKey = process.env.EPOCH_API_KEY ?? process.env.EPOCH_API_TOKEN;
  if (!apiKey) {
    throw new Error("Missing EPOCH_API_KEY or EPOCH_API_TOKEN");
  }

  return apiKey;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sendMessage(payload: unknown): void {
  const body = JSON.stringify(payload);
  const length = Buffer.byteLength(body, "utf8");
  process.stdout.write(`Content-Length: ${length}\r\n\r\n${body}`);
}

function sendResult(id: JsonRpcId | undefined, result: unknown): void {
  if (id === undefined) {
    return;
  }

  sendMessage({
    jsonrpc: "2.0",
    id,
    result,
  });
}

function sendError(id: JsonRpcId | undefined, code: number, message: string, data?: unknown): void {
  if (id === undefined) {
    return;
  }

  sendMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  });
}

async function invokeMemoryTool(name: string, input: unknown): Promise<unknown> {
  const response = await fetch(`${getBaseUrl()}/api/mcp/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      name,
      input: isObject(input) ? input : {},
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(
      isObject(payload) && isObject(payload.error) && typeof payload.error.message === "string"
        ? payload.error.message
        : `MemoryOS API returned ${response.status}`,
    );
  }

  if (isObject(payload) && isObject(payload.data) && "result" in payload.data) {
    return payload.data.result;
  }

  return payload;
}

async function handleRequest(request: JsonRpcRequest): Promise<void> {
  const method = request.method;

  if (!method) {
    sendError(request.id, -32600, "Invalid request");
    return;
  }

  if (method === "initialize") {
    sendResult(request.id, {
      protocolVersion,
      capabilities: {
        tools: {},
      },
      serverInfo,
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    sendResult(request.id, { tools });
    return;
  }

  if (method === "tools/call") {
    if (!isObject(request.params) || typeof request.params.name !== "string") {
      sendError(request.id, -32602, "Invalid tool call params");
      return;
    }

    try {
      const result = await invokeMemoryTool(request.params.name, request.params.arguments);
      const text = JSON.stringify(result, null, 2);
      sendResult(request.id, {
        content: [{ type: "text", text }],
        structuredContent: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "MemoryOS tool call failed";
      sendResult(request.id, {
        isError: true,
        content: [{ type: "text", text: message }],
      });
    }
    return;
  }

  sendError(request.id, -32601, `Method not found: ${method}`);
}

function processInputBuffer(): void {
  const separator = Buffer.from("\r\n\r\n");

  while (true) {
    const headerEnd = inputBuffer.indexOf(separator);
    if (headerEnd === -1) {
      return;
    }

    const header = inputBuffer.slice(0, headerEnd).toString("utf8");
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!lengthMatch) {
      inputBuffer = inputBuffer.slice(headerEnd + separator.length);
      continue;
    }

    const contentLength = Number.parseInt(lengthMatch[1] ?? "0", 10);
    const messageStart = headerEnd + separator.length;
    const messageEnd = messageStart + contentLength;
    if (inputBuffer.length < messageEnd) {
      return;
    }

    const body = inputBuffer.slice(messageStart, messageEnd).toString("utf8");
    inputBuffer = inputBuffer.slice(messageEnd);

    try {
      const request = JSON.parse(body) as JsonRpcRequest;
      void handleRequest(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse request";
      sendError(null, -32700, message);
    }
  }
}

process.stdin.on("data", (chunk: Buffer) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  processInputBuffer();
});

process.stdin.resume();
