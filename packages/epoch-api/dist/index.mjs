"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpochApiClient = void 0;
exports.createEpochApiClient = createEpochApiClient;
class EpochApiClient {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.apiKey = config.apiKey;
    }
    async request(path, options = {}) {
        const headers = new Headers(options.headers);
        headers.set("Content-Type", "application/json");
        if (this.apiKey) {
            headers.set("Authorization", `Bearer ${this.apiKey}`);
        }
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            const message = typeof payload.message === "string" ? payload.message : response.statusText;
            throw new Error(`Epoch API Error: ${message}`);
        }
        return response.json();
    }
    getAgentAccessStatus() {
        return this.request("/api/agent-access/status");
    }
    getMcpTools() {
        return this.request("/api/mcp/tools");
    }
    invokeMcpTool(name, input = {}) {
        return this.request("/api/mcp/invoke", {
            method: "POST",
            body: JSON.stringify({ name, input }),
        });
    }
}
exports.EpochApiClient = EpochApiClient;
function createEpochApiClient(config) {
    return new EpochApiClient(config);
}
