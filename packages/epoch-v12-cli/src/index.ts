#!/usr/bin/env node
type Json = Record<string, unknown>;
const [command, resource, ...args] = process.argv.slice(2);
const baseUrl = (process.env.EPOCH_V12_API_URL ?? "http://localhost:3011").replace(/\/$/, "");
const apiKey = process.env.EPOCH_V12_API_KEY ?? "";

function option(name: string): string | undefined {
  const value = args.find((arg) => arg.startsWith(`--${name}=`));
  return value?.slice(name.length + 3);
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${body?.error?.message ?? body?.message ?? response.statusText}`);
  return body?.data ?? body;
}

function requireOption(name: string): string {
  const value = option(name);
  if (!value) throw new Error(`Missing --${name}=...`);
  return value;
}

async function main(): Promise<void> {
  const workspaceId = option("workspace") ?? process.env.EPOCH_V12_WORKSPACE_ID;
  if (command === "missions" && resource === "list") {
    if (!workspaceId) throw new Error("Missing --workspace=... or EPOCH_V12_WORKSPACE_ID");
    console.log(JSON.stringify(await request(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions`), null, 2));
    return;
  }
  if (command === "workers" && resource === "list") {
    if (!workspaceId) throw new Error("Missing --workspace=... or EPOCH_V12_WORKSPACE_ID");
    console.log(JSON.stringify(await request(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers`), null, 2));
    return;
  }
  if (command === "missions" && resource === "create") {
    if (!workspaceId) throw new Error("Missing --workspace=... or EPOCH_V12_WORKSPACE_ID");
    const body: Json = { institutionId: requireOption("institution"), title: requireOption("title"), objective: requireOption("objective") };
    const acceptance = option("acceptance");
    if (acceptance) body.acceptanceCriteria = acceptance.split("|").map((item) => item.trim()).filter(Boolean);
    console.log(JSON.stringify(await request(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions`, { method: "POST", body: JSON.stringify(body) }), null, 2));
    return;
  }
  if (command === "missions" && resource === "enqueue") {
    if (!workspaceId) throw new Error("Missing --workspace=... or EPOCH_V12_WORKSPACE_ID");
    const missionId = requireOption("mission");
    const type = option("type") ?? "execute";
    const institution = option("institution");
    const body: Json = { type };
    if (institution) body.institutionId = institution;
    console.log(JSON.stringify(await request(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/enqueue`, { method: "POST", body: JSON.stringify({ missionId, type, institutionId: institution }) }), null, 2));
    return;
  }
  throw new Error("Usage: epoch-v12 missions list|create|enqueue --workspace=... or epoch-v12 workers list --workspace=...");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
