import http from "node:http";
import { Buffer } from "node:buffer";
import { chromium } from "playwright-core";

const port = Number(process.env.PORT || 3090);
const webtopBaseUrl = (process.env.MEMORYOSTM_UBUNTU_WEBTOP_BASE_URL || "http://ubuntu-desktop-a:3000").replace(/\/+$/, "");
const authorizeUrl = process.env.MEMORYOSTM_DESKTOP_ADAPTER_AUTHORIZE_URL?.trim() || "";
const viewportWidth = Number(process.env.MEMORYOSTM_DESKTOP_ADAPTER_WIDTH || 1280);
const viewportHeight = Number(process.env.MEMORYOSTM_DESKTOP_ADAPTER_HEIGHT || 800);
const authorizeTimeoutMs = Number(process.env.MEMORYOSTM_DESKTOP_ADAPTER_AUTHORIZE_TIMEOUT_MS || 5000);
const nativeScreenshotTimeoutMs = Number(process.env.MEMORYOSTM_DESKTOP_ADAPTER_NATIVE_SCREENSHOT_TIMEOUT_MS || 3000);

let browserPromise;
const pages = new Map();

function json(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "cache-control": "no-store",
    "content-length": payload.length,
    "content-type": "application/json",
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const body = await readBody(req);
  if (body.length === 0) return {};
  return JSON.parse(body.toString("utf8"));
}

function readBearer(req) {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

async function isAuthorized(sessionId, token) {
  if (!authorizeUrl) return true;
  if (!sessionId || !token) return false;
  const url = new URL(authorizeUrl);
  url.searchParams.set("sessionId", sessionId);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(authorizeTimeoutMs),
    });
    return response.status === 204;
  } catch {
    return false;
  }
}

async function getBrowser() {
  browserPromise ??= chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });
  return browserPromise;
}

async function getPage(sessionId) {
  const key = sessionId || "default";
  const existing = pages.get(key);
  if (existing && !existing.isClosed()) return existing;

  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: viewportWidth, height: viewportHeight },
  });
  page.setDefaultTimeout(5000);
  await page.goto(webtopBaseUrl, { waitUntil: "domcontentloaded" });
  pages.set(key, page);
  return page;
}

async function applyInput(page, event) {
  if (!event || typeof event !== "object") {
    throw new Error("Missing desktop input event.");
  }
  switch (event.type) {
    case "mouse_move": {
      await page.mouse.move(Number(event.x), Number(event.y));
      return;
    }
    case "mouse_click": {
      const button = event.button || "left";
      const x = Number(event.x);
      const y = Number(event.y);
      if (event.action === "down") {
        await page.mouse.move(x, y);
        await page.mouse.down({ button });
        return;
      }
      if (event.action === "up") {
        await page.mouse.move(x, y);
        await page.mouse.up({ button });
        return;
      }
      await page.mouse.click(x, y, {
        button,
        clickCount: event.action === "double_click" ? 2 : 1,
      });
      return;
    }
    case "scroll": {
      if (typeof event.x === "number" && typeof event.y === "number") {
        await page.mouse.move(event.x, event.y);
      }
      await page.mouse.wheel(Number(event.deltaX || 0), Number(event.deltaY || 0));
      return;
    }
    case "key": {
      const modifiers = Array.isArray(event.modifiers) ? event.modifiers : [];
      for (const modifier of modifiers) await page.keyboard.down(modifier);
      try {
        if (event.action === "down") {
          await page.keyboard.down(String(event.key));
        } else if (event.action === "up") {
          await page.keyboard.up(String(event.key));
        } else {
          await page.keyboard.press(String(event.key));
        }
      } finally {
        for (const modifier of [...modifiers].reverse()) await page.keyboard.up(modifier);
      }
      return;
    }
    case "text": {
      await page.keyboard.type(String(event.text || ""));
      return;
    }
    default:
      throw new Error(`Unsupported desktop input type: ${event.type}`);
  }
}

