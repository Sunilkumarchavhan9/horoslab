import { Router } from "express";
import { randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";

type DesktopOsType = "ubuntu" | "windows";
type DesktopState = "idle" | "starting" | "live" | "stale" | "blocked" | "error";

type DesktopBridgeSession = {
  threadId: string;
  osType: DesktopOsType;
  provider: "browser";
  state: DesktopState;
  previewUrl?: string;
  controlUrl?: string;
  providerSessionId: string;
  sessionAuthToken?: string;
  sessionAuthExpiresAt?: string;
  resumeToken?: string;
  resumeSupported?: boolean;
  runtimeMessage?: string;
  previewArtifactId?: string;
  recordingArtifactId?: string;
  lastFrameAt?: string;
  transportMode?: "webrtc" | "vnc" | "image-stream";
  nodeId?: string;
  leaseExpiresAt?: string;
  updatedAt: string;
};

type DesktopInputEvent =
  | { type: "mouse_move"; x: number; y: number }
  | { type: "mouse_click"; x: number; y: number; button?: "left" | "middle" | "right"; action?: "down" | "up" | "click" | "double_click" }
  | { type: "scroll"; x?: number; y?: number; deltaX: number; deltaY: number }
  | { type: "key"; key: string; action?: "down" | "up" | "press"; modifiers?: Array<"ctrl" | "alt" | "shift" | "meta"> }
  | { type: "text"; text: string };

const desktopProviderRouter = Router();
const desktopBridgeSessions = new Map<string, DesktopBridgeSession>();

const DesktopInputEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mouse_move"),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("mouse_click"),
    x: z.number(),
    y: z.number(),
    button: z.enum(["left", "middle", "right"]).optional(),
    action: z.enum(["down", "up", "click", "double_click"]).optional(),
  }),
  z.object({
    type: z.literal("scroll"),
    x: z.number().optional(),
    y: z.number().optional(),
    deltaX: z.number(),
    deltaY: z.number(),
  }),
  z.object({
    type: z.literal("key"),
    key: z.string().min(1).max(80),
    action: z.enum(["down", "up", "press"]).optional(),
    modifiers: z.array(z.enum(["ctrl", "alt", "shift", "meta"])).max(4).optional(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1).max(8000),
  }),
]);

const StartSessionBodySchema = z.object({
  threadId: z.string().min(1).max(200),
  osType: z.enum(["ubuntu", "windows"]).optional(),
});

const StopSessionBodySchema = StartSessionBodySchema;

const InputSessionBodySchema = z.object({
  threadId: z.string().min(1).max(200),
  osType: z.enum(["ubuntu", "windows"]).optional(),
  event: DesktopInputEventSchema,
});

const QuerySessionSchema = z.object({
  threadId: z.string().min(1).max(200),
  osType: z.enum(["ubuntu", "windows"]).optional(),
});

type DesktopFleetNode = {
  id: string;
  label: string;
  healthy: boolean;
  osTypes: DesktopOsType[];
  capacity: number;
  inUse: number;
  transportMode: "webrtc" | "vnc" | "image-stream";
  previewUrlTemplate: string;
  controlUrlTemplate: string;
  inputUrlTemplate?: string;
  screenshotUrlTemplate?: string;
  healthUrl?: string;
  wsUrlTemplate?: string;
};

const fleetNodes = new Map<string, DesktopFleetNode>();
let fleetLoaded = false;
let fleetConfigSignature = "";

function getBridgeMode(): "mock" | "fleet" {
  const mode = process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE?.trim().toLowerCase();
  return mode === "fleet" ? "fleet" : "mock";
}

function fillTemplate(
  template: string,
  args: Record<string, string>,
): string {
  let output = template;
  for (const [key, value] of Object.entries(args)) {
    output = output.replaceAll(`{${key}}`, value);
  }
  return output;
}

