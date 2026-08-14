"use client";

import { mergeMemoryOSOrgHeaders } from "@/lib/org-scope-client";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

export async function consoleAuthHeaders(
  extra?: HeadersInit,
): Promise<HeadersInit> {
  const headers = new Headers(extra ?? undefined);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await getOrCreateMemoryToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return mergeMemoryOSOrgHeaders(headers);
}

export async function consoleApiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = await consoleAuthHeaders(init?.headers);
  return fetch(path, {
    ...init,
    headers,
    cache: init?.cache ?? "no-store",
  });
}
