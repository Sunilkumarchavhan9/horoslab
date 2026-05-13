"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryOSClient = void 0;
exports.createMemoryOSClient = createMemoryOSClient;
class MemoryOSClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? "http://localhost:3001").replace(/\/$/, "");
    }
    async request(path, options = {}) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            ...options.headers,
        };
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Unknown error" }));
            throw new Error(`MemoryOS API Error: ${error.message || response.statusText}`);
        }
        const result = await response.json();
        return result.data ?? result;
    }
    /**
     * Retrieves context and memories before calling the LLM.
     */
    async beforeModel(input) {
        if (input.mode === "resume") {
            const res = await this.resume({
                userId: input.userId,
                project: input.project ?? "default",
                question: input.question,
                workspace: input.workspace,
                threadId: input.threadId,
                topK: input.topK,
                includeArchived: input.includeArchived,
            });
            const contextText = [res.summary, res.lastKnownState, ...res.openLoops]
                .filter(Boolean)
                .join("\n");
            return {
                contextText,
                memories: res.usedMemories,
                source: "resume",
                traceId: `resume:${input.threadId ?? input.project ?? "default"}`,
            };
        }
        const res = await this.request("/api/v1/memory/retrieve", {
            method: "POST",
            body: JSON.stringify(input),
        });
        const memories = res.memories || [];
        const contextText = memories
            .map((m, i) => {
            const content = m.memory ?? m.content ?? "No content";
            const type = m.memoryType ?? "general";
            return `${i + 1}. [${type}] ${content}`;
        })
            .join("\n");
        return {
            contextText,
            memories,
            source: "retrieve",
            traceId: `retrieve:${input.threadId ?? input.project ?? "default"}`,
        };
    }
    /**
     * Processes messages after the LLM response to extract and save memories.
     */
    async afterModel(input) {
        const hasMessage = typeof input.message === "string" && input.message.trim().length > 0;
        const hasContract = Boolean(input.contract);
        if (!hasMessage && !hasContract) {
            throw new Error("afterModel requires either a non-empty message or a memory contract.");
        }
        const res = await this.request("/api/v1/memory/process", {
            method: "POST",
            body: JSON.stringify(input),
        });
        return {
            acceptedCount: (res.acceptedMemories || []).length,
            rejectedCount: (res.rejectedMemories || []).length,
            contractFieldCount: res.contractFieldCount,
            traceId: res.traceId,
            governanceApplied: res.governance,
        };
    }
    /**
     * Specific endpoint for resuming a project thread.
     */
    async resume(input) {
        return this.request("/api/v1/memory/resume", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Specific endpoint for generating a handoff.
     */
    async handoff(input) {
        return this.request("/api/v1/memory/handoff", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
}
exports.MemoryOSClient = MemoryOSClient;
function createMemoryOSClient(config) {
    return new MemoryOSClient(config);
}
