"use client";

import { datadogRum } from "@datadog/browser-rum";
import { useEffect } from "react";

export function DatadogRumInit() {
  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
    const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;

    if (!clientToken || !applicationId) return;

    datadogRum.init({
      applicationId,
      clientToken,
      site: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
      service: process.env.NEXT_PUBLIC_DD_SERVICE || "memoryos-frontend",
      env: process.env.NEXT_PUBLIC_DD_ENV || process.env.NODE_ENV || "development",
      version: process.env.NEXT_PUBLIC_DD_VERSION,
      sessionSampleRate: Number(process.env.NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE ?? 100),
      sessionReplaySampleRate: Number(process.env.NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE ?? 0),
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: "mask-user-input",
    });
  }, []);

  return null;
}

