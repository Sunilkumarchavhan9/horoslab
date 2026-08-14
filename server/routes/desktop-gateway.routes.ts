import { Router } from "express";
import {
  authorizeDesktopGatewaySession,
  buildDesktopGatewayProxyPath,
  buildGatewayTargetUrl,
  forwardDesktopGatewayInput,
  getDesktopGatewayTarget,
  loadDesktopGatewayTargets,
  readDesktopGatewayToken,
  rewriteDesktopGatewayResponseText,
} from "../services/memoryostmDesktopGateway";

const desktopGatewayRouter = Router();

function getSessionToken(req: { query: Record<string, unknown>; headers: { authorization?: string | string[] } }): string {
  return readDesktopGatewayToken({
    queryToken: req.query.token,
    authorization: req.headers.authorization,
  });
}

desktopGatewayRouter.get("/health", (_req, res) => {
  const targets = loadDesktopGatewayTargets();
  res.json({
    ok: targets.some((target) => target.healthy),
    service: "memoryostm-desktop-gateway",
    targets: targets.map((target) => ({
      id: target.id,
      label: target.label,
      healthy: target.healthy,
      osTypes: target.osTypes,
      hasHttpProxy: Boolean(target.httpBaseUrl),
      hasInputAdapter: Boolean(target.inputUrlTemplate),
      hasScreenshotCapture: Boolean(target.screenshotUrlTemplate),
      hasWebSocketProxy: Boolean(target.wsUrlTemplate),
    })),
  });
});

desktopGatewayRouter.get("/sessions/:sessionId/authorize", async (req, res) => {
  const token = getSessionToken(req);
  const authorized = await authorizeDesktopGatewaySession(req.params.sessionId, token);
  if (!authorized) {
    res.status(401).json({ error: "Desktop gateway session is not authorized." });
    return;
  }
  res.status(204).send();
});

desktopGatewayRouter.get("/sessions/:sessionId/view", async (req, res) => {
  const token = getSessionToken(req);
  const target = getDesktopGatewayTarget(
    typeof req.query.target === "string" ? req.query.target : null,
  );
  if (!target) {
    res.status(503).json({ error: "No desktop gateway target is available." });
    return;
  }
  const authorized = await authorizeDesktopGatewaySession(req.params.sessionId, token);
  if (!authorized) {
    res.status(401).json({ error: "Desktop gateway session is not authorized." });
    return;
  }
  const viewUrl = buildGatewayTargetUrl(target, {
    sessionId: req.params.sessionId,
    token,
    mode: "view",
  });
  if (viewUrl) {
    res.redirect(302, viewUrl);
    return;
  }
  const proxyUrl = `/desktop-gateway/sessions/${encodeURIComponent(req.params.sessionId)}/proxy/?target=${encodeURIComponent(target.id)}&token=${encodeURIComponent(token)}`;
  res.type("html").send(`<!doctype html>
<html>
  <head><title>MemoryOSTM Desktop Gateway</title></head>
  <body style="margin:0;background:#0b0b0b">
    <iframe src="${proxyUrl}" style="border:0;width:100vw;height:100vh"></iframe>
  </body>
</html>`);
});

desktopGatewayRouter.post("/sessions/:sessionId/input", async (req, res) => {
  const token = getSessionToken(req);
  const target = getDesktopGatewayTarget(
    typeof req.query.target === "string" ? req.query.target : null,
  );
  if (!target) {
    res.status(503).json({ accepted: false, message: "No desktop gateway target is available." });
    return;
  }
  const authorized = await authorizeDesktopGatewaySession(req.params.sessionId, token);
  if (!authorized) {
    res.status(401).json({ accepted: false, message: "Desktop gateway session is not authorized." });
    return;
  }
  const result = await forwardDesktopGatewayInput({
    sessionId: req.params.sessionId,
    token,
    target,
    event: req.body?.event ?? req.body,
  });
  res.status(result.accepted ? result.status : result.status).json({
    accepted: result.accepted,
    message: result.message,
  });
});

desktopGatewayRouter.get("/sessions/:sessionId/screenshot", async (req, res) => {
  const token = getSessionToken(req);
  const target = getDesktopGatewayTarget(
    typeof req.query.target === "string" ? req.query.target : null,
  );
  if (!target) {
    res.status(503).json({ error: "No desktop gateway target is available." });
    return;
  }
  const authorized = await authorizeDesktopGatewaySession(req.params.sessionId, token);
  if (!authorized) {
    res.status(401).json({ error: "Desktop gateway session is not authorized." });
    return;
  }

  const screenshotUrl = buildGatewayTargetUrl(target, {
    sessionId: req.params.sessionId,
    token,
    mode: "screenshot",
  });
  if (!screenshotUrl) {
    res.status(501).json({ error: "Desktop gateway target does not support screenshot capture." });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(screenshotUrl, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "image/png,image/jpeg,image/webp,image/*;q=0.9,*/*;q=0.1",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      res.status(502).json({ error: "Desktop screenshot target rejected capture." });
      return;
    }
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    if (!/^image\//i.test(contentType)) {
      res.status(502).json({ error: "Desktop screenshot target returned a non-image response." });
      return;
    }
    res.status(200);
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-type", contentType);
    res.setHeader("x-memoryostm-desktop-session", req.params.sessionId);
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.status(502).json({ error: "Desktop screenshot target is unavailable." });
  } finally {
    clearTimeout(timeout);
  }
});

desktopGatewayRouter.use("/sessions/:sessionId/proxy", async (req, res) => {
  const token = getSessionToken(req);
  const target = getDesktopGatewayTarget(
    typeof req.query.target === "string" ? req.query.target : null,
  );
  if (!target) {
    res.status(503).json({ error: "No desktop gateway target is available." });
    return;
  }
  const authorized = await authorizeDesktopGatewaySession(req.params.sessionId, token);
  if (!authorized) {
    res.status(401).json({ error: "Desktop gateway session is not authorized." });
    return;
  }

  const proxyPath = req.path === "/" ? "/" : req.path;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "token" || key === "target") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key === "upstream_token" ? "token" : key, String(item));
      }
    } else if (typeof value !== "undefined") {
      query.set(key === "upstream_token" ? "token" : key, String(value));
    }
  }
  const targetUrl = buildGatewayTargetUrl(target, {
    sessionId: req.params.sessionId,
    token,
    path: proxyPath,
    query: query.size > 0 ? `?${query.toString()}` : "",
    mode: "proxy",
  });
  if (!targetUrl) {
    res.status(503).json({ error: "Desktop gateway target does not support HTTP proxying." });
    return;
  }

  try {
    const headers: Record<string, string> = {
      authorization: `Bearer ${token}`,
      accept: String(req.headers.accept ?? "*/*"),
    };
    if (typeof req.headers["content-type"] === "string") {
      headers["content-type"] = req.headers["content-type"];
    }
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : typeof req.body === "undefined"
            ? undefined
            : JSON.stringify(req.body),
    });
    const location = response.headers.get("location");
    if (location?.startsWith("/")) {
      res.setHeader(
        "location",
        buildDesktopGatewayProxyPath({
          sessionId: req.params.sessionId,
          targetId: target.id,
          token,
          path: location,
        }),
      );
    }
    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);
    if (contentType && /(html|css|javascript|ecmascript)/i.test(contentType)) {
      const body = await response.text();
      res.send(
        rewriteDesktopGatewayResponseText({
          body,
          contentType,
          sessionId: req.params.sessionId,
          targetId: target.id,
          token,
        }),
      );
      return;
    }
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.status(502).json({ error: "Desktop gateway target is unavailable." });
  }
});

export { desktopGatewayRouter };
