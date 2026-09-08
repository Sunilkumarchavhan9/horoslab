import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Continuity Lab surfaces — Devin-style minimal chrome */
export const labSidebarBg = "bg-[var(--cl-sidebar)]";
/** Slightly lighter than sidebar for calm depth contrast */
export const labMainBg = "bg-[var(--cl-main)]";
export const labSidebarEdge = "border-[var(--cl-border)]";
export const labNavActive = "rounded-sm bg-white/[0.07] text-[#F0EFE2]";
export const labNavIdle =
  "rounded-sm text-[#F0EFE2]/70 hover:bg-white/[0.04] hover:text-[#F0EFE2]";
export const labBetaBadge =
  "rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#F0EFE2]/45";
export const labSearchInput =
  "h-8 w-full rounded-md border border-[var(--cl-border)] bg-[var(--cl-panel-soft)] pl-8 pr-2 text-[11px] text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/12 focus:outline-none";

/** Composer / input shell */
export const labComposerClass =
  "overflow-hidden rounded-md border border-[var(--cl-border)] bg-[var(--cl-panel)]";

/** Single subtle panel — avoid stacking inside section wrappers. */
export function subtlePanel(className?: string) {
  return cn(
    "rounded-md border border-[var(--cl-border)] bg-[var(--cl-panel)]",
    className,
  );
}

/** Flat top-of-page notice (MCP, confirm, connect) — no loud indigo boxes */
export function bannerStrip(className?: string) {
  return cn(
    "flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/[0.03] px-3 py-2 text-xs text-[#F0EFE2]/65",
    className,
  );
}

export const pillActionButton =
  "inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-sm font-medium leading-4 text-[#F0EFE2]/85 hover:bg-white/[0.09]";

export function LabSectionHeader({
  title,
  subtext,
  actions,
  titleClassName,
}: {
  title: string;
  subtext?: string;
  actions?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className={cn("text-sm font-semibold text-[#F0EFE2]", titleClassName)}>
          {title}
        </h2>
        {subtext ? (
          <p className="mt-1 text-xs text-[#F0EFE2]/45">{subtext}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function LabSection({
  title,
  subtext,
  actions,
  children,
  className,
}: {
  title: string;
  subtext?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <LabSectionHeader title={title} subtext={subtext} actions={actions} />
      {children}
    </section>
  );
}
