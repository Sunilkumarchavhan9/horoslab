"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type RetentionClass = "short" | "standard" | "long";
type GovernanceMode = "balanced" | "strict" | "enterprise";

type GovernancePolicy = {
  ttlHours: number;
  retentionClass: RetentionClass;
  pinCriticalDecisions: boolean;
  redactSecrets: boolean;
  requireManualReviewForHighRisk: boolean;
  mode: GovernanceMode;
};

type GovernanceReviewItem = {
  id: string;
  reason: string;
  state: "pending" | "approved" | "rejected";
  reviewedAt?: string;
};

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getOrCreateMemoryToken();
  if (!token) throw new Error("Missing auth token");
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

export function GovernanceSection() {
  const [policy, setPolicy] = useState<GovernancePolicy>({
    ttlHours: 168,
    retentionClass: "standard",
    pinCriticalDecisions: true,
    redactSecrets: true,
    requireManualReviewForHighRisk: true,
    mode: "balanced",
  });
  const [status, setStatus] = useState("Loading governance policy...");
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [reviewItems, setReviewItems] = useState<GovernanceReviewItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const dedupedReviewItems = useMemo(
    () =>
      Array.from(
        new Map(reviewItems.map((item) => [item.id, item])).values(),
      ),
    [reviewItems],
  );

  const loadGovernanceData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [policyRes, queueRes] = await Promise.all([
        authFetch("/api/memory/governance-policy"),
        authFetch("/api/memory/governance/review-queue?state=pending"),
      ]);
      const policyPayload = await policyRes.json().catch(() => ({}));
      const queuePayload = await queueRes.json().catch(() => ({}));

      if (!policyRes.ok) {
        throw new Error(policyPayload?.error ?? "Failed to load governance policy");
      }
      if (!queueRes.ok) {
        throw new Error(queuePayload?.error ?? "Failed to load governance review queue");
      }

      if (policyPayload?.governance) {
        setPolicy(policyPayload.governance);
      }
      if (Array.isArray(queuePayload?.items)) {
        setReviewItems(
          queuePayload.items.map((item: GovernanceReviewItem) => ({
            id: item.id,
            reason: item.reason,
            state: item.state,
            reviewedAt: item.reviewedAt,
          })),
        );
      }

      setStatus("Live governance backend connected");
      setLastUpdated(
        typeof policyPayload?.savedAt === "string" && policyPayload.savedAt.trim().length > 0
          ? policyPayload.savedAt
          : new Date().toISOString(),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load governance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGovernanceData();
    const interval = window.setInterval(() => {
      void loadGovernanceData();
    }, 12000);
    return () => window.clearInterval(interval);
  }, [loadGovernanceData]);

  async function savePolicy(): Promise<void> {
    setBusy(true);
    setStatus("Saving policy...");
    try {
      const response = await authFetch("/api/memory/governance-policy", {
        method: "POST",
        body: JSON.stringify({ governance: policy }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save policy");
      }
      setPolicy(payload.governance);
      setStatus("Governance policy saved");
      setLastUpdated(
        typeof payload?.savedAt === "string" && payload.savedAt.trim().length > 0
          ? payload.savedAt
          : new Date().toISOString(),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save policy");
    } finally {
      setBusy(false);
    }
  }

  async function reviewItem(reviewItemId: string, decision: "approve" | "reject"): Promise<void> {
    setBusy(true);
    setStatus(`${decision === "approve" ? "Approving" : "Rejecting"} review item...`);
    try {
      const response = await authFetch("/api/memory/governance/review", {
        method: "POST",
        body: JSON.stringify({
          reviewItemId,
          decision,
          note: "Reviewed in Governance panel",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Review action failed");
      }
      setReviewItems((current) => current.filter((item) => item.id !== reviewItemId));
      setStatus(`Review item ${decision}d`);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Review action failed");
    } finally {
      setBusy(false);
    }
  }

  const retentionTtl = policy.retentionClass === "short" ? 24 : policy.retentionClass === "long" ? 720 : 168;

  return (
    <section>
      <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Governance</h1>
      <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
        Policy controls for retention classes, redaction, review gates, and workspace trust mode.
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Status: {loading ? "Syncing governance state..." : status} | Last updated: {lastUpdated}
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[10px] border border-border bg-muted p-4 xl:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Policy</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[12px] text-muted-foreground">
              Retention class
              <select
                value={policy.retentionClass}
                onChange={(event) =>
                  setPolicy((current) => ({
                    ...current,
                    retentionClass: event.target.value as RetentionClass,
                    ttlHours:
                      event.target.value === "short"
                        ? 24
                        : event.target.value === "long"
                          ? 720
                          : 168,
                  }))
                }
                className="mt-1 h-9 w-full rounded-[8px] border border-border bg-muted px-2 text-[12px]"
              >
                <option value="short">short (24h)</option>
                <option value="standard">standard (168h)</option>
                <option value="long">long (720h)</option>
              </select>
            </label>
            <label className="text-[12px] text-muted-foreground">
              Governance mode
              <select
                value={policy.mode}
                onChange={(event) =>
                  setPolicy((current) => ({
                    ...current,
                    mode: event.target.value as GovernanceMode,
                  }))
                }
                className="mt-1 h-9 w-full rounded-[8px] border border-border bg-muted px-2 text-[12px]"
              >
                <option value="balanced">balanced</option>
                <option value="strict">strict</option>
                <option value="enterprise">enterprise</option>
              </select>
            </label>
            <label className="text-[12px] text-muted-foreground">
              TTL (hours)
              <input
                type="number"
                min={1}
                max={720}
                value={policy.ttlHours}
                onChange={(event) =>
                  setPolicy((current) => ({
                    ...current,
                    ttlHours: Number(event.target.value),
                  }))
                }
                className="mt-1 h-9 w-full rounded-[8px] border border-border bg-muted px-2 text-[12px]"
              />
            </label>
            <div className="text-[12px] text-muted-foreground">
              Role resolution
              <div className="mt-1 h-9 w-full rounded-[8px] border border-border bg-muted px-2 text-[12px] flex items-center text-muted-foreground">
                Server-resolved (owner/admin required)
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={policy.redactSecrets}
                onChange={(event) =>
                  setPolicy((current) => ({ ...current, redactSecrets: event.target.checked }))
                }
              />
              Redact secrets
            </label>
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={policy.pinCriticalDecisions}
                onChange={(event) =>
                  setPolicy((current) => ({ ...current, pinCriticalDecisions: event.target.checked }))
                }
              />
              Pin critical decisions
            </label>
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={policy.requireManualReviewForHighRisk}
                onChange={(event) =>
                  setPolicy((current) => ({
                    ...current,
                    requireManualReviewForHighRisk: event.target.checked,
                  }))
                }
              />
              Manual review high risk
            </label>
          </div>
          <button
            type="button"
            onClick={() => void savePolicy()}
            disabled={busy}
            className="mt-3 rounded-[8px] border border-border px-3 py-2 text-[11px] text-foreground disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save Governance Policy"}
          </button>
        </div>

        <div className="rounded-[10px] border border-border bg-muted p-4">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Live mode summary</p>
          <div className="mt-3 space-y-2 text-[12px] text-muted-foreground">
            <p>Mode: {policy.mode}</p>
            <p>Retention: {policy.retentionClass}</p>
            <p>Policy TTL: {policy.ttlHours}h</p>
            <p>Class baseline TTL: {retentionTtl}h</p>
            <p>Redaction: {policy.redactSecrets ? "on" : "off"}</p>
            <p>Manual review: {policy.requireManualReviewForHighRisk ? "on" : "off"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">High-risk review queue</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Owner/admin can approve or reject pending high-risk memory writes.
        </p>
        <div className="mt-3 space-y-2">
          {dedupedReviewItems.length === 0 ? (
            <p className="rounded-[8px] border border-border bg-muted px-3 py-2 text-[12px] text-muted-foreground">
              No pending review items.
            </p>
          ) : (
            dedupedReviewItems.map((item) => (
              <div key={item.id} className="rounded-[8px] border border-border bg-muted px-3 py-3">
                <p className="text-[12px] text-foreground">{item.reason}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.id}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void reviewItem(item.id, "approve")}
                    disabled={busy}
                    className="rounded-[6px] border border-chart-2/40 px-2 py-1 text-[10px] text-chart-2 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewItem(item.id, "reject")}
                    disabled={busy}
                    className="rounded-[6px] border border-destructive/40 px-2 py-1 text-[10px] text-destructive disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
