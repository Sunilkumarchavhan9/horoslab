#!/usr/bin/env node
import { createInterface } from "node:readline";
const baseUrl = (process.env.EPOCH_V12_API_URL ?? "http://localhost:3011").replace(/\/$/, "");
const apiKey = process.env.EPOCH_V12_API_KEY ?? "";
const tools = [
    { name: "epoch_v12.list_missions", description: "List missions in a workspace.", inputSchema: { type: "object", required: ["workspaceId"], properties: { workspaceId: { type: "string" } } } },
    { name: "epoch_v12.create_mission", description: "Create a governed Epoch V12 mission.", inputSchema: { type: "object", required: ["workspaceId", "institutionId", "title", "objective"], properties: { workspaceId: { type: "string" }, institutionId: { type: "string" }, title: { type: "string" }, objective: { type: "string" }, acceptanceCriteria: { type: "array", items: { type: "string" } }, plan: { type: "array", items: { type: "string" } } } } },
    { name: "epoch_v12.list_workers", description: "List governed workers in a workspace.", inputSchema: { type: "object", required: ["workspaceId"], properties: { workspaceId: { type: "string" } } } },
    { name: "epoch_v12.get_evidence_bundle", description: "Retrieve the deterministic evidence bundle for a mission.", inputSchema: { type: "object", required: ["workspaceId", "missionId"], properties: { workspaceId: { type: "string" }, missionId: { type: "string" } } } },
    { name: "epoch_v12.enqueue_mission", description: "Enqueue a mission for governed worker execution.", inputSchema: { type: "object", required: ["workspaceId", "missionId", "type"], properties: { workspaceId: { type: "string" }, missionId: { type: "string" }, type: { type: "string", enum: ["plan", "execute", "review", "verify", "certificate", "memory"] }, payload: { type: "object" } } } },
    { name: "epoch_v12.record_evidence", description: "Record worker evidence for a mission.", inputSchema: { type: "object", required: ["workspaceId", "missionId", "evidence"], properties: { workspaceId: { type: "string" }, missionId: { type: "string" }, evidence: { type: "array" } } } },
    { name: "epoch_v12.verify_mission", description: "Run deterministic mission verification using evidence and human approval.", inputSchema: { type: "object", required: ["workspaceId", "missionId"], properties: { workspaceId: { type: "string" }, missionId: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } }, humanApproval: { type: "string", enum: ["approved", "rejected", "review"] }, confidence: { type: "number" } } } },
];
async function callApi(path, init = {}) {
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...init.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(body?.error?.message ?? body?.message ?? response.statusText);
    return body?.data ?? body;
}
async function invoke(name, args) {
    const workspaceId = String(args.workspaceId ?? "");
    if (!workspaceId)
        throw new Error("workspaceId is required");
    if (name === "epoch_v12.list_missions")
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions`);
    if (name === "epoch_v12.list_workers")
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers`);
    if (name === "epoch_v12.get_evidence_bundle")
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(String(args.missionId ?? ""))}/evidence-bundle`);
    if (name === "epoch_v12.enqueue_mission") {
        const { workspaceId: _, missionId, ...input } = args;
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/enqueue`, { method: "POST", body: JSON.stringify({ ...input, missionId }) });
    }
    if (name === "epoch_v12.record_evidence") {
        const { workspaceId: _, missionId, ...input } = args;
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(String(missionId ?? ""))}/evidence`, { method: "POST", body: JSON.stringify(input) });
    }
    if (name === "epoch_v12.verify_mission") {
        const { workspaceId: _, missionId, ...input } = args;
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(String(missionId ?? ""))}/verify`, { method: "POST", body: JSON.stringify(input) });
    }
    if (name === "epoch_v12.create_mission") {
        const { workspaceId: _, ...input } = args;
        return callApi(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions`, { method: "POST", body: JSON.stringify(input) });
    }
    throw new Error(`Unknown V12 MCP tool: ${name}`);
}
async function handle(request) {
    if (request.method === "initialize")
        return { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "epoch-v12", version: "0.1.4" } };
    if (request.method === "notifications/initialized")
        return undefined;
    if (request.method === "tools/list")
        return { tools };
    if (request.method === "tools/call") {
        const name = String(request.params?.name ?? "");
        const result = await invoke(name, (request.params?.arguments ?? {}));
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
    throw new Error(`Unsupported V12 MCP method: ${request.method ?? ""}`);
}
async function runStdio() {
    const input = createInterface({ input: process.stdin });
    for await (const line of input) {
        try {
            const request = JSON.parse(line);
            const result = await handle(request);
            if (request.id !== undefined && result !== undefined)
                process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`);
        }
        catch (error) {
            const request = (() => { try {
                return JSON.parse(line);
            }
            catch {
                return {};
            } })();
            if (request.id !== undefined)
                process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, error: { code: -32603, message: error instanceof Error ? error.message : "V12 MCP error" } })}\n`);
        }
    }
}
void runStdio();
