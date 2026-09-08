"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, ExternalLink, FileCode2, Loader2, Search } from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { ContinuityLabBranchSelect } from "@/components/continuity-lab/continuity-lab-branch-select";
import { WikiAskBar } from "@/components/continuity-lab/wiki/wiki-ask-bar";
import { WikiDocSidebar } from "@/components/continuity-lab/wiki/wiki-doc-sidebar";
import { WikiGithubIcon } from "@/components/continuity-lab/wiki/wiki-github-icon";
import { WikiSourcesPanel } from "@/components/continuity-lab/wiki/wiki-sources-panel";
import { WikiOperationalMapPanel } from "@/components/continuity-lab/wiki/wiki-operational-map-panel";
import { WikiAiDiagram } from "@/components/continuity-lab/wiki/wiki-ai-diagram";
import {
  WikiDiagramPanel,
  operationalMapToDiagram,
} from "@/components/continuity-lab/wiki/wiki-diagram-panel";
import { WikiRepoTreeDiagram } from "@/components/continuity-lab/wiki/wiki-repo-tree-diagram";
import {
  WikiContentBlock,
  WikiDataTable,
  WikiMetricCards,
  WikiSectionLayout,
} from "@/components/continuity-lab/wiki/wiki-section-layout";
import { WikiSectionFooter } from "@/components/continuity-lab/wiki/wiki-section-footer";
import type { DecisionHistoryEntry } from "@/lib/continuity-lab/operational-api";
import {
  decisionsForSection,
  fetchOperationalMap,
  fetchOrgGraph,
  fetchProjectState,
  fetchRepoIndexStatus,
  fetchRepoWorkspace,
  fetchWikiDecisions,
  fetchWikiSourcePaths,
  filterGraphForProject,
  latestWikiUpdatedAt,
  parseSourceRefHref,
  type OperationalMapPayload,
  type ProjectStateData,
  type RepoIndexStatus,
  type RepoWorkspacePayload,
} from "@/lib/continuity-lab/wiki-api";
import {
  buildContractSummaryRows,
  buildWikiSectionsFromOperationalMap,
  formatWikiRelativeTime,
  githubBlobUrl,
  githubRepoUrl,
  parseWikiRepoFullName,
  repoFullNameFromProjectId,
  resolveWikiDocSection,
  touchRecentWikiRepo,
  WIKI_CONTRACT_SECTIONS,
  WIKI_DOC_SECTIONS,
  wikiSectionFromQuery,
  wikiRepoHref,
  type WikiDocSection,
  type WikiSectionId,
} from "@/lib/continuity-lab/wiki";
import {
  buildRepoTreeDiagramNodes,
  buildWorkspaceSections,
  parseDeploymentHints,
  parseTechStackFromPackageJson,
  type WorkspaceNavSection,
} from "@/lib/continuity-lab/wiki-workspace";
import { cn } from "@/lib/utils";

type WikiRepoPageProps = {
  projectId: string;
};

