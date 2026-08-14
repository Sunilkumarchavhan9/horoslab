"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { CornerUpRight, RefreshCcw } from "lucide-react";
import type { RuntimeThread } from "@/lib/continuity-lab/openhands-api";
import type { DesktopState } from "@/lib/continuity-lab/agent-store";
import type {
  RuntimeDesktopInputEvent,
  RuntimeDesktopStreamState,
} from "@/lib/continuity-lab/openhands-api";
import { cn } from "@/lib/utils";

type DesktopFreshness = "live" | "stale" | "blocked" | "waiting" | "idle" | "missing";

type ContinuityLabSessionDesktopPanelProps = {
  desktopUrl: string | null;
  controlUrl?: string | null;
  desktopState: DesktopState;
  desktopOsType?: "ubuntu" | "windows" | null;
  desktopFreshness: DesktopFreshness;
  desktopReady: boolean;
  runtimeThread: RuntimeThread | null;
  previewTitle?: string | null;
  verificationLabel?: string | null;
  previewArtifactUrl?: string | null;
  recordingArtifactUrl?: string | null;
  recordingTitle?: string | null;
  onWakeDesktop?: () => void;
  onToggleFullscreen?: () => void;
  onDesktopInput?: (event: RuntimeDesktopInputEvent) => void;
  streamState?: RuntimeDesktopStreamState | null;
  autoReconnecting?: boolean;
  reconnectAttemptCount?: number;
  waking?: boolean;
};

function desktopModifiersFromKeyboardEvent(
  event: KeyboardEvent<HTMLElement>,
): Array<"ctrl" | "alt" | "shift" | "meta"> {
  const modifiers: Array<"ctrl" | "alt" | "shift" | "meta"> = [];
  if (event.ctrlKey) modifiers.push("ctrl");
  if (event.altKey) modifiers.push("alt");
  if (event.shiftKey) modifiers.push("shift");
  if (event.metaKey) modifiers.push("meta");
  return modifiers;
}

function isPlaceholderDesktopUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/desktop-sandbox.html") ||
    url.includes("MemoryOS+desktop+sandbox") ||
    url.includes("MemoryOSTM+desktop+sandbox")
  );
}

function isEmbeddedDesktopTransport(url: string | null, transportMode?: string): boolean {
  return (
    Boolean(url?.includes("/desktop-gateway/")) ||
    transportMode === "vnc" ||
    transportMode === "webrtc"
  );
}

