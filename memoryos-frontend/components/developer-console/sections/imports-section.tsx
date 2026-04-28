"use client";

import { useMemo, useState } from "react";

type SourceConnector = {
  id: string;
  name: string;
  type: string;
  status: "connected" | "pending" | "error";
  lastSync: string;
  records: number;
  mode: "batch" | "continuous";
};

type ImportRun = {
  id: string;
  sourceId: string;
  source: string;
  status: "success" | "pending" | "error";
  imported: number;
  rejected: number;
  durationMs: number;
  startedAt: string;
};

type MappingRow = {
  sourceField: string;
  memoryField: string;
  confidence: number;
};

const SOURCE_CONNECTORS: SourceConnector[] = [
  { id: "github", name: "GitHub", type: "Code + issues", status: "connected", lastSync: "2m ago", records: 1287, mode: "continuous" },
  { id: "notion", name: "Notion", type: "Docs + notes", status: "connected", lastSync: "8m ago", records: 642, mode: "batch" },
  { id: "slack", name: "Slack", type: "Threads + decisions", status: "pending", lastSync: "Waiting", records: 0, mode: "continuous" },
  { id: "local", name: "Local files", type: "Markdown + JSONL", status: "connected", lastSync: "Just now", records: 96, mode: "batch" },
];

const PIPELINE_STAGES = [
  { name: "Ingest", state: "healthy" },
  { name: "Parse", state: "healthy" },
  { name: "Normalize", state: "healthy" },
  { name: "Deduplicate", state: "watch" },
  { name: "Index", state: "healthy" },
] as const;

const IMPORT_RUNS: ImportRun[] = [
  { id: "run-1", sourceId: "github", source: "GitHub", status: "success", imported: 142, rejected: 3, durationMs: 1820, startedAt: "2m ago" },
  { id: "run-2", sourceId: "notion", source: "Notion", status: "success", imported: 86, rejected: 1, durationMs: 1240, startedAt: "9m ago" },
  { id: "run-3", sourceId: "local", source: "Local files", status: "pending", imported: 0, rejected: 0, durationMs: 0, startedAt: "Running..." },
  { id: "run-4", sourceId: "slack", source: "Slack", status: "error", imported: 0, rejected: 12, durationMs: 600, startedAt: "25m ago" },
];

const MAPPING_ROWS: MappingRow[] = [
  { sourceField: "repo.name", memoryField: "project.name", confidence: 94 },
  { sourceField: "issue.title", memoryField: "open_loop.summary", confidence: 89 },
  { sourceField: "pr.body", memoryField: "decision.context", confidence: 81 },
  { sourceField: "doc.section", memoryField: "knowledge.chunk", confidence: 86 },
  { sourceField: "comment.thread", memoryField: "handoff.detail", confidence: 77 },
];

const PREVIEW_ROWS = [
  { source: "github/issue-183", type: "open_loop", mapped: "Need route tests for handoff endpoint", score: 0.92 },
  { source: "notion/decision-log", type: "decision", mapped: "Use API + MCP as initial integration surface", score: 0.88 },
  { source: "repo/changelog.md", type: "project", mapped: "Continuity graph UI shipped for projects", score: 0.85 },
];

function toneForStatus(status: SourceConnector["status"] | ImportRun["status"] | string) {
  if (status === "connected" || status === "success" || status === "healthy") return "#14c38e";
  if (status === "pending" || status === "watch") return "#f0b429";
  return "#ff6d6d";
}

