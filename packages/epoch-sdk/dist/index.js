"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpochClient = void 0;
exports.createEpochClient = createEpochClient;
class EpochClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? "http://localhost:3011").replace(/\/$/, "");
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
     * Create the standard MemoryIgnition inheritance package before an agent acts.
     */
    async createBrief(input) {
        return this.request("/api/memory/memoryignition/brief", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Return only the canonical Standard Inheritance Package that API, SDK, and MCP agents should consume.
     */
    async createInheritancePackage(input) {
        const brief = await this.createBrief(input);
        return brief.standard_inheritance_package;
    }
    /**
     * Format and record a Send Now event for a target agent or runtime.
     */
    async sendNow(input) {
        return this.request("/api/memory/memoryignition/send-now", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Prepare and guard one proposed action before the agent uses a tool or edits files.
     */
    async beforeAction(input) {
        return this.request("/api/memory/memoryignition/before-action", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Re-check risk while an agent is acting, using current files/action/tool context.
     */
    async duringAction(input) {
        return this.request("/api/memory/memoryignition/during-action", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Check risk, approvals, required tests, and trace proof before tool use.
     */
    async riskCheck(input) {
        return this.request("/api/memory/memoryignition/risk-check", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Save an agent outcome so future agents inherit what worked and failed.
     */
    async saveOutcome(input) {
        return this.request("/api/memory/memoryignition/outcome", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Create a MemoryIgnition handoff package for another future agent.
     */
    async createHandoff(input) {
        return this.request("/api/memory/memoryignition/handoff", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    /**
     * Inspect why a memory can be inherited.
     */
    async getTraceProof(memoryId) {
        return this.request(`/api/memory/memory/${encodeURIComponent(memoryId)}/trace-proof`);
    }
    buildExperienceQueryPath(path, input = {}) {
        const params = new URLSearchParams();
        if (typeof input.query === "string" && input.query.trim().length > 0) {
            params.set("query", input.query.trim());
        }
        if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
            params.set("limit", String(input.limit));
        }
        if (input.verdict) {
            params.set("verdict", input.verdict);
        }
        const queryString = params.toString();
        return queryString.length > 0 ? `${path}?${queryString}` : path;
    }
    /**
     * Search verified Mission Control experiences.
     */
    async searchExperiences(input = {}) {
        return this.request(this.buildExperienceQueryPath("/api/experience/search", input));
    }
    /**
     * List reusable lessons extracted from verified PR missions.
     */
    async listExperienceLessons(input = {}) {
        return this.request(this.buildExperienceQueryPath("/api/experience/lessons", input));
    }
    /**
     * List recurring failure patterns extracted from verified PR missions.
     */
    async listFailurePatterns(input = {}) {
        return this.request(this.buildExperienceQueryPath("/api/experience/failure-patterns", input));
    }
    /**
     * List root causes extracted from verified PR missions.
     */
    async listRootCauses(input = {}) {
        return this.request(this.buildExperienceQueryPath("/api/experience/root-causes", input));
    }
    /**
     * Find similar verified experiences to a specific mission or query.
     */
    async findSimilarExperiences(input = {}) {
        const path = this.buildExperienceQueryPath("/api/experience/similar", input);
        const params = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
        if (typeof input.experienceId === "string" && input.experienceId.trim().length > 0) {
            params.set("experienceId", input.experienceId.trim());
        }
        if (typeof input.repository === "string" && input.repository.trim().length > 0) {
            params.set("repository", input.repository.trim());
        }
        const query = params.toString();
        return this.request(query.length > 0 ? `/api/experience/similar?${query}` : "/api/experience/similar");
    }
    /**
     * Build experience-backed recommendations for the next verification or fix.
     */
    async getExperienceRecommendations(input = {}) {
        const path = this.buildExperienceQueryPath("/api/experience/recommendations", input);
        const params = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
        if (typeof input.repository === "string" && input.repository.trim().length > 0) {
            params.set("repository", input.repository.trim());
        }
        const query = params.toString();
        return this.request(query.length > 0 ? `/api/experience/recommendations?${query}` : "/api/experience/recommendations");
    }
    /**
     * Creates the standard MemoryIgnition inheritance package before calling an agent.
     */
    async beforeModel(input) {
        return this.createBrief(input);
    }
    /**
     * Processes messages after the LLM response to extract and save memories.
     */
    async afterModel(input) {
        const hasMessage = typeof input.message === "string" && input.message.trim().length > 0;
        const hasContract = Boolean(input.contract);
        const hasOutcome = Boolean(input.outcome?.trim() || input.modelResponse?.trim());
        if (!hasMessage && !hasContract && !hasOutcome) {
            throw new Error("afterModel requires a non-empty message, outcome, model response, or memory contract.");
        }
        return this.saveOutcome(input);
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
    async registerWorker(workspaceId, input) {
        const result = await this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers`, {
            method: "POST",
            body: JSON.stringify(input),
        });
        return result.worker;
    }
    async heartbeatWorker(workspaceId, workerId, input = {}) {
        const result = await this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers/${encodeURIComponent(workerId)}/heartbeat`, {
            method: "POST",
            body: JSON.stringify(input),
        });
        return result.worker;
    }
    async leaseWorkerJobs(workspaceId, workerId, input = {}) {
        return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/lease`, {
            method: "POST",
            body: JSON.stringify({ ...input, workerId }),
        });
    }
    async completeWorkerJob(workspaceId, jobId, workerId, fencingToken) {
        const result = await this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/${encodeURIComponent(jobId)}/ack`, {
            method: "POST",
            body: JSON.stringify({ workerId, fencingToken }),
        });
        return result.job;
    }
}
exports.EpochClient = EpochClient;
function createEpochClient(config) {
    return new EpochClient(config);
}
