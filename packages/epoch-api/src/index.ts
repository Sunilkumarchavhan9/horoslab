export interface EpochApiConfig {
  baseUrl: string;
  apiKey?: string;
}

export class EpochApiClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(config: EpochApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
      const payload = await response.json().catch(() => ({} as Record<string, unknown>));
      const message = typeof payload.message === "string" ? payload.message : response.statusText;
      throw new Error(`Epoch API Error: ${message}`);
    }

    return response.json() as Promise<T>;
  }

  getAgentAccessStatus(): Promise<unknown> {
    return this.request("/api/agent-access/status");
  }

  getMcpTools(): Promise<unknown> {
    return this.request("/api/mcp/tools");
  }

  invokeMcpTool(name: string, input: Record<string, unknown> = {}): Promise<unknown> {
    return this.request("/api/mcp/invoke", {
      method: "POST",
      body: JSON.stringify({ name, input }),
    });
  }
}

export function createEpochApiClient(config: EpochApiConfig): EpochApiClient {
  return new EpochApiClient(config);
}