function MemoryEntryList({
  entries,
  repoFullName,
  branch,
}: {
  entries: DecisionHistoryEntry[];
  repoFullName: string;
  branch: string;
}) {
  if (!entries.length) {
    return <p className="text-sm text-[#F0EFE2]/45">No contract memories in this section yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const sourceFiles = entry.files ?? [];
        return (
          <li key={entry.memoryId} className="border border-[#2F2F2F] bg-[#111111] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#F0EFE2]">{entry.summary}</p>
              <span className="text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">
                {formatWikiRelativeTime(entry.updatedAt)}
              </span>
            </div>
            {entry.content?.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#F0EFE2]/60">
                {entry.content.trim()}
              </p>
            ) : null}
            {entry.sourceRef ? (
              <p className="mt-2 text-[10px] text-[#F0EFE2]/40">
                Source:{" "}
                {(() => {
                  const href = parseSourceRefHref(entry.sourceRef);
                  return href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-200/90 underline hover:text-indigo-100"
                    >
                      {entry.sourceRef}
                    </a>
                  ) : (
                    entry.sourceRef
                  );
                })()}
              </p>
            ) : null}
            {sourceFiles.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {sourceFiles.map((filePath) => (
                  <a
                    key={`${entry.memoryId}-${filePath}`}
                    href={githubBlobUrl(repoFullName, branch, filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded border border-[#3A3A3A] px-2 py-0.5 text-[10px] text-indigo-200/90 hover:border-[#4338CA]/50"
                  >
                    {filePath}
                  </a>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-[10px] text-[#F0EFE2]/35">
              {entry.contractCategory} · confidence {Math.round((entry.confidence ?? 0) * 100)}%
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function WikiRepoPage({ projectId }: WikiRepoPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connector } = useContinuityLab();
  const github = connector.payload.github;

  const section = wikiSectionFromQuery(searchParams.get("section"));
  const focusPath = searchParams.get("focus")?.trim() || null;
  const [sectionSearch, setSectionSearch] = useState("");
  const [branch, setBranch] = useState("main");
  const [projectState, setProjectState] = useState<ProjectStateData | null>(null);
  const [decisions, setDecisions] = useState<DecisionHistoryEntry[]>([]);
  const [indexStatus, setIndexStatus] = useState<RepoIndexStatus | null>(null);
  const [operationalMap, setOperationalMap] = useState<OperationalMapPayload | null>(null);
  const [repoWorkspace, setRepoWorkspace] = useState<RepoWorkspacePayload | null>(null);
  const [scopedGraphNodes, setScopedGraphNodes] = useState<
    ReturnType<typeof filterGraphForProject>["nodes"]
  >([]);
  const [scopedGraphEdges, setScopedGraphEdges] = useState<
    ReturnType<typeof filterGraphForProject>["edges"]
  >([]);
  const [graphUpdatedAt, setGraphUpdatedAt] = useState<string | null>(null);
  const [sourcePaths, setSourcePaths] = useState<string[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repoFullName = useMemo(
    () => repoFullNameFromProjectId(projectId, github.repos),
    [projectId, github.repos],
  );

  const repoMeta = useMemo(
    () => github.repos.find((r) => r.fullName === repoFullName),
    [github.repos, repoFullName],
  );

  const repoParts = useMemo(
    () => (repoFullName ? parseWikiRepoFullName(repoFullName) : null),
    [repoFullName],
  );

  const indexed = indexStatus?.status === "indexed";
  const generating = indexStatus?.status === "generating";

  const docSections = useMemo((): WikiDocSection[] => {
    const dynamic = buildWikiSectionsFromOperationalMap(operationalMap?.sections ?? []);
    if ((operationalMap?.sections?.length ?? 0) > 0) {
      return dynamic;
    }
    return [...WIKI_DOC_SECTIONS];
  }, [operationalMap]);

  const sectionDef = resolveWikiDocSection(section, docSections);

  const workspaceSections = useMemo((): WorkspaceNavSection[] => {
    if (!repoWorkspace) return [];
    const childrenByDir = new Map(Object.entries(repoWorkspace.childrenByDir));
    return buildWorkspaceSections({
      rootEntries: repoWorkspace.rootEntries,
      childrenByDir,
    });
  }, [repoWorkspace]);

  const repoTreeNodes = useMemo(() => {
    if (!repoWorkspace) return [];
    const childrenByDir = new Map(Object.entries(repoWorkspace.childrenByDir));
    return buildRepoTreeDiagramNodes({
      rootEntries: repoWorkspace.rootEntries,
      childrenByDir,
      maxDepth: 2,
    });
  }, [repoWorkspace]);

  const techStack = useMemo(
    () =>
      repoWorkspace?.packageJson
        ? parseTechStackFromPackageJson(repoWorkspace.packageJson)
        : [],
    [repoWorkspace?.packageJson],
  );

  const deploymentHints = useMemo(
    () =>
      parseDeploymentHints({
        packageJson: repoWorkspace?.packageJson,
        renderYaml: repoWorkspace?.renderYaml,
      }),
    [repoWorkspace?.packageJson, repoWorkspace?.renderYaml],
  );

  const loadRepo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [state, wikiDecisions, graph, map, status, workspace] = await Promise.all([
        fetchProjectState(projectId),
        fetchWikiDecisions(projectId, 50),
        fetchOrgGraph({ projectId, repoFullName: repoFullName ?? undefined }),
        fetchOperationalMap(projectId),
        repoFullName ? fetchRepoIndexStatus(repoFullName, projectId) : Promise.resolve(null),
        repoFullName ? fetchRepoWorkspace(repoFullName, branch) : Promise.resolve(null),
      ]);
      setProjectState(state);
      setDecisions(wikiDecisions);
      setOperationalMap(map);
      setIndexStatus(status);
      setRepoWorkspace(workspace);
      setGraphUpdatedAt(graph?.updatedAt ?? null);
      const scoped = filterGraphForProject(graph, projectId, repoFullName);
      setScopedGraphNodes(scoped.nodes);
      setScopedGraphEdges(scoped.edges);
      const paths = await fetchWikiSourcePaths(projectId, wikiDecisions);
      setSourcePaths(paths);
      if (!state && !wikiDecisions.length && !map?.nodes?.length) {
        setError("No operational memory indexed for this repository yet.");
      }
    } catch {
      setError("Could not load wiki data.");
    } finally {
      setLoading(false);
    }
  }, [projectId, repoFullName, branch]);

  useEffect(() => {
    if (repoFullName) {
      touchRecentWikiRepo(repoFullName);
      setBranch(repoMeta?.defaultBranch || "main");
    }
  }, [repoFullName, repoMeta?.defaultBranch]);

  useEffect(() => {
    void loadRepo();
  }, [loadRepo]);

  const contractSummary = useMemo(() => buildContractSummaryRows(decisions), [decisions]);

  const visibleSections = useMemo((): WikiSectionId[] => {
    const ids: WikiSectionId[] = ["overview", "getting-started", "deployment"];
    const contractSections =
      (operationalMap?.sections?.length ?? 0) > 0
        ? docSections.filter((def) => def.group === "contract")
        : WIKI_CONTRACT_SECTIONS;

    for (const def of contractSections) {
      const hasMemories = decisionsForSection(decisions, def.contractCategories).length > 0;
      const hasMapNodes = (def.nodeCount ?? 0) > 0;
      const hasBlockers =
        def.id === "blockers" && (projectState?.briefSummary?.openBlockers?.length ?? 0) > 0;
      if (hasMemories || hasMapNodes || hasBlockers) ids.push(def.id);
    }

    if (
      scopedGraphNodes.length > 0 &&
      !ids.includes("architecture") &&
      contractSections.some((section) => section.id === "architecture")
    ) {
      ids.push("architecture");
    }

    if (repoTreeNodes.length > 0 && !ids.includes("architecture")) {
      ids.push("architecture");
    }

    return ids;
  }, [decisions, projectState, operationalMap, docSections, scopedGraphNodes.length, repoTreeNodes.length]);

  const sectionDecisions = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    let list = decisionsForSection(decisions, sectionDef.contractCategories);
    if (section === "blockers") {
      const blockers = projectState?.briefSummary?.openBlockers ?? [];
      if (blockers.length && !list.length) {
        return blockers.map(
          (text, i): DecisionHistoryEntry => ({
            memoryId: `blocker-${i}`,
            summary: text,
            content: text,
            contractCategory: "blocker",
            updatedAt: new Date().toISOString(),
            confidence: 0.5,
          }),
        );
      }
    }
    if (q) {
      list = list.filter(
        (d) =>
          d.summary.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.contractCategory.toLowerCase().includes(q),
      );
    }
    return list;
  }, [decisions, section, sectionDef.contractCategories, sectionSearch, projectState]);

  const lastUpdated = latestWikiUpdatedAt({
    projectState,
    decisions,
    graphUpdatedAt,
  });

  const repoOptions = github.repos.map((r) => ({
    fullName: r.fullName,
    private: r.private,
    defaultBranch: r.defaultBranch,
    updatedAt: r.updatedAt,
  }));

  const childSections = useMemo(
    () =>
      visibleSections
        .filter((id) => id !== section)
        .map((id) => docSections.find((s) => s.id === id))
        .filter((s): s is WikiDocSection => Boolean(s)),
    [visibleSections, section, docSections],
  );

  if (!repoFullName) {
    return (
      <div className="px-5 py-10">
        <p className="text-sm text-[#F0EFE2]/60">Repository not found in your connected GitHub scope.</p>
        <Link href="/continuity-lab/wiki" className="mt-4 inline-block text-sm text-indigo-300 underline">
          Back to wiki index
        </Link>
      </div>
    );
  }

  function sectionFooter() {
    return (
      <WikiSectionFooter
        repoFullName={repoFullName ?? ""}
        branch={branch}
        sourcePaths={sourcePaths}
      />
    );
  }

  function renderSectionBody() {
    if (loading) {
      return (
        <p className="flex items-center gap-2 text-sm text-[#F0EFE2]/50">
          <Loader2 className="size-4 animate-spin" />
          Loading {sectionDef.label}…
        </p>
      );
    }

    const repoName = repoFullName ?? "";
    const brief = projectState?.briefSummary;
    const mapDiagram = operationalMapToDiagram(
      operationalMap?.nodes ?? [],
      operationalMap?.edges ?? [],
    );

    switch (section) {
      case "overview":
        return (
          <WikiSectionLayout
            description={
              brief?.currentGoal ??
              repoWorkspace?.readme?.excerpt ??
              "Sync this repository to index operational memory, or run a Continuity Lab session."
            }
            footer={sectionFooter()}
          >
            {error ? <p className="text-amber-200/90">{error}</p> : null}

            <WikiMetricCards
              items={[
                {
                  label: "Resume confidence",
                  value:
                    projectState?.resumeConfidenceScore != null
                      ? `${Math.round(projectState.resumeConfidenceScore * 100)}%`
                      : "—",
                },
                {
                  label: "Drift",
                  value: projectState?.driftFlag
                    ? projectState.driftSummary || "Detected"
                    : "None",
                  hint: projectState?.driftFlag ? undefined : "No drift flag on project state",
                },
                {
                  label: "Map nodes",
                  value: operationalMap?.nodes?.length ?? 0,
                  hint: "From operational map compiler",
                },
              ]}
            />

            {techStack.length > 0 ? (
              <WikiContentBlock
                title="Tech stack"
                description="Parsed from package.json in the connected repository."
              >
                <WikiDataTable
                  columns={[
                    { key: "name", label: "Package" },
                    { key: "version", label: "Version" },
                    { key: "kind", label: "Type" },
                  ]}
                  rows={techStack.map((row) => ({
                    name: <span className="font-mono text-[#F0EFE2]/85">{row.name}</span>,
                    version: <span className="font-mono text-[#F0EFE2]/60">{row.version}</span>,
                    kind: row.kind,
                  }))}
                />
              </WikiContentBlock>
            ) : null}

            <WikiAiDiagram
              projectId={projectId}
              repoFullName={repoName}
              branch={branch}
              diagramType="ui_composition"
              fallback={
                <WikiDiagramPanel
                  title="Code Entity Mapping: UI Composition"
                  description="Operational map fallback — configure Company Model for AI-generated diagrams."
                  nodes={mapDiagram.nodes}
                  edges={mapDiagram.edges}
                  layout="category"
                  maxNodes={10}
                  compact
                  emptyMessage="No operational map nodes yet. Sync GitHub memory for this repo."
                />
              }
            />

            <WikiAiDiagram
              projectId={projectId}
              repoFullName={repoName}
              branch={branch}
              diagramType="data_flow"
            />

            <WikiDiagramPanel
              title="Operational map"
              description="Live graph compiled from contract memories — not LLM-generated architecture prose."
              nodes={mapDiagram.nodes}
              edges={mapDiagram.edges}
              layout="category"
              maxNodes={10}
              compact
              emptyMessage="No operational map nodes yet. Sync GitHub memory for this repo."
            />

            {repoTreeNodes.length > 0 ? (
              <WikiContentBlock
                title="Repository structure"
                description="Directory tree from GitHub with frontend / backend / static grouping."
              >
                <WikiRepoTreeDiagram nodes={repoTreeNodes} />
              </WikiContentBlock>
            ) : null}

            {contractSummary.length > 0 ? (
              <WikiContentBlock title="Contract sections" description="Indexed memory by category.">
                <WikiDataTable
                  columns={[
                    { key: "label", label: "Section" },
                    { key: "count", label: "Memories", className: "tabular-nums" },
                  ]}
                  rows={contractSummary.map((row) => ({
                    label: (
                      <Link
                        href={wikiRepoHref(projectId, row.category as WikiSectionId)}
                        className="text-indigo-200/90 hover:text-indigo-100"
                      >
                        {row.label}
                      </Link>
                    ),
                    count: row.count,
                  }))}
                />
              </WikiContentBlock>
            ) : null}
          </WikiSectionLayout>
        );

      case "getting-started":
        return (
          <WikiSectionLayout
            description={
              brief?.nextBestAction ??
              "Setup hints from README and project state — no generated onboarding prose."
            }
            footer={sectionFooter()}
          >
            {repoWorkspace?.readme?.excerpt ? (
              <WikiContentBlock
                title="README excerpt"
                description={`From ${repoWorkspace.readme.path} in the connected repository.`}
              >
                <div className="border border-[#2F2F2F] bg-[#111111] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F0EFE2]/70">
                    {repoWorkspace.readme.excerpt}
                  </p>
                  <a
                    href={githubBlobUrl(repoName, branch, repoWorkspace.readme.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                  >
                    View full README on GitHub
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </WikiContentBlock>
            ) : null}

            {brief?.whatChangedRecently?.length ? (
              <WikiContentBlock title="What changed recently">
                <ul className="list-disc space-y-1 pl-5 text-sm text-[#F0EFE2]/70">
                  {brief.whatChangedRecently.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </WikiContentBlock>
            ) : null}

            {brief?.openBlockers?.length ? (
              <WikiContentBlock title="Open blockers">
                <ul className="space-y-2">
                  {brief.openBlockers.map((b) => (
                    <li
                      key={b}
                      className="border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-100/90"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </WikiContentBlock>
            ) : null}

            {!repoWorkspace?.readme?.excerpt && !brief?.whatChangedRecently?.length ? (
              <p className="text-sm text-[#F0EFE2]/45">
                No README or recent project-state changes recorded yet.
              </p>
            ) : null}
          </WikiSectionLayout>
        );

      case "deployment":
        return (
          <WikiSectionLayout
            description="Deployment signals from render.yaml, package.json scripts, and runbook memories."
            footer={sectionFooter()}
          >
            {deploymentHints.length > 0 ? (
              <WikiContentBlock title="Deploy configuration">
                <WikiDataTable
                  columns={[
                    { key: "label", label: "Signal" },
                    { key: "value", label: "Value" },
                    { key: "path", label: "File" },
                  ]}
                  rows={deploymentHints.map((hint) => ({
                    label: hint.label,
                    value: <span className="font-mono text-xs">{hint.value}</span>,
                    path: (
                      <a
                        href={githubBlobUrl(repoName, branch, hint.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-indigo-200/90 hover:text-indigo-100"
                      >
                        {hint.path}
                      </a>
                    ),
                  }))}
                />
              </WikiContentBlock>
            ) : null}

            {sectionDecisions.length > 0 ? (
              <WikiContentBlock title="Runbook memories">
                <MemoryEntryList entries={sectionDecisions} repoFullName={repoName} branch={branch} />
              </WikiContentBlock>
            ) : (
              <p className="text-sm text-[#F0EFE2]/45">
                No deployment runbooks or config files detected yet.
              </p>
            )}
          </WikiSectionLayout>
        );

      case "architecture":
        return (
          <WikiSectionLayout
            description="Code entity mapping from AI diagrams, operational map, org graph, and GitHub tree."
            footer={sectionFooter()}
          >
            <WikiAiDiagram
              projectId={projectId}
              repoFullName={repoName}
              branch={branch}
              diagramType="architecture"
            />
            <WikiAiDiagram
              projectId={projectId}
              repoFullName={repoName}
              branch={branch}
              diagramType="overview"
              className="mt-8"
            />
            <div className="mt-8">
              <WikiOperationalMapPanel
                operationalMap={operationalMap}
                graphNodes={scopedGraphNodes}
                graphEdges={scopedGraphEdges}
                repoTreeNodes={repoTreeNodes}
                focusPath={focusPath}
              />
            </div>
          </WikiSectionLayout>
        );

      default:
        return (
          <WikiSectionLayout
            description={`Contract memories tagged as ${sectionDef.contractCategories.join(", ") || sectionDef.label}.`}
            footer={sectionFooter()}
          >
            <MemoryEntryList entries={sectionDecisions} repoFullName={repoName} branch={branch} />
          </WikiSectionLayout>
        );
    }
  }

  return (
    <div className="flex min-h-full flex-col pb-44">
      <WikiSourcesPanel
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        repoFullName={repoFullName}
        branch={branch}
        sourcePaths={sourcePaths}
      />

      <div className="flex min-h-0 flex-1">
        <WikiDocSidebar
          projectId={projectId}
          repoFullName={repoFullName}
          activeSection={section}
          visibleSections={visibleSections}
          docSections={docSections}
          workspaceSections={workspaceSections}
          focusPath={focusPath}
          className="hidden lg:block"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[#2F2F2F] bg-[#0A0A0A] px-4 py-3 sm:px-6">
            <nav className="flex flex-wrap items-center gap-1 text-xs text-[#F0EFE2]/45">
              <Link href="/continuity-lab/wiki" className="hover:text-[#F0EFE2]">
                Operational Wiki
              </Link>
              {repoParts ? (
                <>
                  <ChevronRight className="size-3" />
                  <span>{repoParts.owner}</span>
                  <ChevronRight className="size-3" />
                  <span className="font-mono text-[#F0EFE2]/85">{repoParts.repo}</span>
                </>
              ) : (
                <>
                  <ChevronRight className="size-3" />
                  <span className="font-mono text-[#F0EFE2]/85">{repoFullName}</span>
                </>
              )}
            </nav>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {lastUpdated ? (
                <span className="text-[11px] text-[#F0EFE2]/40">
                  Updated {formatWikiRelativeTime(lastUpdated)}
                </span>
              ) : null}
              <span
                className={cn(
                  "rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  indexed
                    ? "border-emerald-500/30 text-emerald-200/90"
                    : generating
                      ? "border-amber-500/30 text-amber-100/90"
                      : "border-[#3A3A3A] text-[#F0EFE2]/45",
                )}
              >
                {indexed ? "Indexed" : generating ? "Generating" : "Not indexed"}
              </span>
              {generating ? (
                <span className="inline-flex items-center gap-1 rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-100/90">
                  <Loader2 className="size-3 animate-spin" />
                  Auto-indexing
                </span>
              ) : null}
              <ContinuityLabBranchSelect
                value={branch}
                defaultBranch={repoMeta?.defaultBranch}
                onChange={setBranch}
              />
              <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/35" />
                <input
                  type="search"
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  placeholder="Search this section…"
                  className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#111111] pl-8 pr-2 text-xs text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#4338CA] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setSourcesOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#3A3A3A] px-2.5 text-[11px] font-medium text-[#F0EFE2]/80 hover:border-[#4338CA]/50"
              >
                <FileCode2 className="size-3.5" />
                Relevant source files
                {sourcePaths.length > 0 ? (
                  <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] tabular-nums text-[#F0EFE2]/70">
                    {sourcePaths.length}
                  </span>
                ) : null}
              </button>
              <a
                href={githubRepoUrl(repoFullName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 rounded-md border border-[#3A3A3A] px-2.5 text-[11px] text-[#F0EFE2]/70 hover:text-[#F0EFE2]"
              >
                <WikiGithubIcon className="size-3.5" />
                GitHub
                <ExternalLink className="size-3" />
              </a>
              <select
                className="h-8 rounded-md border border-[#3A3A3A] bg-[#111111] px-2 text-xs text-[#F0EFE2]/80 lg:hidden"
                value={section}
                onChange={(e) => {
                  router.push(wikiRepoHref(projectId, wikiSectionFromQuery(e.target.value)));
                }}
              >
                {visibleSections.map((id) => {
                  const def = docSections.find((s) => s.id === id);
                  return (
                    <option key={id} value={id}>
                      {def?.label ?? id}
                    </option>
                  );
                })}
              </select>
            </div>
          </header>

          <article className="flex-1 px-4 py-6 sm:px-8">
            <h2 className="text-xl font-semibold text-[#F0EFE2]">{sectionDef.label}</h2>
            <p className="mt-1 text-xs text-[#F0EFE2]/40">
              {repoFullName}
              {lastUpdated ? ` · Updated ${formatWikiRelativeTime(lastUpdated)}` : ""}
            </p>
            <div className="mt-6">{renderSectionBody()}</div>

            {childSections.length > 0 && section === "overview" ? (
              <div className="mt-10 border-t border-[#2F2F2F] pt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F0EFE2]/35">
                  Navigation
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {childSections.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={wikiRepoHref(projectId, child.id)}
                        className="block rounded-md border border-[#2F2F2F] bg-[#111111] px-4 py-3 text-sm text-[#F0EFE2]/75 transition hover:border-[#4338CA]/40 hover:text-[#F0EFE2]"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        </div>
      </div>

      {!github.connected ? (
        <div className="mx-4 mb-4 border border-[#4338CA]/40 bg-[#4338CA]/10 px-4 py-3 text-sm text-[#F0EFE2]/70">
          Connect GitHub to use Ask on this wiki.{" "}
          <Link href="/mission-control?section=connectors" className="text-indigo-300 underline">
            Connect GitHub
          </Link>
        </div>
      ) : (
        <WikiAskBar
          repoFullName={repoFullName}
          defaultBranch={repoMeta?.defaultBranch || "main"}
          projectId={projectId}
          githubConnected={github.connected}
          repoOptions={repoOptions}
          lastSyncAt={github.lastSyncAt}
        />
      )}
    </div>
  );
}
