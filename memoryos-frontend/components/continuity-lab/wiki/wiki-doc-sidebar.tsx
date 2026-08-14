"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceNavSection } from "@/lib/continuity-lab/wiki-workspace";
import {
  parseWikiRepoFullName,
  wikiRepoHref,
  type WikiDocSection,
  type WikiSectionId,
} from "@/lib/continuity-lab/wiki";

type WikiDocSidebarProps = {
  projectId: string;
  repoFullName: string;
  activeSection: WikiSectionId;
  visibleSections: WikiSectionId[];
  docSections: WikiDocSection[];
  workspaceSections?: WorkspaceNavSection[];
  focusPath?: string | null;
  className?: string;
};

export function WikiDocSidebar({
  projectId,
  repoFullName,
  activeSection,
  visibleSections,
  docSections,
  workspaceSections = [],
  focusPath,
  className,
}: WikiDocSidebarProps) {
  const visible = new Set(visibleSections);
  const sectionById = new Map(docSections.map((section) => [section.id, section]));
  const core = docSections.filter((section) => section.group === "core" && visible.has(section.id));
  const contracts = docSections.filter(
    (section) => section.group === "contract" && visible.has(section.id),
  );
  const parts = parseWikiRepoFullName(repoFullName);

  function renderDocGroup(title: string, sections: WikiDocSection[]) {
    if (!sections.length) return null;
    return (
      <div className="mb-4">
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {title}
        </p>
        <ul className="space-y-0.5">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={wikiRepoHref(projectId, section.id)}
                className={cn(
                  "flex items-center justify-between rounded px-3 py-1.5 text-xs transition",
                  activeSection === section.id
                    ? "bg-[#1a1a2e] font-medium text-white"
                    : "text-white/60 hover:bg-[#141414] hover:text-white",
                )}
              >
                <span>{sectionById.get(section.id)?.label ?? section.label}</span>
                {section.nodeCount != null && section.nodeCount > 0 ? (
                  <span className="text-[10px] tabular-nums text-white/35">{section.nodeCount}</span>
                ) : null}
              </Link>
              {section.children?.length ? (
                <ul className="mt-0.5 space-y-0.5 border-l border-[#2F2F2F]/80 pl-2">
                  {section.children.slice(0, 8).map((child) => (
                    <li
                      key={child.id}
                      className="truncate px-2 py-1 text-[10px] text-white/40"
                      title={child.label}
                    >
                      {child.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderWorkspaceGroup(section: WorkspaceNavSection) {
    return (
      <div key={section.id} className="mb-4">
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {section.label}
        </p>
        <ul className="space-y-1">
          {section.dirs.map((dir) => (
            <li key={dir.path || dir.name}>
              <Link
                href={`${wikiRepoHref(projectId, "architecture")}${dir.path ? `&focus=${encodeURIComponent(dir.path)}` : ""}`}
                className={cn(
                  "block rounded px-3 py-1 text-xs transition",
                  activeSection === "architecture" && focusPath === dir.path
                    ? "bg-[#1a1a2e] font-medium text-white"
                    : "text-white/65 hover:bg-[#141414] hover:text-white",
                )}
              >
                <span className="font-mono">{dir.name}/</span>
              </Link>
              {dir.children.length > 0 ? (
                <ul className="mt-0.5 space-y-0.5 border-l border-[#2F2F2F]/80 pl-3">
                  {dir.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`${wikiRepoHref(projectId, "architecture")}&focus=${encodeURIComponent(child.path)}`}
                        className={cn(
                          "block truncate rounded px-2 py-0.5 text-[10px] font-mono transition",
                          activeSection === "architecture" && focusPath === child.path
                            ? "bg-[#4338CA]/15 text-indigo-200"
                            : "text-white/40 hover:text-white/70",
                        )}
                        title={child.path}
                      >
                        {child.type === "dir" ? `${child.label}/` : child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <nav
      className={cn(
        "w-[240px] shrink-0 overflow-y-auto border-r border-[#2F2F2F] bg-[#0A0A0A] py-4",
        className,
      )}
    >
      <Link
        href="/continuity-lab/wiki"
        className="mx-3 mb-4 inline-flex items-center gap-1 text-[11px] font-medium text-white/55 hover:text-white"
      >
        <ChevronLeft className="size-3.5" />
        Back to index
      </Link>

      <div className="mx-3 mb-5 border-b border-[#2F2F2F] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
          Repository
        </p>
        {parts ? (
          <>
            <p className="mt-1 truncate text-[11px] text-white/45">{parts.owner}</p>
            <p className="truncate font-mono text-xs font-medium text-white">{parts.repo}</p>
          </>
        ) : (
          <p className="mt-1 truncate font-mono text-xs font-medium text-white">{repoFullName}</p>
        )}
      </div>

      {renderDocGroup("Overview", core.filter((section) => section.id === "overview"))}
      {workspaceSections.map(renderWorkspaceGroup)}
      {renderDocGroup(
        "Documentation",
        core.filter((section) => section.id !== "overview"),
      )}
      {renderDocGroup("Operational map", contracts)}
    </nav>
  );
}
