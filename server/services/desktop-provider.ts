import type {
  ContinuityDesktopSession,
  ContinuityDesktopSessionState,
} from "../../lib/continuity/continuityThreadStore";
import { randomBytes } from "crypto";

export type DesktopOsType = "ubuntu" | "windows";

export type DesktopProviderSession = {
  provider: ContinuityDesktopSession["provider"];
  state: ContinuityDesktopSessionState;
  osType: DesktopOsType;
  previewUrl?: string;
  controlUrl?: string;
  providerSessionId?: string;
  sessionAuthToken?: string;
  sessionAuthExpiresAt?: string;
  resumeToken?: string;
  resumeSupported?: boolean;
  transportMode?: "webrtc" | "vnc" | "image-stream" | "unknown";
  nodeId?: string;
  runtimeMessage?: string;
  previewArtifactId?: string;
  recordingArtifactId?: string;
  lastFrameAt?: string;
};

export type DesktopInputEvent =
  | {
      type: "mouse_move";
      x: number;
      y: number;
    }
  | {
      type: "mouse_click";
      x: number;
      y: number;
      button?: "left" | "middle" | "right";
      action?: "down" | "up" | "click" | "double_click";
    }
  | {
      type: "scroll";
      x?: number;
      y?: number;
      deltaX: number;
      deltaY: number;
    }
  | {
      type: "key";
      key: string;
      action?: "down" | "up" | "press";
      modifiers?: Array<"ctrl" | "alt" | "shift" | "meta">;
    }
  | {
      type: "text";
      text: string;
    };

export type DesktopInputResult = {
  accepted: boolean;
  message?: string;
  at: string;
};

export type DesktopStreamState = {
  connected: boolean;
  mode: "webrtc" | "vnc" | "image-stream" | "unknown";
  latencyMs?: number;
  fps?: number;
  width?: number;
  height?: number;
  cursorVisible?: boolean;
  sessionAuthExpiresAt?: string;
  resumeSupported?: boolean;
  reconnectRecommended?: boolean;
  reconnectAfterMs?: number;
  disconnectReason?: string;
  message?: string;
  at: string;
};

export type DesktopScreenshotResult = {
  captured: boolean;
  imageUrl?: string;
  contentType?: string;
  width?: number;
  height?: number;
  message?: string;
  at: string;
};

type StartOrWakeDesktopInput = {
  threadId: string;
  osType: DesktopOsType;
  existingSession?: ContinuityDesktopSession | null;
};

type DesktopStatusInput = {
  threadId: string;
  osType: DesktopOsType;
  existingSession?: ContinuityDesktopSession | null;
};

type StopDesktopInput = {
  threadId: string;
  osType: DesktopOsType;
  existingSession?: ContinuityDesktopSession | null;
};

type DesktopInputCommand = {
  threadId: string;
  osType: DesktopOsType;
  existingSession?: ContinuityDesktopSession | null;
  event: DesktopInputEvent;
};

type DesktopStreamInput = {
  threadId: string;
  osType: DesktopOsType;
  existingSession?: ContinuityDesktopSession | null;
};

export type DesktopProviderHealth = {
  provider: "sandbox" | "external";
  healthy: boolean;
  detail: string;
  checkedAt: string;
};

interface DesktopProviderAdapter {
  startOrWakeSession(input: StartOrWakeDesktopInput): Promise<DesktopProviderSession>;
  resumeSession(input: StartOrWakeDesktopInput): Promise<DesktopProviderSession>;
  getSessionStatus(input: DesktopStatusInput): Promise<DesktopProviderSession>;
  stopSession(input: StopDesktopInput): Promise<DesktopProviderSession>;
  healthCheck(): Promise<DesktopProviderHealth>;
  sendInput(input: DesktopInputCommand): Promise<DesktopInputResult>;
  getStreamState(input: DesktopStreamInput): Promise<DesktopStreamState>;
  captureScreenshot(input: DesktopStreamInput): Promise<DesktopScreenshotResult>;
}

type ExternalDesktopProviderResponse = {
  provider?: ContinuityDesktopSession["provider"];
  state?: ContinuityDesktopSessionState;
  osType?: DesktopOsType;
  previewUrl?: string;
  controlUrl?: string;
  providerSessionId?: string;
  sessionAuthToken?: string;
  sessionAuthExpiresAt?: string;
  resumeToken?: string;
  resumeSupported?: boolean;
  transportMode?: "webrtc" | "vnc" | "image-stream" | "unknown";
  nodeId?: string;
  runtimeMessage?: string;
  previewArtifactId?: string;
  recordingArtifactId?: string;
  lastFrameAt?: string;
};

