export class EpochV12Worker {
    baseUrl;
    apiKey;
    workspaceId;
    workerId;
    http;
    constructor(config) { this.baseUrl = config.baseUrl.replace(/\/$/, ""); this.apiKey = config.apiKey; this.workspaceId = config.workspaceId; this.workerId = config.workerId; this.http = config.fetch ?? fetch; }
    async request(path, init = {}) {
        const response = await this.http(`${this.baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", ...init.headers } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok)
            throw new Error(`Epoch V12 worker API error ${response.status}: ${body?.error?.message ?? body?.message ?? response.statusText}`);
        return (body?.data ?? body);
    }
    register(input) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/workers`, { method: "POST", body: JSON.stringify(input) }); }
    heartbeat(status) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/workers/${encodeURIComponent(this.workerId)}/heartbeat`, { method: "POST", body: JSON.stringify(status ? { status } : {}) }); }
    lease(limit = 1, leaseMs = 30_000, missionId) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/queue/lease`, { method: "POST", body: JSON.stringify({ workerId: this.workerId, limit, leaseMs, ...(missionId ? { missionId } : {}) }) }); }
    complete(jobId, fencingToken) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/queue/${encodeURIComponent(jobId)}/ack`, { method: "POST", body: JSON.stringify({ workerId: this.workerId, fencingToken }) }); }
    fail(jobId, error) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/queue/${encodeURIComponent(jobId)}/fail`, { method: "POST", body: JSON.stringify({ error }) }); }
    recordEvidence(missionId, evidence) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence`, { method: "POST", body: JSON.stringify({ evidence }) }); }
    evaluate(input) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/workers/${encodeURIComponent(this.workerId)}/evaluations`, { method: "POST", body: JSON.stringify(input) }); }
    verify(missionId, input = {}) { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`, { method: "POST", body: JSON.stringify(input) }); }
}
