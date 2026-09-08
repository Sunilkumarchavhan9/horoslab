"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, Copy, Plus, Search } from "lucide-react";
import { OsBrandIcon } from "@/components/continuity-lab/os-brand-icons";
import type { AskOsId } from "@/lib/continuity-lab/ask-os-preference";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

export type SettingsBreadcrumbItem = {
  label: string;
  href?: string;
};

export function SettingsBreadcrumb({ items }: { items: SettingsBreadcrumbItem[] }) {
  return (
    <nav className="mb-3 text-xs text-[#F0EFE2]/45" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`}>
            {index > 0 ? <span className="mx-1.5 text-[#F0EFE2]/25">/</span> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-[#F0EFE2]/70">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-[#F0EFE2]/88" : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function SettingsPageHeader({
  title,
  description,
  docHref,
  docLabel = "Learn more",
  breadcrumb,
}: {
  title: string;
  description?: string;
  docHref?: string;
  docLabel?: string;
  breadcrumb?: SettingsBreadcrumbItem[];
}) {
  return (
    <header className="border-b border-white/[0.06] px-6 py-6 md:px-8 md:py-8">
      {breadcrumb?.length ? <SettingsBreadcrumb items={breadcrumb} /> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-[#F0EFE2]">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#F0EFE2]/50">
          {description}
          {docHref ? (
            <>
              {" "}
              <a
                href={docHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#F0EFE2]/70 underline decoration-white/20 underline-offset-2 hover:text-[#F0EFE2]"
              >
                {docLabel}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </header>
  );
}

export function SettingsToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function SettingsSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-[200px] flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/30" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] pl-9 pr-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none"
      />
    </div>
  );
}

const settingsPrimaryButtonClass = {
  default:
    "inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-3.5 text-sm font-medium text-[#0A0A0A] transition hover:bg-white/90",
  blue: "inline-flex h-9 items-center gap-1.5 rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-[#F0EFE2] transition hover:bg-[#3B82F6]",
} as const;

export function SettingsPrimaryButton({
  children,
  onClick,
  href,
  type = "button",
  variant = "default",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  variant?: keyof typeof settingsPrimaryButtonClass;
  disabled?: boolean;
}) {
  const className = cn(settingsPrimaryButtonClass[variant], disabled && "opacity-40");

  if (href) {
    return (
      <Link href={href} className={className} aria-disabled={disabled}>
        <Plus className="size-3.5" aria-hidden />
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      <Plus className="size-3.5" aria-hidden />
      {children}
    </button>
  );
}

export function SettingsTabPills<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-white/[0.08] bg-[#111111] p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            active === tab.id
              ? "bg-white/[0.1] text-[#F0EFE2]"
              : "text-[#F0EFE2]/50 hover:text-[#F0EFE2]/75",
          )}
          >
            {tab.label}
          {tab.count !== undefined ? (
            <span className="ml-1 tabular-nums text-[#F0EFE2]/35">({tab.count})</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#F0EFE2]">{title}</h2>
            {description ? <p className="mt-1 text-xs text-[#F0EFE2]/45">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div>{children}</div>
    </section>
  );
}

/** Flat Devin-style panel — single border, no nested cards inside. */
export function SettingsFlatPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(subtlePanel(), "overflow-visible px-4", className)}>{children}</div>
  );
}

export function SettingsSelect<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] focus:border-white/20 focus:outline-none disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/** Devin-style popover select — dark panel, checkmark on active option. */
export function SettingsSelectDropdown<T extends string>({
  value,
  onChange,
  options,
  disabled,
  searchable,
  searchPlaceholder = "Search…",
  className,
  menuClassName,
  triggerIcon = "chevron-down",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; description?: string }[];
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  menuClassName?: string;
  triggerIcon?: "chevron-down" | "chevrons-up-down";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((opt) => opt.value === value);
  const filtered = searchable
    ? options.filter((opt) => (opt.label ?? "").toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeMenu]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            setOpen(true);
          }
        }}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[#111111] px-3 text-left text-sm text-[#F0EFE2]/90 transition hover:border-white/15 disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Select…"}</span>
        {triggerIcon === "chevrons-up-down" ? (
          <ChevronsUpDown className="size-3.5 shrink-0 text-[#F0EFE2]/40" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-[#F0EFE2]/40" aria-hidden />
        )}
      </button>
      {open ? (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-md border border-white/[0.08] bg-[#141416] py-1 shadow-xl",
            menuClassName,
          )}
        >
          {searchable ? (
            <div className="border-b border-white/[0.06] px-2 py-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-[#F0EFE2]/30" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-7 w-full rounded-md border border-white/[0.08] bg-[#111111] pl-7 pr-2 text-xs text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none"
                />
              </div>
            </div>
          ) : null}
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#F0EFE2]/40">No matches</p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  closeMenu();
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[#F0EFE2]/80 transition hover:bg-white/[0.04]"
              >
                <span className="min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {opt.description ? (
                    <span className="mt-0.5 block truncate text-xs text-[#F0EFE2]/40">
                      {opt.description}
                    </span>
                  ) : null}
                </span>
                {value === opt.value ? <Check className="size-3.5 shrink-0 text-[#F0EFE2]/60" /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsSecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-medium text-[#F0EFE2]/90 transition hover:bg-white/[0.08] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SettingsCopyValue({
  value,
  onCopy,
  copied,
  ariaLabel = "Copy value",
}: {
  value: string;
  onCopy?: () => void;
  copied?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border border-white/[0.06] bg-[#111111] px-3 py-2 font-mono text-xs text-[#F0EFE2]/75">
        {value}
      </code>
      {onCopy ? (
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/60 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]"
          aria-label={ariaLabel}
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </button>
      ) : null}
    </div>
  );
}

export function SettingsEmptyTable({
  columns,
  message,
  action,
}: {
  columns: string[];
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn(subtlePanel(), "overflow-hidden")}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-[#111111]">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#F0EFE2]/35"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-4 py-12 text-center">
              <p className="text-sm text-[#F0EFE2]/45">{message}</p>
              {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SettingsRowLink({
  href,
  label,
  detail,
  external,
  onClick,
}: {
  href: string;
  label: string;
  detail?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-[#F0EFE2]/85 transition hover:bg-white/[0.04]";

  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[#F0EFE2]">{label}</span>
        {detail ? <span className="mt-0.5 block text-xs text-[#F0EFE2]/45">{detail}</span> : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-[#F0EFE2]/30" aria-hidden />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function SettingsFieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:max-w-[40%]">
        <p className="text-sm font-medium text-[#F0EFE2]">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-[#F0EFE2]/45">{hint}</p> : null}
      </div>
      <div className="min-w-0 flex-1 sm:max-w-md">{children}</div>
    </div>
  );
}

export function SettingsComingSoon({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <SettingsCard title={title} description={description}>
      <p className="text-sm text-[#F0EFE2]/50">Coming soon in Continuity Lab settings.</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-3 inline-flex text-sm font-medium text-[#F0EFE2]/70 underline decoration-white/20 underline-offset-2 hover:text-[#F0EFE2]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </SettingsCard>
  );
}

export function ConnectorStatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        connected
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-white/[0.06] text-[#F0EFE2]/45",
      )}
    >
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

export function SettingsToggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        checked ? "bg-white" : "bg-white/20",
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 rounded-full shadow transition-transform",
          checked ? "translate-x-[18px] bg-[#0A0A0A]" : "translate-x-0.5 bg-white",
        )}
      />
    </button>
  );
}

export function SettingsIntegrationRow({
  icon,
  name,
  detail,
  connected,
  badge,
  href,
  onClick,
  onActionClick,
  disabled,
  actionLabel,
  actionDisabled,
  borderless,
}: {
  icon: ReactNode;
  name: string;
  detail?: string;
  connected?: boolean;
  badge?: string;
  href?: string;
  onClick?: () => void;
  /** Invoked when the action label is clicked (e.g. Connect) without navigating via href. */
  onActionClick?: () => void;
  disabled?: boolean;
  /** Shown before chevron when row is interactive (e.g. Configure). */
  actionLabel?: string;
  actionDisabled?: boolean;
  borderless?: boolean;
}) {
  const actionControl =
    actionLabel && onActionClick && !disabled ? (
      <button
        type="button"
        disabled={actionDisabled}
        onClick={(event) => {
          event.stopPropagation();
          onActionClick();
        }}
        className="text-xs font-medium text-indigo-300/90 hover:text-indigo-200 disabled:opacity-50"
      >
        {actionLabel}
      </button>
    ) : actionLabel && href && !disabled ? (
      <span className="text-xs font-medium text-indigo-300/90">{actionLabel}</span>
    ) : null;

  const trailing =
    connected !== undefined ? (
      <div className="flex shrink-0 items-center gap-2">
        <ConnectorStatusPill connected={connected} />
        {actionControl}
      </div>
    ) : badge ? (
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/35">
        {badge}
      </span>
    ) : null;

  const className = cn(
    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
    borderless ? "rounded-md hover:bg-white/[0.03]" : "rounded-md border border-white/[0.06] hover:bg-white/[0.03]",
    disabled ? "opacity-60" : null,
  );

  const inner = (
    <>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-[#0A0A0A]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[#F0EFE2]">{name}</span>
        {detail ? <span className="mt-0.5 block text-xs text-[#F0EFE2]/45">{detail}</span> : null}
      </span>
      {trailing}
      {href || onClick ? (
        <ChevronRight className="size-4 shrink-0 text-[#F0EFE2]/30" aria-hidden />
      ) : null}
    </>
  );

  if (onClick && !disabled) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
        className={cn(className, "cursor-pointer")}
      >
        {inner}
      </div>
    );
  }

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function SettingsOsOption({
  os,
  label,
  selected,
  onSelect,
}: {
  os: AskOsId;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition",
        selected
          ? "border-white/25 bg-white/[0.06] text-[#F0EFE2]"
          : "border-white/[0.06] text-[#F0EFE2]/70 hover:bg-white/[0.03]",
      )}
    >
      <OsBrandIcon os={os} className="size-5" muted={!selected} />
      <span className="flex-1 font-medium">{label}</span>
      {selected ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/50">
          Default
        </span>
      ) : null}
    </button>
  );
}