type ExternalDesktopInputResponse = {
  accepted?: boolean;
  message?: string;
  at?: string;
};

type ExternalDesktopStreamResponse = {
  connected?: boolean;
  mode?: "webrtc" | "vnc" | "image-stream" | "unknown";
  latencyMs?: number;
  fps?: number;
  width?: number;
  height?: number;
  cursorVisible?: boolean;
  sessionAuthExpiresAt?: string;
  resumeSupported?: boolean;
  reconnectRecommended?: boolean;
  reconnectAfterMs?: number;
  disconnectReason?: string;
  message?: string;
  at?: string;
};

type ExternalDesktopScreenshotResponse = {
  captured?: boolean;
  imageUrl?: string;
  screenshotUrl?: string;
  contentType?: string;
  width?: number;
  height?: number;
  message?: string;
  at?: string;
};

function resolveSandboxDesktopUrl(threadId: string, osType: DesktopOsType): string | null {
  const configured =
    (osType === "windows"
      ? process.env.MEMORYOS_DESKTOP_SANDBOX_URL_WINDOWS
      : process.env.MEMORYOS_DESKTOP_SANDBOX_URL_UBUNTU) ??
    process.env.MEMORYOS_DESKTOP_SANDBOX_URL;
  return configured?.trim()
    ? configured.trim().replaceAll("{threadId}", threadId)
    : null;
}

class SandboxDesktopProviderAdapter implements DesktopProviderAdapter {
  async startOrWakeSession(input: StartOrWakeDesktopInput): Promise<DesktopProviderSession> {
    const now = new Date().toISOString();
    const sessionAuthToken =
      input.existingSession?.sessionAuthToken ??
      `dtk_${randomBytes(16).toString("hex")}`;
    const sessionAuthExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const previewUrl = input.existingSession?.previewUrl?.trim() || resolveSandboxDesktopUrl(input.threadId, input.osType);
    const controlUrl = input.existingSession?.controlUrl?.trim() || previewUrl;
    const osLabel = input.osType === "windows" ? "Windows" : "Ubuntu";
    if (!previewUrl || !controlUrl) {
      return {
        provider: "browser",
        state: "starting",
        osType: input.osType,
        providerSessionId: input.existingSession?.providerSessionId ?? `sandbox-${input.threadId}-${input.osType}`,
        sessionAuthToken,
        sessionAuthExpiresAt,
        resumeToken:
          input.existingSession?.resumeToken ??
          `dtr_${randomBytes(16).toString("hex")}`,
        resumeSupported: true,
        transportMode: "image-stream",
        runtimeMessage: `${osLabel} desktop stream is not configured. Set MEMORYOS_DESKTOP_SANDBOX_URL(_UBUNTU/_WINDOWS).`,
        previewArtifactId: input.existingSession?.previewArtifactId,
        recordingArtifactId: input.existingSession?.recordingArtifactId,
        lastFrameAt: now,
      };
    }
    return {
      provider: "browser",
      state: "live",
      osType: input.osType,
      previewUrl,
      controlUrl,
      providerSessionId: input.existingSession?.providerSessionId ?? `sandbox-${input.threadId}-${input.osType}`,
      sessionAuthToken,
      sessionAuthExpiresAt,
      resumeToken:
        input.existingSession?.resumeToken ??
        `dtr_${randomBytes(16).toString("hex")}`,
      resumeSupported: true,
      transportMode: "image-stream",
      runtimeMessage: `${osLabel} desktop sandbox is live for agent browser automation.`,
      previewArtifactId: input.existingSession?.previewArtifactId,
      recordingArtifactId: input.existingSession?.recordingArtifactId,
      lastFrameAt: now,
    };
  }

  async resumeSession(input: StartOrWakeDesktopInput): Promise<DesktopProviderSession> {
    const resumed = await this.startOrWakeSession(input);
    return {
      ...resumed,
      runtimeMessage: `${input.osType === "windows" ? "Windows" : "Ubuntu"} desktop sandbox resumed.`,
    };
  }

