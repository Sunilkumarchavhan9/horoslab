#!/usr/bin/env node
const protocolVersion = "2025-06-18";
const serverInfo = {
    name: "memoryos",
    version: "0.1.0",
};
const tools = [
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
];
let inputBuffer = Buffer.alloc(0);
function getBaseUrl() {
    return (process.env.MEMORYOS_BASE_URL ?? "http://localhost:3001").replace(/\/+$/, "");
}
function getApiKey() {
    const apiKey = process.env.MEMORYOS_API_KEY ?? process.env.MEMORYOS_API_TOKEN;
    if (!apiKey) {
        throw new Error("Missing MEMORYOS_API_KEY or MEMORYOS_API_TOKEN");
    }
    return apiKey;
}
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function sendMessage(payload) {
    const body = JSON.stringify(payload);
    const length = Buffer.byteLength(body, "utf8");
    process.stdout.write(`Content-Length: ${length}\r\n\r\n${body}`);
}
function sendResult(id, result) {
    if (id === undefined) {
        return;
    }
    sendMessage({
        jsonrpc: "2.0",
        id,
        result,
    });
}
function sendError(id, code, message, data) {
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
async function invokeMemoryTool(name, input) {
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
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        throw new Error(isObject(payload) && isObject(payload.error) && typeof payload.error.message === "string"
            ? payload.error.message
            : `MemoryOS API returned ${response.status}`);
    }
    if (isObject(payload) && isObject(payload.data) && "result" in payload.data) {
        return payload.data.result;
    }
    return payload;
}
async function handleRequest(request) {
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
        }
        catch (error) {
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
function processInputBuffer() {
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
            const request = JSON.parse(body);
            void handleRequest(request);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to parse request";
            sendError(null, -32700, message);
        }
    }
}
process.stdin.on("data", (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);
    processInputBuffer();
});
process.stdin.resume();
export {};
//# sourceMappingURL=stdio.js.map