"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildLaunchTaskFromContext,
  readMemoryOSLaunchContext,
  type MemoryOSLaunchContext,
} from "@/lib/continuity-launch-context";
import { markFunnelLabOpened } from "@/lib/company-brain-funnel";
import {
  buildLabIframeSrc,
  resolveLabOrigin,
  type MemoryOsConnectorState,
} from "@/lib/continuity-lab/runtime";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";

function launchContextFromUrl(): MemoryOSLaunchContext | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const project = params.get("project")?.trim();
  if (!project) return null;
  return {
    project,
    briefSummary: params.get("brief")?.trim() || undefined,
    repo: params.get("repo")?.trim() || null,
    branch: null,
    createdAt: new Date().toISOString(),
  };
}

export function useContinuityLabIframe(conversationId?: string | null) {
  const { connector } = useContinuityLab();
  const [launchContext, setLaunchContext] = useState<MemoryOSLaunchContext | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const labSrc = useMemo(
    () => buildLabIframeSrc(conversationId),
    [conversationId],
  );
  const labOrigin = useMemo(() => resolveLabOrigin(labSrc), [labSrc]);

  const connectorState = useMemo<MemoryOsConnectorState>(
    () => connector,
    [connector],
  );

  const postLaunchContext = useCallback(
    (targetOrigin = labOrigin ?? "*") => {
      if (!launchContext) return;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "memoryos:launch-context",
          payload: {
            ...launchContext,
            task: buildLaunchTaskFromContext(launchContext),
          },
        },
        targetOrigin,
      );
    },
    [launchContext, labOrigin],
  );

  const postConnectorState = useCallback(
    (targetOrigin = labOrigin ?? "*") => {
      iframeRef.current?.contentWindow?.postMessage(connectorState, targetOrigin);
      postLaunchContext(targetOrigin);
    },
    [connectorState, labOrigin, postLaunchContext],
  );

  useEffect(() => {
    const fromStorage = readMemoryOSLaunchContext();
    const fromUrl = launchContextFromUrl();
    const merged = fromStorage ?? fromUrl;
    if (merged) setLaunchContext(merged);
    markFunnelLabOpened();
  }, []);

  useEffect(() => {
    postConnectorState();
  }, [postConnectorState]);

  useEffect(() => {
    function handleConnectorStateRequest(event: MessageEvent) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        !event.data ||
        typeof event.data !== "object" ||
        (event.data as { type?: unknown }).type !== "memoryos:request-connector-state"
      ) {
        return;
      }
      postConnectorState(event.origin || labOrigin || "*");
    }

    window.addEventListener("message", handleConnectorStateRequest);
    return () => window.removeEventListener("message", handleConnectorStateRequest);
  }, [labOrigin, postConnectorState]);

  const onIframeLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "memoryos:request-lab-context" },
      labOrigin ?? "*",
    );
    postConnectorState();
  }, [labOrigin, postConnectorState]);

  return {
    iframeRef,
    labSrc,
    launchContext,
    onIframeLoad,
  };
}
