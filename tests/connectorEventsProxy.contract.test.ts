import { describe, expect, it } from "vitest";
import { proxyConnectorEventStream } from "../memoryos-frontend/lib/connector-event-stream";

async function readResponseText(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        text += decoder.decode(value, { stream: true });
      }
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return text;
}

describe("connector event stream proxy", () => {
  it("downgrades a terminated upstream stream into a connector-offline SSE fallback", async () => {
    const upstream = new Response(
      new ReadableStream<Uint8Array>({
        pull: (() => {
          let emitted = false;
          return (controller) => {
            if (!emitted) {
              emitted = true;
              controller.enqueue(
                new TextEncoder().encode("event: ping\ndata: {\"ok\":true}\n\n"),
              );
              return;
            }
            controller.error(new Error("terminated"));
          };
        })(),
        start(controller) {
          void controller;
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
        },
      },
    );

    const proxied = proxyConnectorEventStream(upstream, "http://backend.test/api/connector/events");
    const text = await readResponseText(proxied);

    expect(text).toContain("event: ping");
    expect(text).toContain("event: connector-offline");
    expect(text).toContain("\"status\":\"offline\"");
    expect(proxied.headers.get("content-type")).toContain("text/event-stream");
  });

  it("returns a connector-offline fallback when the upstream stream has no body", async () => {
    const upstream = new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

    const proxied = proxyConnectorEventStream(upstream, "http://backend.test/api/connector/events");
    const text = await readResponseText(proxied);

    expect(text).toContain("event: connector-offline");
    expect(text).toContain("\"status\":\"offline\"");
  });
});
