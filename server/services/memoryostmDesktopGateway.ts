import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import path from "node:path";
import { z } from "zod";
import { WebSocket, WebSocketServer } from "ws";
import type { Server as HttpServer } from "node:http";

type DesktopOsType = "ubuntu" | "windows";

type DesktopGatewayTarget = {
  id: string;
  label: string;
  osTypes: DesktopOsType[];
  healthy: boolean;
  httpBaseUrl?: string;
  viewUrlTemplate?: string;
  inputUrlTemplate?: string;
  screenshotUrlTemplate?: string;
  wsUrlTemplate?: string;
};

type DesktopInputEvent =
  | { type: "mouse_move"; x: number; y: number }
  | { type: "mouse_click"; x: number; y: number; button?: "left" | "middle" | "right"; action?: "down" | "up" | "click" | "double_click" }
  | { type: "scroll"; x?: number; y?: number; deltaX: number; deltaY: number }
  | { type: "key"; key: string; action?: "down" | "up" | "press"; modifiers?: Array<"ctrl" | "alt" | "shift" | "meta"> }
  | { type: "text"; text: string };

const DesktopInputEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mouse_move"), x: z.number(), y: z.number() }),
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
  z.object({ type: z.literal("text"), text: z.string().min(1).max(8000) }),
]);

const GatewayTargetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  osTypes: z.array(z.enum(["ubuntu", "windows"])).min(1),
  healthy: z.boolean().optional(),
  httpBaseUrl: z.string().min(1).optional(),
  viewUrlTemplate: z.string().min(1).optional(),
  inputUrlTemplate: z.string().min(1).optional(),
  screenshotUrlTemplate: z.string().min(1).optional(),
  wsUrlTemplate: z.string().min(1).optional(),
});

const GatewayTargetsSchema = z.array(GatewayTargetSchema).min(1);
const DESKTOP_GATEWAY_AUTHORIZE_TIMEOUT_MS = 5000;
const DESKTOP_GATEWAY_INPUT_TIMEOUT_MS = 10000;

let loadedSignature = "";
let loadedTargets: DesktopGatewayTarget[] = [];

function fillTemplate(template: string, args: Record<string, string>): string {
  let output = template;
  for (const [key, value] of Object.entries(args)) {
    output = output.replaceAll(`{${key}}`, value);
  }
  return output;
}

function normalizeDesktopAssetPath(rawPath: string): string {
  const [pathPart, query = ""] = rawPath.split("?");
  const normalized = path.posix.normalize(`/${pathPart.replace(/^\.\/+/, "")}`);
  const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return query ? `${cleanPath}?${query}` : cleanPath;
}

