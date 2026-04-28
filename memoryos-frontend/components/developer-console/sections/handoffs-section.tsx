"use client";

type HandoffEvidenceMemory = {
  id: string;
  type: string;
  content: string;
  updatedAt: string;
};

type HandoffRequestEvent = {
  id: string;
  createdAt: string;
  status: string;
  route: string;
  latencyMs: number;
};

type HandoffsSectionProps = {
  activeProjectName: string;
  activeProjectIntegration: string;
  currentSummary: string;
  lastKnownState: string;
  nextRecommendedAction: string;
  openLoops: string[];
  workspaceName: string;
  handoffStatus: string;
  handoffTitle: string;
  handoffUsedMemories: HandoffEvidenceMemory[];
  handoffRecommendedActions: string[];
  handoffRequestEvents: HandoffRequestEvent[];
  dashboardDataLoading: boolean;
  dashboardDataError: string | null;
};

function formatTimestamp(value: string): string {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "No timestamp";
  return date.toLocaleString();
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("success")) {
    return "border-[#14c38e]/40 bg-[#0e2a21] text-[#89e8c8]";
  }
  if (normalized.includes("pending") || normalized.includes("draft") || normalized.includes("waiting")) {
    return "border-[#f0b429]/40 bg-[#2c240f] text-[#ffd27b]";
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "border-[#ff6d6d]/40 bg-[#2c1414] text-[#ffadad]";
  }
  return "border-[#4f93ff]/40 bg-[#102145] text-[#a9c7ff]";
}

function firstLiveTimestamp(events: HandoffRequestEvent[], memories: HandoffEvidenceMemory[]) {
  if (events.length > 0) return events[0].createdAt;
  if (memories.length > 0) return memories[0].updatedAt;
  return "";
}

