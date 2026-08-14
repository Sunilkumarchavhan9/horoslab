"use client";

import { getMemoryOSOrgHeaders } from "@/lib/org-scope-client";

const PRODUCT_AGENT_BASE = "/api/product-agent";

type ApiEnvelope<T> =
  | { ok: true; data: T; meta?: unknown }
  | { ok: false; error?: { code?: string; message?: string }; meta?: unknown };

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : null;
    throw new Error(message || `Product agent request failed (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok) return payload.data;
    throw new Error(payload.error?.message || "Product agent request failed.");
  }

  return payload as T;
}

async function productAgentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PRODUCT_AGENT_BASE}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...getMemoryOSOrgHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  return readJson<T>(response);
}

export type ProductAgent = {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  defaultProjectScope?: boolean;
};

export type ProductAgentSession = {
  model?: string | null;
  id: string;
  userId: string;
  orgId?: string | null;
  agentId: string;
  projectId?: string | null;
  goal?: string | null;
  goalId?: string | null;
  status: "active" | "ended";
  createdAt: string;
  updatedAt: string;
};

export async function listProductAgents(): Promise<ProductAgent[]> {
  const payload = await productAgentFetch<{ agents: ProductAgent[] }>("/registry");
  return payload.agents;
}

export async function listProductAgentSessions(input?: { limit?: number }): Promise<ProductAgentSession[]> {
  const query = new URLSearchParams();
  if (typeof input?.limit === "number" && Number.isFinite(input.limit)) {
    query.set("limit", String(input.limit));
  }
  const suffix = query.toString().length > 0 ? `?${query.toString()}` : "";
  const payload = await productAgentFetch<{ sessions: ProductAgentSession[] }>(`/sessions${suffix}`);
  return payload.sessions;
}
