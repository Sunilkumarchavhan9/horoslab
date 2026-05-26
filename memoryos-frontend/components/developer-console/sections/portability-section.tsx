"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type PortabilitySectionProps = {
  workspaceName: string;
  realtimeVersion?: number;
};

export function PortabilitySection({ workspaceName, realtimeVersion = 0 }: PortabilitySectionProps) {
  const [project, setProject] = useState("company-brain");
  const [agentsMd, setAgentsMd] = useState("");
  const [snapshotText, setSnapshotText] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [lastTraceId, setLastTraceId] = useState<string>("-");
  const [isBusy, setIsBusy] = useState(false);
  const [importDryRun, setImportDryRun] = useState(true);
  const [importResult, setImportResult] = useState<null | {
    traceId?: string;
    importedCount?: number;
    validation?: {
      valid: boolean;
      errors: string[];
      warnings: string[];
      stats?: {
        importedCandidateCount?: number;
        contractFieldCount?: number;
        memorySummaryCount?: number;
      };
    };
  }>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  const compatibilityNotes = useMemo(() => {
    if (!importResult?.validation) return [];
    const notes: string[] = [];
    const warnings = importResult.validation.warnings ?? [];
    for (const warning of warnings) {
      if (warning.includes("unexpected schema")) {
        notes.push("Snapshot schema version mismatch detected. Prefer memoryos.snapshot.v1 for full compatibility.");
      } else {
        notes.push(warning);
      }
    }
    return notes;
  }, [importResult]);

  const validation = importResult?.validation ?? null;
  const validationReady = Boolean(validation);
  const validationPassed = Boolean(validation?.valid);
  const exported = agentsMd.trim().length > 0 || snapshotText.trim().length > 0;
  const snapshotSize = snapshotText.trim().length;
  const agentsSize = agentsMd.trim().length;
  const validationStats = validation?.stats;
  const statusTone = statusMessage.toLowerCase().includes("fail") || statusMessage.toLowerCase().includes("invalid")
    ? "text-destructive"
    : statusMessage.toLowerCase().includes("complete") || statusMessage.toLowerCase().includes("connected")
      ? "text-primary"
      : "text-muted-foreground";

  function formatTimestamp(value: string): string {
    if (!value || value === "-") return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }

  async function authenticatedFetch(path: string, init?: RequestInit): Promise<Response> {
    const token = await getOrCreateMemoryToken();
    if (!token) {
      throw new Error("Missing auth token");
    }
    return fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  }

  async function runExport(): Promise<void> {
    setIsBusy(true);
    setStatusMessage("Exporting portability artifacts...");
    try {
      const response = await authenticatedFetch(
        `/api/memory/portability/export?workspace=${encodeURIComponent(workspaceName)}&project=${encodeURIComponent(project)}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Export failed");
      }
      setAgentsMd(typeof payload.agentsMd === "string" ? payload.agentsMd : "");
      setSnapshotText(JSON.stringify(payload.snapshot ?? {}, null, 2));
      setLastTraceId(typeof payload.traceId === "string" ? payload.traceId : "-");
      setLastUpdated(new Date().toISOString());
      setLiveConnected(true);
      setStatusMessage(`Export complete${payload.traceId ? ` (${payload.traceId})` : ""}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function runImport(): Promise<void> {
    setIsBusy(true);
    setStatusMessage(importDryRun ? "Validating snapshot..." : "Importing snapshot...");
    try {
      const snapshot = JSON.parse(snapshotText);
      const response = await authenticatedFetch("/api/memory/portability/import", {
        method: "POST",
        body: JSON.stringify({
          workspace: workspaceName,
          project,
          snapshot,
          dryRun: importDryRun,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setImportResult({
          traceId: payload?.traceId,
          validation: payload?.validation,
        });
        setLastTraceId(typeof payload?.traceId === "string" ? payload.traceId : "-");
        setLastUpdated(new Date().toISOString());
        throw new Error(payload?.error ?? "Import failed");
      }
      setImportResult({
        traceId: payload?.traceId,
        importedCount: payload?.importedCount,
        validation: payload?.validation,
      });
      setLastTraceId(typeof payload?.traceId === "string" ? payload.traceId : "-");
      setLastUpdated(new Date().toISOString());
      setLiveConnected(true);
      setStatusMessage(
        importDryRun
          ? `Validation complete${payload?.traceId ? ` (${payload.traceId})` : ""}`
          : `Import complete${payload?.traceId ? ` (${payload.traceId})` : ""}`,
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        setStatusMessage("Invalid JSON snapshot. Fix JSON syntax before import.");
      } else {
        setStatusMessage(error instanceof Error ? error.message : "Import failed");
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function copyText(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage("Copied to clipboard");
    } catch {
      setStatusMessage("Clipboard copy failed");
    }
  }

  return (
    <section className="space-y-5 text-foreground">
      <div className="border border-border bg-card p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Portability Control</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Move company memory without losing trust</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Export an AGENTS.md handoff plus a machine-readable snapshot, then validate imports before another agent,
              workspace, or team relies on the memory graph.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Backend</p>
              <p className={`mt-2 font-semibold ${liveConnected ? "text-primary" : "text-muted-foreground"}`}>
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${liveConnected ? "bg-primary" : "bg-muted-foreground"}`} />
                {liveConnected ? "Live trace" : "Ready"}
              </p>
            </div>
            <div className="border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trace</p>
              <p className="mt-2 truncate font-mono text-xs font-semibold">{lastTraceId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
        {[
          { label: "Export package", value: exported ? "Prepared" : "Not generated", detail: `${agentsSize.toLocaleString()} md chars` },
          { label: "Snapshot", value: snapshotSize ? `${snapshotSize.toLocaleString()} chars` : "Empty", detail: "memoryos.snapshot.v1" },
          { label: "Validation", value: validationReady ? (validationPassed ? "Passed" : "Blocked") : "Not run", detail: validationReady ? `${validationStats?.importedCandidateCount ?? 0} candidates` : "Dry run recommended" },
          { label: "Updated", value: lastUpdated === "-" ? "-" : "Live", detail: formatTimestamp(lastUpdated) },
        ].map((item) => (
          <div key={item.label} className="bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="mt-3 text-xl font-semibold">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Workflow</p>
            <div className="mt-4 space-y-3">
              {[
                ["1", "Choose project", "Select the memory namespace to package."],
                ["2", "Export handoff", "Generate AGENTS.md and snapshot JSON."],
                ["3", "Validate import", "Dry run before writing memory into a new workspace."],
              ].map(([step, title, detail]) => (
                <div key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div className="grid h-7 w-7 place-items-center border border-border bg-background text-xs font-semibold">{step}</div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Controls</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project</label>
            <input
              value={project}
              onChange={(event) => setProject(event.target.value)}
              className="mt-2 h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring"
            />
            <button
              type="button"
              onClick={() => void runExport()}
              disabled={isBusy}
              className="mt-3 w-full border border-primary bg-primary px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? "Working..." : "Export handoff package"}
            </button>

            <div className="mt-5 border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  id="dry-run"
                  type="checkbox"
                  checked={importDryRun}
                  onChange={(event) => setImportDryRun(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Dry run validation only
              </label>
              <button
                type="button"
                onClick={() => void runImport()}
                disabled={isBusy || snapshotText.trim().length === 0}
                className="mt-3 w-full border border-border bg-background px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBusy ? "Working..." : importDryRun ? "Validate snapshot" : "Import snapshot"}
              </button>
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">System Status</p>
            <p className={`mt-3 text-sm font-semibold ${statusTone}`}>{statusMessage}</p>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <p>Workspace: <span className="font-medium text-foreground">{workspaceName}</span></p>
              <p>Last update: <span className="font-medium text-foreground">{formatTimestamp(lastUpdated)}</span></p>
              <p>Trace ID: <span className="font-mono text-foreground">{lastTraceId}</span></p>
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">AGENTS.md</p>
                  <p className="mt-1 text-xs text-muted-foreground">Human-readable operating context for agents and engineers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(agentsMd)}
                  disabled={!agentsMd}
                  className="border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Copy
                </button>
              </div>
              <textarea
                value={agentsMd}
                onChange={(event) => setAgentsMd(event.target.value)}
                className="h-80 w-full resize-y border-0 bg-background p-4 font-mono text-xs leading-5 text-foreground outline-none"
                placeholder="Export to generate AGENTS.md continuity instructions..."
              />
            </div>

            <div className="border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Snapshot JSON</p>
                  <p className="mt-1 text-xs text-muted-foreground">Machine-readable memory package for import validation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(snapshotText)}
                  disabled={!snapshotText}
                  className="border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Copy
                </button>
              </div>
              <textarea
                value={snapshotText}
                onChange={(event) => setSnapshotText(event.target.value)}
                className="h-80 w-full resize-y border-0 bg-background p-4 font-mono text-xs leading-5 text-foreground outline-none"
                placeholder='Paste or export snapshot JSON here. Expected schema: "memoryos.snapshot.v1"'
              />
            </div>
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Validation Gate</p>
              <p className="mt-1 text-sm text-muted-foreground">Import only after schema, contract fields, and candidate memories pass review.</p>
            </div>
            <div className="p-4">
              {validation ? (
                <div className="space-y-4">
                  <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
                    {[
                      ["Result", validation.valid ? "Pass" : "Block"],
                      ["Candidates", String(validationStats?.importedCandidateCount ?? 0)],
                      ["Contract fields", String(validationStats?.contractFieldCount ?? 0)],
                      ["Summaries", String(validationStats?.memorySummaryCount ?? 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-background p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className={`mt-2 text-lg font-semibold ${label === "Result" ? (validation.valid ? "text-primary" : "text-destructive") : ""}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {(validation.errors ?? []).length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-destructive">Blocking issues</p>
                      {(validation.errors ?? []).map((error) => (
                        <p key={error} className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  {(compatibilityNotes ?? []).length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-chart-4">Compatibility notes</p>
                      {(compatibilityNotes ?? []).map((warning) => (
                        <p key={warning} className="border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-sm text-chart-4">
                          {warning}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid min-h-36 place-items-center text-center">
                  <div>
                    <div className="mx-auto h-2 w-2 bg-primary" />
                    <p className="mt-4 text-sm font-semibold">No validation run yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Export or paste a snapshot, keep dry-run enabled, then validate before importing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