export function HandoffsSection({
  activeProjectName,
  activeProjectIntegration,
  currentSummary,
  lastKnownState,
  nextRecommendedAction,
  openLoops,
  workspaceName,
  handoffStatus,
  handoffTitle,
  handoffUsedMemories,
  handoffRecommendedActions,
  handoffRequestEvents,
  dashboardDataLoading,
  dashboardDataError,
}: HandoffsSectionProps) {
  const liveHandoffReady = handoffUsedMemories.length > 0;
  const generatedAt = firstLiveTimestamp(handoffRequestEvents, handoffUsedMemories);
  const handoffScore = liveHandoffReady ? Math.min(98, 68 + handoffUsedMemories.length * 5) : 0;

  return (
    <section className="relative overflow-hidden rounded-[14px] border border-white/[0.09] bg-[linear-gradient(180deg,#0d1018_0%,#090c12_100%)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.4)] sm:p-5">
      <div className="pointer-events-none absolute -right-20 top-[-90px] h-[220px] w-[220px] rounded-full bg-[#4f93ff]/12 blur-[80px]" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[24px]">Handoffs</h1>
          <p className="mt-1.5 max-w-[820px] text-[13px] leading-6 text-white/58 sm:text-[14px]">
            Live handoff state from MemoryOS. This view updates from real `/api/memory/handoff` and related memory calls.
          </p>
        </div>
        <div className={`rounded-[10px] border px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] ${statusTone(handoffStatus)}`}>
          {dashboardDataLoading ? "SYNCING" : handoffStatus.toUpperCase()}
        </div>
      </div>

      {dashboardDataError ? (
        <div className="mt-3 rounded-[10px] border border-[#ff6d6d]/35 bg-[#2a1515] px-3.5 py-2.5 text-[12px] text-[#ffb1b1]">
          Live sync warning: {dashboardDataError}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className="rounded-[12px] border border-white/[0.09] bg-[linear-gradient(180deg,#131927_0%,#0d131e_100%)] px-4 py-4 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Latest Handoff</p>
              <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.03em] text-white sm:text-[20px]">{handoffTitle}</h2>
            </div>
            <div className="rounded-[8px] border border-white/12 bg-black/30 px-3 py-2 text-[12px] text-white/65">
              Generated {formatTimestamp(generatedAt)}
            </div>
          </div>

          {liveHandoffReady ? (
            <>
              <div className="mt-3 rounded-[10px] border border-white/[0.09] bg-[linear-gradient(180deg,#0f151f_0%,#0a0f17_100%)] p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Summary</p>
                <p className="mt-1.5 text-[14px] leading-7 text-white/80">{currentSummary}</p>
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-2">
                <div className="rounded-[10px] border border-white/[0.09] bg-[#0d121b] p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Last Known State</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-white/72">{lastKnownState}</p>
                </div>
                <div className="rounded-[10px] border border-white/[0.09] bg-[#0d121b] p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Next Action</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-white/72">{nextRecommendedAction}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-[10px] border border-dashed border-white/20 bg-[#0e121a] p-4 text-[13px] text-white/68">
              No live handoff generated yet. Run one memory process + resume + handoff flow from Playground, then refresh this tab.
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-white/[0.09] bg-[linear-gradient(180deg,#121a28_0%,#0c111a_100%)] px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Handoff Signal</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12px] text-white/56">Trust score</span>
            <span className="text-[26px] font-semibold tracking-[-0.03em] text-[#8bb5ff]">{handoffScore}</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
            <div className="h-full rounded-full bg-[#4f93ff] shadow-[0_0_14px_rgba(79,147,255,0.45)]" style={{ width: `${handoffScore}%` }} />
          </div>

          <div className="mt-3 space-y-2 rounded-[10px] border border-white/[0.09] bg-[#0d121b] p-3.5 text-[12px] text-white/66">
            <div className="flex items-center justify-between gap-3">
              <span>Workspace</span>
              <span className="text-white/84">{workspaceName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Project</span>
              <span className="text-white/84">{activeProjectName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Surface</span>
              <span className="text-white/84">{activeProjectIntegration}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Used memories</span>
              <span className="text-white/84">{handoffUsedMemories.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[12px] border border-white/[0.09] bg-[linear-gradient(180deg,#111824_0%,#0b1018_100%)] px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Evidence Memories</p>
          <div className="mt-2.5 space-y-2.5">
            {handoffUsedMemories.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-white/20 bg-[#0e121a] p-3 text-[12px] text-white/58">
                No evidence memories yet.
              </div>
            ) : (
              handoffUsedMemories.map((memory) => (
                <div key={memory.id} className="rounded-[10px] border border-white/[0.09] bg-[#0d121b] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8bb5ff]">{memory.type}</p>
                    <p className="text-[11px] text-white/42">{formatTimestamp(memory.updatedAt)}</p>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-6 text-white/76">{memory.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[12px] border border-white/[0.09] bg-[linear-gradient(180deg,#111824_0%,#0b1018_100%)] px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Open Loops</p>
            <div className="mt-2.5 space-y-2">
              {openLoops.map((loop) => (
                <div key={loop} className="rounded-[10px] border border-white/[0.09] bg-[#0d121b] px-3 py-2.5 text-[13px] leading-6 text-white/74">
                  {loop}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] border border-white/[0.09] bg-[linear-gradient(180deg,#111824_0%,#0b1018_100%)] px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Recommended Actions</p>
            <div className="mt-2.5 space-y-2">
              {handoffRecommendedActions.map((action) => (
                <div key={action} className="rounded-[10px] border border-white/[0.09] bg-[#0d121b] px-3 py-2.5 text-[13px] leading-6 text-white/74">
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[12px] border border-white/[0.09] bg-[linear-gradient(180deg,#111824_0%,#0b1018_100%)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Recent Handoff API Requests</p>
          <span className="text-[11px] text-white/42">{handoffRequestEvents.length} events</span>
        </div>
        <div className="mt-2.5 space-y-2">
          {handoffRequestEvents.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-white/20 bg-[#0e121a] p-3 text-[12px] text-white/58">
              No live `/api/memory/handoff` requests yet.
            </div>
          ) : (
            handoffRequestEvents.map((event) => (
              <div key={event.id} className="rounded-[10px] border border-white/[0.09] bg-[#0d121b] px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <span className="text-white/74">{event.route}</span>
                  <span className={`rounded-[6px] border px-2 py-1 text-[10px] uppercase tracking-[0.1em] ${statusTone(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-white/48">
                  {formatTimestamp(event.createdAt)} · {event.latencyMs}ms
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