function parseFleetNodePayload(payload: unknown): DesktopFleetNode[] {
  const FleetNodeSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1).optional(),
    healthy: z.boolean().optional(),
    osTypes: z.array(z.enum(["ubuntu", "windows"])).min(1),
    capacity: z.number().int().positive(),
    transportMode: z.enum(["webrtc", "vnc", "image-stream"]).optional(),
    previewUrlTemplate: z.string().min(1),
    controlUrlTemplate: z.string().min(1),
    inputUrlTemplate: z.string().min(1).optional(),
    screenshotUrlTemplate: z.string().min(1).optional(),
    healthUrl: z.string().min(1).optional(),
    wsUrlTemplate: z.string().optional(),
  });
  const FleetSchema = z.array(FleetNodeSchema).min(1);
  const parsed = FleetSchema.safeParse(payload);
  if (!parsed.success) return [];
  return parsed.data.map((node) => ({
    id: node.id,
    label: node.label ?? node.id,
    healthy: node.healthy ?? true,
    osTypes: node.osTypes,
    capacity: node.capacity,
    inUse: 0,
    transportMode: node.transportMode ?? "vnc",
    previewUrlTemplate: node.previewUrlTemplate,
    controlUrlTemplate: node.controlUrlTemplate,
    inputUrlTemplate: node.inputUrlTemplate,
    screenshotUrlTemplate: node.screenshotUrlTemplate,
    healthUrl: node.healthUrl,
    wsUrlTemplate: node.wsUrlTemplate,
  }));
}

function ensureFleetLoaded(): void {
  const signature = `${process.env.MEMORYOSTM_DESKTOP_FLEET_JSON?.trim() ?? ""}|${process.env.MEMORYOSTM_DESKTOP_LOCAL_CAPACITY ?? ""}|${process.env.MEMORYOS_FRONTEND_ORIGIN ?? ""}|${process.env.NEXT_PUBLIC_MEMORYOS_APP_ORIGIN ?? ""}`;
  if (fleetLoaded && fleetConfigSignature === signature) return;
  fleetNodes.clear();
  const fleetJson = process.env.MEMORYOSTM_DESKTOP_FLEET_JSON?.trim();
  const nodes =
    fleetJson
      ? parseFleetNodePayload((() => {
          try {
            return JSON.parse(fleetJson);
          } catch {
            return null;
          }
        })())
      : [];
  for (const node of nodes) {
    fleetNodes.set(node.id, node);
  }
  fleetConfigSignature = signature;
  fleetLoaded = true;
}

function selectFleetNode(osType: DesktopOsType): DesktopFleetNode | null {
  ensureFleetLoaded();
  const candidates = Array.from(fleetNodes.values())
    .filter((node) => node.healthy && node.osTypes.includes(osType) && node.inUse < node.capacity)
    .sort((a, b) => {
      const aUtil = a.capacity === 0 ? 1 : a.inUse / a.capacity;
      const bUtil = b.capacity === 0 ? 1 : b.inUse / b.capacity;
      if (aUtil !== bUtil) return aUtil - bUtil;
      return a.inUse - b.inUse;
    });
  return candidates[0] ?? null;
}

function getFleetNodeById(nodeId?: string): DesktopFleetNode | null {
  if (!nodeId) return null;
  ensureFleetLoaded();
  return fleetNodes.get(nodeId) ?? null;
}

