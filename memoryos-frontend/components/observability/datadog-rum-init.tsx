"use client";

import { Component, useEffect, type ReactNode } from "react";
import { isDatadogRumConfigured } from "./datadog-rum-config";

function DatadogRumInitInner() {
  useEffect(() => {
    if (!isDatadogRumConfigured()) return;

    let cancelled = false;

    void (async () => {
      const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
      const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
      if (!clientToken || !applicationId || cancelled) return;

      const rumWindow = window as typeof window & {
        __MEMORYOS_DD_RUM_INITIALIZED__?: boolean;
      };
      if (rumWindow.__MEMORYOS_DD_RUM_INITIALIZED__) return;

      const { datadogRum } = await import("@datadog/browser-rum");
      if (cancelled) return;

      try {
        if (datadogRum.getInitConfiguration()) {
          rumWindow.__MEMORYOS_DD_RUM_INITIALIZED__ = true;
          return;
        }
      } catch {
        // Continue to init when SDK does not expose current state.
      }

      datadogRum.init({
        applicationId,
        clientToken,
        site: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
        service: process.env.NEXT_PUBLIC_DD_SERVICE || "memoryos-frontend",
        env:
          process.env.NEXT_PUBLIC_DD_ENV ||
          process.env.NODE_ENV ||
          "development",
        version: process.env.NEXT_PUBLIC_DD_VERSION,
        sessionSampleRate: Number(
          process.env.NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE ?? 100,
        ),
        sessionReplaySampleRate: Number(
          process.env.NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE ?? 0,
        ),
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: "mask-user-input",
      });
      rumWindow.__MEMORYOS_DD_RUM_INITIALIZED__ = true;
    })().catch(() => {
      // Ignore init/chunk failures so observability never blocks the app shell.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

class DatadogRumInitErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/** Safe root slot for layout — skips when DD keys are absent. */
export function DatadogRumInit() {
  if (!isDatadogRumConfigured()) return null;

  return (
    <DatadogRumInitErrorBoundary>
      <DatadogRumInitInner />
    </DatadogRumInitErrorBoundary>
  );
}
