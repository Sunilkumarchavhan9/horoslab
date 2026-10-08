export type HorosTMShellLiveState =
  | "starting"
  | "working"
  | "waiting"
  | "error"
  | "closed";

export type HorosTMShellLiveEntry = {
  id: string;
  at: string;
  title: string;
  detail: string | null;
  output: string | null;
  kind: "command" | "runtime" | "prompt" | "session";
  state: HorosTMShellLiveState;
  exitCode?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  source: "browser" | "hook";
};

export type HorosTMShellLiveSnapshot = {
  threadId: string;
  sessionId: string;
  state: HorosTMShellLiveState;
  shell: "powershell" | "bash";
  cwd: string;
  promptLabel: string;
  summary: string | null;
  lastUpdatedAt: string | null;
  activeCommandId: string | null;
  cols: number;
  rows: number;
  entries: HorosTMShellLiveEntry[];
};

type ShellOpenResponse = {
  shell: HorosTMShellLiveSnapshot | null;
  wsUrl: string | null;
};

type ShellSnapshotResponse = {
  shell: HorosTMShellLiveSnapshot | null;
  cwd?: string | null;
};

async function unwrap<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { message?: string } | string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? typeof payload.error === "string"
          ? payload.error
          : payload.error?.message ?? "Shell request failed."
        : "Shell request failed.";
    throw new Error(message);
  }

  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }

  return payload as T;
}

export async function openHorosTMShellSession(
  threadId: string,
  dimensions?: { cols?: number; rows?: number },
): Promise<ShellOpenResponse> {
  const response = await fetch(`/api/runtime/threads/${encodeURIComponent(threadId)}/shell/open`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      cols: dimensions?.cols,
      rows: dimensions?.rows,
    }),
    cache: "no-store",
  });
  return unwrap<ShellOpenResponse>(response);
}

export async function getHorosTMShellSession(
  threadId: string,
): Promise<ShellSnapshotResponse> {
  const response = await fetch(`/api/runtime/threads/${encodeURIComponent(threadId)}/shell`, {
    cache: "no-store",
  });
  return unwrap<ShellSnapshotResponse>(response);
}

export async function runHorosTMShellCommand(
  threadId: string,
  command: string,
  dimensions?: { cols?: number; rows?: number },
): Promise<{ shell: HorosTMShellLiveSnapshot | null }> {
  const response = await fetch(
    `/api/runtime/threads/${encodeURIComponent(threadId)}/shell/command`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command, cols: dimensions?.cols, rows: dimensions?.rows }),
      cache: "no-store",
    },
  );
  return unwrap<{ shell: HorosTMShellLiveSnapshot | null }>(response);
}

export async function submitHorosTMShellPrompt(
  threadId: string,
  prompt: string,
  dimensions?: { cols?: number; rows?: number },
  metadata?: { currentLine?: string; recentHistory?: string },
): Promise<{ shell: HorosTMShellLiveSnapshot | null }> {
  const response = await fetch(
    `/api/runtime/threads/${encodeURIComponent(threadId)}/shell/prompt`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt,
        cols: dimensions?.cols,
        rows: dimensions?.rows,
        currentLine: metadata?.currentLine,
        recentHistory: metadata?.recentHistory,
      }),
      cache: "no-store",
    },
  );
  return unwrap<{ shell: HorosTMShellLiveSnapshot | null }>(response);
}

export function connectHorosTMShellStream(
  wsUrl: string,
  handlers: {
    onSnapshot: (snapshot: HorosTMShellLiveSnapshot) => void;
    onTerminalOutput?: (chunk: string) => void;
    onError?: () => void;
    onClose?: () => void;
  },
): {
  close: () => void;
  sendInput: (input: string) => void;
  sendResize: (cols: number, rows: number) => void;
} {
  const socket = new WebSocket(wsUrl);
  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(String(event.data)) as {
        type?: string;
        snapshot?: HorosTMShellLiveSnapshot;
        chunk?: string;
      };
      if (payload.type === "snapshot" && payload.snapshot) {
        handlers.onSnapshot(payload.snapshot);
        return;
      }
      if (payload.type === "terminal_output" && typeof payload.chunk === "string") {
        handlers.onTerminalOutput?.(payload.chunk);
      }
    } catch {
      // Ignore malformed payloads.
    }
  };
  socket.onerror = () => {
    handlers.onError?.();
  };
  socket.onclose = () => {
    handlers.onClose?.();
  };

  return {
    close: () => {
      socket.close();
    },
    sendInput: (input: string) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "input", input }));
    },
    sendResize: (cols: number, rows: number) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "resize", cols, rows }));
    },
  };
}
