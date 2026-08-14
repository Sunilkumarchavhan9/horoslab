"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, RefreshCw } from "lucide-react";
import type { MemoryOSLaunchContext } from "@/lib/continuity-launch-context";
import {
  createHandoffPacket,
  createPlaybookFromSession,
  extractExperienceFromSession,
  retrieveCompanyMemory,
  fetchHandoffTrace,
  fetchRelevantMemories,
  type HandoffTrace,
  type SessionHandoffPacket,
  type SessionMemoryExtraction,
  type SessionPlaybook,
  type RetrievedMemoryItem,
} from "@/lib/continuity-lab/continuity-memory-api";
import {
  fetchContinuityScore,
  fetchResumeBrief,
  type OperationalResumeBrief,
} from "@/lib/continuity-lab/resume-brief";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type ContinuityLabSessionContinuityPanelProps = {
  projectId: string;
  repoFullName: string | null;
  launchContext: MemoryOSLaunchContext | null;
  sessionQuestion?: string | null;
  sessionMemories: SessionMemoryExtraction[];
  handoffPacket: SessionHandoffPacket | null;
  playbook: SessionPlaybook | null;
};

function BriefSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-white/35">
        <span className="font-semibold text-white/50">{title}:</span> {empty}
      </p>
    );
  }
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {items.slice(0, 6).map((item) => (
          <li key={item} className="text-[11px] leading-snug text-white/75">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemoryList({ memories }: { memories: RetrievedMemoryItem[] }) {
  if (memories.length === 0) {
    return (
      <p className="text-[11px] text-white/35">No ranked memories returned for this question.</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {memories.slice(0, 8).map((memory) => (
        <li
          key={memory.id}
          className={cn(subtlePanel(), "px-2.5 py-2 text-[11px]")}
        >
          {memory.type ? (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-indigo-300/90">
              {memory.type}
            </span>
          ) : null}
          <p className="mt-0.5 leading-snug text-white/80">{memory.summary}</p>
          {memory.confidence != null ? (
            <p className="mt-1 text-[9px] text-white/35">
              Confidence {Math.round(memory.confidence * 100)}%
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ExtractionList({ memories }: { memories: SessionMemoryExtraction[] }) {
  if (memories.length === 0) {
    return <p className="text-[11px] text-white/35">No extracted session memories yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {memories.map((memory) => (
        <li key={`${memory.memoryType}-${memory.title}`} className={cn(subtlePanel(), "px-2.5 py-2 text-[11px]")}>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-indigo-300/90">
            {memory.memoryType.replace(/_/g, " ")}
          </p>
          <p className="mt-0.5 font-semibold text-white/85">{memory.title}</p>
          <p className="mt-1 leading-snug text-white/70">{memory.content}</p>
          {memory.evidence.length > 0 ? (
            <p className="mt-1 text-[10px] text-white/40">Evidence: {memory.evidence.slice(0, 3).join(" · ")}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function WhySelectedList({
  items,
}: {
  items: OperationalResumeBrief["whyTheseMemoriesWereSelected"];
}) {
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-white/35">No explicit provenance reasons were returned.</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.slice(0, 4).map((item) => {
        const mythicTags = (item.reasonTags ?? []).filter((tag) => tag.includes("mythic_"));
        return (
          <li key={item.memoryId} className={cn(subtlePanel(), "px-2.5 py-2 text-[11px]")}>
            <p className="leading-snug text-white/80">{item.summary}</p>
            <p className="mt-1 text-[9px] text-white/40">
              Score {item.finalScore.toFixed(3)}
              {item.contractCategory ? ` · ${item.contractCategory}` : ""}
            </p>
            {mythicTags.length > 0 ? (
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-300/85">
                Mythic provenance: {mythicTags.join(", ")}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function ContinuityLabSessionContinuityPanel({
  projectId,
  repoFullName,
  launchContext,
  sessionQuestion,
  sessionMemories,
  handoffPacket,
  playbook,
}: ContinuityLabSessionContinuityPanelProps) {
  const [brief, setBrief] = useState<OperationalResumeBrief | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [memories, setMemories] = useState<RetrievedMemoryItem[]>([]);
  const [handoff, setHandoff] = useState<HandoffTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveQuestion = useCallback(() => {
    return (
      sessionQuestion?.trim() ||
      launchContext?.currentGoal?.trim() ||
      "Where should we continue from the latest organizational memory?"
    );
  }, [sessionQuestion, launchContext]);

  const injectedMemory = useMemo(
    () =>
      retrieveCompanyMemory({
        question: resolveQuestion(),
        launchContext,
        memories,
        handoff,
      }),
    [handoff, launchContext, memories, resolveQuestion],
  );

  const extractedMemories = useMemo(
    () =>
      sessionMemories.length > 0
        ? sessionMemories
        : extractExperienceFromSession({
            question: resolveQuestion(),
            files: handoff?.keyMemories.map((memory) => memory.summary).slice(0, 4) ?? [],
            commands: [],
            worklog: [],
            memories,
            handoff,
          }),
    [handoff, memories, resolveQuestion, sessionMemories],
  );

  const handoffSummary = useMemo(
    () =>
      handoffPacket ??
      createHandoffPacket({
        question: resolveQuestion(),
        injectedMemory,
        newMemories: extractedMemories,
        handoff,
      }),
    [handoff, handoffPacket, injectedMemory, extractedMemories, resolveQuestion],
  );

  const playbookSummary = useMemo(
    () =>
      playbook ??
      createPlaybookFromSession({
        question: resolveQuestion(),
        files: handoff?.keyMemories.map((memory) => memory.summary).slice(0, 4) ?? [],
        commands: [],
        newMemories: extractedMemories,
      }),
    [extractedMemories, handoff, playbook, resolveQuestion],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const question = resolveQuestion();
    try {
      const [loadedBrief, loadedScore, loadedMemories, loadedHandoff] = await Promise.all([
        fetchResumeBrief({
          projectId,
          repo: repoFullName,
          question,
        }),
        fetchContinuityScore(projectId),
        fetchRelevantMemories({
          projectId,
          repo: repoFullName,
          question,
          topK: 8,
        }),
        fetchHandoffTrace({
          projectId,
          repo: repoFullName,
          question,
          topK: 6,
        }),
      ]);
      setBrief(loadedBrief);
      setScore(loadedScore?.score ?? launchContext?.resumeConfidenceScore ?? null);
      setMemories(loadedMemories);
      setHandoff(loadedHandoff);
      if (!loadedBrief && loadedMemories.length === 0 && !loadedHandoff) {
        setError("No continuity context yet. Connect GitHub and sync company memory.");
      }
    } catch {
      setError("Could not load continuity context.");
      setBrief(null);
      setMemories([]);
      setHandoff(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, repoFullName, launchContext, resolveQuestion]);

  useEffect(() => {
    void load();
  }, [load]);

  const wikiHref = repoFullName
    ? `/continuity-lab/wiki/${encodeURIComponent(projectId)}`
    : "/continuity-lab/wiki";

  const handoffMemories =
    handoff?.keyMemories?.length ? handoff.keyMemories : memories.filter((m) => m.type === "handoff");

  return (
    <div className="flex min-h-0 flex-col p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-white">Continuity</p>
          <p className="mt-0.5 text-[11px] text-white/45">
            Resume brief, retrieve, and handoff from MemoryOS APIs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex size-7 shrink-0 items-center justify-center text-white/50 hover:bg-[#141414] hover:text-white disabled:opacity-40"
          aria-label="Refresh continuity context"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {typeof score === "number" ? (
        <div className="mb-3 border border-[#4338CA]/30 bg-[#4338CA]/10 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/80">
            Resume confidence
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{score}%</p>
        </div>
      ) : null}

      {launchContext?.briefSummary ? (
        <p className={cn(subtlePanel(), "mb-3 px-2.5 py-2 text-[11px] leading-relaxed text-white/70")}>
          {launchContext.briefSummary}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-white/45">
          <Loader2 className="size-4 animate-spin" />
          Loading continuity context…
        </div>
      ) : error && !brief && memories.length === 0 ? (
        <p className="text-xs text-amber-200/90">{error}</p>
      ) : (
        <div className="space-y-4 text-sm">
          {brief ? (
            <div className="space-y-3">
              {brief.currentGoal ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                    Current goal
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/85">{brief.currentGoal}</p>
                </div>
              ) : null}
              {brief.nextBestAction ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                    Next best action
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-indigo-100/90">
                    {brief.nextBestAction}
                  </p>
                </div>
              ) : null}
              <BriefSection title="Blockers" items={brief.openBlockers} empty="None listed" />
              <BriefSection title="Risky files" items={brief.riskyFiles} empty="None flagged" />
              <BriefSection
                title="Recent changes"
                items={brief.whatChangedRecently}
                empty="No recent changes in memory"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  Why this context was selected
                </p>
                <p className="mt-1 text-[11px] text-white/35">
                  Ranked reasons for the loaded context, including Mythic lineage when a successful run matched this project.
                </p>
                <div className="mt-1.5">
                  <WhySelectedList items={brief.whyTheseMemoriesWereSelected} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                Injected Context
              </p>
              <p className="mt-1 text-[11px] text-white/35">
                Memory injected before the task starts, so the next agent inherits the same context.
              </p>
              <div className="mt-1.5">
                <MemoryList memories={injectedMemory} />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                New Memories Created
              </p>
              <p className="mt-1 text-[11px] text-white/35">
                Decision memory, bug fix memory, experience learned, handoff packet, and playbook.
              </p>
              <div className="mt-1.5">
                <ExtractionList memories={extractedMemories} />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                Experience Learned
              </p>
              <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-white/75">
                {handoffSummary.experienceLearned.length > 0 ? (
                  handoffSummary.experienceLearned.map((item: string) => <li key={item}>{item}</li>)
                ) : (
                  <li>Session experience is ready to be compiled into the company brain.</li>
                )}
              </ul>
            </div>

            <div className="border border-[#2F2F2F] bg-[#111111] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-300/90">
                Reusable Skill
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/80">{playbookSummary.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/55">{playbookSummary.whenToUse}</p>
            </div>

            <div className="border border-[#2F2F2F] bg-[#111111] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-300/90">
                Handoff Packet
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/80">{handoffSummary.summary}</p>
              {handoffSummary.recommendedNextActions.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-white/65">
                  {handoffSummary.recommendedNextActions.slice(0, 4).map((item: string) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[10px] text-white/40">{handoffSummary.sameBugDetectionHint}</p>
            </div>
          </div>

          {handoff ? (
            <div className="border-t border-[#2F2F2F] pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                Handoff trace
              </p>
              {handoff.summary ? (
                <p className="mt-1 text-[11px] leading-relaxed text-white/75">{handoff.summary}</p>
              ) : null}
              {handoff.currentState ? (
                <p className="mt-2 text-[11px] text-white/55">{handoff.currentState}</p>
              ) : null}
              {handoff.openLoops.length > 0 ? (
                <BriefSection title="Open loops" items={handoff.openLoops} empty="" />
              ) : null}
              {handoff.recommendedNextActions.length > 0 ? (
                <BriefSection
                  title="Recommended"
                  items={handoff.recommendedNextActions}
                  empty=""
                />
              ) : null}
              {handoffMemories.length > 0 ? (
                <div className="mt-2">
                  <p className="text-[10px] text-white/40">Key memories</p>
                  <div className="mt-1">
                    <MemoryList memories={handoffMemories} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4 border-t border-[#2F2F2F] pt-3">
        <Link
          href={wikiHref}
          className="inline-flex items-center gap-2 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200"
        >
          <BookOpen className="size-3.5" />
          Open project wiki
        </Link>
      </div>
    </div>
  );
}