function deriveWebSocketTemplateFromHttpBaseUrl(
  httpBaseUrl?: string,
): string | undefined {
  if (!httpBaseUrl?.trim()) return undefined;
  try {
    const url = new URL(httpBaseUrl.trim());
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const pathname = url.pathname.replace(/\/+$/, "");
    url.pathname = `${pathname}/websockify`;
    url.search = "?token={sessionId}";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

function getGatewaySignature(): string {
  return [
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON ?? "",
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_UBUNTU_HTTP_BASE_URL ?? "",
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_UBUNTU_WS_URL ?? "",
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_WINDOWS_HTTP_BASE_URL ?? "",
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_WINDOWS_WS_URL ?? "",
  ].join("|");
}

function buildFallbackTargets(): DesktopGatewayTarget[] {
  const ubuntuHttp = process.env.MEMORYOSTM_DESKTOP_GATEWAY_UBUNTU_HTTP_BASE_URL?.trim();
  const ubuntuWs = process.env.MEMORYOSTM_DESKTOP_GATEWAY_UBUNTU_WS_URL?.trim();
  const windowsHttp = process.env.MEMORYOSTM_DESKTOP_GATEWAY_WINDOWS_HTTP_BASE_URL?.trim();
  const windowsWs = process.env.MEMORYOSTM_DESKTOP_GATEWAY_WINDOWS_WS_URL?.trim();
  const targets: DesktopGatewayTarget[] = [];
  if (ubuntuHttp || ubuntuWs) {
    targets.push({
      id: "ubuntu-local",
      label: "Ubuntu local desktop",
      osTypes: ["ubuntu"],
      healthy: true,
      httpBaseUrl: ubuntuHttp,
      wsUrlTemplate: ubuntuWs ?? deriveWebSocketTemplateFromHttpBaseUrl(ubuntuHttp),
    });
  }
  if (windowsHttp || windowsWs) {
    targets.push({
      id: "windows-local",
      label: "Windows local desktop",
      osTypes: ["windows"],
      healthy: true,
      httpBaseUrl: windowsHttp,
      wsUrlTemplate: windowsWs ?? deriveWebSocketTemplateFromHttpBaseUrl(windowsHttp),
    });
  }
  return targets;
}

export function loadDesktopGatewayTargets(): DesktopGatewayTarget[] {
  const signature = getGatewaySignature();
  if (loadedSignature === signature) return loadedTargets;

  const configured = process.env.MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON?.trim();
  const parsed =
    configured
      ? GatewayTargetsSchema.safeParse((() => {
          try {
            return JSON.parse(configured);
          } catch {
            return null;
          }
        })())
      : null;
  loadedTargets =
    parsed?.success
      ? parsed.data.map((target) => ({
          id: target.id,
          label: target.label ?? target.id,
          osTypes: target.osTypes,
          healthy: target.healthy ?? true,
          httpBaseUrl: target.httpBaseUrl,
          viewUrlTemplate: target.viewUrlTemplate,
          inputUrlTemplate: target.inputUrlTemplate,
          screenshotUrlTemplate: target.screenshotUrlTemplate,
          wsUrlTemplate:
            target.wsUrlTemplate ??
            deriveWebSocketTemplateFromHttpBaseUrl(target.httpBaseUrl),
        }))
      : buildFallbackTargets();
  loadedSignature = signature;
  return loadedTargets;
}

export function getDesktopGatewayTarget(targetId?: string | null): DesktopGatewayTarget | null {
  const targets = loadDesktopGatewayTargets().filter((target) => target.healthy);
  if (targetId) return targets.find((target) => target.id === targetId) ?? null;
  return targets[0] ?? null;
}

function getProviderAuthorizeUrl(): string {
  const explicit = process.env.MEMORYOSTM_DESKTOP_GATEWAY_PROVIDER_AUTHORIZE_URL?.trim();
  if (explicit) return explicit;
  const base =
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL?.trim() ||
    `http://127.0.0.1:${process.env.PORT ?? 3001}/internal/desktop-provider`;
  return `${base.replace(/\/+$/, "")}/desktop/gateway/authorize`;
}

export function readDesktopGatewayToken(params: {
  queryToken?: unknown;
  authorization?: string | string[] | undefined;
}): string {
  if (typeof params.queryToken === "string" && params.queryToken.trim()) {
    return params.queryToken.trim();
  }

  const authHeader = Array.isArray(params.authorization)
    ? params.authorization[0]
    : params.authorization;
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}

export async function authorizeDesktopGatewaySession(
  sessionId: string,
  token: string,
): Promise<boolean> {
  if (!sessionId || !token) return false;
  const url = new URL(getProviderAuthorizeUrl());
  url.searchParams.set("sessionId", sessionId);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DESKTOP_GATEWAY_AUTHORIZE_TIMEOUT_MS,
  );
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    return response.status === 204;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildGatewayTargetUrl(
  target: DesktopGatewayTarget,
  args: {
    sessionId: string;
    token: string;
    path?: string;
    query?: string;
    mode: "view" | "input" | "screenshot" | "ws" | "proxy";
  },
): string | null {
  const templateArgs = {
    sessionId: encodeURIComponent(args.sessionId),
    token: encodeURIComponent(args.token),
    targetId: encodeURIComponent(target.id),
  };
  if (args.mode === "view" && target.viewUrlTemplate) {
    return fillTemplate(target.viewUrlTemplate, templateArgs);
  }
  if (args.mode === "input" && target.inputUrlTemplate) {
    return fillTemplate(target.inputUrlTemplate, templateArgs);
  }
  if (args.mode === "screenshot" && target.screenshotUrlTemplate) {
    return fillTemplate(target.screenshotUrlTemplate, templateArgs);
  }
  if (args.mode === "ws" && target.wsUrlTemplate) {
    return fillTemplate(target.wsUrlTemplate, templateArgs);
  }
  if (args.mode === "proxy" && target.httpBaseUrl) {
    const base = target.httpBaseUrl.replace(/\/+$/, "");
    const path = args.path?.startsWith("/") ? args.path : `/${args.path ?? ""}`;
    return `${base}${path}${args.query ?? ""}`;
  }
  return null;
}

export function buildDesktopGatewayProxyPath(args: {
  sessionId: string;
  targetId: string;
  token: string;
  path: string;
  query?: string;
}): string {
  const cleanPath = args.path.startsWith("/") ? args.path : `/${args.path}`;
  const query = new URLSearchParams();
  query.set("target", args.targetId);
  query.set("token", args.token);
  if (args.query) {
    const existing = new URLSearchParams(args.query.startsWith("?") ? args.query.slice(1) : args.query);
    for (const [key, value] of existing.entries()) {
      if (key === "target") continue;
      if (key === "token") {
        query.append("upstream_token", value);
        continue;
      }
      query.append(key, value);
    }
  }
  return `/desktop-gateway/sessions/${encodeURIComponent(args.sessionId)}/proxy${cleanPath}?${query.toString()}`;
}

export function rewriteDesktopGatewayResponseText(args: {
  body: string;
  contentType: string;
  sessionId: string;
  targetId: string;
  token: string;
}): string {
  if (!/(html|css)/i.test(args.contentType)) return args.body;
  const toProxyPath = (rawPath: string): string => {
    if (
      rawPath.startsWith("http://") ||
      rawPath.startsWith("https://") ||
      rawPath.startsWith("data:") ||
      rawPath.startsWith("blob:") ||
      rawPath.startsWith("#") ||
      rawPath.startsWith("/desktop-gateway/")
    ) {
      return rawPath;
    }
    const normalizedPath = normalizeDesktopAssetPath(rawPath);
    const [path, query = ""] = normalizedPath.split("?");
    return buildDesktopGatewayProxyPath({
      sessionId: args.sessionId,
      targetId: args.targetId,
      token: args.token,
      path,
      query,
    });
  };
  const wsProxyPath = `/ws/desktop-gateway/sessions/${encodeURIComponent(args.sessionId)}?target=${encodeURIComponent(args.targetId)}&token=${encodeURIComponent(args.token)}`;

  const assetAttributePattern = new RegExp('(src|href|action)=["\']([^"\'#:]+)["\']', 'gi');
  const cssUrlPattern = new RegExp('url\\((["\']?)([^"\')]+)\\1\\)', 'gi');
  const websockifyPattern = new RegExp('(["\'`])(\\/websockify[^"\'`]*)\\1', 'gi');
  const scriptRelativePathPattern = new RegExp(
    '(["\'`])((?:\\.\\/|\\/)?(?:assets|src|static|vendor)\\/[^"\'`?#]+(?:\\?[^"\'`]*)?)\\1',
    'gi',
  );
  const scriptRootAssetPattern = new RegExp(
    '(["\'`])(\\/(?:manifest\\.json|favicon\\.ico|websockify|api\\/[^"\'`]+|[^"\'`]+\\.(?:js|css|json|wasm|png|jpg|jpeg|svg|ico))(?:\\?[^"\'`]*)?)\\1',
    'gi',
  );

  return args.body
    .replaceAll(assetAttributePattern, (_match, attr: string, path: string) => {
      return `${attr}="${toProxyPath(path)}"`;
    })
    .replaceAll(cssUrlPattern, (_match, quote: string, path: string) => {
      return `url(${quote}${toProxyPath(path)}${quote})`;
    })
    .replaceAll(websockifyPattern, (_match, quote: string) => {
      return `${quote}${wsProxyPath}${quote}`;
    })
    .replaceAll(scriptRelativePathPattern, (_match, quote: string, path: string) => {
      return `${quote}${toProxyPath(path)}${quote}`;
    })
    .replaceAll(scriptRootAssetPattern, (_match, quote: string, path: string) => {
      return `${quote}${toProxyPath(path)}${quote}`;
    });
}

export async function forwardDesktopGatewayInput(params: {
  sessionId: string;
  token: string;
  target: DesktopGatewayTarget;
  event: DesktopInputEvent;
}): Promise<{ accepted: boolean; status: number; message: string }> {
  const parsed = DesktopInputEventSchema.safeParse(params.event);
  if (!parsed.success) {
    return { accepted: false, status: 400, message: "Invalid desktop input event." };
  }
  const inputUrl = buildGatewayTargetUrl(params.target, {
    sessionId: params.sessionId,
    token: params.token,
    mode: "input",
  });
  if (!inputUrl) {
    return {
      accepted: true,
      status: 202,
      message: "Desktop input accepted by gateway; no target input adapter configured.",
    };
  }
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DESKTOP_GATEWAY_INPUT_TIMEOUT_MS,
  );
  try {
    const response = await fetch(inputUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        sessionId: params.sessionId,
        event: parsed.data,
        at: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    return {
      accepted: response.ok,
      status: response.status,
      message: response.ok
        ? "Desktop input forwarded to target."
        : "Desktop input target rejected the event.",
    };
  } catch {
    return {
      accepted: false,
      status: 502,
      message: "Desktop input target is unavailable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function pipeWebSocketToDesktopTarget(params: {
  client: WebSocket;
  sessionId: string;
  token: string;
  target: DesktopGatewayTarget;
}): Promise<void> {
  const targetUrl = buildGatewayTargetUrl(params.target, {
    sessionId: params.sessionId,
    token: params.token,
    mode: "ws",
  });
  if (!targetUrl) {
    params.client.close(1011, "No desktop websocket target configured");
    return;
  }
  const upstream = new WebSocket(targetUrl, {
    headers: { authorization: `Bearer ${params.token}` },
  });
  upstream.on("open", () => {
    params.client.on("message", (message, isBinary) => {
      if (upstream.readyState === upstream.OPEN) upstream.send(message, { binary: isBinary });
    });
    upstream.on("message", (message, isBinary) => {
      if (params.client.readyState === params.client.OPEN) {
        params.client.send(message, { binary: isBinary });
      }
    });
  });
  upstream.on("close", (code, reason) => {
    if (params.client.readyState === params.client.OPEN) {
      params.client.close(code, reason.toString());
    }
  });
  upstream.on("error", () => {
    if (params.client.readyState === params.client.OPEN) {
      params.client.close(1011, "Desktop websocket target unavailable");
    }
  });
  params.client.on("close", () => {
    if (upstream.readyState === upstream.OPEN || upstream.readyState === upstream.CONNECTING) {
      upstream.close();
    }
  });
}

export function attachMemoryOSTMDesktopGatewaySocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (!url.pathname.startsWith("/ws/desktop-gateway/sessions/")) return;
    void (async () => {
      const parts = url.pathname.split("/").filter(Boolean);
      const sessionId = parts[3] ?? "";
      const token = readDesktopGatewayToken({
        queryToken: url.searchParams.get("token"),
        authorization: request.headers.authorization,
      });
      const target = getDesktopGatewayTarget(url.searchParams.get("target"));
      if (!sessionId || !token || !target) {
        socket.destroy();
        return;
      }
      const authorized = await authorizeDesktopGatewaySession(sessionId, token);
      if (!authorized) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (client) => {
        void pipeWebSocketToDesktopTarget({ client, sessionId, token, target });
      });
    })();
  });
}
