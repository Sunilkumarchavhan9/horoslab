const EVENT_STREAM_HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const textEncoder = new TextEncoder();

function isStreamTerminationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const cause = error as Error & { cause?: { code?: string } };
  const code = cause.cause?.code?.toLowerCase() ?? "";
  return (
    message.includes("terminated") ||
    message.includes("econnreset") ||
    message.includes("socket hang up") ||
    message.includes("premature close") ||
    code === "econnreset"
  );
}

function buildConnectorEventHeaders(
  response: Response,
  upstreamUrl: string,
): Headers {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (!EVENT_STREAM_HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-MemoryOS-Proxy-Target", upstreamUrl);
  return headers;
}

function buildConnectorOfflineEvent(detail: string): Uint8Array {
  return textEncoder.encode(
    [
      "retry: 15000",
      "event: connector-offline",
      `data: ${JSON.stringify({ status: "offline", detail })}`,
      "",
      "",
    ].join("\n"),
  );
}

export function offlineEventStream(detail: string): Response {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(buildConnectorOfflineEvent(detail));
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-MemoryOS-Proxy-Fallback": "connector-events-offline",
    },
  });
}

export function proxyConnectorEventStream(
  response: Response,
  upstreamUrl: string,
): Response {
  if (!response.body) {
    return offlineEventStream("Connector event stream had no body.");
  }

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = response.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            controller.enqueue(value);
          }
        }
        controller.close();
      } catch (error) {
        if (isStreamTerminationError(error)) {
          controller.enqueue(
            buildConnectorOfflineEvent(
              error instanceof Error ? error.message : "Connector event stream terminated.",
            ),
          );
          controller.close();
          return;
        }
        controller.error(error);
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // Ignore reader release failures during shutdown.
        }
      }
    },
    cancel(reason) {
      void response.body?.cancel(reason).catch(() => undefined);
    },
  });

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildConnectorEventHeaders(response, upstreamUrl),
  });
}
