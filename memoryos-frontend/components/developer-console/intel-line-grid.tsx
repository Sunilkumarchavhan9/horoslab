"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const INTEL_LINE_CELL = "bg-white p-5 min-w-0";

/** Full-bleed stacked panels + hatch gutters (Connectors / Overview). */
export const intelPanelBleed = "intel-full-bleed intel-panel-run";

export function IntelLineGridFrame({
  children,
  className,
  flush,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        flush ? "bg-white" : "overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function IntelPageStack({ children }: { children: ReactNode }) {
  return <div className="intel-page-stack">{children}</div>;
}

/** Scrollable body below workspace header — not the full main column. */
export function IntelSectionScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "intel-section-scroll memoryos-console-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Root wrapper for intelligence dashboard sections (fills main, no page scroll). */
export const intelSectionRootClass =
  "intel-section-root intel-section-content flex h-full min-h-0 w-full min-w-0 flex-1 flex-col";

/** Line → diagonal hatch → line (matches Connected Intelligence Sources). */
export function IntelSectionGutter() {
  return (
    <div className="intel-section-gutter-band" role="presentation" aria-hidden="true">
      <div className="intel-section-gutter-line" />
      <div className="intel-section-gutter connector-section-gutter" />
      <div className="intel-section-gutter-line" />
    </div>
  );
}

export function IntelTileGrid({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "kpi" | "chart" | "cards" | "short";
}) {
  return (
    <div
      className={cn(
        "intel-tile-grid",
        variant === "kpi" && "intel-tile-grid--kpi",
        variant === "chart" && "intel-tile-grid--chart",
        variant === "cards" && "intel-tile-grid--cards",
        variant === "short" && "intel-tile-grid--short",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Overview: flow chart (left) + dark flow snapshot (right). */
export function OverviewChartRow({ children }: { children: ReactNode }) {
  return <div className="overview-chart-row">{children}</div>;
}
