"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowLeft, Search } from "lucide-react";
import {
  findSettingsNavItem,
  filterSettingsNav,
  resolveSettingsSectionSlug,
  settingsSectionDescription,
  settingsSectionPath,
  type SettingsSectionId,
} from "@/lib/continuity-lab/settings-nav";
import { readDevConsoleOrgDisplayName } from "@/lib/continuity-lab/settings-org";
import { SettingsNavIcon } from "@/components/continuity-lab/settings/continuity-lab-settings-nav-icons";
import {
  SettingsPageHeader,
  type SettingsBreadcrumbItem,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import { cn } from "@/lib/utils";

export type { SettingsBreadcrumbItem };

function activeSectionFromPath(pathname: string): SettingsSectionId | null {
  const prefix = "/continuity-lab/settings/";
  if (!pathname.startsWith(prefix)) return null;
  const slug = pathname.slice(prefix.length).split("/")[0];
  if (!slug) return null;
  return resolveSettingsSectionSlug(slug) ?? null;
}

function settingsGroupLabel(groupId: string, groupTitle: string, orgDisplayName: string | null) {
  if (groupId === "organization" && orgDisplayName) {
    return orgDisplayName;
  }
  return groupTitle;
}

function subscribeOrgDisplayName(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const SettingsSidebar = memo(function SettingsSidebar({
  activeSection,
}: {
  activeSection: SettingsSectionId | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const orgDisplayName = useSyncExternalStore(
    subscribeOrgDisplayName,
    readDevConsoleOrgDisplayName,
    () => null,
  );
  const groups = useMemo(() => filterSettingsNav(searchQuery), [searchQuery]);

  return (
    <aside
      className="flex h-full min-h-0 w-[292px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0A0A]"
      aria-label="Settings navigation"
    >
      <div className="shrink-0 px-3 pb-2 pt-4">
        <Link
          href="/continuity-lab"
          className="inline-flex items-center gap-1.5 px-2 text-xs font-medium text-white/50 transition hover:text-white/80"
        >
          <ArrowLeft className="size-3.5" />
          Back to app
        </Link>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="h-8 w-full rounded-md border border-white/[0.08] bg-[#111111] pl-8 pr-2 text-xs text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.id} className="mb-4">
            <p className="mb-1 truncate px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
              {settingsGroupLabel(group.id, group.title, orgDisplayName)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const href = item.productHref ?? settingsSectionPath(item.id);
                const active = activeSection === item.id;

                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition",
                        active
                          ? "bg-white/[0.08] font-medium text-white"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <SettingsNavIcon sectionId={item.id} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="shrink-0 text-[9px] font-semibold uppercase text-white/30">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
});

export function ContinuityLabSettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = activeSectionFromPath(pathname);

  return (
    <div className="continuity-lab-settings-root flex h-full min-h-0 flex-col overflow-hidden bg-[#0A0A0A]">
      <div className="flex h-full min-h-0 overflow-hidden">
        <SettingsSidebar activeSection={activeSection} />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ContinuityLabSettingsSectionFrame({
  sectionId,
  children,
  docHref,
  docLabel,
  breadcrumb,
  titleOverride,
  descriptionOverride,
  contentClassName,
}: {
  sectionId: SettingsSectionId;
  children: ReactNode;
  docHref?: string;
  docLabel?: string;
  breadcrumb?: SettingsBreadcrumbItem[];
  titleOverride?: string;
  descriptionOverride?: string;
  /** Override default `max-w-3xl` content width (e.g. sessions table). */
  contentClassName?: string;
}) {
  const item = findSettingsNavItem(sectionId);
  const description = descriptionOverride ?? settingsSectionDescription(sectionId);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0f0f0f]">
      <SettingsPageHeader
        breadcrumb={breadcrumb}
        title={titleOverride ?? item?.label ?? "Settings"}
        description={description}
        docHref={docHref}
        docLabel={docLabel}
      />
      <div
        className={cn(
          "mx-auto w-full space-y-6 px-6 py-6 md:px-8 md:py-8",
          contentClassName ?? "max-w-3xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
