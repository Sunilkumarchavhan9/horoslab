"use client";

import type { HTMLAttributes, ReactNode, ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { Icon, type IconName } from "@/components/ui/icon";
import { COCKPIT_TRANSITION } from "@/lib/motion";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type PrimitiveProps = {
  children?: ReactNode;
  className?: string;
};

export function DitherCard({ children, className }: PrimitiveProps) {
  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-[10px] border border-[#2b2b2b] bg-[#0d0d0d]",
        className,
      )}
    >
      <DitherBackground
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09] transition-opacity group-hover:opacity-[0.16]"
        accent="#10b981"
        density={0.46}
      />
      <div className="relative">{children}</div>
    </article>
  );
}

export function CockpitPanel({
  children,
  className,
  ...props
}: PrimitiveProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={cx(
        "rounded-[10px] border border-[#262626] bg-[#0a0a0a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

type MetricCardProps = PrimitiveProps & {
  label: string;
  value: ReactNode;
  trend?: string;
  tone?: "neutral" | "good" | "warn";
};

export function MetricCard({
  children,
  className,
  label,
  value,
  trend,
  tone = "neutral",
}: MetricCardProps) {
  const toneClass =
    tone === "good"
      ? "text-[#10b981]"
      : tone === "warn"
        ? "text-[#f59e0b]"
        : "text-[#60a5fa]";
  return (
    <DitherCard className={cx("p-4", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666]">
        {label}
      </p>
      <p className={cx("mt-2 font-mono text-[22px] leading-none", toneClass)}>
        {value}
      </p>
      {trend ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a8a8a]">
          {trend}
        </p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </DitherCard>
  );
}

export function StatusPill({
  children,
  className,
  tone = "neutral",
}: PrimitiveProps & { tone?: "neutral" | "good" | "warn" | "danger" }) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: "border-[#3a3a3a] text-[#bdbdbd] bg-[#161616]",
    good: "border-[#10b981]/45 text-[#10b981] bg-[#0a1b15]",
    warn: "border-[#f59e0b]/45 text-[#f59e0b] bg-[#211706]",
    danger: "border-[#ef4444]/45 text-[#fca5a5] bg-[#23090b]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RadarBadge({
  label,
  className,
  tone = "good",
}: {
  label: string;
  className?: string;
  tone?: "good" | "warn" | "danger";
}) {
  const dotClass =
    tone === "good"
      ? "bg-[#10b981]"
      : tone === "warn"
        ? "bg-[#f59e0b]"
        : "bg-[#ef4444]";
  return (
    <StatusPill tone={tone} className={className}>
      <span className="relative flex h-2 w-2">
        <span className={cx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-50", dotClass)} />
        <span className={cx("relative inline-flex h-2 w-2 rounded-full", dotClass)} />
      </span>
      {label}
    </StatusPill>
  );
}

export function TerminalPanel({ children, className }: PrimitiveProps) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[8px] border border-[#252525] bg-[#070707] font-mono text-[12px] text-[#d4d4d8]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_30%,rgba(16,185,129,0.04)_50%,transparent_70%)] bg-[length:100%_3px]" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; icon?: IconName }>;
}) {
  return (
    <div className="grid grid-flow-col gap-1 rounded-[8px] border border-[#252525] bg-[#0a0a0a] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            "inline-flex items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition",
            value === option.value
              ? "bg-[#151515] text-[#f2f2f2] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
              : "text-[#666] hover:text-[#b5b5b5]",
          )}
        >
          {option.icon ? <Icon name={option.icon} className="h-3.5 w-3.5" /> : null}
          {option.label}
        </button>
      ))}
    </div>
  );
}

type AnimatedButtonProps = ComponentPropsWithoutRef<typeof motion.button>;

export function AnimatedButton({
  children,
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
      transition={COCKPIT_TRANSITION}
      className={cx(
        "rounded-[8px] border border-[#2e2e2e] bg-[#121212] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#d4d4d8] transition-colors hover:border-[#4a4a4a] hover:text-[#F0EFE2] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