  async getSessionStatus(input: DesktopStatusInput): Promise<DesktopProviderSession> {
    const existing = input.existingSession;
    if (!existing?.previewUrl && !existing?.controlUrl) {
      return {
        provider: existing?.provider ?? "browser",
        state: "idle",
        osType: input.osType,
        runtimeMessage: "Desktop sandbox has not started yet.",
      };
    }
    return {
      provider: existing.provider,
      state: existing.state,
      osType: existing.osType === "windows" ? "windows" : input.osType,
      previewUrl: existing.previewUrl,
      controlUrl: existing.controlUrl ?? existing.previewUrl,
      providerSessionId: existing.providerSessionId,
      sessionAuthToken: existing.sessionAuthToken,
      sessionAuthExpiresAt: existing.sessionAuthExpiresAt,
      resumeToken: existing.resumeToken,
      resumeSupported: existing.resumeSupported ?? true,
      transportMode: existing.transportMode ?? "image-stream",
      nodeId: existing.nodeId,
      runtimeMessage: existing.runtimeMessage ?? "Desktop sandbox status available.",
      previewArtifactId: existing.previewArtifactId,
      recordingArtifactId: existing.recordingArtifactId,
      lastFrameAt: existing.lastFrameAt,
    };
  }

  async stopSession(input: StopDesktopInput): Promise<DesktopProviderSession> {
    const osLabel = input.osType === "windows" ? "Windows" : "Ubuntu";
    return {
      provider: input.existingSession?.provider ?? "browser",
      state: "idle",
      osType: input.osType,
      previewUrl: input.existingSession?.previewUrl,
      controlUrl: input.existingSession?.controlUrl ?? input.existingSession?.previewUrl,
      providerSessionId: input.existingSession?.providerSessionId,
      resumeToken: input.existingSession?.resumeToken,
      resumeSupported: input.existingSession?.resumeSupported ?? true,
      transportMode: input.existingSession?.transportMode ?? "image-stream",
      nodeId: input.existingSession?.nodeId,
      runtimeMessage: `${osLabel} desktop session stopped.`,
      previewArtifactId: input.existingSession?.previewArtifactId,
      recordingArtifactId: input.existingSession?.recordingArtifactId,
    };
  }

  async healthCheck(): Promise<DesktopProviderHealth> {
    const ubuntuConfigured = Boolean(process.env.MEMORYOS_DESKTOP_SANDBOX_URL_UBUNTU?.trim() || process.env.MEMORYOS_DESKTOP_SANDBOX_URL?.trim());
    const windowsConfigured = Boolean(process.env.MEMORYOS_DESKTOP_SANDBOX_URL_WINDOWS?.trim() || process.env.MEMORYOS_DESKTOP_SANDBOX_URL?.trim());
    const healthy = ubuntuConfigured || windowsConfigured;
    return {
      provider: "sandbox",
      healthy,
      detail: healthy
        ? "Sandbox desktop provider is available."
        : "Sandbox desktop provider is enabled but no stream URL is configured.",
      checkedAt: new Date().toISOString(),
    };
  }

  async sendInput(input: DesktopInputCommand): Promise<DesktopInputResult> {
    return {
      accepted: Boolean(input.existingSession?.previewUrl || input.existingSession?.controlUrl),
      message: "Sandbox input bridge acknowledged.",
      at: new Date().toISOString(),
    };
  }

  async getStreamState(input: DesktopStreamInput): Promise<DesktopStreamState> {
    const connected = Boolean(input.existingSession?.previewUrl || input.existingSession?.controlUrl);
    return {
      connected,
      mode: "image-stream",
      ...(connected ? { fps: 12, latencyMs: 120, width: 1024, height: 768, cursorVisible: true } : {}),
      ...(input.existingSession?.sessionAuthExpiresAt
        ? { sessionAuthExpiresAt: input.existingSession.sessionAuthExpiresAt }
        : {}),
      resumeSupported: true,
      reconnectRecommended: !connected,
      reconnectAfterMs: connected ? 0 : 1500,
      ...(connected ? {} : { disconnectReason: "session_not_live" }),
      message: connected ? "Sandbox stream available." : "Sandbox stream is idle.",
      at: new Date().toISOString(),
    };
  }

  async captureScreenshot(input: DesktopStreamInput): Promise<DesktopScreenshotResult> {
    const connected = Boolean(input.existingSession?.previewUrl || input.existingSession?.controlUrl);
    return {
      captured: false,
      message: connected
        ? "Screenshot capture requires a fleet or external desktop provider."
        : "Desktop session is not live yet.",
      at: new Date().toISOString(),
    };
  }
}

class ExternalDesktopProviderAdapter implements DesktopProviderAdapter {
  private readonly baseUrl: string;
  private readonly token: string | null;

