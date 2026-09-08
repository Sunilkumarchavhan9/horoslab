"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  AutomationIntegrationPills,
  ConnectorBrandIcon,
  MemoryOsBrandIcon,
} from "@/components/continuity-lab/connector-brand-icons";
import { cn } from "@/lib/utils";
import {
  AUTOMATION_TEMPLATE_CATEGORIES,
  AUTOMATION_TEMPLATES,
  isTemplateAvailable,
  type AutomationTemplate,
  type AutomationTemplateCategory,
} from "@/lib/continuity-lab/automation-templates";

function TemplateCard({
  template,
  onUse,
}: {
  template: AutomationTemplate;
  onUse: (id: string) => void;
}) {
  const live = isTemplateAvailable(template);
  const primaryPill =
    template.integrationPills.find((pill) => pill !== "memoryos") ?? "memoryos";
  const primaryIcon =
    primaryPill === "memoryos" ? (
      <MemoryOsBrandIcon className="size-4" />
    ) : (
      <ConnectorBrandIcon id={primaryPill} className="size-4" />
    );

  return (
    <article
      role={live ? "button" : undefined}
      tabIndex={live ? 0 : undefined}
      onClick={live ? () => onUse(template.id) : undefined}
      onKeyDown={
        live
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onUse(template.id);
              }
            }
          : undefined
      }
      className={cn(
        "group flex min-h-[126px] flex-col rounded-md border border-white/[0.08] bg-[#1C1C1C] p-4 transition",
        live ? "cursor-pointer hover:border-white/[0.16] hover:bg-[#222222]" : "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-[#F0EFE2]/80">
          {primaryIcon}
        </span>
        <h3 className="min-w-0 truncate text-sm font-semibold leading-5 text-[#F0EFE2]">
          {template.title}
        </h3>
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#F0EFE2]/50">
        {template.description}
      </p>
      <AutomationIntegrationPills
        pills={template.integrationPills}
        muted={!live}
        className="mt-auto pt-4"
      />
    </article>
  );
}

export function ContinuityLabAutomationTemplates() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUTOMATION_TEMPLATES.filter((t) => {
      if (!q) return true;
      const haystack = [
        t.title,
        t.description,
        t.loopGoal,
        t.category,
        t.availability,
        ...t.connectors,
        ...t.integrationPills,
        ...t.triggers,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<AutomationTemplateCategory, AutomationTemplate[]>();
    for (const cat of AUTOMATION_TEMPLATE_CATEGORIES) map.set(cat.id, []);
    for (const template of filtered) {
      map.get(template.category)?.push(template);
    }
    return map;
  }, [filtered]);

  function handleUseTemplate(templateId: string) {
    const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId);
    if (!template || !isTemplateAvailable(template)) return;
    router.push(`/continuity-lab/automations/new?template=${encodeURIComponent(templateId)}`);
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-12 pb-20">
      <header>
        <h1 className="text-xl font-semibold text-[#F0EFE2]">All templates</h1>
        <p className="mt-1 text-sm leading-6 text-[#F0EFE2]/55">
          Browse all automation templates to get started quickly.
        </p>
      </header>

      <div className="relative mt-7 max-w-[448px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#F0EFE2]/35" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          className="h-9 w-full rounded-md border border-white/[0.08] bg-[#1F1F1F] py-2 pl-9 pr-4 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/40 focus:border-white/20 focus:outline-none"
          aria-label="Search templates"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="px-2 py-12 text-center">
          <p className="text-sm text-[#F0EFE2]/60">No templates match your search.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {AUTOMATION_TEMPLATE_CATEGORIES.map((cat) => {
            const items = grouped.get(cat.id) ?? [];
            if (!items.length) return null;
            return (
              <section key={cat.id}>
                <h2 className="text-sm font-semibold text-[#F0EFE2]">{cat.label}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((template) => (
                    <li key={template.id}>
                      <TemplateCard template={template} onUse={handleUseTemplate} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
