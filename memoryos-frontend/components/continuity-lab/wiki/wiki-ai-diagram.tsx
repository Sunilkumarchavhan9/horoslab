"use client";

import { ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  fetchWikiDiagram,
  regenerateWikiDiagram,
  type WikiDiagramPayload,
  type WikiDiagramType,
} from "@/lib/continuity-lab/wiki-api";
import { githubBlobUrl } from "@/lib/continuity-lab/wiki";
import { cn } from "@/lib/utils";

type WikiAiDiagramProps = {
  projectId: string;
  repoFullName: string;
  branch: string;
  diagramType: WikiDiagramType;
  fallback?: React.ReactNode;
  className?: string;
};

const MERMAID_THEME = {
  theme: "dark" as const,
  themeVariables: {
    darkMode: true,
    background: "#0A0A0A",
    primaryColor: "#1a1a2e",
    primaryTextColor: "#e5e7eb",
    primaryBorderColor: "#4338CA",
    lineColor: "#6366f1",
    secondaryColor: "#111827",
    tertiaryColor: "#0f172a",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontSize: "13px",
    nodeBorder: "#4338CA",
    clusterBkg: "#111111",
    clusterBorder: "#3A3A3A",
    titleColor: "#f3f4f6",
    edgeLabelBackground: "#111111",
  },
};

function DiagramSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-md border border-[#2F2F2F] bg-[#0A0A0A] p-6">
      <div className="mx-auto h-3 w-40 rounded bg-[#2F2F2F]" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 rounded border border-[#2F2F2F] bg-[#111111] p-4">
          <div className="h-2 w-24 rounded bg-[#2F2F2F]" />
          <div className="h-8 rounded bg-[#1a1a2e]" />
          <div className="h-8 rounded bg-[#1a1a2e]" />
        </div>
        <div className="space-y-2 rounded border border-[#2F2F2F] bg-[#111111] p-4">
          <div className="h-2 w-28 rounded bg-[#2F2F2F]" />
          <div className="h-8 rounded bg-[#1a1a2e]" />
          <div className="h-8 rounded bg-[#1a1a2e]" />
        </div>
      </div>
      <div className="mx-auto h-2 w-56 rounded bg-[#2F2F2F]" />
    </div>
  );
}

export function WikiAiDiagram({
  projectId,
  repoFullName,
  branch,
  diagramType,
  fallback,
  className,
}: WikiAiDiagramProps) {
  const diagramId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [diagram, setDiagram] = useState<WikiDiagramPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const loadDiagram = useCallback(
    async (refresh = false) => {
      if (refresh) setRegenerating(true);
      else setLoading(true);
      setError(null);
      setRenderError(null);

      const result = refresh
        ? await regenerateWikiDiagram({ projectId, repoFullName, branch, diagramType })
        : await fetchWikiDiagram({ projectId, repoFullName, branch, diagramType });

      if (result.error || !result.data) {
        setDiagram(null);
        setError(result.error);
      } else {
        setDiagram(result.data);
      }

      setLoading(false);
      setRegenerating(false);
    },
    [projectId, repoFullName, branch, diagramType],
  );

  useEffect(() => {
    void loadDiagram(false);
  }, [loadDiagram]);

  useEffect(() => {
    if (!diagram?.mermaid || !containerRef.current) return;
    const mermaidSource = diagram.mermaid;

    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          ...MERMAID_THEME,
        });

        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        const { svg } = await mermaid.render(`wiki-ai-${diagramId}`, mermaidSource);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setRenderError(null);
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : "Could not render diagram.");
        }
      }
    }

    void renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [diagram?.mermaid, diagramId]);

  if (loading) {
    return (
      <section className={cn("space-y-2", className)}>
        <header className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Generating diagram…</p>
            <p className="mt-1 text-xs text-white/45">AI-generated from repository structure</p>
          </div>
          <Loader2 className="size-4 animate-spin text-indigo-300/80" />
        </header>
        <DiagramSkeleton />
      </section>
    );
  }

  if (error || !diagram) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{diagram.title}</h3>
            <span className="inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-200/90">
              <Sparkles className="size-3" />
              AI-generated from repository structure
            </span>
            {diagram.cached ? (
              <span className="text-[10px] text-white/35">Cached</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            Grounded in the connected GitHub tree, README, package.json, and schema files.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDiagram(true)}
          disabled={regenerating}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#3A3A3A] px-2.5 text-[11px] font-medium text-white/80 hover:border-[#4338CA]/50 disabled:opacity-60"
        >
          {regenerating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Regenerate diagram
        </button>
      </header>

      <div className="overflow-x-auto rounded-md border border-[#2F2F2F] bg-[#0A0A0A] p-4">
        {renderError ? (
          <p className="text-sm text-amber-200/90">{renderError}</p>
        ) : (
          <div
            ref={containerRef}
            className="wiki-ai-diagram [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
          />
        )}
      </div>

      {diagram.sources.length > 0 ? (
        <footer className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {diagram.sources.map((sourcePath) => (
              <a
                key={sourcePath}
                href={githubBlobUrl(repoFullName, branch, sourcePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-[#3A3A3A] px-2 py-0.5 font-mono text-[10px] text-indigo-200/90 hover:border-[#4338CA]/50"
              >
                {sourcePath}
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
            ))}
          </div>
        </footer>
      ) : null}
    </section>
  );
}
