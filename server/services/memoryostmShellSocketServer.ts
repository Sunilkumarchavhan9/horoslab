import type { Server as HttpServer } from "node:http";
import { WebSocketServer } from "ws";
import { memoryostmShellSessionManager } from "./memoryostmShellSessionManager";

type ClientMessage =
  | { type: "input"; input?: string }
  | { type: "resize"; cols?: number; rows?: number };

export function attachMemoryOSTMShellSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({
    server,
    path: "/ws/runtime/memoryostm-shell",
  });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const ticket = url.searchParams.get("ticket");
    if (!ticket) {
      socket.close(1008, "Missing ticket");
      return;
    }

    const threadId = memoryostmShellSessionManager.consumeTicket(ticket);
    if (!threadId) {
      socket.close(1008, "Invalid ticket");
      return;
    }

    const unsubscribeSnapshot = memoryostmShellSessionManager.subscribe(threadId, (snapshot) => {
      if (socket.readyState !== socket.OPEN) return;
      socket.send(
        JSON.stringify({
          type: "snapshot",
          snapshot,
        }),
      );
    });
    const unsubscribeTerminal = memoryostmShellSessionManager.subscribeTerminalOutput(
      threadId,
      (chunk) => {
        if (socket.readyState !== socket.OPEN) return;
        socket.send(
          JSON.stringify({
            type: "terminal_output",
            chunk,
          }),
        );
      },
    );

    socket.on("message", (raw) => {
      try {
        const payload = JSON.parse(String(raw)) as ClientMessage;
        if (payload.type === "input" && typeof payload.input === "string") {
          memoryostmShellSessionManager.writeInput(threadId, payload.input);
          return;
        }
        if (
          payload.type === "resize" &&
          typeof payload.cols === "number" &&
          typeof payload.rows === "number"
        ) {
          memoryostmShellSessionManager.resizeTerminal(
            threadId,
            payload.cols,
            payload.rows,
          );
        }
      } catch {
        // Ignore malformed websocket messages.
      }
    });

    socket.on("close", () => {
      unsubscribeSnapshot();
      unsubscribeTerminal();
    });
  });
}
