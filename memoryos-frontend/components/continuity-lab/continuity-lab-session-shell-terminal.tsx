"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import {
  connectMemoryOSTMShellStream,
  openMemoryOSTMShellSession,
  submitMemoryOSTMShellPrompt,
  type MemoryOSTMShellLiveEntry,
  type MemoryOSTMShellLiveSnapshot,
} from "@/lib/continuity-lab/memoryostm-shell-session-api";
import {
  applyShellTerminalInput,
  summarizeShellHistory,
} from "@/lib/continuity-lab/memoryostm-shell-terminal-input";

type ContinuityLabSessionShellTerminalProps = {
  threadId: string;
  onSnapshot: (snapshot: MemoryOSTMShellLiveSnapshot) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (message: string | null) => void;
  scrollToEndToken?: number;
};

function renderEntryPrompt(promptLabel: string, entry: MemoryOSTMShellLiveEntry): string {
  if (entry.kind === "runtime") {
    return `${entry.title}\r\n`;
  }
  if (entry.kind === "session") {
    return `${entry.title}\r\n`;
  }
  if (entry.kind === "prompt") {
    return `memoryostm> ${entry.title}\r\n`;
  }
  return `${promptLabel} ${entry.title}\r\n`;
}

function renderSnapshotTranscript(snapshot: MemoryOSTMShellLiveSnapshot): string {
  const parts: string[] = [];
  for (const entry of snapshot.entries) {
    parts.push(renderEntryPrompt(snapshot.promptLabel, entry));
    if (entry.output) {
      parts.push(entry.output.replace(/\n/g, "\r\n"));
      if (!entry.output.endsWith("\n")) {
        parts.push("\r\n");
      }
    }
  }
  if (parts.length === 0) {
    parts.push(`${snapshot.promptLabel} `);
  } else if (snapshot.state !== "closed") {
    parts.push(`${snapshot.promptLabel} `);
  }
  return parts.join("");
}

export function ContinuityLabSessionShellTerminal({
  threadId,
  onSnapshot,
  onConnectionChange,
  onError,
  scrollToEndToken,
}: ContinuityLabSessionShellTerminalProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<ReturnType<typeof connectMemoryOSTMShellStream> | null>(null);
  const renderedSessionIdRef = useRef<string | null>(null);
  const shellSnapshotRef = useRef<MemoryOSTMShellLiveSnapshot | null>(null);
  const activeInputLineRef = useRef("");

  useEffect(() => {
    if (!hostRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
      fontSize: 12,
      lineHeight: 1.18,
      scrollback: 5000,
      convertEol: true,
      allowTransparency: true,
      theme: {
        background: "#0b0b0b",
        foreground: "#f3f4f6",
        cursor: "#f8fafc",
        cursorAccent: "#090909",
        selectionBackground: "rgba(255,255,255,0.10)",
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(hostRef.current);
    fitAddon.fit();
    terminal.focus();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    let inputDisposable: { dispose: () => void } | null = null;

    const openLiveSession = async () => {
      try {
        const dims = {
          cols: terminal.cols,
          rows: terminal.rows,
        };
        const opened = await openMemoryOSTMShellSession(threadId, dims);
        if (opened.shell) {
          shellSnapshotRef.current = opened.shell;
          onSnapshot(opened.shell);
          terminal.reset();
          terminal.write(renderSnapshotTranscript(opened.shell));
          renderedSessionIdRef.current = opened.shell.sessionId;
        }
        if (!opened.wsUrl) {
          onConnectionChange?.(false);
          return;
        }
        socketRef.current?.close();
        socketRef.current = connectMemoryOSTMShellStream(opened.wsUrl, {
          onSnapshot: (snapshot) => {
            shellSnapshotRef.current = snapshot;
            onSnapshot(snapshot);
            if (renderedSessionIdRef.current !== snapshot.sessionId) {
              terminal.reset();
              terminal.write(renderSnapshotTranscript(snapshot));
              renderedSessionIdRef.current = snapshot.sessionId;
            }
            onConnectionChange?.(true);
          },
          onTerminalOutput: (chunk) => {
            terminal.write(chunk);
          },
          onError: () => {
            onConnectionChange?.(false);
          },
          onClose: () => {
            onConnectionChange?.(false);
          },
        });

        inputDisposable = terminal.onData((data) => {
          const historyPreview = summarizeShellHistory(shellSnapshotRef.current?.entries ?? []);
          const next = applyShellTerminalInput(activeInputLineRef.current, data, historyPreview);
          activeInputLineRef.current = next.currentLine;

          if (next.promptSubmission) {
            void submitMemoryOSTMShellPrompt(
              threadId,
              next.promptSubmission.prompt,
              dims,
              {
                currentLine: next.promptSubmission.currentLine,
                recentHistory: next.promptSubmission.recentHistory ?? undefined,
              },
            ).catch((error) => {
              onError?.(error instanceof Error ? error.message : "Prompt submission failed.");
            });
          }

          socketRef.current?.sendInput(data);
        });
      } catch (error) {
        onConnectionChange?.(false);
        onError?.(error instanceof Error ? error.message : "Terminal unavailable.");
      }
    };

    void openLiveSession();

    const observer = new ResizeObserver(() => {
      if (!terminalRef.current || !fitAddonRef.current) return;
      fitAddonRef.current.fit();
      socketRef.current?.sendResize(terminalRef.current.cols, terminalRef.current.rows);
    });
    observer.observe(hostRef.current);

    return () => {
      observer.disconnect();
      inputDisposable?.dispose();
      inputDisposable = null;
      socketRef.current?.close();
      socketRef.current = null;
      activeInputLineRef.current = "";
      shellSnapshotRef.current = null;
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [onConnectionChange, onError, onSnapshot, threadId]);

  useEffect(() => {
    if (scrollToEndToken == null || scrollToEndToken <= 0) return;
    terminalRef.current?.scrollToBottom();
    terminalRef.current?.focus();
  }, [scrollToEndToken]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden bg-[#0b0b0b]" />;
}
