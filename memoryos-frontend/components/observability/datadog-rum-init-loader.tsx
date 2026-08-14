"use client";

import dynamic from "next/dynamic";
import { shouldMountDatadogRum } from "./datadog-rum-config";

const DatadogRumInit = dynamic(
  () =>
    import("./datadog-rum-init")
      .then((mod) => ({
        default: mod.DatadogRumInit,
      }))
      .catch(() => ({
        default: function DatadogRumInitChunkFailed() {
          return null;
        },
      })),
  { ssr: false },
);

export function DatadogRumInitLoader() {
  if (!shouldMountDatadogRum()) return null;
  return <DatadogRumInit />;
}
