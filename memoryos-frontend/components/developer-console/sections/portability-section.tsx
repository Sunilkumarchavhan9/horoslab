"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type PortabilitySectionProps = {
  workspaceName: string;
};

export function PortabilitySection({ workspaceName }: PortabilitySectionProps) {
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

  async function loadLivePortabilityStatus(): Promise<void> {
    try {
      const response = await authenticatedFetch("/api/memory/requests?limit=120&range=all");
      const payload = await response.json();
      if (!response.ok) {
        return;
      }
      const list: Array<{
        id?: string;
        createdAt?: string;
        traceId?: string;
        path?: string;
        route?: string;
        method?: string;
      }> = Array.isArray(payload?.requests)
        ? payload.requests
        : Array.isArray(payload?.data?.requests)
          ? payload.data.requests
          : [];

      const events = list.filter((item) => {
        const route = (item.path ?? item.route ?? "").toLowerCase();
        return route.includes("/api/memory/portability/");
      });

      if (events.length === 0) {
        setLiveConnected(false);
        return;
      }

      const newest = events
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        )[0];

      setLiveConnected(true);
      if (typeof newest?.traceId === "string" && newest.traceId.trim().length > 0) {
        setLastTraceId(newest.traceId);
      }
      if (typeof newest?.createdAt === "string" && newest.createdAt.trim().length > 0) {
        setLastUpdated(newest.createdAt);
      }
      setStatusMessage("Connected to live portability backend");
    } catch {
      // Keep UI stable if backend is temporarily unreachable.
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      if (cancelled) return;
      await loadLivePortabilityStatus();
    }

    void run();
    const timer = window.setInterval(() => {
      void run();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

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
    <section>
      <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Portability</h1>
      {statusMessage ? <p className="mt-2 text-[11px] text-muted-foreground">{statusMessage}</p> : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Export</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Generate portability artifacts for {workspaceName}.</p>
          <div className="mt-3 space-y-2">
            <label className="block text-[11px] text-muted-foreground">Project</label>
            <input
              value={project}
              onChange={(event) => setProject(event.target.value)}
              className="h-9 w-full rounded-[8px] border border-border bg-muted px-3 text-[12px] text-muted-foreground5"
            />
            <button
              type="button"
              onClick={() => void runExport()}
              disabled={isBusy}
              className="rounded-[8px] border border-border px-3 py-2 text-[11px] text-foreground disabled:opacity-50"
            >
              {isBusy ? "Working..." : "Export AGENTS.md + Snapshot"}
            </button>
          </div>
        </div>
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Import</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Validate and ingest external continuity snapshots.</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="dry-run"
              type="checkbox"
              checked={importDryRun}
              onChange={(event) => setImportDryRun(event.target.checked)}
            />
            <label htmlFor="dry-run" className="text-[12px] text-muted-foreground">
              Dry run validation only
            </label>
          </div>
          <button
            type="button"
            onClick={() => void runImport()}
            disabled={isBusy || snapshotText.trim().length === 0}
            className="mt-3 rounded-[8px] border border-border px-3 py-2 text-[11px] text-foreground disabled:opacity-50"
          >
            {isBusy ? "Working..." : importDryRun ? "Validate Snapshot" : "Import Snapshot"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">AGENTS.md</p>
            <button
              type="button"
              onClick={() => void copyText(agentsMd)}
              disabled={!agentsMd}
              className="rounded-[6px] border border-border px-2 py-1 text-[10px] text-foreground disabled:opacity-40"
            >
              Copy
            </button>
          </div>
          <textarea
            value={agentsMd}
            onChange={(event) => setAgentsMd(event.target.value)}
            className="mt-2 h-64 w-full rounded-[8px] border border-border bg-muted p-3 font-mono text-[11px] text-foreground"
            placeholder="Export to view AGENTS.md content..."
          />
        </div>
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Snapshot JSON</p>
            <button
              type="button"
              onClick={() => void copyText(snapshotText)}
              disabled={!snapshotText}
              className="rounded-[6px] border border-border px-2 py-1 text-[10px] text-foreground disabled:opacity-40"
            >
              Copy
            </button>
          </div>
          <textarea
            value={snapshotText}
            onChange={(event) => setSnapshotText(event.target.value)}
            className="mt-2 h-64 w-full rounded-[8px] border border-border bg-muted p-3 font-mono text-[11px] text-foreground"
            placeholder='Paste external snapshot JSON here (schema: "memoryos.snapshot.v1")'
          />
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Validation Result</p>
        {importResult?.validation ? (
          <div className="mt-2 space-y-2 text-[12px]">
            <p className={importResult.validation.valid ? "text-chart-2" : "text-destructive"}>
              valid={String(importResult.validation.valid)}
            </p>
            <p className="text-muted-foreground">
              candidates={importResult.validation.stats?.importedCandidateCount ?? 0} contractFields={importResult.validation.stats?.contractFieldCount ?? 0}
            </p>
            {(importResult.validation.errors ?? []).map((error) => (
              <p key={error} className="rounded-[6px] border border-destructive/30 bg-destructive/10 px-2 py-1 text-destructive">
                {error}
              </p>
            ))}
            {(compatibilityNotes ?? []).map((warning) => (
              <p key={warning} className="rounded-[6px] border border-chart-5/30 bg-chart-5/15 px-2 py-1 text-chart-5">
                {warning}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-muted-foreground">Run export or import validation to see compatibility and schema checks.</p>
        )}
      </div>
    </section>
  );
}