function buildFleetSession(
  threadId: string,
  osType: DesktopOsType,
  node: DesktopFleetNode,
  previous?: DesktopBridgeSession,
): DesktopBridgeSession {
  const now = new Date().toISOString();
  const authExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const sessionId =
    previous?.providerSessionId?.trim() ||
    `fleet-${node.id}-${threadId}-${Date.now().toString(36)}`;
  const token = previous?.sessionAuthToken ?? `dtk_${randomBytes(16).toString("hex")}`;
  const resumeToken = previous?.resumeToken ?? `dtr_${randomBytes(16).toString("hex")}`;
  const templateArgs = {
    threadId: encodeURIComponent(threadId),
    osType: encodeURIComponent(osType),
    sessionId: encodeURIComponent(sessionId),
    token: encodeURIComponent(token),
    nodeId: encodeURIComponent(node.id),
  };
  return {
    threadId,
    osType,
    provider: "browser",
    state: "live",
    previewUrl: fillTemplate(node.previewUrlTemplate, templateArgs),
    controlUrl: fillTemplate(node.controlUrlTemplate, templateArgs),
    providerSessionId: sessionId,
    sessionAuthToken: token,
    sessionAuthExpiresAt: authExpiresAt,
    resumeToken,
    resumeSupported: true,
    runtimeMessage: `${node.label} live (${node.transportMode.toUpperCase()})`,
    previewArtifactId: previous?.previewArtifactId ?? `preview-${threadId}-${osType}`,
    recordingArtifactId: previous?.recordingArtifactId,
    lastFrameAt: now,
    updatedAt: now,
    transportMode: node.transportMode,
    nodeId: node.id,
    leaseExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function releaseFleetNode(session: DesktopBridgeSession | undefined): void {
  if (getBridgeMode() !== "fleet" || !session?.nodeId) return;
  const node = getFleetNodeById(session.nodeId);
  if (!node) return;
  node.inUse = Math.max(0, node.inUse - 1);
}

function safeTokenEquals(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function findSessionByProviderSessionId(providerSessionId: string): DesktopBridgeSession | null {
  for (const session of desktopBridgeSessions.values()) {
    if (session.providerSessionId === providerSessionId) return session;
  }
  return null;
}

function isSessionAuthExpired(session: DesktopBridgeSession): boolean {
  if (!session.sessionAuthExpiresAt) return true;
  const expiresMs = Date.parse(session.sessionAuthExpiresAt);
  return Number.isNaN(expiresMs) || expiresMs <= Date.now();
}

function readGatewayToken(req: { query: Record<string, unknown>; headers: Record<string, unknown> }): string {
  const queryToken = typeof req.query.token === "string" ? req.query.token : "";
  const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  if (authHeader.toLowerCase().startsWith("bearer ")) return authHeader.slice(7).trim();
  return queryToken.trim();
}

async function postJsonWithTimeout(
  url: string,
  token: string | undefined,
  body: unknown,
  timeoutMs = 1500,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function forwardInputToFleetNode(
  session: DesktopBridgeSession,
  event: DesktopInputEvent,
): Promise<{ ok: boolean; attempted: boolean }> {
  const node = getFleetNodeById(session.nodeId);
  if (!node?.inputUrlTemplate) return { ok: true, attempted: false };
  const token = session.sessionAuthToken;
  const url = fillTemplate(node.inputUrlTemplate, {
    threadId: encodeURIComponent(session.threadId),
    osType: encodeURIComponent(session.osType),
    sessionId: encodeURIComponent(session.providerSessionId),
    token: encodeURIComponent(token ?? ""),
    nodeId: encodeURIComponent(node.id),
  });
  const ok = await postJsonWithTimeout(url, token, {
    sessionId: session.providerSessionId,
    threadId: session.threadId,
    osType: session.osType,
    event,
    at: new Date().toISOString(),
  });
  return { ok, attempted: true };
}

function reapExpiredFleetLeases(): void {
  if (getBridgeMode() !== "fleet") return;
  const nowMs = Date.now();
  for (const [key, session] of desktopBridgeSessions.entries()) {
    if (session.state !== "live" || !session.leaseExpiresAt) continue;
    const expiresMs = Date.parse(session.leaseExpiresAt);
    if (Number.isNaN(expiresMs) || expiresMs > nowMs) continue;
    releaseFleetNode(session);
    desktopBridgeSessions.set(key, {
      ...session,
      state: "stale",
      sessionAuthToken: undefined,
      sessionAuthExpiresAt: undefined,
      runtimeMessage: "Desktop lease expired; session marked stale.",
      updatedAt: new Date().toISOString(),
    });
  }
}

function ensureDesktopProviderAuthorized(authHeader: string | undefined): boolean {
  const token = process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN?.trim();
  if (!token) return true;
  return authHeader === `Bearer ${token}`;
}

function resolveBridgeDesktopUrl(threadId: string, osType: DesktopOsType): string {
  const configured =
    (osType === "windows"
      ? process.env.MEMORYOSTM_DESKTOP_PROVIDER_PREVIEW_URL_WINDOWS
      : process.env.MEMORYOSTM_DESKTOP_PROVIDER_PREVIEW_URL_UBUNTU) ??
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_PREVIEW_URL;
  return configured?.trim()
    ? configured.trim().replaceAll("{threadId}", threadId)
    : "";
}

desktopProviderRouter.get("/desktop/gateway/authorize", (req, res) => {
  reapExpiredFleetLeases();
  const sessionId =
    typeof req.query.sessionId === "string"
      ? req.query.sessionId.trim()
      : typeof req.headers["x-memoryostm-desktop-session"] === "string"
        ? req.headers["x-memoryostm-desktop-session"].trim()
        : "";
  const token = readGatewayToken(req);
  if (!sessionId || !token) {
    res.status(401).json({ error: "Desktop gateway token is required." });
    return;
  }
  const session = findSessionByProviderSessionId(sessionId);
  if (!session || session.state !== "live") {
    res.status(410).json({ error: "Desktop gateway session is not live." });
    return;
  }
  if (isSessionAuthExpired(session)) {
    res.status(401).json({ error: "Desktop gateway token expired." });
    return;
  }
  if (!safeTokenEquals(session.sessionAuthToken, token)) {
    res.status(401).json({ error: "Desktop gateway token is invalid." });
    return;
  }
  res.status(204).send();
});

desktopProviderRouter.use((req, res, next) => {
  if (!ensureDesktopProviderAuthorized(req.headers.authorization)) {
    res.status(401).json({ error: "Unauthorized desktop provider request." });
    return;
  }
  next();
});

desktopProviderRouter.get("/desktop/health", (_req, res) => {
  reapExpiredFleetLeases();
  if (getBridgeMode() === "fleet") {
    ensureFleetLoaded();
    const nodes = Array.from(fleetNodes.values());
    const healthy = nodes.some((node) => node.healthy && node.inUse < node.capacity);
    res.json({
      ok: healthy,
      healthy,
      mode: "fleet",
      message: healthy
        ? "Desktop fleet healthy."
        : nodes.length === 0
          ? "Desktop fleet is not configured."
          : "Desktop fleet saturated or unhealthy.",
      capacity: nodes.reduce((sum, node) => sum + node.capacity, 0),
      inUse: nodes.reduce((sum, node) => sum + node.inUse, 0),
      nodes: nodes.map((node) => ({
        id: node.id,
        label: node.label,
        healthy: node.healthy,
        inUse: node.inUse,
        capacity: node.capacity,
        transportMode: node.transportMode,
        osTypes: node.osTypes,
        hasInputForwarder: Boolean(node.inputUrlTemplate),
        hasScreenshotCapture: Boolean(node.screenshotUrlTemplate),
        hasHealthProbe: Boolean(node.healthUrl),
      })),
    });
    return;
  }
  res.json({
    ok: true,
    healthy: true,
    mode: "mock",
    message: "Desktop provider bridge healthy.",
  });
});

desktopProviderRouter.post("/desktop/sessions/start", (req, res) => {
  reapExpiredFleetLeases();
  const parsed = StartSessionBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid desktop start request." });
    return;
  }
  const threadId = parsed.data.threadId.trim();
  const osType = parsed.data.osType === "windows" ? "windows" : "ubuntu";
  const key = `${threadId}:${osType}`;
  const previous = desktopBridgeSessions.get(key);

  let session: DesktopBridgeSession;
  if (getBridgeMode() === "fleet") {
    const priorNode = previous?.nodeId ? getFleetNodeById(previous.nodeId) : null;
    const node = previous?.state === "live" && priorNode ? priorNode : selectFleetNode(osType);
    if (!node) {
      res.status(503).json({
        error: "No desktop fleet capacity available for this OS.",
        retryAfterSeconds: 10,
      });
      return;
    }
    if (!previous || previous.state !== "live") node.inUse += 1;
    session = buildFleetSession(threadId, osType, node, previous);
  } else {
    const now = new Date().toISOString();
    const previewUrl = previous?.previewUrl ?? resolveBridgeDesktopUrl(threadId, osType);
    const controlUrl = previous?.controlUrl ?? previewUrl;
    const hasConfiguredUrl = Boolean(previewUrl && controlUrl);
    session = {
      threadId,
      osType,
      provider: "browser",
      state: hasConfiguredUrl ? "live" : "starting",
      previewUrl: hasConfiguredUrl ? previewUrl : undefined,
      controlUrl: hasConfiguredUrl ? controlUrl : undefined,
      providerSessionId: previous?.providerSessionId ?? `bridge-${threadId}-${osType}`,
      sessionAuthToken:
        previous?.sessionAuthToken ?? `dtk_${randomBytes(16).toString("hex")}`,
      sessionAuthExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      resumeToken: previous?.resumeToken ?? `dtr_${randomBytes(16).toString("hex")}`,
      resumeSupported: true,
      runtimeMessage: hasConfiguredUrl
        ? `${osType === "windows" ? "Windows" : "Ubuntu"} desktop bridge is live.`
        : `${osType === "windows" ? "Windows" : "Ubuntu"} desktop bridge is not configured.`,
      previewArtifactId: previous?.previewArtifactId ?? `preview-${threadId}-${osType}`,
      recordingArtifactId: previous?.recordingArtifactId,
      lastFrameAt: now,
      updatedAt: now,
      transportMode: "image-stream",
    };
  }
  desktopBridgeSessions.set(key, session);
  res.json({ session });
});

desktopProviderRouter.get("/desktop/sessions/status", (req, res) => {
  reapExpiredFleetLeases();
  const parsed = QuerySessionSchema.safeParse({
    threadId: String(req.query.threadId ?? ""),
    osType: req.query.osType === "windows" ? "windows" : "ubuntu",
  });
  if (!parsed.success) {
    res.status(400).json({ error: "threadId is required." });
    return;
  }
  const threadId = parsed.data.threadId.trim();
  const osType = parsed.data.osType === "windows" ? "windows" : "ubuntu";
  const key = `${threadId}:${osType}`;
  const existing = desktopBridgeSessions.get(key);
  if (!existing) {
    res.json({
      session: {
        threadId,
        osType,
        provider: "browser",
        state: "idle",
        runtimeMessage: "Desktop bridge session has not started yet.",
      },
    });
    return;
  }
  res.json({ session: existing });
});

desktopProviderRouter.post("/desktop/sessions/stop", (req, res) => {
  reapExpiredFleetLeases();
  const parsed = StopSessionBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid desktop stop request." });
    return;
  }
  const threadId = parsed.data.threadId.trim();
  const osType = parsed.data.osType === "windows" ? "windows" : "ubuntu";
  const key = `${threadId}:${osType}`;
  const existing = desktopBridgeSessions.get(key);
  releaseFleetNode(existing);
  const now = new Date().toISOString();
  const session: DesktopBridgeSession = {
    threadId,
    osType,
    provider: "browser",
    state: "idle",
    previewUrl: existing?.previewUrl,
    controlUrl: existing?.controlUrl ?? existing?.previewUrl,
    providerSessionId: existing?.providerSessionId ?? `bridge-${threadId}-${osType}`,
    sessionAuthToken: undefined,
    sessionAuthExpiresAt: undefined,
    resumeToken: existing?.resumeToken,
    resumeSupported: existing?.resumeSupported ?? true,
    runtimeMessage: `${osType === "windows" ? "Windows" : "Ubuntu"} desktop bridge stopped.`,
    previewArtifactId: existing?.previewArtifactId,
    recordingArtifactId: existing?.recordingArtifactId,
    updatedAt: now,
    transportMode: existing?.transportMode ?? "image-stream",
    nodeId: existing?.nodeId,
  };
  desktopBridgeSessions.set(key, session);
  res.json({ session });
});

desktopProviderRouter.post("/desktop/sessions/input", async (req, res) => {
  reapExpiredFleetLeases();
  const parsed = InputSessionBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid desktop input request." });
    return;
  }
  const threadId = parsed.data.threadId.trim();
  const osType = parsed.data.osType === "windows" ? "windows" : "ubuntu";
  const event = parsed.data.event as DesktopInputEvent;
  const key = `${threadId}:${osType}`;
  const existing = desktopBridgeSessions.get(key);
  if (!existing) {
    res.json({
      accepted: false,
      message: "Desktop session is not live yet.",
      disconnectReason: "session_not_live",
      at: new Date().toISOString(),
    });
    return;
  }
  if (existing.state !== "live" || isSessionAuthExpired(existing)) {
    res.json({
      accepted: false,
      message: isSessionAuthExpired(existing)
        ? "Desktop control token expired; wake the desktop to resume control."
        : "Desktop session is not live.",
      disconnectReason: isSessionAuthExpired(existing) ? "auth_expired" : "session_not_live",
      at: new Date().toISOString(),
    });
    return;
  }
  const forwarded = await forwardInputToFleetNode(existing, event);
  if (forwarded.attempted && !forwarded.ok) {
    res.status(502).json({
      accepted: false,
      message: "Desktop input gateway rejected or timed out.",
      disconnectReason: "input_gateway_unavailable",
      at: new Date().toISOString(),
    });
    return;
  }
  existing.lastFrameAt = new Date().toISOString();
  existing.updatedAt = existing.lastFrameAt;
  if (existing.leaseExpiresAt) {
    existing.leaseExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  }
  if (existing.sessionAuthExpiresAt) {
    existing.sessionAuthExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }
  desktopBridgeSessions.set(key, existing);
  res.json({
    accepted: true,
    message: forwarded.attempted
      ? `Input forwarded (${event.type}).`
      : `Input accepted (${event.type}).`,
    at: existing.lastFrameAt,
  });
});

desktopProviderRouter.get("/desktop/sessions/stream", (req, res) => {
  reapExpiredFleetLeases();
  const parsed = QuerySessionSchema.safeParse({
    threadId: String(req.query.threadId ?? ""),
    osType: req.query.osType === "windows" ? "windows" : "ubuntu",
  });
  if (!parsed.success) {
    res.status(400).json({ error: "threadId is required." });
    return;
  }
  const threadId = parsed.data.threadId.trim();
  const osType = parsed.data.osType === "windows" ? "windows" : "ubuntu";
  const key = `${threadId}:${osType}`;
  const existing = desktopBridgeSessions.get(key);
  if (!existing) {
    res.json({
      connected: false,
      mode: "image-stream",
      resumeSupported: true,
      reconnectRecommended: true,
      reconnectAfterMs: 1500,
      disconnectReason: "session_not_started",
      message: "Desktop stream has not started yet.",
      at: new Date().toISOString(),
    });
    return;
  }
  res.json({
    connected: existing.state === "live" && !isSessionAuthExpired(existing),
    mode: existing.transportMode ?? "image-stream",
    latencyMs: existing.transportMode === "webrtc" ? 45 : 120,
    fps: existing.transportMode === "webrtc" ? 28 : 12,
    width: 1024,
    height: 768,
    cursorVisible: true,
    ...(existing.sessionAuthExpiresAt
      ? { sessionAuthExpiresAt: existing.sessionAuthExpiresAt }
      : {}),
    resumeSupported: existing.resumeSupported ?? true,
    reconnectRecommended: existing.state !== "live" || isSessionAuthExpired(existing),
    reconnectAfterMs: existing.state === "live" && !isSessionAuthExpired(existing) ? 0 : 1500,
    ...(existing.state !== "live" || isSessionAuthExpired(existing)
      ? {
          disconnectReason:
            isSessionAuthExpired(existing)
              ? "auth_expired"
              : existing.state === "stale"
              ? "lease_expired"
              : existing.state === "blocked"
                ? "provider_blocked"
                : existing.state === "error"
                  ? "provider_error"
                  : "session_not_live",
        }
      : {}),
    message: existing.runtimeMessage ?? "Desktop stream active.",
    at: existing.updatedAt,
  });
});

desktopProviderRouter.get("/desktop/sessions/screenshot", (req, res) => {
  reapExpiredFleetLeases();
  const parsed = QuerySessionSchema.safeParse({
    threadId: String(req.query.threadId ?? ""),
    osType: req.query.osType === "windows" ? "windows" : "ubuntu",
  });
  if (!parsed.success) {
    res.status(400).json({ error: "threadId is required." });
    return;
  }
  const threadId = parsed.data.threadId.trim();
  const osType = parsed.data.osType === "windows" ? "windows" : "ubuntu";
  const key = `${threadId}:${osType}`;
  const existing = desktopBridgeSessions.get(key);
  const at = new Date().toISOString();
  if (!existing || existing.state !== "live" || isSessionAuthExpired(existing)) {
    res.json({
      captured: false,
      message: !existing
        ? "Desktop session has not started yet."
        : isSessionAuthExpired(existing)
          ? "Desktop control token expired; wake the desktop before capturing proof."
          : "Desktop session is not live.",
      disconnectReason: !existing
        ? "session_not_started"
        : isSessionAuthExpired(existing)
          ? "auth_expired"
          : "session_not_live",
      at,
    });
    return;
  }
  const node = getFleetNodeById(existing.nodeId);
  if (!node?.screenshotUrlTemplate) {
    res.json({
      captured: false,
      message: "Desktop screenshot capture is not configured for this provider node.",
      at,
    });
    return;
  }
  const imageUrl = fillTemplate(node.screenshotUrlTemplate, {
    threadId: encodeURIComponent(existing.threadId),
    osType: encodeURIComponent(existing.osType),
    sessionId: encodeURIComponent(existing.providerSessionId),
    token: encodeURIComponent(existing.sessionAuthToken ?? ""),
    nodeId: encodeURIComponent(node.id),
  });
  existing.lastFrameAt = at;
  existing.updatedAt = at;
  desktopBridgeSessions.set(key, existing);
  res.json({
    captured: true,
    imageUrl,
    contentType: "image/png",
    width: 1024,
    height: 768,
    message: "Desktop screenshot proof captured.",
    at,
  });
});

export { desktopProviderRouter };
