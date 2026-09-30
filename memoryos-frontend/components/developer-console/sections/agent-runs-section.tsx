"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Database,
  FileJson,
  FileText,
  Filter,
  Package,
  Play,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { ConsolePage } from "@/components/developer-console/console-ui";
import { ConnectorBrandIcon } from "@/components/developer-console/connector-brand-icons";
import { MemoryosLogoTile } from "@/components/continuity-lab/memoryos-logo-mark";
import {
  cancelAgentRun,
  completeAgentRun,
  createFirstLaunchProof,
  createFutureInstructionFromRun,
  createMistakeRuleFromRun,
  createSkillCandidateFromRun,
  failAgentRun,
  getAgentRun,
  getAgentRunBlackBox,
  getAgentRunPackage,
  getAgentRunProof,
  getAgentRunTimeline,
  getAgentRunsSummary,
  listAgentRuns,
  replayAgentRun,
  saveAgentRunOutcome,
  type AgentRunBlackBox,
  type AgentRunReplay,
  type AgentRunsSummary,
  type FirstLaunchProof,
} from "@/lib/agent-runs-api";
import {
  createMasterplanBlackBoxRecord,
  createMasterplanWorkspace,
  listMasterplanWorkspaces,
  type MasterplanAgentRunDetail,
  type MasterplanAgentRunEvent,
  type MasterplanBlackBoxRecord,
  type MasterplanComplianceEvidence,
  type MasterplanPackage,
} from "@/lib/masterplan-api";
import { cn } from "@/lib/utils";

type AgentRunsSectionProps = {
  workspaceName?: string;
  requestEvents?: unknown[];
  timelineEvents?: unknown[];
  memoryCount?: number;
  timelineCount?: number;
  onOpenMemoryIgnition?: () => void;
  onOpenExperience?: () => void;
  onOpenFutureInstructions?: () => void;
  onOpenRiskApproval?: () => void;
  onOutcomeSaved?: () => void;
};

const BRAND_CONTRACT_MARKERS = [
  'id="codex-chats"',
  'id="cursor-chats"',
  'id="claude"',
  'id="openai-agents"',
  'id="jira"',
  'id="notion"',
  'id="slack"',
];

const LIVE_EVENT_TYPES = new Set([
  "agent_run.updated",
  "package.sent",
  "outcome.captured",
  "future_instruction.created",
  "mistake_rule.created",
  "skill_candidate.created",
  "first_launch_proof.created",
]);

function AgentBrandIcon({ agent, className }: { agent: string; className?: string }) {
  const iconClassName = className ?? "size-5";
  let icon: ReactNode;
  switch (agent) {
    case "Codex":
      icon = <ConnectorBrandIcon id="codex-chats" className={iconClassName} />;
      break;
    case "Cursor":
      icon = <ConnectorBrandIcon id="cursor-chats" className={iconClassName} />;
      break;
    case "Claude":
      icon = <ConnectorBrandIcon id="claude" className={iconClassName} />;
      break;
    case "OpenAI Adapter":
      icon = <ConnectorBrandIcon id="openai-agents" className={iconClassName} />;
      break;
    case "Jira Agent":
      icon = <ConnectorBrandIcon id="jira" className={iconClassName} />;
      break;
    case "Notion Agent":
      icon = <ConnectorBrandIcon id="notion" className={iconClassName} />;
      break;
    case "Slack Agent":
      icon = <ConnectorBrandIcon id="slack" className={iconClassName} />;
      break;
    case "Internal Agent":
      icon = <MemoryosLogoTile size={16} />;
      break;
    default:
      icon = <span className="text-[10px] font-bold text-slate-500">{agent.slice(0, 1)}</span>;
  }
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-none border border-slate-200 bg-white" aria-hidden>
      {icon}
    </span>
  );
}

