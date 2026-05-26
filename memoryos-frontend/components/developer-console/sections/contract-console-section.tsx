"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type ContractConsoleSectionProps = {
  contract: {
    goal: string;
    constraints: string[];
    decisions: string[];
    openRisks: string[];
    nextActions: string[];
  };
};

type ContractValidationResponse = {
  traceId: string;
  governanceMode: "balanced" | "strict" | "enterprise";
  completenessScore: number;
  minimumRequiredFields: number;
  presentFields: string[];
  missingFields: string[];
  pass: boolean;
  readyToWrite: boolean;
  suggestions: string[];
  qualityScore: number;
  qualityGrade: "A" | "B" | "C" | "D";
  qualityReasons: string[];
};

function cleanContractText(input: string): string {
  if (!input) return "";
  return input
    .replace(/,\s*"expectedType"\s*:\s*"[^"]*"/g, "")
    .replace(/,\s*"input"\s*:\s*\{[^}]*\}/g, "")
    .replace(/,\s*"expected"\s*:\s*\{[^}]*\}/g, "")
    .replace(/"text"\s*:\s*/g, "")
    .replace(/[\[\]\{\}"]/g, "")
    .replace(/\s*,\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function compactList(items: string[]): string {
  if (items.length === 0) return "None";
  const cleaned = items.map((item) => cleanContractText(item)).filter(Boolean);
  const joined = cleaned.join(" · ");
  return joined.length > 360 ? `${joined.slice(0, 360).trimEnd()} ...` : joined;
}

export function ContractConsoleSection({ contract }: ContractConsoleSectionProps) {
  const [validation, setValidation] = useState<ContractValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      contract: {
        goal: contract.goal ?? "",
        constraints: contract.constraints ?? [],
        decisions: contract.decisions ?? [],
        open_risks: contract.openRisks ?? [],
        next_actions: contract.nextActions ?? [],
      },
    }),
    [contract],
  );

  const hasMeaningfulContract = useMemo(() => {
    return (
      (contract.goal ?? "").trim().length > 0 ||
      contract.constraints.length > 0 ||
      contract.decisions.length > 0 ||
      contract.openRisks.length > 0 ||
      contract.nextActions.length > 0
    );
  }, [contract]);

  const dedupedSuggestions = useMemo(
    () => Array.from(new Set(validation?.suggestions ?? [])),
    [validation?.suggestions],
  );

  const dedupedReasons = useMemo(
    () => Array.from(new Set(validation?.qualityReasons ?? [])),
    [validation?.qualityReasons],
  );

  const contractRows = useMemo(
    () => [
      { key: "goal", label: "Goal", value: cleanContractText(contract.goal), required: true },
      { key: "constraints", label: "Constraints", value: compactList(contract.constraints), required: false },
      { key: "decisions", label: "Decisions", value: compactList(contract.decisions), required: false },
      { key: "open_risks", label: "Open Risks", value: compactList(contract.openRisks), required: false },
      { key: "next_actions", label: "Next Actions", value: compactList(contract.nextActions), required: false },
    ],
    [contract],
  );

  const presentCount = validation?.presentFields.length ?? contractRows.filter((row) => row.value && row.value !== "None").length;
  const missingCount = validation?.missingFields.length ?? contractRows.filter((row) => row.required && !row.value).length;
  const readinessLabel = validation
    ? validation.readyToWrite
      ? "Ready to write"
      : "Needs fields"
    : hasMeaningfulContract
      ? "Awaiting validation"
      : "No contract";
  const qualityLabel = validation ? `${validation.qualityGrade} / ${validation.qualityScore}` : "Not scored";

  const runValidation = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      if (!hasMeaningfulContract) {
        setValidation(null);
        setLastValidatedAt(null);
        return;
      }
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/memory/contract/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as
        | (ContractValidationResponse & { error?: string; traceId?: string })
        | null;

      if (!response.ok || !result) {
        setValidation(null);
        return;
      }

      setValidation(result);
      setLastValidatedAt(new Date().toISOString());
    } catch (error) {
      setValidation(null);
    } finally {
      setLoading(false);
    }
  }, [hasMeaningfulContract, payload]);

  useEffect(() => {
    void runValidation();
  }, [runValidation]);

  return (
    <section className="space-y-6">
      <div className="border border-border bg-muted/30">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Contract Console</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground">
              Verify memory contracts before agents write shared context.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Contract Console checks whether an agent has enough goal, decisions, risks, constraints, and next-action
              context to safely store memory for future sessions.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <StatusTile label="Validation" value={loading ? "Checking" : readinessLabel} tone={validation?.readyToWrite ? "good" : "neutral"} />
            <StatusTile label="Trace" value={validation?.traceId ?? "Not created"} detail={lastValidatedAt ? new Date(lastValidatedAt).toLocaleString() : "Validate to create trace"} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Completeness" value={validation ? `${validation.completenessScore}%` : "0%"} detail={`${presentCount} fields present`} />
        <Metric label="Quality" value={qualityLabel} detail="backend contract score" />
        <Metric label="Required Fields" value={`${validation?.minimumRequiredFields ?? 1}`} detail={`missing ${missingCount}`} />
        <Metric label="Governance Mode" value={validation?.governanceMode ?? "balanced"} detail="validation threshold" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="border border-border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contract Fields</p>
              <p className="mt-1 text-sm text-muted-foreground">Current operating context that will become reusable memory.</p>
            </div>
            <button
              type="button"
              onClick={() => void runValidation()}
              disabled={loading || !hasMeaningfulContract}
              className="border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? "Validating..." : "Validate"}
            </button>
          </div>
          <div className="divide-y divide-border">
            {contractRows.map((row) => {
              const isMissing = !row.value || row.value === "None";
              return (
                <div key={row.key} className="grid gap-3 px-4 py-4 md:grid-cols-[180px_1fr_120px] md:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{row.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{row.required ? "Required" : "Recommended"}</p>
                  </div>
                  <p className={`text-sm leading-6 ${isMissing ? "text-muted-foreground" : "text-foreground"}`}>
                    {isMissing ? "Not captured yet" : row.value}
                  </p>
                  <span className={`w-fit border px-2 py-1 text-xs font-semibold uppercase tracking-widest md:ml-auto ${isMissing ? "border-border bg-muted text-muted-foreground" : "border-primary/30 bg-primary/10 text-primary"}`}>
                    {isMissing ? "Missing" : "Present"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Validation Gate</p>
            <p className="mt-1 text-sm text-muted-foreground">Backend verdict from `/api/memory/contract/validate`.</p>
          </div>
          {validation ? (
            <div className="divide-y divide-border">
              <SummaryRow label="Ready to write" value={validation.readyToWrite ? "Yes" : "No"} />
              <SummaryRow label="Pass" value={validation.pass ? "Yes" : "No"} />
              <SummaryRow label="Present fields" value={validation.presentFields.join(", ") || "None"} />
              <SummaryRow label="Missing fields" value={validation.missingFields.join(", ") || "None"} />
            </div>
          ) : (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {hasMeaningfulContract ? "Validation has not returned yet." : "No contract fields are available yet."}
            </div>
          )}
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Suggestions</p>
            <div className="mt-3 space-y-2">
              {dedupedSuggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suggestions yet.</p>
              ) : (
                dedupedSuggestions.map((item) => (
                  <p key={item} className="border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">{item}</p>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Quality Evidence</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Why the validator gave this score, so engineering teams can improve the handoff before storing memory.
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {dedupedReasons.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">No quality reasons yet.</p>
          ) : (
            dedupedReasons.map((item) => (
              <p key={item} className="border-b border-border px-4 py-4 text-sm text-muted-foreground md:border-r">
                {item}
              </p>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-border bg-card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function StatusTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "good" | "neutral";
}) {
  return (
    <div className="border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className={`h-2 w-2 rounded-full ${tone === "good" ? "bg-primary" : "bg-muted-foreground"}`} />
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 px-4 py-3 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
