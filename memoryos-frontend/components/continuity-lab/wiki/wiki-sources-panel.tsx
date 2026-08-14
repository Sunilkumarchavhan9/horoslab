"use client";

import { ExternalLink, X } from "lucide-react";
import { githubBlobUrl, githubRepoUrl } from "@/lib/continuity-lab/wiki";
import { WikiGithubIcon } from "@/components/continuity-lab/wiki/wiki-github-icon";
import { cn } from "@/lib/utils";

type WikiSourcesPanelProps = {
  open: boolean;
  onClose: () => void;
  repoFullName: string;
  branch: string;
  sourcePaths: string[];
  className?: string;
};

export function WikiSourcesPanel({
  open,
  onClose,
  repoFullName,
  branch,
  sourcePaths,
  className,
}: WikiSourcesPanelProps) {
  if (!open) return null;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[#2F2F2F] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Sources
          </p>
          <p className="mt-0.5 text-sm font-medium text-white">Relevant source files</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center text-white/60 hover:bg-[#141414] hover:text-white"
          aria-label="Close sources panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <a
          href={githubRepoUrl(repoFullName)}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-2 text-xs text-indigo-300 hover:text-indigo-200"
        >
          <WikiGithubIcon className="size-3.5" />
          {repoFullName}
          <ExternalLink className="size-3" />
        </a>

        {sourcePaths.length === 0 ? (
          <p className="text-sm leading-relaxed text-white/45">
            No file paths recorded yet. Sync GitHub memory or run a Continuity Lab session to
            populate risky-file and execution lineage paths.
          </p>
        ) : (
          <ul className="space-y-1">
            {sourcePaths.map((path) => (
              <li key={path}>
                <a
                  href={githubBlobUrl(repoFullName, branch, path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 border border-[#2F2F2F] bg-[#111111] px-3 py-2 text-xs text-white/75 transition hover:border-[#4338CA]/40 hover:text-white"
                >
                  <ExternalLink className="mt-0.5 size-3 shrink-0 text-white/35" />
                  <span className="break-all font-mono">{path}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