export function ContinuityLabSessionDesktopPanel({
  desktopUrl,
  controlUrl,
  desktopState,
  desktopFreshness,
  desktopReady,
  runtimeThread,
  onWakeDesktop,
  onToggleFullscreen,
  onDesktopInput,
  streamState,
  autoReconnecting = false,
  reconnectAttemptCount = 0,
  waking = false,
}: ContinuityLabSessionDesktopPanelProps) {
  const [frameState, setFrameState] = useState<{
    url: string | null;
    healthy: boolean;
    loaded: boolean;
  }>({ url: null, healthy: true, loaded: false });
  const rawIframeUrl = controlUrl ?? desktopUrl;
  const iframeUrl = isPlaceholderDesktopUrl(rawIframeUrl) ? null : rawIframeUrl;
  const iframeHealthy = frameState.url === iframeUrl ? frameState.healthy : true;
  const iframeLoaded = frameState.url === iframeUrl ? frameState.loaded : false;
  const desktopSession = runtimeThread?.desktopSession ?? null;
  const transportMode = desktopSession?.transportMode ?? streamState?.mode ?? "unknown";

  const iframeHandlesInput = isEmbeddedDesktopTransport(iframeUrl, transportMode);
  const hasStreamUrl = Boolean(iframeUrl);
  const streamConnected =
    streamState?.connected ??
    (hasStreamUrl && desktopReady && iframeHealthy && iframeLoaded);
  const isStarting =
    waking ||
    desktopState.status === "starting" ||
    desktopSession?.state === "starting";
  const hasProviderError =
    desktopState.status === "error" || desktopSession?.state === "error";
  const isLive =
    hasStreamUrl &&
    desktopReady &&
    iframeHealthy &&
    streamConnected &&
    desktopFreshness === "live" &&
    !hasProviderError;
  const isDisconnected =
    hasStreamUrl &&
    desktopReady &&
    (!iframeHealthy || streamState?.connected === false || hasProviderError);
  const showWakeButton = Boolean(onWakeDesktop) && !isLive;
  const statusLabel = isLive
    ? "Live"
    : isStarting || autoReconnecting
      ? "Waking up..."
      : "Wake up to see live";
  const centerLabel = isLive
    ? null
    : isStarting || autoReconnecting
      ? "DecagonIgnition connecting"
      : isDisconnected
        ? "Desktop stream disconnected"
        : "DecagonIgnition sleeping";
  const statusDotClass = isLive
    ? "bg-[#ff4141]"
    : isStarting || autoReconnecting
      ? "bg-amber-300"
      : "bg-white/35";
  const getPointerPosition = (event: MouseEvent<HTMLElement>) => {
    const target = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - target.left),
      y: Math.round(event.clientY - target.top),
    };
  };

  const sendPointerMove = (event: MouseEvent<HTMLElement>) => {
    if (!onDesktopInput || !iframeHealthy) return;
    onDesktopInput({ type: "mouse_move", ...getPointerPosition(event) });
  };

  const sendPointerClick = (event: MouseEvent<HTMLElement>) => {
    if (!onDesktopInput || !iframeHealthy) return;
    onDesktopInput({
      type: "mouse_click",
      ...getPointerPosition(event),
      button: "left",
      action: "click",
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f0f0f]">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-[#242424] bg-[#111111]">
        <div className="absolute inset-0 px-1.5 pt-1.5 pb-[42px]">
          <div className="relative h-full w-full overflow-hidden rounded-[8px] border border-white/8 bg-[#2b3038]">
            {iframeUrl && desktopReady ? (
              <iframe
                title="Live desktop"
                src={iframeUrl}
                className="h-full w-full border-0 bg-[#2b3038]"
                allow="clipboard-read; clipboard-write; fullscreen"
                onLoad={() => {
                  setFrameState({ url: iframeUrl, healthy: true, loaded: true });
                }}
                onError={() => {
                  setFrameState({ url: iframeUrl, healthy: false, loaded: false });
                }}
              />
            ) : null}
          </div>
        </div>

        {onDesktopInput && iframeUrl && desktopReady && !iframeHandlesInput ? (
          <div
            role="application"
            tabIndex={0}
            aria-label="Live desktop control surface"
            className="absolute inset-[6px_6px_42px_6px] z-[5] cursor-default rounded-[8px]"
            onFocus={() => setFrameState({ url: iframeUrl, healthy: true, loaded: iframeLoaded })}
            onMouseMove={sendPointerMove}
            onClick={(event) => {
              event.currentTarget.focus();
              sendPointerClick(event);
            }}
            onWheel={(event) => {
              if (!iframeHealthy) return;
              onDesktopInput({
                type: "scroll",
                deltaX: event.deltaX,
                deltaY: event.deltaY,
              });
            }}
            onKeyDown={(event) => {
              if (!iframeHealthy) return;
              if (event.key === "Tab") event.preventDefault();
              if (
                event.key === "Meta" ||
                event.key === "Control" ||
                event.key === "Alt" ||
                event.key === "Shift"
              ) {
                return;
              }
              onDesktopInput({
                type: "key",
                key: event.key,
                action: "press",
                modifiers: desktopModifiersFromKeyboardEvent(event),
              });
            }}
            onPaste={(event) => {
              if (!iframeHealthy) return;
              const text = event.clipboardData.getData("text");
              if (!text) return;
              event.preventDefault();
              onDesktopInput({ type: "text", text });
            }}
          />
        ) : null}

        {onToggleFullscreen ? (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="absolute right-3 top-3 z-30 inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-[#111111]/90 text-white/70 transition hover:bg-[#1a1a1a] hover:text-white"
            aria-label="Fullscreen desktop"
            title="Fullscreen desktop"
          >
            <CornerUpRight className="size-4" />
          </button>
        ) : null}

        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="max-w-md text-center">
              <p className="text-sm font-medium text-white/55">{centerLabel}</p>
              {isDisconnected ? (
                <p className="mt-2 text-xs text-white/35">
                  {streamState?.message ??
                    desktopState.runtimeMessage ??
                    "Reconnect the desktop runtime to restore the live view."}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-30">
          <div className="h-2 bg-[#2a3f72]">
            <div
              className={cn(
                "h-full bg-[#5f8fff]",
                isLive ? "w-full" : isStarting || autoReconnecting ? "w-2/3 animate-pulse" : "w-1/3",
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#101010] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-white/55">
              <button
                type="button"
                className="rounded-full border border-white/10 px-2 py-0.5 text-white/45 hover:bg-white/5 hover:text-white"
                aria-label="Back"
              >
                ←
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-2 py-0.5 text-white/45 hover:bg-white/5 hover:text-white"
                aria-label="Forward"
              >
                →
              </button>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-white/75">
                <span className={cn("size-2 rounded-full", statusDotClass)} />
                {statusLabel}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              {autoReconnecting ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-100">
                  reconnecting{reconnectAttemptCount > 0 ? ` #${reconnectAttemptCount}` : ""}
                </span>
              ) : null}
              {showWakeButton ? (
                <button
                  type="button"
                  onClick={onWakeDesktop}
                  disabled={waking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4f86ff]/35 bg-[#4f86ff]/15 px-3 py-1 text-[11px] text-[#9ec1ff] transition hover:bg-[#4f86ff]/25 disabled:opacity-60"
                >
                  <RefreshCcw className={cn("size-3.5", waking && "animate-spin")} />
                  {waking ? "Waking..." : "Wake up to see live"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
