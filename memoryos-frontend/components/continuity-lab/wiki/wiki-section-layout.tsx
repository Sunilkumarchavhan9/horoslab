"use client";

import type { ReactNode } from "react";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type WikiSectionLayoutProps = {
  description?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function WikiSectionLayout({
  description,
  children,
  footer,
  className,
}: WikiSectionLayoutProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-[#F0EFE2]/65">{description}</p>
      ) : null}
      {children}
      {footer}
    </div>
  );
}

type WikiContentBlockProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function WikiContentBlock({ title, description, children, className }: WikiContentBlockProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-[#F0EFE2]">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[#F0EFE2]/45">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type WikiDataTableProps = {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<Record<string, ReactNode>>;
  emptyMessage?: string;
};

export function WikiDataTable({ columns, rows, emptyMessage }: WikiDataTableProps) {
  if (!rows.length) {
    return emptyMessage ? (
      <p className="text-sm text-[#F0EFE2]/45">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className={cn(subtlePanel(), "overflow-x-auto")}>
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="border-b border-white/[0.06] bg-[#1a1a1a] text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-2 font-semibold", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/[0.06] last:border-0">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-2.5 text-[#F0EFE2]/75", col.className)}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type WikiMetricCardsProps = {
  items: Array<{ label: string; value: ReactNode; hint?: string }>;
};

export function WikiMetricCards({ items }: WikiMetricCardsProps) {
  if (!items.length) return null;
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={cn(subtlePanel(), "p-3")}>
          <dt className="text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">{item.label}</dt>
          <dd className="mt-1 text-lg font-semibold text-[#F0EFE2]">{item.value}</dd>
          {item.hint ? <dd className="mt-1 text-xs text-[#F0EFE2]/45">{item.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
