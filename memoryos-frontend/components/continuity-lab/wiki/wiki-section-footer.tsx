"use client";

import { ExternalLink } from "lucide-react";
import { githubBlobUrl } from "@/lib/continuity-lab/wiki";

type WikiSectionFooterProps = {
  repoFullName: string;
  branch: string;
  sourcePaths: string[];
  maxPaths?: number;
};

export function WikiSectionFooter({
  repoFullName,
  branch,
  sourcePaths,
  maxPaths = 6,
}: WikiSectionFooterProps) {
  const paths = sourcePaths.slice(0, maxPaths);
  if (!paths.length) return null;

  return (
    <footer className="border-t border-[#2F2F2F] pt-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
        Sources
      </p>
      <p className="mt-1 text-xs text-white/45">
        Linked from contract memories and execution lineage — not generated prose.
      </p>
      <ul className="mt-3 space-y-1.5">
        {paths.map((path) => (
          <li key={path}>
            <a
              href={githubBlobUrl(repoFullName, branch, path)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-2 text-xs text-indigo-200/90 hover:text-indigo-100"
            >
              <ExternalLink className="mt-0.5 size-3 shrink-0" />
              <span className="break-all font-mono">{path}</span>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
