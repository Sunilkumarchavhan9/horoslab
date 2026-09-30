"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Play, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import {
    cancelDhyraMission,
    decideDhyraMissionApproval,
    getDhyraMissionEvidenceBundle,
    getDhyraMission,
    getDhyraMissionSettlement,
    issueDhyraMissionCertificate,
    queueDhyraMission,
    retryDhyraMission,
    runDhyraMission,
    settleDhyraMission,
    verifyDhyraMission,
    type DhyraMissionDetail,
} from "@/lib/dhyra-api";

export function MissionInspector({ entityData }: { entityData: Record<string, unknown> }) {
    const workspaceId = typeof entityData.workspaceId === "string" ? entityData.workspaceId : null;
    const missionId = String(entityData.id ?? "");
    const [mission, setMission] = useState<DhyraMissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settlement, setSettlement] = useState<Awaited<ReturnType<typeof getDhyraMissionSettlement>>>(null);

    useEffect(() => {
        if (!workspaceId || !missionId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const [next, nextSettlement] = await Promise.all([
                    getDhyraMission(workspaceId, missionId),
                    getDhyraMissionSettlement(workspaceId, missionId).catch(() => null),
                ]);
                if (!cancelled) {
                    setMission(next);
                    setSettlement(nextSettlement);
                }
            } catch (cause) {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "Mission could not be loaded.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [missionId, workspaceId]);

    const refresh = async () => {
        if (!workspaceId || !missionId) return;
        const [next, nextSettlement] = await Promise.all([
            getDhyraMission(workspaceId, missionId),
            getDhyraMissionSettlement(workspaceId, missionId).catch(() => null),
        ]);
        setMission(next);
        setSettlement(nextSettlement);
    };

    const action = async (name: string, operation: () => Promise<DhyraMissionDetail | unknown>) => {
        setBusy(name);
        setError(null);
        try {
            const result = await operation();
            if (result && typeof result === "object" && "id" in result) setMission(result as DhyraMissionDetail);
            await refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Mission action failed.");
        } finally {
            setBusy(null);
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>;
    if (!workspaceId || !missionId) return <div className="p-6 text-sm text-muted-foreground">Mission identity is missing.</div>;
    if (!mission) return <div className="p-6 text-sm text-red-500">{error ?? "Mission was not found."}</div>;

    const terminal = mission.state === "completed" || mission.state === "failed" || mission.state === "cancelled";
    const isWaitingForApproval = mission.state === "waiting_review" && mission.currentStep === "human_review";
    const isRepositoryMission = Boolean(mission.repository);
    const canQueueWorkerJob = !isRepositoryMission && mission.state === "draft";
    const timeline = Array.isArray(mission.timeline) ? mission.timeline : [];
    const evidence = Array.isArray(mission.evidence) ? mission.evidence : [];
    const verificationDecision = mission.verificationRun?.finalDecision?.toUpperCase() ?? null;
    const canVerify = evidence.length > 0 && Boolean(mission.executionRun || mission.currentStep === "github_execution" || mission.state === "completed" || mission.state === "failed");
    const canIssueCertificate = verificationDecision === "PASS" && !mission.certificate;
    const canSettle = verificationDecision === "PASS" && Boolean(mission.certificate) && !settlement;

    return (
        <div className="flex h-full flex-col overflow-auto bg-background/50">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/50 px-6 py-3">
                <button disabled={Boolean(busy) || terminal || isWaitingForApproval || isRepositoryMission} title={isRepositoryMission ? "Approve the repository mission to start its guarded GitHub execution." : isWaitingForApproval ? "Approval is required before execution." : undefined} onClick={() => void action("run", () => runDhyraMission(workspaceId, missionId))} className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Play className="size-3.5" />{busy === "run" ? "Running..." : "Run"}</button>
                {canQueueWorkerJob ? <button disabled={Boolean(busy)} title="Create an explicitly approved execute job for a registered Dhyra worker to lease." onClick={() => void action("queue", async () => { await queueDhyraMission(workspaceId, missionId, { source: "mission_control", humanApproval: "approved" }); return getDhyraMission(workspaceId, missionId); })} className="inline-flex items-center gap-1.5 rounded border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 disabled:opacity-50">{busy === "queue" ? "Queueing..." : "Queue worker job"}</button> : null}
                <button disabled={Boolean(busy) || mission.state !== "failed"} onClick={() => void action("retry", () => retryDhyraMission(workspaceId, missionId, "Retried from Mission Control"))} className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold disabled:opacity-50"><RotateCcw className="size-3.5" />Retry</button>
                <button disabled={Boolean(busy) || terminal || !isWaitingForApproval} onClick={() => void action("approve", () => decideDhyraMissionApproval(workspaceId, missionId, "approved", "Approved from Mission Control"))} className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 disabled:opacity-50"><ShieldCheck className="size-3.5" />{busy === "approve" ? "Approving..." : "Approve"}</button>
                <button disabled={Boolean(busy) || !canVerify} title={canVerify ? "Run verification against the live mission evidence." : "Verification requires an execution and at least one evidence item."} onClick={() => void action("verify", async () => { await verifyDhyraMission(workspaceId, missionId, { evidenceIds: evidence.map((item) => item.id), checklist: ["Execution completed", "Evidence is present", "Declared acceptance criteria reviewed"], humanApproval: "approved", confidence: 100, approvals: ["Mission Control reviewer"] }); return null; })} className="inline-flex items-center gap-1.5 rounded border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 disabled:opacity-50"><ShieldCheck className="size-3.5" />{busy === "verify" ? "Verifying..." : "Verify"}</button>
                <button disabled={Boolean(busy) || !canIssueCertificate} title={canIssueCertificate ? "Issue the certificate from the live PASS verification." : "A PASS verification is required before issuing a certificate."} onClick={() => void action("certificate", async () => { const bundle = await getDhyraMissionEvidenceBundle(workspaceId, missionId); await issueDhyraMissionCertificate(workspaceId, missionId, { summary: `Verified mission: ${mission.title}`, approvals: ["Mission Control reviewer"], evidenceSummary: { evidenceCount: evidence.length, bundleHash: bundle.bundleHash }, proof: { bundleHash: bundle.bundleHash } }); return null; })} className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"><ShieldCheck className="size-3.5" />{busy === "certificate" ? "Issuing..." : "Issue Certificate"}</button>
                <button disabled={Boolean(busy) || !canSettle} title={canSettle ? "Settle the verified mission and create its learning handoff." : "Issue a certificate before settlement."} onClick={() => void action("settlement", async () => { const bundle = await getDhyraMissionEvidenceBundle(workspaceId, missionId); const result = await settleDhyraMission(workspaceId, missionId, { decision: "PASS", evidenceHash: bundle.bundleHash, assuranceConfidence: mission.verificationRun?.confidence ?? 100, humanApproval: "approved", unresolvedRisks: [], summary: mission.title, lessons: ["Verified mission outcome recorded from Mission Control."] }); setSettlement(result.settlement); return null; })} className="inline-flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 disabled:opacity-50">{busy === "settlement" ? "Settling..." : "Settle & Learn"}</button>
                <button disabled={Boolean(busy) || terminal} onClick={() => void action("cancel", () => cancelDhyraMission(workspaceId, missionId, "Cancelled from Mission Control"))} className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 disabled:opacity-50"><XCircle className="size-3.5" />Cancel</button>
            </div>
            <div className="space-y-6 p-6">
                {error && <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
                {isRepositoryMission && isWaitingForApproval && !error ? <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">This repository mission is waiting for approval. Select <strong>Approve</strong> to start the guarded GitHub flow. It will create the isolated branch, run the declared checks, capture evidence, and open the pull request without merging.</div> : null}
                <div>
                    <div className="mb-2 flex items-center gap-2"><h2 className="text-lg font-semibold">{mission.title}</h2><span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase">{mission.state}</span></div>
                    <p className="text-sm text-muted-foreground">{mission.objective}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded border border-border p-4"><div className="text-xs text-muted-foreground">Institution</div><div className="mt-1 text-sm font-medium">{mission.institution?.name ?? mission.institution?.id ?? "-"}</div></div>
                    <div className="rounded border border-border p-4"><div className="text-xs text-muted-foreground">Current step</div><div className="mt-1 text-sm font-medium">{mission.currentStep ?? "-"}</div></div>
                    <div className="rounded border border-border p-4"><div className="text-xs text-muted-foreground">Evidence</div><div className="mt-1 flex items-center gap-1 text-sm font-medium"><CheckCircle2 className="size-4 text-emerald-500" />{evidence.length}</div></div>
                </div>
                {(mission.verificationRun || mission.certificate || settlement) ? <section className="grid gap-3 md:grid-cols-3">
                    <div className="rounded border border-border p-4"><div className="text-xs text-muted-foreground">Verification</div><div className="mt-1 text-sm font-medium">{verificationDecision ?? "Pending"}{mission.verificationRun?.confidence != null ? ` (${mission.verificationRun.confidence}%)` : ""}</div></div>
                    <div className="rounded border border-border p-4"><div className="text-xs text-muted-foreground">Certificate</div><div className="mt-1 break-all text-sm font-medium">{mission.certificate?.id ?? "Not issued"}</div></div>
                    <div className="rounded border border-border p-4"><div className="text-xs text-muted-foreground">Settlement / learning</div><div className="mt-1 text-sm font-medium">{settlement ? `${settlement.decision ?? "-"} · ${settlement.learningEligible ? "Handoff created" : "Held"}` : "Not settled"}</div></div>
                </section> : null}
                <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3><div className="space-y-2">{timeline.length ? timeline.map((event, index) => <div key={index} className="rounded border border-border/70 p-3 text-sm">{JSON.stringify(event)}</div>) : <div className="text-sm text-muted-foreground">No timeline events returned by the backend.</div>}</div></section>
                <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence</h3><div className="space-y-2">{evidence.length ? evidence.map((item, index) => <div key={index} className="rounded border border-border/70 p-3 text-sm">{JSON.stringify(item)}</div>) : <div className="text-sm text-muted-foreground">No evidence returned by the backend.</div>}</div></section>
            </div>
        </div>
    );
}
