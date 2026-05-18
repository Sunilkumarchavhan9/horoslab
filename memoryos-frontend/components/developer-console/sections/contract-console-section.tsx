"use client";

import { useEffect, useMemo, useState } from "react";
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2">
      <p className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="max-w-[75%] text-right text-[13px] text-foreground">{value}</p>
    </div>
  );
}

function cleanContractText(input: string): string {
  if (!input) return "";
  return input
    .replace(/,\s*"expectedType"\s*:\s*"[^"]*"/g, "")
    .replace(/,\s*"input"\s*:\s*\{[^}]*\}/g, "")
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
  const [status, setStatus] = useState("Syncing contract validation...");
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [traceId, setTraceId] = useState<string>("-");
  const [validation, setValidation] = useState<ContractValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function runValidation(): Promise<void> {
      setLoading(true);
      try {
        if (!hasMeaningfulContract) {
          if (!cancelled) {
            setValidation(null);
            setTraceId("-");
            setStatus("Waiting for contract input");
            setLastUpdated(new Date().toISOString());
          }
          return;
        }
        const token = await getOrCreateMemoryToken();
        if (!token) {
          if (!cancelled) setStatus("Missing auth token. Sign in again.");
          return;
        }
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

        if (!response.ok) {
          if (!cancelled) {
            setStatus(result?.error ?? "Contract validation failed");
            if (typeof result?.traceId === "string") {
              setTraceId(result.traceId);
            }
            setLastUpdated(new Date().toISOString());
          }
          return;
        }

        if (!cancelled && result) {
          setValidation(result);
          setTraceId(result.traceId ?? "-");
          setLastUpdated(new Date().toISOString());
          setStatus("Validation ready");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Contract validation failed");
          setLastUpdated(new Date().toISOString());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void runValidation();
    const timer = window.setInterval(() => {
      void runValidation();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [payload, hasMeaningfulContract]);

  return (
    <section>
      <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Contract Console</h1>
      <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
        Validate memory contract quality before execution and handoff.
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {loading ? "Validating contract..." : status}
      </p>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <Row label="Goal" value={cleanContractText(contract.goal) || "Missing"} />
        <Row label="Constraints" value={compactList(contract.constraints)} />
        <Row label="Decisions" value={compactList(contract.decisions)} />
        <Row label="Open Risks" value={compactList(contract.openRisks)} />
        <Row label="Next Actions" value={compactList(contract.nextActions)} />
      </div>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Live Validation</p>
        {validation ? (
          <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
            <p>Governance mode: {validation.governanceMode}</p>
            <p>Completeness: {validation.completenessScore}%</p>
            <p>Quality: {validation.qualityGrade} ({validation.qualityScore})</p>
            <p>Ready to write: {validation.readyToWrite ? "yes" : "no"}</p>
            <p>Present fields: {validation.presentFields.join(" · ") || "None"}</p>
            <p>Missing fields: {validation.missingFields.join(" · ") || "None"}</p>
            {dedupedSuggestions.map((item) => (
              <p key={item} className="rounded-[6px] border border-border px-2 py-1 text-[11px] text-foreground">{item}</p>
            ))}
            {dedupedReasons.map((item) => (
              <p key={item} className="rounded-[6px] border border-border px-2 py-1 text-[11px] text-muted-foreground">{item}</p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-muted-foreground">Awaiting live validation response...</p>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">Trace: {traceId} · Updated: {lastUpdated}</p>
      </div>
    </section>
  );
}