function relativeTime(value?: string | null): string {
  if (!value) return "Waiting";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function eventTitle(type: string): string {
  return type
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string): string {
  if (status === "Completed") return "border-emerald-100 bg-emerald-50 text-emerald-600";
  if (status === "Running") return "border-blue-100 bg-blue-50 text-blue-600";
  if (status === "Failed") return "border-red-100 bg-red-50 text-red-600";
  if (status === "Cancelled") return "border-slate-200 bg-slate-100 text-slate-500";
  if (status.toLowerCase().includes("approval")) return "border-amber-100 bg-amber-50 text-amber-600";
  return "border-slate-100 bg-slate-50 text-slate-600";
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function describeEvidenceItem(item: unknown): string {
  const record = asRecord(item);
  const primary = String(
    record.title ??
      record.name ??
      record.label ??
      record.summary ??
      record.tool ??
      record.path ??
      record.action ??
      record.id ??
      safeJson(item),
  );
  const status =
    record.allowed !== undefined
      ? record.allowed === true
        ? "allowed"
        : "blocked"
      : record.ok !== undefined
        ? record.ok === true
          ? "allowed"
          : "blocked"
        : record.status !== undefined
          ? String(record.status)
          : record.reason !== undefined
            ? String(record.reason)
            : record.detail !== undefined
              ? String(record.detail)
              : "";
  return status ? `${primary} · ${status}` : primary;
}

function evidenceItems(value: unknown): string[] {
  return asArray(value).map((item) => describeEvidenceItem(item));
}

function evidenceLinkLabel(value: unknown, fallback: string): string {
  const record = asRecord(value);
  return String(record.id ?? record.outcomeId ?? record.futureInstructionId ?? record.mistakeRuleId ?? record.skillCandidateId ?? fallback);
}

function runContract(run: MasterplanAgentRunDetail | null): Record<string, unknown> {
  if (!run) return {};
  return asRecord(
    run.inheritanceContract ??
      run.inheritancePackage?.contract ??
      asRecord(run.inheritancePackage?.payload).inheritance_contract ??
      asRecord(run.inheritancePackage?.proof).inheritanceContract,
  );
}

function contractIdForRun(run: MasterplanAgentRunDetail | null): string {
  const contract = runContract(run);
  return String(contract.id ?? run?.contractId ?? run?.inheritancePackage?.contractId ?? asRecord(run?.inheritancePackage?.payload).contract_id ?? "");
}

function isLiveEvent(event: MessageEvent<string>): boolean {
  try {
    const payload = JSON.parse(event.data) as { eventType?: string };
    return Boolean(payload.eventType && LIVE_EVENT_TYPES.has(payload.eventType));
  } catch {
    return false;
  }
}

export function AgentRunsSection(props: AgentRunsSectionProps) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [eventDetail, setEventDetail] = useState<MasterplanAgentRunEvent | null>(null);
  const [blackBox, setBlackBox] = useState<AgentRunBlackBox | null>(null);
  const [linkedPackage, setLinkedPackage] = useState<MasterplanPackage | null>(null);
  const [proof, setProof] = useState<unknown>(null);
  const [replay, setReplay] = useState<AgentRunReplay | null>(null);
  const [firstLaunchProof, setFirstLaunchProof] = useState<FirstLaunchProof | null>(null);
  const [persistedProof, setPersistedProof] = useState<{
    blackBoxRecord: MasterplanBlackBoxRecord;
    complianceEvidence: MasterplanComplianceEvidence;
  } | null>(null);
  const [summaryText, setSummaryText] = useState("Run completed and outcome reviewed.");
  const [futureLesson, setFutureLesson] = useState("Future agents should inspect the AgentRun timeline before approving follow-up instructions.");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      const workspaces = await listMasterplanWorkspaces();
      const workspace =
        workspaces[0] ??
        (await createMasterplanWorkspace({
          name: props.workspaceName ?? "MemoryOS Workspace",
          plan: "developer",
          region: "local",
        }));
      if (!cancelled) setWorkspaceId(workspace.id);
    }
    void loadWorkspace().catch((error) => setMutationError(error instanceof Error ? error.message : "workspace_load_failed"));
    return () => {
      cancelled = true;
    };
  }, [props.workspaceName]);

  const summary = useSWR<AgentRunsSummary>(
    workspaceId ? ["agent-runs-summary", workspaceId] : null,
    () => getAgentRunsSummary(workspaceId ?? undefined),
  );
  const runs = useSWR<MasterplanAgentRunDetail[]>(
    workspaceId ? ["agent-runs", workspaceId, activeFilter] : null,
    () => listAgentRuns({ workspaceId: workspaceId ?? undefined, status: activeFilter }),
  );
  const selectedRun = useSWR<MasterplanAgentRunDetail>(
    selectedRunId ? ["agent-run", selectedRunId] : null,
    () => getAgentRun(selectedRunId ?? ""),
  );
  const timeline = useSWR<MasterplanAgentRunEvent[]>(
    selectedRunId ? ["agent-run-timeline", selectedRunId] : null,
    () => getAgentRunTimeline(selectedRunId ?? ""),
  );
  const selectedBlackBox = useSWR<AgentRunBlackBox>(
    selectedRunId ? ["agent-run-black-box", selectedRunId] : null,
    () => getAgentRunBlackBox(selectedRunId ?? ""),
    { refreshInterval: 15000 },
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([
      summary.mutate(),
      runs.mutate(),
      selectedRun.mutate(),
      timeline.mutate(),
      selectedBlackBox.mutate(),
    ]);
  }, [runs, selectedBlackBox, selectedRun, summary, timeline]);

  useEffect(() => {
    if (selectedRunId || !runs.data?.[0]) return;
    setSelectedRunId(runs.data[0].id);
  }, [runs.data, selectedRunId]);

  useEffect(() => {
    const source = new EventSource("/api/events/stream");
    const refresh = (event: MessageEvent<string>) => {
      if (isLiveEvent(event)) void refreshAll();
    };
    source.onmessage = refresh;
    source.addEventListener("message", refresh);
    source.addEventListener("agent_run.updated", refresh as EventListener);
    source.addEventListener("outcome.captured", refresh as EventListener);
    source.addEventListener("future_instruction.created", refresh as EventListener);
    source.addEventListener("mistake_rule.created", refresh as EventListener);
    source.addEventListener("skill_candidate.created", refresh as EventListener);
    source.addEventListener("first_launch_proof.created", refresh as EventListener);
    source.onerror = () => {
      // Dev Fast Refresh can briefly drop the SSE connection while RSC recompiles.
      // EventSource reconnects by itself; keep the page stable and visible.
    };
    return () => source.close();
  }, [refreshAll]);

  const filteredRuns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = runs.data ?? [];
    if (!needle) return rows;
    return rows.filter((run) => {
      const haystack = [
        run.id,
        run.packageId,
        run.targetAgent,
        run.status,
        run.inheritancePackage?.task,
        run.outcome?.summary,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, runs.data]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setBusyAction(label);
    setMutationError(null);
    try {
      await action();
      await refreshAll();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : `${label}_failed`);
    } finally {
      setBusyAction(null);
    }
  }

  function openMemoryIgnition() {
    if (props.onOpenMemoryIgnition) {
      props.onOpenMemoryIgnition();
      return;
    }
    window.location.assign("/developer-console?section=memory-ignition");
  }

  async function saveOutcomeLearning() {
    if (!selectedRunId) return;
    await runAction("save-outcome", async () => {
      await saveAgentRunOutcome(selectedRunId, {
        summary: summaryText,
        filesChanged: [],
        testsPassed: [],
        testsFailed: [],
        worked: "Timeline proof made the run traceable.",
        failed: "No unresolved failure captured from this inspector action.",
        humanCorrection: false,
        futureLesson,
      });
      props.onOutcomeSaved?.();
    });
  }

  async function openBlackBox() {
    if (!selectedRunId) return;
    await runAction("black-box", async () => setBlackBox(await getAgentRunBlackBox(selectedRunId)));
  }

  async function openLinkedPackage() {
    if (!selectedRunId) return;
    await runAction("package", async () => setLinkedPackage(await getAgentRunPackage(selectedRunId)));
  }

  async function openProof() {
    if (!selectedRunId) return;
    await runAction("proof", async () => setProof(await getAgentRunProof(selectedRunId)));
  }

  async function openReplay() {
    if (!selectedRunId) return;
    await runAction("replay", async () => setReplay(await replayAgentRun(selectedRunId)));
  }

  async function recordBlackBoxEvidence() {
    if (!selectedRunId) return;
    await runAction("record-black-box", async () => {
      const saved = await createMasterplanBlackBoxRecord(selectedRunId);
      setPersistedProof(saved);
    });
  }

  async function buildFirstLaunchProof() {
    await runAction("first-launch-proof", async () => {
      const created = await createFirstLaunchProof();
      setFirstLaunchProof(created);
      setSelectedRunId(created.secondRun.id);
      setReplay(created.replay);
    });
  }

  const loading = summary.isLoading || runs.isLoading || !workspaceId;
  const error = mutationError ?? summary.error?.message ?? runs.error?.message ?? selectedRun.error?.message ?? timeline.error?.message ?? selectedBlackBox.error?.message ?? null;

  return (
    <ConsolePage className="h-full w-full max-w-none overflow-y-auto bg-[#FAFAFA] memoryos-console-scroll">
      <div className="hidden">{BRAND_CONTRACT_MARKERS.join(" ")}</div>
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Agent Runs</h1>
            <p className="mt-1 text-[13px] text-slate-500">Live flight recorder for AgentRun timelines, black-box proof, and outcome learning.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Search runs, agent, package..."
                className="h-10 w-64 rounded-[10px] border border-slate-200 bg-white pl-9 pr-10 text-[13px] shadow-sm outline-none focus:border-amber-500"
              />
            </div>
            <button className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100" aria-label="Live run notifications">
              <Bell className="size-5" />
              {(runs.data?.length ?? 0) > 0 ? <span className="absolute right-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-[#FAFAFA]">{Math.min(runs.data?.length ?? 0, 9)}</span> : null}
            </button>
            <button
              onClick={buildFirstLaunchProof}
              disabled={Boolean(busyAction)}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-slate-900 px-4 text-[12px] font-black text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="size-4 text-amber-300" />
              {busyAction === "first-launch-proof" ? "Building proof..." : "Build proof loop"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">{error}</div>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {(summary.data?.metrics ?? Array.from({ length: 6 }, (_, index) => ({ key: `loading-${index}`, label: "Loading", value: 0, filter: "all" }))).map((metric, index) => {
            const icons = [Database, Play, ShieldCheck, XCircle, Clock, Sparkles];
            const Icon = icons[index] ?? Database;
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setActiveFilter(metric.filter)}
                className={cn(
                  "rounded-[20px] border border-black/5 bg-[#E2E4E9] text-left transition hover:-translate-y-0.5",
                  activeFilter === metric.filter && "ring-2 ring-amber-300",
                )}
              >
                <div className="min-h-[126px] rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="size-4 text-amber-500" />
                    <span className="text-[13px] font-bold text-slate-700">{metric.label}</span>
                  </div>
                  <div className="text-[38px] font-black leading-none tracking-tighter text-slate-900">{loading ? "..." : metric.value}</div>
                </div>
                <div className="flex h-9 items-center justify-center px-4">
                  <span className="rounded bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{summary.data?.proofLoop ?? "live backend data"}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
          <div className="space-y-6">
            <section className="rounded-[20px] border border-black/5 bg-[#E2E4E9] p-1.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                <div className="flex items-center gap-3">
                  <Filter className="size-4 text-slate-500" />
                  <span className="text-[12px] font-bold text-slate-600">Backend AgentRun stream</span>
                  <span className="rounded bg-white px-2 py-1 text-[11px] font-bold text-slate-500">SSE live</span>
                </div>
                <button onClick={openMemoryIgnition} className="rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  Create first run
                </button>
              </div>

              <div className="hidden overflow-x-auto rounded-[16px] border border-black/[0.04] bg-white shadow-sm md:block">
                <table className="w-full text-left text-[12px]">
                  <thead className="border-b border-slate-100 bg-[#FAFAFA] text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-5 py-3.5">Agent</th>
                      <th className="px-5 py-3.5">Task</th>
                      <th className="px-5 py-3.5">Package</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Outcome</th>
                      <th className="px-5 py-3.5">Events</th>
                      <th className="px-5 py-3.5">Started</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? <SkeletonRows /> : null}
                    {!loading && filteredRuns.map((run) => (
                      <RunTableRow key={run.id} run={run} selected={selectedRunId === run.id} onSelect={() => setSelectedRunId(run.id)} />
                    ))}
                    {!loading && !filteredRuns.length ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center">
                          <EmptyRuns onCreate={openMemoryIgnition} />
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 rounded-[16px] border border-black/[0.04] bg-white p-3 shadow-sm md:hidden">
                {loading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-[14px] bg-slate-100" />) : null}
                {!loading && filteredRuns.map((run) => (
                  <button key={run.id} type="button" onClick={() => setSelectedRunId(run.id)} className={cn("rounded-[14px] border p-4 text-left", selectedRunId === run.id ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-white")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900"><AgentBrandIcon agent={run.targetAgent} /> {run.targetAgent}</div>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", statusClass(run.status))}>{run.status}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[13px] font-semibold text-slate-700">{run.inheritancePackage?.task ?? "Direct agent run"}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>{run.events?.length ?? 0} events</span>
                      <span>{relativeTime(run.startedAt)}</span>
                    </div>
                  </button>
                ))}
                {!loading && !filteredRuns.length ? <EmptyRuns onCreate={openMemoryIgnition} /> : null}
              </div>
            </section>

            <section className="rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-6 flex flex-wrap items-center gap-2 text-[14px] font-bold text-slate-900">
                AgentRun Timeline
                <span className="text-[12px] font-normal text-slate-400">· {selectedRun.data?.targetAgent ?? "No run selected"} {selectedRun.data ? `(Run ID: ${selectedRun.data.id.slice(0, 12)}...)` : ""}</span>
              </h3>
              <Timeline
                events={timeline.data ?? []}
                loading={timeline.isLoading}
                onSelectEvent={setEventDetail}
              />
            </section>

            <BlackBoxCentralProofPanel
              blackBox={selectedBlackBox.data ?? blackBox}
              loading={selectedBlackBox.isLoading}
              onOpenBlackBox={openBlackBox}
              onRecordEvidence={recordBlackBoxEvidence}
              onReplay={openReplay}
              busyAction={busyAction}
            />
          </div>

          <RunInspector
            run={selectedRun.data ?? null}
            loading={selectedRun.isLoading}
            busyAction={busyAction}
            summaryText={summaryText}
            futureLesson={futureLesson}
            onSummaryChange={setSummaryText}
            onFutureLessonChange={setFutureLesson}
            onSaveOutcome={saveOutcomeLearning}
            onComplete={() => selectedRunId && void runAction("complete", () => completeAgentRun(selectedRunId))}
            onFail={() => selectedRunId && void runAction("fail", () => failAgentRun(selectedRunId, "Marked failed from Agent Runs flight recorder."))}
            onCancel={() => selectedRunId && void runAction("cancel", () => cancelAgentRun(selectedRunId, "Cancelled from Agent Runs flight recorder."))}
            onBlackBox={openBlackBox}
            onPackage={openLinkedPackage}
            onProof={openProof}
            onReplay={openReplay}
            onRecordBlackBox={recordBlackBoxEvidence}
            onFutureInstruction={() => selectedRunId && void runAction("future-instruction", () => createFutureInstructionFromRun(selectedRunId, futureLesson))}
            onMistakeRule={() => selectedRunId && void runAction("mistake-rule", () => createMistakeRuleFromRun(selectedRunId, futureLesson))}
            onSkillCandidate={() => selectedRunId && void runAction("skill-candidate", () => createSkillCandidateFromRun(selectedRunId))}
            onOpenFutureInstructions={props.onOpenFutureInstructions}
          />
        </div>

        <Modal title="Event Detail" open={Boolean(eventDetail)} onClose={() => setEventDetail(null)}>
          {eventDetail ? (
            <div className="space-y-4">
              <InspectorRow label="Type" value={eventTitle(eventDetail.type)} />
              <InspectorRow label="Timestamp" value={new Date(eventDetail.timestamp).toLocaleString()} />
              <JsonBlock title="Payload" value={eventDetail.payload} />
              <JsonBlock title="Proof" value={eventDetail.proof} />
              <JsonBlock title="Raw JSON" value={eventDetail} />
            </div>
          ) : null}
        </Modal>

        <Modal title="Agent Black Box Proof" open={Boolean(blackBox)} onClose={() => setBlackBox(null)}>
          {blackBox ? (
            <div className="space-y-4">
              <div className="rounded-[14px] border border-amber-100 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-black text-amber-950">Inheritance Contract</div>
                    <p className="mt-1 font-mono text-[11px] font-semibold text-amber-700">{blackBox.contractId ?? "not linked"}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-amber-700">
                    {blackBox.proofLoop}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <ContractStat label="Risk" value={String(asRecord(blackBox.contract).riskLevel ?? "low")} />
                  <ContractStat label="Status" value={String(asRecord(blackBox.contract).status ?? "prepared")} />
                  <ContractStat label="Readiness" value={`${String(asRecord(blackBox.contract).readinessScore ?? 0)}%`} />
                  <ContractStat label="Memory" value={`${Array.isArray(asRecord(blackBox.contract).memory) ? (asRecord(blackBox.contract).memory as unknown[]).length : 0}`} />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {blackBox.integrityChecks.map((check) => (
                  <div key={check.label} className="rounded-[12px] border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-900">
                      {check.ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" />}
                      {check.label}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{check.detail}</p>
                  </div>
                ))}
              </div>
              <JsonBlock title="Black Box Record" value={blackBox} />
            </div>
          ) : null}
        </Modal>

        <Modal title="Linked InheritancePackage" open={Boolean(linkedPackage)} onClose={() => setLinkedPackage(null)}>
          {linkedPackage ? <JsonBlock title={linkedPackage.task} value={linkedPackage} /> : <EmptyText title="No package linked" detail="This AgentRun was created directly or the package was disconnected." />}
        </Modal>

        <Modal title="Trace Proof" open={Boolean(proof)} onClose={() => setProof(null)}>
          <JsonBlock title="AgentRun Proof" value={proof} />
        </Modal>

        <Modal title="Persisted Black Box + Compliance Evidence" open={Boolean(persistedProof)} onClose={() => setPersistedProof(null)}>
          {persistedProof ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 p-3">
                  <div className="text-[12px] font-black text-emerald-900">AgentBlackBoxRecord persisted</div>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-emerald-700">{persistedProof.blackBoxRecord.id}</p>
                </div>
                <div className="rounded-[12px] border border-blue-100 bg-blue-50 p-3">
                  <div className="text-[12px] font-black text-blue-900">ComplianceEvidenceItem persisted</div>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-blue-700">{persistedProof.complianceEvidence.id}</p>
                </div>
              </div>
              <JsonBlock title="AgentBlackBoxRecord" value={persistedProof.blackBoxRecord} />
              <JsonBlock title="Compliance Evidence" value={persistedProof.complianceEvidence} />
            </div>
          ) : null}
        </Modal>

        <Modal title="Replay Run" open={Boolean(replay)} onClose={() => setReplay(null)}>
          {replay ? <JsonBlock title={`${replay.replayId} · ${replay.steps.length} steps`} value={replay} /> : null}
        </Modal>

        <Modal title="First Launch Proof Loop" open={Boolean(firstLaunchProof)} onClose={() => setFirstLaunchProof(null)}>
          {firstLaunchProof ? (
            <div className="space-y-4">
              <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-black text-emerald-900">{firstLaunchProof.title}</div>
                    <p className="mt-1 text-[12px] font-semibold text-emerald-700">
                      The second agent inherited the correction and did not repeat the first mistake.
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-black text-emerald-700">
                    {firstLaunchProof.status}
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InspectorRow label="Source" value={firstLaunchProof.source.provider} />
                <InspectorRow label="Memory Count" value={String(firstLaunchProof.memories.length)} />
                <InspectorRow label="First Run" value={firstLaunchProof.firstRun.id} />
                <InspectorRow label="Second Run" value={firstLaunchProof.secondRun.id} />
                <InspectorRow label="Mistake Repeated" value={firstLaunchProof.comparison.mistakeRepeated ? "Yes" : "No"} />
                <InspectorRow label="Replay Steps" value={String(firstLaunchProof.replay.steps.length)} />
              </div>
              <div className="rounded-[12px] border border-slate-100 bg-slate-50 p-3 text-[12px] font-bold text-slate-600">
                {firstLaunchProof.proofLoop.join(" -> ")}
              </div>
              <JsonBlock title="Full Proof Payload" value={firstLaunchProof} />
            </div>
          ) : null}
        </Modal>
      </div>
    </ConsolePage>
  );
}

function RunTableRow({ run, selected, onSelect }: { run: MasterplanAgentRunDetail; selected: boolean; onSelect: () => void }) {
  const contractId = contractIdForRun(run);
  return (
    <tr onClick={onSelect} className={cn("cursor-pointer transition-colors hover:bg-slate-50", selected && "bg-amber-50/60")}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <AgentBrandIcon agent={run.targetAgent} />
          {run.targetAgent}
        </div>
      </td>
      <td className="max-w-[360px] truncate px-5 py-3.5 font-medium text-slate-700">{run.inheritancePackage?.task ?? "Direct agent run"}</td>
      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
        <div>{run.packageId?.slice(0, 12) ?? "none"}</div>
        <div className="mt-1 text-[10px] text-amber-600">{contractId ? `contract ${contractId.slice(0, 10)}` : "no contract"}</div>
      </td>
      <td className="px-5 py-3.5">
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", statusClass(run.status))}>{run.status}</span>
      </td>
      <td className="px-5 py-3.5">
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", run.outcomeId ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-amber-100 bg-amber-50 text-amber-600")}>
          {run.outcomeId ? "Saved" : "Needed"}
        </span>
      </td>
      <td className="px-5 py-3.5 text-slate-500">{run.events?.length ?? 0}</td>
      <td className="px-5 py-3.5 text-slate-500">{relativeTime(run.startedAt)}</td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index}>
          <td colSpan={7} className="px-5 py-3">
            <div className="h-10 animate-pulse rounded-[10px] bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyRuns({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <Package className="mx-auto mb-3 size-8 text-slate-300" />
      <div className="text-[14px] font-bold text-slate-900">No AgentRuns yet</div>
      <p className="mt-1 text-[12px] text-slate-500">Create a MemoryIgnition package, press Send Now, and the live run appears here.</p>
      <button onClick={onCreate} className="mt-4 rounded-[10px] bg-amber-400 px-4 py-2 text-[12px] font-black text-amber-950 hover:bg-amber-500">
        Create first run
      </button>
    </div>
  );
}

