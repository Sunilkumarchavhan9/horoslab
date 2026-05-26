"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { intel, intelMotion, intelInsetClass, intelPanelClass } from "@/components/developer-console/intel-design";

export function IntelStatGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string; detail?: string; tone?: "cyan" | "violet" | "rose" | "amber" }>;
}) {
  const toneAccent = {
    cyan: "ring-[#99F6E4]/60",
    violet: "ring-[#C7D2FE]/60",
    rose: "ring-[#FECACA]/60",
    amber: "ring-[#FDE68A]/60",
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, ...intelMotion.panel }}
          whileHover={{ y: -2 }}
          className={cn(
            intelInsetClass,
            "rounded-2xl p-4 ring-1 ring-inset ring-black/[0.04]",
            stat.tone ? toneAccent[stat.tone] : "",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[#111827]">{stat.value}</p>
          {stat.detail ? <p className="mt-1 text-xs text-[#6B7280]">{stat.detail}</p> : null}
        </motion.div>
      ))}
    </div>
  );
}

export function IntelChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-white text-[#111827] shadow-sm ring-1 ring-black/[0.06]"
          : "text-[#6B7280] hover:bg-white/80 hover:text-[#374151]",
      )}
    >
      {children}
    </motion.button>
  );
}

export function IntelChipRow({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border bg-[#F9FAFB] p-1"
      style={{ borderColor: intel.colors.borderStrong }}
    >
      {children}
    </div>
  );
}

export function IntelPanel({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={intelMotion.panel}
      className={cn(intelPanelClass, "overflow-hidden", className)}
      style={{ boxShadow: intel.shadow.workspace }}
    >
      {title ? (
        <div
          className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: intel.colors.border }}
        >
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs text-[#6B7280]">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </motion.section>
  );
}

export function IntelEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
      <motion.div
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="grid size-12 place-items-center rounded-2xl border bg-[#F9FAFB] shadow-sm"
        style={{ borderColor: intel.colors.borderStrong }}
      >
        <Icon className="size-5 text-[#14B8A6]" strokeWidth={1.5} />
      </motion.div>
      <h2 className="mt-5 text-lg font-semibold text-[#111827]">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6B7280]">{description}</p>
    </div>
  );
}

export function IntelPulseDot({ tone = "cyan" }: { tone?: "cyan" | "violet" | "rose" | "emerald" }) {
  const color =
    tone === "cyan"
      ? intel.colors.teal
      : tone === "violet"
        ? intel.colors.violet
        : tone === "rose"
          ? intel.colors.rose
          : intel.colors.emerald;
  return (
    <motion.span
      className="size-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
      animate={{ opacity: [1, 0.4, 1] }}
      transition={{ duration: 2.2, repeat: Infinity }}
    />
  );
}
