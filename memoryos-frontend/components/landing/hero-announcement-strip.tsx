export function HeroAnnouncementStrip() {
  return (
    <div className="border-b border-dashed border-[#c9d8ee] py-6">
      <div className="px-6 lg:px-7">
        <div className="inline-flex w-fit items-center overflow-hidden border-x border-[#b7d2f5] bg-white text-[13px] text-[#0f213f]">
          <span className="inline-flex items-center gap-2 border-r border-[#b7d2f5] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[#2166f3]" />
            Memory layer
          </span>
          <span className="px-3 py-2 bg-[#ddebff]">
            Developer memory continuity for agents, IDEs, copilots, and long-running
            technical workflows
          </span>
          <span className="px-3 py-2 bg-[#ddebff]">→</span>
        </div>
      </div>
    </div>
  );
}