function Timeline({ events, loading, onSelectEvent }: { events: MasterplanAgentRunEvent[]; loading: boolean; onSelectEvent: (event: MasterplanAgentRunEvent) => void }) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-[16px] bg-slate-100" />;
  }
  if (!events.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-8 text-center text-[13px] font-semibold text-slate-500">
        Select a run or create one from MemoryIgnition to see run_created, package_sent, outcome_saved, future_instruction_created, and black-box proof events.
      </div>
    );
  }
  return (
    <div className="relative pl-0 sm:pl-3">
      <div className="absolute bottom-4 left-[29px] top-4 z-0 hidden w-px bg-slate-100 sm:block" />
      <div className="relative z-10 flex flex-col gap-5">
        {events.map((item, index) => (
          <button key={item.id} type="button" onClick={() => onSelectEvent(item)} className="group flex gap-4 text-left">
            <div className="hidden w-[85px] shrink-0 flex-col items-end pt-1 sm:flex">
              <div className="text-[11px] font-bold text-slate-700">{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="text-[10px] font-medium text-slate-400">{relativeTime(item.timestamp)}</div>
            </div>
            <div className="relative hidden items-start justify-center sm:flex">
              <div className={cn("z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-110", (index === 0 || index === events.length - 1) && "border-white bg-amber-100")}>
                <div className={cn("rounded-full", index === 0 || index === events.length - 1 ? "size-2 bg-amber-500" : "size-1.5 bg-slate-300")} />
              </div>
            </div>
            <div className="flex flex-1 items-start justify-between rounded-[12px] border border-slate-100 bg-white p-3 transition group-hover:border-amber-200 group-hover:bg-amber-50/30 sm:border-0 sm:border-b sm:p-0 sm:pb-2 sm:pt-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {item.type.includes("outcome") ? <CheckCircle2 className="size-4 text-emerald-500" /> : item.type.includes("fail") ? <AlertTriangle className="size-4 text-red-500" /> : <FileText className="size-4 text-slate-500" />}
                  <span className="text-[13px] font-bold text-slate-900">{eventTitle(item.type)}</span>
                </div>
                <span className="mt-1 block max-w-[520px] truncate text-[12px] text-slate-500">{safeJson(item.payload).replace(/\s+/g, " ")}</span>
              </div>
              <span className="ml-3 shrink-0 rounded-[4px] bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">Proof</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BlackBoxCentralProofPanel({
  blackBox,
  loading,
  busyAction,
  onOpenBlackBox,
  onRecordEvidence,
  onReplay,
}: {
  blackBox: AgentRunBlackBox | null | undefined;
  loading: boolean;
  busyAction: string | null;
  onOpenBlackBox: () => void;
  onRecordEvidence: () => void;
  onReplay: () => void;
}) {
  const summary = blackBox?.proofSummary;
  const evidence = blackBox?.evidence ?? {};
  const trustChecks = blackBox?.trustChecks ?? blackBox?.integrityChecks ?? [];
  const memoryUsed = evidenceItems(evidence.memoryUsed);
  const filesTouched = evidenceItems(evidence.filesTouched);
  const toolsCalled = evidenceItems(evidence.toolsCalled);
  const policyChecks = evidenceItems(evidence.policyChecks);
  const outcomeLinks = asArray(evidence.outcome).length > 0 ? evidenceItems(evidence.outcome) : blackBox?.outcome ? [evidenceLinkLabel(blackBox.outcome, "outcome") ] : [];
  const futureInstructionLinks = evidenceItems(evidence.futureInstructions);
  const mistakeImmunityLinks = evidenceItems(evidence.mistakeImmunity);
  const replaySteps = evidence.replayProof?.steps ?? [];
  const replayStepPreview = replaySteps.length ? describeEvidenceItem(replaySteps[0]) : "timeline steps";
  const proofTiles = [
    { label: "Memory Used", value: String(summary?.memoryCount ?? memoryUsed.length ?? 0), detail: memoryUsed.length ? memoryUsed[0] : "facts, incidents, rules" },
    { label: "Skills Routed", value: String(summary?.skillCount ?? evidence.skillsRouted?.length ?? 0), detail: "only relevant skills" },
    { label: "Files Touched", value: String(summary?.fileTouchCount ?? filesTouched.length ?? 0), detail: filesTouched.length ? filesTouched[0] : "run file proof" },
    { label: "Tools Called", value: String(summary?.toolCallCount ?? toolsCalled.length ?? 0), detail: toolsCalled.length ? toolsCalled[0] : "agent access proof" },
    { label: "Policy Checks", value: String(summary?.policyCheckCount ?? policyChecks.length ?? 0), detail: policyChecks.length ? policyChecks[0] : "allowed or blocked" },
    { label: "Replay Proof", value: String(evidence.replayProof?.stepCount ?? replaySteps.length ?? blackBox?.eventCount ?? 0), detail: replayStepPreview },
  ];

  return (
    <section className="rounded-[20px] border border-black/5 bg-[#E2E4E9] p-1.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">Agent Black Box</h3>
          <p className="mt-0.5 text-[12px] font-medium text-slate-500">
            Central proof for what the agent did, what it inherited, what it accessed, and what learning it created.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenBlackBox}
            disabled={!blackBox || Boolean(busyAction)}
            className="rounded-[9px] border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open raw proof
          </button>
          <button
            type="button"
            onClick={onRecordEvidence}
            disabled={!blackBox || Boolean(busyAction)}
            className="rounded-[9px] border border-slate-900 bg-slate-900 px-3 py-2 text-[11px] font-black text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === "record-black-box" ? "Recording..." : "Record evidence"}
          </button>
        </div>
      </div>
      <div className="rounded-[16px] border border-black/[0.04] bg-white p-5 shadow-sm">
        {loading ? <div className="h-56 animate-pulse rounded-[14px] bg-slate-100" /> : null}
        {!loading && !blackBox ? (
          <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <ShieldCheck className="mx-auto mb-3 size-8 text-slate-300" />
            <div className="text-[14px] font-bold text-slate-900">Select a run to see black-box proof</div>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">The proof panel will show memory, skills, policy, outcome, replay, and learning artifacts.</p>
          </div>
        ) : null}
        {!loading && blackBox ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-[14px] border border-slate-100 bg-slate-50 p-4">
              <div>
                <div className="flex items-center gap-2 text-[13px] font-black text-slate-950">
                  <Database className="size-4 text-amber-500" />
                  {summary?.pillar ?? "Agent Black Box"} proof spine
                </div>
                <p className="mt-1 max-w-3xl text-[12px] font-semibold text-slate-500">
                  {summary?.promise ?? "What did the agent do, why was it allowed, what memory did it inherit, and what proof exists?"}
                </p>
                <p className="mt-2 max-w-3xl text-[11px] font-bold text-amber-700">
                  {summary?.proofLoop ?? blackBox.proofLoop}
                </p>
              </div>
              <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black", summary?.outcomeCaptured ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700")}>
                {summary?.outcomeCaptured ? "Outcome captured" : "Outcome required"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {proofTiles.map((tile) => (
                <div key={tile.label} className="rounded-[14px] border border-slate-100 bg-white p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{tile.label}</div>
                  <div className="mt-2 text-[28px] font-black leading-none text-slate-950">{tile.value}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500">{tile.detail}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <EvidenceListCard title="Memory Trail" count={memoryUsed.length} items={memoryUsed} emptyLabel="No memory evidence recorded" />
              <EvidenceListCard title="File Trail" count={filesTouched.length} items={filesTouched} emptyLabel="No file touch evidence recorded" />
              <EvidenceListCard title="Tool Trail" count={toolsCalled.length} items={toolsCalled} emptyLabel="No tool-call evidence recorded" />
              <EvidenceListCard title="Policy Trail" count={policyChecks.length} items={policyChecks} emptyLabel="No policy checks recorded" />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <EvidenceListCard title="Outcome Link" count={outcomeLinks.length} items={outcomeLinks} emptyLabel="No outcome linked yet" accent="emerald" />
              <EvidenceListCard title="Future Instruction Link" count={futureInstructionLinks.length} items={futureInstructionLinks} emptyLabel="No future instruction linked yet" accent="blue" />
              <EvidenceListCard title="Mistake Immunity Link" count={mistakeImmunityLinks.length} items={mistakeImmunityLinks} emptyLabel="No mistake immunity linked yet" accent="amber" />
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
              <div className="grid gap-2 sm:grid-cols-2">
                {trustChecks.map((check) => (
                  <div key={check.label} className="rounded-[12px] border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-900">
                      {check.ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" />}
                      {check.label}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{check.detail}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-[14px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[12px] font-black text-slate-900">Learning artifacts</div>
                <div className="mt-3 space-y-2">
                  <ProofArtifact label="Outcome" ready={summary?.outcomeCaptured === true} />
                  <ProofArtifact label="Future Instruction" ready={summary?.futureInstructionCreated === true} />
                  <ProofArtifact label="Mistake Immunity" ready={summary?.mistakeImmunityCreated === true} />
                  <ProofArtifact label="Skill Candidate" ready={(evidence.skillsCreated?.length ?? 0) > 0} />
                </div>
                <button
                  type="button"
                  onClick={onReplay}
                  disabled={Boolean(busyAction) || !summary?.replayReady}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white py-2.5 text-[12px] font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw className="size-4" />
                  Replay proof
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EvidenceListCard({
  title,
  count,
  items,
  emptyLabel,
  accent = "slate",
}: {
  title: string;
  count: number;
  items: string[];
  emptyLabel: string;
  accent?: "slate" | "emerald" | "blue" | "amber";
}) {
  const accentClasses = {
    slate: "border-slate-100 bg-slate-50 text-slate-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  }[accent];
  return (
    <div className={cn("rounded-[14px] border p-4", accentClasses)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.16em]">{title}</div>
        <span className="rounded-full border border-white bg-white px-2 py-0.5 text-[10px] font-black">{count}</span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, 4).map((item) => (
            <div key={item} className="rounded-[10px] border border-white bg-white px-3 py-2 text-[11px] font-semibold text-slate-700">
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-[10px] border border-dashed border-white/80 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function ProofArtifact({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-white bg-white px-3 py-2">
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
        {ready ? "Ready" : "Pending"}
      </span>
    </div>
  );
}

function RunInspector({
  run,
  loading,
  busyAction,
  summaryText,
  futureLesson,
  onSummaryChange,
  onFutureLessonChange,
  onSaveOutcome,
  onComplete,
  onFail,
  onCancel,
  onBlackBox,
  onPackage,
  onProof,
  onReplay,
  onRecordBlackBox,
  onFutureInstruction,
  onMistakeRule,
  onSkillCandidate,
  onOpenFutureInstructions,
}: {
  run: MasterplanAgentRunDetail | null;
  loading: boolean;
  busyAction: string | null;
  summaryText: string;
  futureLesson: string;
  onSummaryChange: (value: string) => void;
  onFutureLessonChange: (value: string) => void;
  onSaveOutcome: () => void;
  onComplete: () => void;
  onFail: () => void;
  onCancel: () => void;
  onBlackBox: () => void;
  onPackage: () => void;
  onProof: () => void;
  onReplay: () => void;
  onRecordBlackBox: () => void;
  onFutureInstruction: () => void;
  onMistakeRule: () => void;
  onSkillCandidate: () => void;
  onOpenFutureInstructions?: () => void;
}) {
  const contract = runContract(run);
  const contractId = contractIdForRun(run);
  const outcomeSaved = Boolean(run?.outcomeId);
  const completionBlocked = !outcomeSaved;
  return (
    <aside className="rounded-[20px] border border-black/10 bg-[#E2E4E9] p-1.5 shadow-xl xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-[14px] font-bold text-slate-700">Run Summary & Outcome</h3>
        <span className="rounded bg-white px-2 py-1 text-[11px] font-bold text-slate-500">Flight recorder</span>
      </div>
      <div className="rounded-[16px] border border-black/[0.04] bg-white p-5 shadow-sm">
        {loading ? <div className="h-96 animate-pulse rounded-[14px] bg-slate-100" /> : null}
        {!loading && run ? (
          <div className="space-y-4">
            <InspectorRow label="Agent" value={run.targetAgent} icon={<AgentBrandIcon agent={run.targetAgent} className="size-4" />} />
            <InspectorRow label="Task" value={run.inheritancePackage?.task ?? "Direct agent run"} />
            <InspectorRow label="Contract" value={contractId || "Not linked"} />
            <InspectorRow label="Package" value={run.packageId ?? "none"} />
            <InspectorRow label="Status" value={run.status} />
            <InspectorRow label="Outcome" value={run.outcomeId ? "Saved" : "Needed"} />
            <div className="rounded-[12px] border border-amber-100 bg-amber-50/60 p-3">
              <div className="flex items-center gap-2 text-[12px] font-black text-amber-900">
                <ShieldCheck className="size-4" />
                Inheritance Contract
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <ContractStat label="Risk" value={String(contract.riskLevel ?? "low")} />
                <ContractStat label="Readiness" value={`${String(contract.readinessScore ?? 0)}%`} />
                <ContractStat label="Memory" value={`${Array.isArray(contract.memory) ? contract.memory.length : 0}`} />
                <ContractStat label="Status" value={String(contract.status ?? "prepared")} />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-slate-500">
                Run ID
                <Copy className="size-3.5 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => void navigator.clipboard?.writeText(run.id)} />
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-[11px] font-medium text-slate-600">{run.id}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <ActionButton icon={Boxes} label="View Package" onClick={onPackage} disabled={!run.packageId || Boolean(busyAction)} />
              <ActionButton icon={ShieldCheck} label="View Proof" onClick={onProof} disabled={Boolean(busyAction)} />
              <ActionButton icon={Database} label="Black Box" onClick={onBlackBox} disabled={Boolean(busyAction)} />
              <ActionButton icon={RefreshCcw} label="Replay Run" onClick={onReplay} disabled={Boolean(busyAction)} />
            </div>

            {completionBlocked ? (
              <div className="rounded-[12px] border border-amber-200 bg-amber-50/80 px-3 py-3 text-[12px] font-semibold text-amber-800">
                Outcome Required: save outcome learning before completing this run. Completion stays blocked until the run has outcome proof.
              </div>
            ) : null}

            <button
              onClick={onRecordBlackBox}
              disabled={Boolean(busyAction)}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-slate-900 py-2.5 text-[12px] font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="size-4 text-emerald-300" />
              {busyAction === "record-black-box" ? "Recording evidence..." : "Record Black Box + Compliance Evidence"}
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onComplete}
                disabled={Boolean(busyAction) || completionBlocked}
                className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-2 py-2 text-[11px] font-black text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {completionBlocked ? "Outcome Required" : "Complete"}
              </button>
              <button onClick={onFail} disabled={Boolean(busyAction)} className="rounded-[10px] border border-red-200 bg-red-50 px-2 py-2 text-[11px] font-black text-red-700 disabled:opacity-50">Fail</button>
              <button onClick={onCancel} disabled={Boolean(busyAction)} className="rounded-[10px] border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-black text-slate-700 disabled:opacity-50">Cancel</button>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <textarea value={summaryText} onChange={(event) => onSummaryChange(event.target.value)} className="min-h-[70px] w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] outline-none focus:border-amber-400" />
              <textarea value={futureLesson} onChange={(event) => onFutureLessonChange(event.target.value)} className="min-h-[90px] w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] outline-none focus:border-amber-400" />
              <button
                onClick={onSaveOutcome}
                disabled={Boolean(busyAction) || outcomeSaved}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-slate-900 py-3 text-[13px] font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" /> {outcomeSaved ? "Outcome Saved" : "Save Outcome Learning"}
              </button>
              <div className="grid gap-2">
                <button onClick={onFutureInstruction} disabled={Boolean(busyAction)} className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-blue-200 bg-blue-50 py-2.5 text-[12px] font-black text-blue-700 disabled:opacity-50">
                  Create Future Instruction <ChevronRight className="size-3.5" />
                </button>
                <button onClick={onMistakeRule} disabled={Boolean(busyAction)} className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 py-2.5 text-[12px] font-black text-amber-700 disabled:opacity-50">
                  Create Mistake Immunity <ChevronRight className="size-3.5" />
                </button>
                <button onClick={onSkillCandidate} disabled={Boolean(busyAction)} className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 py-2.5 text-[12px] font-black text-emerald-700 disabled:opacity-50">
                  Create Skill Candidate <ChevronRight className="size-3.5" />
                </button>
              </div>
              {outcomeSaved ? (
                <button onClick={onOpenFutureInstructions} className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-emerald-200 bg-white py-2.5 text-[12px] font-black text-emerald-700">
                  Open Future Instructions <ChevronRight className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {!loading && !run ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-3 size-8 text-slate-300" />
            <div className="text-[14px] font-bold text-slate-900">No run selected</div>
            <p className="mt-1 text-[12px] text-slate-500">Select a run to inspect timeline proof and save outcome learning.</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-2 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function InspectorRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] font-medium text-slate-500">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 truncate text-right text-[13px] font-bold text-slate-900">
        {icon}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}

function ContractStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-amber-100 bg-white px-2 py-1.5">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-500">{label}</div>
      <div className="mt-0.5 truncate font-mono text-[11px] font-bold text-slate-800">{value}</div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[12px] font-black text-slate-700">
        <FileJson className="size-4 text-amber-500" />
        {title}
      </div>
      <pre className="max-h-[420px] overflow-auto rounded-[12px] border border-slate-200 bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-100">
        {safeJson(value)}
      </pre>
    </div>
  );
}

function EmptyText({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="text-[14px] font-black text-slate-900">{title}</div>
      <p className="mt-1 text-[12px] font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-[15px] font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-64px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