  constructor(baseUrl: string, token: string | null) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  private async request<T>(
    method: "GET" | "POST",
    endpoint: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (method !== "GET") headers["Content-Type"] = "application/json";
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      ...(method === "GET" ? {} : { body: JSON.stringify(body ?? {}) }),
    });
    if (!response.ok) {
      const fallback = `${method} ${endpoint} failed (${response.status})`;
      let message = fallback;
      try {
        const payload = (await response.json()) as { error?: string; message?: string };
        message = payload.error || payload.message || fallback;
      } catch {
        // Keep fallback message when response is not JSON.
      }
      throw new Error(`Desktop provider error (${response.status}): ${message}`);
    }
    return (await response.json()) as T;
  }

  private mapSession(
    threadId: string,
    osType: DesktopOsType,
    payload: ExternalDesktopProviderResponse | null | undefined,
    fallbackMessage: string,
  ): DesktopProviderSession {
    const safeState = payload?.state;
    const safeProvider = payload?.provider;
    return {
      provider:
        safeProvider === "browser" ||
        safeProvider === "preview" ||
        safeProvider === "vscode" ||
        safeProvider === "playwright" ||
        safeProvider === "custom"
          ? safeProvider
          : "browser",
      state:
        safeState === "idle" ||
        safeState === "starting" ||
        safeState === "live" ||
        safeState === "stale" ||
        safeState === "blocked" ||
        safeState === "error"
          ? safeState
          : "starting",
      osType: payload?.osType === "windows" ? "windows" : osType,
      previewUrl: payload?.previewUrl,
      controlUrl: payload?.controlUrl ?? payload?.previewUrl,
      providerSessionId:
        payload?.providerSessionId ??
        `external-${threadId}-${osType}`,
      sessionAuthToken: payload?.sessionAuthToken,
      sessionAuthExpiresAt: payload?.sessionAuthExpiresAt,
      resumeToken: payload?.resumeToken,
      ...(typeof payload?.resumeSupported === "boolean"
        ? { resumeSupported: payload.resumeSupported }
        : {}),
      transportMode: payload?.transportMode ?? "unknown",
      nodeId: payload?.nodeId,
      runtimeMessage: payload?.runtimeMessage ?? fallbackMessage,
      previewArtifactId: payload?.previewArtifactId,
      recordingArtifactId: payload?.recordingArtifactId,
      lastFrameAt: payload?.lastFrameAt ?? new Date().toISOString(),
    };
  }

  async startOrWakeSession(input: StartOrWakeDesktopInput): Promise<DesktopProviderSession> {
    const payload = await this.request<{
      session?: ExternalDesktopProviderResponse;
      desktop?: ExternalDesktopProviderResponse;
    }>("POST", "/desktop/sessions/start", {
      threadId: input.threadId,
      osType: input.osType,
      providerSessionId: input.existingSession?.providerSessionId,
    });
    return this.mapSession(
      input.threadId,
      input.osType,
      payload.session ?? payload.desktop,
      "Desktop session started via external provider.",
    );
  }

  async resumeSession(input: StartOrWakeDesktopInput): Promise<DesktopProviderSession> {
    try {
      const payload = await this.request<{
        session?: ExternalDesktopProviderResponse;
        desktop?: ExternalDesktopProviderResponse;
      }>("POST", "/desktop/sessions/resume", {
        threadId: input.threadId,
        osType: input.osType,
        providerSessionId: input.existingSession?.providerSessionId,
        resumeToken: input.existingSession?.resumeToken,
      });
      return this.mapSession(
        input.threadId,
        input.osType,
        payload.session ?? payload.desktop,
        "Desktop session resumed via external provider.",
      );
    } catch {
      return this.startOrWakeSession(input);
    }
  }

  async getSessionStatus(input: DesktopStatusInput): Promise<DesktopProviderSession> {
    const payload = await this.request<{
      session?: ExternalDesktopProviderResponse;
      desktop?: ExternalDesktopProviderResponse;
    }>(
      "GET",
      `/desktop/sessions/status?threadId=${encodeURIComponent(input.threadId)}&osType=${encodeURIComponent(input.osType)}`,
    );
    return this.mapSession(
      input.threadId,
      input.osType,
      payload.session ?? payload.desktop,
      "Desktop status loaded from external provider.",
    );
  }

  async stopSession(input: StopDesktopInput): Promise<DesktopProviderSession> {
    const payload = await this.request<{
      session?: ExternalDesktopProviderResponse;
      desktop?: ExternalDesktopProviderResponse;
    }>("POST", "/desktop/sessions/stop", {
      threadId: input.threadId,
      osType: input.osType,
      providerSessionId: input.existingSession?.providerSessionId,
    });
    return this.mapSession(
      input.threadId,
      input.osType,
      payload.session ?? payload.desktop,
      "Desktop session stopped via external provider.",
    );
  }

  async healthCheck(): Promise<DesktopProviderHealth> {
    const checkedAt = new Date().toISOString();
    try {
      type HealthResponse = { ok?: boolean; healthy?: boolean; message?: string; detail?: string };
      const payload = await this.request<HealthResponse>("GET", "/desktop/health");
      const healthy = payload.healthy ?? payload.ok ?? true;
      return {
        provider: "external",
        healthy,
        detail: payload.detail ?? payload.message ?? (healthy ? "External desktop provider healthy." : "External desktop provider unhealthy."),
        checkedAt,
      };
    } catch (error) {
      return {
        provider: "external",
        healthy: false,
        detail: error instanceof Error ? error.message : "External desktop provider health check failed.",
        checkedAt,
      };
    }
  }

  async sendInput(input: DesktopInputCommand): Promise<DesktopInputResult> {
    const payload = await this.request<ExternalDesktopInputResponse>(
      "POST",
      "/desktop/sessions/input",
      {
        threadId: input.threadId,
        osType: input.osType,
        providerSessionId: input.existingSession?.providerSessionId,
        event: input.event,
      },
    );
    return {
      accepted: payload.accepted !== false,
      message: payload.message ?? "Desktop input forwarded to provider.",
      at: payload.at ?? new Date().toISOString(),
    };
  }

  async getStreamState(input: DesktopStreamInput): Promise<DesktopStreamState> {
    const payload = await this.request<ExternalDesktopStreamResponse>(
      "GET",
      `/desktop/sessions/stream?threadId=${encodeURIComponent(input.threadId)}&osType=${encodeURIComponent(input.osType)}`,
    );
    return {
      connected: payload.connected === true,
      mode: payload.mode ?? "unknown",
      ...(typeof payload.latencyMs === "number" ? { latencyMs: payload.latencyMs } : {}),
      ...(typeof payload.fps === "number" ? { fps: payload.fps } : {}),
      ...(typeof payload.width === "number" ? { width: payload.width } : {}),
      ...(typeof payload.height === "number" ? { height: payload.height } : {}),
      ...(typeof payload.cursorVisible === "boolean" ? { cursorVisible: payload.cursorVisible } : {}),
      ...(payload.sessionAuthExpiresAt ? { sessionAuthExpiresAt: payload.sessionAuthExpiresAt } : {}),
      ...(typeof payload.resumeSupported === "boolean" ? { resumeSupported: payload.resumeSupported } : {}),
      ...(typeof payload.reconnectRecommended === "boolean" ? { reconnectRecommended: payload.reconnectRecommended } : {}),
      ...(typeof payload.reconnectAfterMs === "number" ? { reconnectAfterMs: payload.reconnectAfterMs } : {}),
      ...(payload.disconnectReason ? { disconnectReason: payload.disconnectReason } : {}),
      message: payload.message ?? "Desktop stream state loaded from provider.",
      at: payload.at ?? new Date().toISOString(),
    };
  }

  async captureScreenshot(input: DesktopStreamInput): Promise<DesktopScreenshotResult> {
    const payload = await this.request<ExternalDesktopScreenshotResponse>(
      "GET",
      `/desktop/sessions/screenshot?threadId=${encodeURIComponent(input.threadId)}&osType=${encodeURIComponent(input.osType)}`,
    );
    return {
      captured: payload.captured === true,
      ...(payload.imageUrl || payload.screenshotUrl
        ? { imageUrl: payload.imageUrl ?? payload.screenshotUrl }
        : {}),
      ...(payload.contentType ? { contentType: payload.contentType } : {}),
      ...(typeof payload.width === "number" ? { width: payload.width } : {}),
      ...(typeof payload.height === "number" ? { height: payload.height } : {}),
      message: payload.message ?? "Desktop screenshot capture completed.",
      at: payload.at ?? new Date().toISOString(),
    };
  }
}

let desktopProviderSingleton: DesktopProviderAdapter | null = null;

function createDesktopProvider(): DesktopProviderAdapter {
  const provider = process.env.MEMORYOSTM_DESKTOP_PROVIDER?.trim().toLowerCase() || "sandbox";
  switch (provider) {
    case "external": {
      const baseUrl = process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL?.trim();
      if (!baseUrl) {
        throw new Error(
          "MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL is required when MEMORYOSTM_DESKTOP_PROVIDER=external.",
        );
      }
      const token = process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN?.trim() || null;
      return new ExternalDesktopProviderAdapter(baseUrl, token);
    }
    case "sandbox":
    default:
      return new SandboxDesktopProviderAdapter();
  }
}

export function getDesktopProviderAdapter(): DesktopProviderAdapter {
  if (!desktopProviderSingleton) {
    desktopProviderSingleton = createDesktopProvider();
  }
  return desktopProviderSingleton;
}
