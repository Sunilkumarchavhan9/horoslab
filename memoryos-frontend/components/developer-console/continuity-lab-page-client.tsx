"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RunDemoSection } from "@/components/developer-console/sections/run-demo-section";
import type { LabLayoutMode } from "@/components/developer-console/continuity-lab-ide-workspace";

function ContinuityLabChromeLock({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);
  return children;
}

function ContinuityLabPageInner() {
  const params = useSearchParams();
  const autostart = params.get("autostart") === "1";
  const autobrief = params.get("autobrief") === "1" || autostart;
  const layoutParam = params.get("layout");
  const desktop = params.get("desktop") === "1";
  const initialLayoutMode: LabLayoutMode | undefined =
    layoutParam === "editor"
      ? "editor"
      : layoutParam === "agent"
        ? "agent"
        : desktop
          ? "editor"
          : undefined;
  return (
    <ContinuityLabChromeLock>
      <RunDemoSection
        autostart={autostart}
        autobrief={autobrief}
        initialLayoutMode={initialLayoutMode}
        forceDesktop={desktop}
      />
    </ContinuityLabChromeLock>
  );
}

export function ContinuityLabPageClient() {
  return (
    <Suspense
      fallback={
        <ContinuityLabChromeLock>
          <RunDemoSection />
        </ContinuityLabChromeLock>
      }
    >
      <ContinuityLabPageInner />
    </Suspense>
  );
}
