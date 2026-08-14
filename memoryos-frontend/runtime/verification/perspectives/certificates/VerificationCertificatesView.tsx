"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, ChevronDown, Download, FileText, Filter, Hash, RefreshCw, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listEpochCertificates, readActiveEpochWorkspaceId, type EpochCertificate } from "@/lib/epoch-api";

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function evidenceCount(certificate: EpochCertificate): number {
  if (!certificate.evidenceSummary || typeof certificate.evidenceSummary !== "object") return 0;
  const summary = certificate.evidenceSummary as Record<string, unknown>;
  const value = summary.evidenceCount ?? summary.count ?? summary.items;
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return value.length;
  return Object.keys(summary).length;
}

export function VerificationCertificatesView() {
  const [certificates, setCertificates] = useState<EpochCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const workspaceId = readActiveEpochWorkspaceId();

  const loadCertificates = useCallback(async () => {
    if (!workspaceId) {
      setCertificates([]);
      setLoading(false);
      setError("No active Epoch workspace is available.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await listEpochCertificates(workspaceId, { limit: 50 });
      setCertificates(payload.certificates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const filtered = useMemo(
    () =>
      certificates.filter((certificate) =>
        `${certificate.id} ${certificate.status} ${certificate.summary} ${JSON.stringify(certificate.evidenceSummary ?? {})}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [certificates, query],
  );

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto">
      <div className="flex flex-col px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Institutional Certificates</h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              Immutable proof records emitted by the live backend.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadCertificates()}
            className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-8 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center flex-1 bg-muted/30 border border-border rounded-sm focus-within:border-foreground/30 transition-colors">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-card/50">
            All <ChevronDown className="size-3" />
          </button>
          <div className="relative flex-1 flex items-center">
            <Search className="size-3.5 text-muted-foreground ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search certificates by id, status, or summary..."
              className="w-full bg-transparent border-none pl-2 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/70"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
            <Filter className="size-3.5" /> Status <ChevronDown className="size-3" />
          </button>
        </div>
      </div>

      <div className="p-8 bg-[#fafafa] dark:bg-[#0a0a0a] min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live certificates...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground">No certificates were found in this workspace.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {filtered.map((cert) => {
              const status = (cert.status ?? "unknown").toLowerCase();

              return (
                <div key={cert.id} className="flex flex-col bg-card border border-border shadow-sm rounded-md overflow-hidden hover:shadow-md transition-shadow relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

                  <div className="flex items-start justify-between p-6 border-b border-border">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-sm border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Award className="size-6 text-emerald-600 dark:text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-[16px] font-bold text-foreground">{cert.summary ?? "Verified certificate"}</h2>
                        <span className="text-[12px] font-mono text-muted-foreground mt-1">{cert.id}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                          status === "valid" || status === "issued"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500",
                        )}
                      >
                        <CheckCircle2 className="size-3" /> {cert.status ?? "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-6 gap-x-8 gap-y-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="size-3" /> Summary
                      </span>
                      <span className="text-[13px] font-medium text-foreground">{cert.summary ?? "No certificate summary recorded."}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Hash className="size-3" /> Evidence Count
                      </span>
                      <span className="text-[13px] font-medium text-foreground">{evidenceCount(cert)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Award className="size-3" /> Created
                      </span>
                      <span className="text-[13px] font-medium text-foreground">{formatDate(cert.createdAt)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="size-3" /> Evidence Fields
                      </span>
                      <span className="text-[13px] font-medium text-foreground">
                        {cert.evidenceSummary ? Object.keys(cert.evidenceSummary).length : 0} field(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
                        <FileText className="size-3.5" />
                        <span>Summary: <strong className="text-foreground">{cert.summary ?? "n/a"}</strong></span>
                      </div>
                    </div>

                    <button className="flex items-center gap-1.5 text-[12px] font-bold text-foreground hover:text-blue-500 transition-colors uppercase tracking-wider">
                      <Download className="size-3.5" /> Export
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
