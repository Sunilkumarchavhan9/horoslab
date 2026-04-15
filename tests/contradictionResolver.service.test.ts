import { describe, expect, it } from "vitest";
import { resolveLifecycleTransition } from "../lib/memory/contradictionResolver";
import type { Memory, MemoryType } from "../lib/memory/types";

function makeMemory(input: {
  id: string;
  type: MemoryType;
  content: string;
  summary?: string;
}): Memory {
  return {
    id: input.id,
    userId: "u1",
    type: input.type,
    content: input.content,
    summary: input.summary ?? input.content,
    importanceScore: 0.8,
    confidence: 0.8,
    source: "chat",
    status: "active",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    evidenceCount: 1,
  };
}

describe("contradiction resolver v2", () => {
  it("marks reversed preference pairs as contradicted", () => {
    const existing = makeMemory({
      id: "p1",
      type: "preference",
      content: "User prefers TypeScript over Python",
    });
    const incoming = makeMemory({
      id: "p2",
      type: "preference",
      content: "User prefers Python over TypeScript",
    });

    expect(resolveLifecycleTransition(existing, incoming)).toMatchObject({
      status: "contradicted",
    });
  });

  it("marks changed use-with stack choices as stale", () => {
    const existing = makeMemory({
      id: "p1",
      type: "preference",
      content: "User uses React with TypeScript",
    });
    const incoming = makeMemory({
      id: "p2",
      type: "preference",
      content: "User uses React with JavaScript",
    });

    expect(resolveLifecycleTransition(existing, incoming)).toMatchObject({
      status: "stale",
    });
  });

  it("marks in-progress project state as stale after shipment", () => {
    const existing = makeMemory({
      id: "pr1",
      type: "project",
      content: "User is building MemoryOS handoff workflow",
    });
    const incoming = makeMemory({
      id: "pr2",
      type: "project",
      content: "User shipped MemoryOS handoff workflow",
    });

    expect(resolveLifecycleTransition(existing, incoming)).toMatchObject({
      status: "stale",
    });
  });

  it("marks resolved bug state as contradicted when the issue reopens", () => {
    const existing = makeMemory({
      id: "b1",
      type: "episodic",
      content: "User fixed checkout timeout bug",
    });
    const incoming = makeMemory({
      id: "b2",
      type: "episodic",
      content: "User is debugging checkout timeout bug",
    });

    expect(resolveLifecycleTransition(existing, incoming)).toMatchObject({
      status: "contradicted",
    });
  });
});
