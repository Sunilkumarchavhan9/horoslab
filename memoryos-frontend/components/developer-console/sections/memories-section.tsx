"use client";

type MemoryRelation = {
  label: string;
  tone: string;
};

type MemoryStatus = {
  label: string;
  tone: string;
};

type MemoriesSectionProps = {
  selectedMemoryTags: string[];
  workspaceName: string;
  showMemoryTagFilter: boolean;
  memoryLegendExpanded: boolean;
  memoryTagQuery: string;
  filteredMemoryTagOptions: string[];
  memoryStats: Array<[string, string]>;
  memoryRelations: MemoryRelation[];
  memoryStatuses: MemoryStatus[];
  onToggleLegend: () => void;
  onOpenTagFilter: () => void;
  onCloseTagFilter: () => void;
  onApplyTagFilter: () => void;
  onResetTagFilter: () => void;
  onTagQueryChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
};

export function MemoriesSection({
  selectedMemoryTags,
  workspaceName,
  showMemoryTagFilter,
  memoryLegendExpanded,
  memoryTagQuery,
  filteredMemoryTagOptions,
  memoryStats,
  memoryRelations,
  memoryStatuses,
  onToggleLegend,
  onOpenTagFilter,
  onCloseTagFilter,
  onApplyTagFilter,
  onResetTagFilter,
  onTagQueryChange,
  onToggleTag,
}: MemoriesSectionProps) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Memories</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Inspect the project memory graph, relationship types, and lifecycle status for your continuity workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenTagFilter}
            className="rounded-[8px] border border-white/10 bg-[#111111] px-2.5 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/72 transition hover:border-white/20"
          >
            {selectedMemoryTags.length > 0 ? `TAGS: ${selectedMemoryTags.join(", ").toUpperCase()}` : "ALL TAGS"}
          </button>
          <div className="rounded-[8px] border border-white/10 bg-[#111111] px-2.5 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/60">
            WORKSPACE: {workspaceName.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="relative grid min-h-[420px] place-items-center rounded-[10px] border border-white/10 bg-[#141414] px-4 py-4 sm:min-h-[500px] sm:px-5 sm:py-5 lg:min-h-[560px]">
          <div className="max-w-[520px] text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 text-white/28 sm:h-16 sm:w-16">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="3.5" />
                <circle cx="21" cy="14" r="3.5" />
                <circle cx="7" cy="21" r="3.5" />
                <path d="M10.5 7.5l7 4.5M10.5 20.5l7-4.5" />
              </svg>
            </div>
            <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.04em] sm:mt-5 sm:text-[24px] lg:text-[30px]">No memory graph yet</h2>
            <p className="mt-2.5 text-[13px] leading-7 text-white/50 sm:text-[14px] sm:leading-7">
              Save project updates, run retrieve or resume flows, or ingest source context through the API to populate
              the MemoryOS graph for this workspace.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5 sm:gap-2.5">
              <button
                type="button"
                className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3.5 py-2 text-[12px] font-medium text-[#8bb5ff] sm:text-[13px]"
              >
                Open Playground
              </button>
              <button
                type="button"
                className="rounded-[8px] border border-white/10 bg-[#111111] px-3.5 py-2 text-[12px] font-medium text-white/74 sm:text-[13px]"
              >
                View API quickstart
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 z-10 sm:bottom-4 sm:left-4">
            <div className="w-[min(220px,calc(100vw-4rem))] rounded-[10px] border border-white/10 bg-[#161616] px-3 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)] sm:w-[244px] sm:px-3.5 sm:py-3.5">
              <button type="button" onClick={onToggleLegend} className="flex w-full items-center justify-between gap-3 text-left">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/76">Legend</p>
                <span className={`text-[18px] text-white/46 transition ${memoryLegendExpanded ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {memoryLegendExpanded ? (
                <div className="mt-3 max-h-[240px] overflow-y-auto pr-1">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/30">Statistics</p>
                    <div className="mt-2.5 space-y-2">
                      {memoryStats.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 text-[12px] text-white/80 sm:text-[13px]">
                          <span>{label}</span>
                          <span className="text-white/38">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/30">Relationships</p>
                    <div className="mt-2.5 space-y-2">
                      {memoryRelations.map((relation) => (
                        <div key={relation.label} className="flex items-center gap-3 text-[12px] text-white/80 sm:text-[13px]">
                          <span className={`h-[3px] w-6 rounded-full ${relation.tone}`} />
                          <span>{relation.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/30">Memory Status</p>
                    <div className="mt-2.5 space-y-2">
                      {memoryStatuses.map((status) => (
                        <div key={status.label} className="flex items-center gap-3 text-[12px] text-white/80 sm:text-[13px]">
                          <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.12em] ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showMemoryTagFilter ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/55 px-4">
          <div className="w-full max-w-[560px] rounded-[12px] border border-white/10 bg-[#1b1b1b] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em]">Filter by Memory Tags</h2>
                <p className="mt-2 text-[15px] leading-7 text-white/46">
                  Select continuity tags to show in the MemoryOS graph and explorer.
                </p>
              </div>
              <button type="button" onClick={onCloseTagFilter} className="text-[24px] text-white/42">
                ×
              </button>
            </div>

            <div className="mt-6 rounded-[8px] border border-white/10 bg-[#161616] px-4 py-3">
              <input
                value={memoryTagQuery}
                onChange={(event) => onTagQueryChange(event.target.value)}
                placeholder="Search memory tags..."
                className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/28"
              />
            </div>

            <div className="mt-5 min-h-[160px] rounded-[8px] border border-white/8 bg-[#161616] px-4 py-4">
              {filteredMemoryTagOptions.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {filteredMemoryTagOptions.map((tag) => {
                    const active = selectedMemoryTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onToggleTag(tag)}
                        className={`rounded-full border px-3 py-2 text-[13px] font-medium tracking-[0.06em] transition ${
                          active
                            ? "border-[#4f93ff]/35 bg-[#4f93ff]/8 text-[#8bb5ff]"
                            : "border-white/10 bg-[#111111] text-white/72 hover:border-white/20"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid h-full min-h-[120px] place-items-center text-[15px] text-white/34">
                  No matching tags found
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-[14px] text-white/36">
                {selectedMemoryTags.length > 0 ? `${selectedMemoryTags.length} tag(s) selected` : "Showing all"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onResetTagFilter}
                  className="rounded-[8px] border border-white/10 px-5 py-2.5 text-[14px] font-medium text-white/72"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onApplyTagFilter}
                  className="rounded-[8px] bg-[#4f93ff] px-5 py-2.5 text-[14px] font-medium text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
