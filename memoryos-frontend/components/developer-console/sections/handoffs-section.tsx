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
    return "border-chart-2/40 bg-chart-2/15 text-chart-2";
  }
  if (normalized.includes("pending") || normalized.includes("draft") || normalized.includes("waiting")) {
    return "border-chart-5/40 bg-chart-5/15 text-chart-5";
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "border-destructive/40 bg-destructive/15 text-destructive";
  }
  return "border-primary/40 bg-primary/15 text-primary";
}

function firstLiveTimestamp(events: HandoffRequestEvent[], memories: HandoffEvidenceMemory[]) {
  if (events.length > 0) return events[0].createdAt;
  if (memories.length > 0) return memories[0].updatedAt;
  return "";
}

const panelClass =
  "rounded-lg border border-border bg-card px-4 py-4";
const innerCardClass = "rounded-lg border border-border bg-muted/40 p-3.5";
const dashedEmptyClass = "rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground";

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
    <section className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tighter text-foreground sm:text-2xl">Handoffs</h1>
          <p className="mt-1.5 max-w-4xl text-sm leading-6 text-muted-foreground sm:text-sm">
            Live handoff state from MemoryOS. This view updates from real `/api/memory/handoff` and related memory calls.
          </p>
        </div>
        <div className={`rounded-lg border px-3 py-1.5 text-xs font-medium tracking-wider ${statusTone(handoffStatus)}`}>
          {dashboardDataLoading ? "SYNCING" : handoffStatus.toUpperCase()}
        </div>
      </div>

      {dashboardDataError ? (
        <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/15 px-3.5 py-2.5 text-xs text-destructive">
          Live sync warning: {dashboardDataError}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className={`${panelClass} xl:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Latest Handoff</p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{handoffTitle}</h2>
            </div>
            <div className="rounded-md border border-border bg-background/30 px-3 py-2 text-xs text-muted-foreground">
              Generated {formatTimestamp(generatedAt)}
            </div>
          </div>

          {liveHandoffReady ? (
            <>
              <div className={`mt-3 ${innerCardClass}`}>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Summary</p>
                <p className="mt-1.5 text-sm leading-7 text-foreground">{currentSummary}</p>
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-2">
                <div className={innerCardClass}>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Last Known State</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{lastKnownState}</p>
                </div>
                <div className={innerCardClass}>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Next Action</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{nextRecommendedAction}</p>
                </div>
              </div>
            </>
          ) : (
            <div className={`mt-3 ${dashedEmptyClass} p-4 text-sm`}>
              No live handoff generated yet. Run one memory process + resume + handoff flow from Playground, then refresh this tab.
            </div>
          )}
        </div>

        <div className={panelClass}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Handoff Signal</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Trust score</span>
            <span className="text-2xl font-semibold tracking-tight text-primary">{handoffScore}</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${handoffScore}%` }} />
          </div>

          <div className={`mt-3 space-y-2 ${innerCardClass} text-xs text-muted-foreground`}>
            <div className="flex items-center justify-between gap-3">
              <span>Workspace</span>
              <span className="text-foreground">{workspaceName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Project</span>
              <span className="text-foreground">{activeProjectName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Surface</span>
              <span className="text-foreground">{activeProjectIntegration}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Used memories</span>
              <span className="text-foreground">{handoffUsedMemories.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className={panelClass}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Evidence Memories</p>
          <div className="mt-2.5 space-y-2.5">
            {handoffUsedMemories.length === 0 ? (
              <div className={dashedEmptyClass}>No evidence memories yet.</div>
            ) : (
              handoffUsedMemories.map((memory) => (
                <div key={memory.id} className={`${innerCardClass} p-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{memory.type}</p>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(memory.updatedAt)}</p>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{memory.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className={panelClass}>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Open Loops</p>
            <div className="mt-2.5 space-y-2">
              {openLoops.map((loop) => (
                <div key={loop} className={`rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-6 text-muted-foreground`}>
                  {loop}
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recommended Actions</p>
            <div className="mt-2.5 space-y-2">
              {handoffRecommendedActions.map((action) => (
                <div key={action} className={`rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-6 text-muted-foreground`}>
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-3 ${panelClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recent Handoff API Requests</p>
          <span className="text-xs text-muted-foreground">{handoffRequestEvents.length} events</span>
        </div>
        <div className="mt-2.5 space-y-2">
          {handoffRequestEvents.length === 0 ? (
            <div className={dashedEmptyClass}>No live `/api/memory/handoff` requests yet.</div>
          ) : (
            handoffRequestEvents.map((event) => (
              <div key={event.id} className={`rounded-lg border border-border bg-muted/40 px-3 py-2.5`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{event.route}</span>
                  <span className={`rounded-md border px-2 py-1 text-xs uppercase tracking-widest ${statusTone(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
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