export function ImportsSection() {
  const [activeSourceId, setActiveSourceId] = useState<string>(SOURCE_CONNECTORS[0]?.id ?? "github");
  const [importMode, setImportMode] = useState<"batch" | "continuous">("continuous");
  const [format, setFormat] = useState<"jsonl" | "markdown" | "api-push">("jsonl");

  const activeSource = useMemo(
    () => SOURCE_CONNECTORS.find((source) => source.id === activeSourceId) ?? SOURCE_CONNECTORS[0],
    [activeSourceId],
  );

  const visibleRuns = useMemo(
    () => IMPORT_RUNS.filter((run) => run.sourceId === activeSource?.id || run.status === "pending"),
    [activeSource?.id],
  );

  const totalImported = IMPORT_RUNS.reduce((sum, run) => sum + run.imported, 0);
  const totalRejected = IMPORT_RUNS.reduce((sum, run) => sum + run.rejected, 0);
  const healthyStages = PIPELINE_STAGES.filter((stage) => stage.state === "healthy").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Imports</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Ingest project context into MemoryOS with auditable import runs and field mapping quality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff]"
          >
            NEW IMPORT JOB
          </button>
          <button
            type="button"
            className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
          >
            OPEN CONNECTORS
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Imported records</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{totalImported}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#ff6d6d", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Rejected records</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{totalRejected}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#14c38e", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Pipeline stages healthy</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">
            {healthyStages} / {PIPELINE_STAGES.length}
          </p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#9b7bff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Active source</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{activeSource?.name ?? "-"}</p>
        </div>
      </div>

      <div className="mt-2.5 rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="5.5" cy="3" rx="4" ry="1.5" /><path d="M1.5 3v2c0 .83 1.79 1.5 4 1.5S9.5 5.83 9.5 5V3" /><path d="M1.5 5v2c0 .83 1.79 1.5 4 1.5S9.5 7.83 9.5 7V5" />
          </svg>
          Source Connectors
        </p>
        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {SOURCE_CONNECTORS.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => {
                setActiveSourceId(source.id);
                setImportMode(source.mode);
              }}
              className={`rounded-[10px] border px-3.5 py-3 text-left transition ${
                activeSourceId === source.id
                  ? "border-[#4f93ff]/45 bg-[#4f93ff]/8"
                  : "border-white/10 bg-[#111111] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold tracking-[-0.02em]">{source.name}</p>
                <span
                  className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                  style={{
                    borderColor: `${toneForStatus(source.status)}55`,
                    color: toneForStatus(source.status),
                    background: `${toneForStatus(source.status)}12`,
                  }}
                >
                  {source.status}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-white/52">{source.type}</p>
              <p className="mt-1 text-[11px] text-white/40">
                {source.records} records · {source.lastSync}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="2,1.5 9.5,5.5 2,9.5" />
              </svg>
              Import Runs
            </p>
            <div className="flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#111111]">
              {(["batch", "continuous"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setImportMode(mode)}
                  className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                    importMode === mode ? "bg-[#1f1f1f] text-white" : "text-white/46 hover:text-white/76"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
         
          <div className="mt-2.5 overflow-x-auto rounded-[10px] border border-white/10 bg-[#111111]">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-white/34">
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Imported</th>
                  <th className="px-3 py-2.5">Rejected</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {visibleRuns.map((run) => (
                  <tr key={run.id} className="text-[12px]">
                    <td className="px-3 py-2.5 text-white/82">{run.source}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${toneForStatus(run.status)}55`,
                          color: toneForStatus(run.status),
                          background: `${toneForStatus(run.status)}14`,
                        }}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-white/62">{run.imported}</td>
                    <td className="px-3 py-2.5 text-white/62">{run.rejected}</td>
                    <td className="px-3 py-2.5 text-white/62">{run.durationMs > 0 ? `${run.durationMs}ms` : "-"}</td>
                    <td className="px-3 py-2.5 text-white/62">{run.startedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 5.5h2.5M4 3.5l2 2-2 2M7 5.5h2.5" />
              </svg>
              Ingestion Pipeline
            </p>
            <div className="mt-2.5 space-y-2">
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage.name} className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <p className="text-[12px] text-white/74">{stage.name}</p>
                  <span
                    className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                    style={{
                      borderColor: `${toneForStatus(stage.state)}55`,
                      color: toneForStatus(stage.state),
                      background: `${toneForStatus(stage.state)}14`,
                    }}
                  >
                    {stage.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 3L1 5.5l2.5 2.5M7.5 3L10 5.5 7.5 8" />
              </svg>
              Payload Format
            </p>
            <div className="mt-2.5 flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#111111]">
              {([
                ["jsonl", "JSONL"],
                ["markdown", "Markdown"],
                ["api-push", "API Push"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                    format === value ? "bg-[#1f1f1f] text-white" : "text-white/46 hover:text-white/76"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <pre className="mt-3 overflow-x-auto rounded-[8px] border border-white/10 bg-[#0f0f0f] p-3 text-[11px] leading-6 text-white/72">
              <code>{`{
  "workspace": "acm",
  "project": "continuity-workspace",
  "thread": "onboarding-thread-01",
  "items": [{ "type": "decision", "text": "..." }]
}`}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-2">
        <div className="rounded-[10px] border border-white/10 bg-[#151515] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3.5h2.5M6 3.5h3M4.5 3.5L6 5.5l-1.5 2M2 7.5h2.5M6 7.5h3" />
            </svg>
            Field Mapping Quality
          </p>
          <div className="mt-2.5 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-white/34">
                  <th className="px-2.5 py-2">Source field</th>
                  <th className="px-2.5 py-2">Memory field</th>
                  <th className="px-2.5 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {MAPPING_ROWS.map((row) => (
                  <tr key={`${row.sourceField}-${row.memoryField}`} className="text-[12px]">
                    <td className="px-2.5 py-2.5 text-white/74">{row.sourceField}</td>
                    <td className="px-2.5 py-2.5 font-semibold text-white/82">{row.memoryField}</td>
                    <td className="px-2.5 py-2.5 text-white/62">{row.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[10px] border border-white/10 bg-[#151515] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 5.5S2.5 2 5.5 2 10 5.5 10 5.5 8.5 9 5.5 9 1 5.5 1 5.5z" /><circle cx="5.5" cy="5.5" r="1.5" />
            </svg>
            Import Preview
          </p>
          <div className="mt-2.5 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-white/34">
                  <th className="px-2.5 py-2">Source</th>
                  <th className="px-2.5 py-2">Type</th>
                  <th className="px-2.5 py-2">Mapped output</th>
                  <th className="px-2.5 py-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {PREVIEW_ROWS.map((row) => (
                  <tr key={row.source} className="text-[12px] text-white/76">
                    <td className="px-2.5 py-2.5">{row.source}</td>
                    <td className="px-2.5 py-2.5">
                      <span className="rounded-[6px] border border-white/10 bg-[#101010] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white/56">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5">{row.mapped}</td>
                    <td className="px-2.5 py-2.5">{row.score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