async function tryNativeScreenshot() {
  const candidatePaths = [
    "/api/get_screenshot",
    "/api/screenshot",
    "/screenshot.png",
  ];
  for (const candidatePath of candidatePaths) {
    try {
      const response = await fetch(`${webtopBaseUrl}${candidatePath}`, {
        headers: { accept: "image/png,image/jpeg,image/webp,image/*" },
        signal: AbortSignal.timeout(nativeScreenshotTimeoutMs),
      });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && /^image\//i.test(contentType)) {
        return {
          body: Buffer.from(await response.arrayBuffer()),
          contentType,
        };
      }
    } catch {
      // Fall through to browser screenshot capture.
    }
  }
  return null;
}

async function handleScreenshot(req, res, sessionId) {
  const token = readBearer(req);
  if (!(await isAuthorized(sessionId, token))) {
    json(res, 401, { error: "Desktop adapter session is not authorized." });
    return;
  }

  const native = await tryNativeScreenshot();
  if (native) {
    res.writeHead(200, {
      "cache-control": "no-store",
      "content-length": native.body.length,
      "content-type": native.contentType,
    });
    res.end(native.body);
    return;
  }

  const page = await getPage(sessionId);
  const body = await page.screenshot({ type: "png", fullPage: false });
  res.writeHead(200, {
    "cache-control": "no-store",
    "content-length": body.length,
    "content-type": "image/png",
  });
  res.end(body);
}

async function handleInput(req, res, sessionId) {
  const token = readBearer(req);
  if (!(await isAuthorized(sessionId, token))) {
    json(res, 401, { accepted: false, message: "Desktop adapter session is not authorized." });
    return;
  }
  const payload = await readJson(req);
  const page = await getPage(sessionId);
  await applyInput(page, payload.event ?? payload);
  json(res, 200, {
    accepted: true,
    message: "Ubuntu desktop input applied through MemoryOSTM adapter.",
    at: new Date().toISOString(),
  });
}

async function proxyToWebtop(req, res) {
  const target = new URL(req.url || "/", webtopBaseUrl);
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || key.toLowerCase() === "host") continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = {};
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-encoding") return;
    responseHeaders[key] = value;
  });
  res.writeHead(upstream.status, responseHeaders);
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

function extractSessionId(pathname) {
  const inputMatch = pathname.match(/^\/(?:sessions\/([^/]+)\/input|input\/([^/]+))\/?$/);
  if (inputMatch) return inputMatch[1] || inputMatch[2] || "";
  const screenshotMatch = pathname.match(/^\/(?:sessions\/([^/]+)\/screenshot(?:\.png)?|screenshot\/([^/]+)\.png)\/?$/);
  if (screenshotMatch) return screenshotMatch[1] || screenshotMatch[2] || "";
  return "";
}

const server = http.createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, {
        ok: true,
        service: "memoryostm-ubuntu-desktop-adapter",
        webtopBaseUrl,
        screenshot: "native-or-playwright",
      });
      return;
    }
    if (req.method === "POST" && /^\/(?:sessions\/[^/]+\/input|input\/[^/]+)\/?$/.test(url.pathname)) {
      await handleInput(req, res, extractSessionId(url.pathname));
      return;
    }
    if (req.method === "GET" && /^\/(?:sessions\/[^/]+\/screenshot(?:\.png)?|screenshot\/[^/]+\.png|api\/get_screenshot)\/?$/.test(url.pathname)) {
      await handleScreenshot(req, res, extractSessionId(url.pathname) || String(url.searchParams.get("sessionId") || "default"));
      return;
    }
    await proxyToWebtop(req, res);
  })().catch((error) => {
    json(res, 502, {
      error: error instanceof Error ? error.message : "Ubuntu desktop adapter failed.",
    });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`MemoryOSTM Ubuntu desktop adapter listening on :${port}`);
  console.log(`Proxying webtop from ${webtopBaseUrl}`);
});
