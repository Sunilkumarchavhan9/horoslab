import sys

filepath = "components/mission-control/account-home-dashboard.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

find_str = """            <span className="text-[13px] text-[#666] truncate">
              Evidence uploaded: <strong className="font-semibold text-[#111]">Audit_Log_2026.json</strong>
            </span>
            key="dashboard_content"
"""

replace_str = """            <span className="text-[13px] text-[#666] truncate">
              Evidence uploaded: <strong className="font-semibold text-[#111]">Audit_Log_2026.json</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">12m ago</span>
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span className="text-[13px] text-[#666] truncate">
              Institution updated: <strong className="font-semibold text-[#111]">Security Compliance</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">45m ago</span>
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <Rocket className="size-4 text-[#777] shrink-0" />
            <span className="text-[13px] text-[#666] truncate">
              Mission created: <strong className="font-semibold text-[#111]">OAuth Keys Audit</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">1h ago</span>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-[#111] font-sans flex flex-col relative" data-popover>
      
      {/* 1. Top Greeting Header */}
      <div className="flex flex-col items-center mb-7">
        <h1 className="text-[34px] font-bold text-[#111] tracking-tight text-center">
          What are we building today?
        </h1>
      </div>

      {/* 3. Centered Search Input Bar */}
      <div className="max-w-3xl w-full mx-auto mb-12">
        <div className="relative flex items-center w-full bg-white border border-[#e2e2e8] rounded-xl h-11 px-4 shadow-xs focus-within:border-[#0f52ff] focus-within:ring-1 focus-within:ring-[#0f52ff]/20 transition-all">
          <Search className="size-4 text-[#888] pointer-events-none mr-3" />
          <input
            type="text"
            placeholder="Search institutions, missions, evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[14.5px] text-[#111] placeholder:text-[#999] min-w-0"
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="inline-flex h-5 items-center justify-center rounded border border-[#e2e2e7] bg-[#f8f8fa] px-1.5 text-[10.5px] font-medium text-[#666]">Ctrl</kbd>
            <kbd className="inline-flex h-5 items-center justify-center rounded border border-[#e2e2e7] bg-[#f8f8fa] px-1.5 text-[10.5px] font-medium text-[#666]">K</kbd>
          </div>
        </div>
      </div>

      {/* AnimatePresence for Loading Skeleton vs Main Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <DashboardSkeletonLoader key="skeleton_loader" />
        ) : (
          <motion.div
            key="dashboard_content"
"""

if find_str in content:
    content = content.replace(find_str, replace_str)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed!")
else:
    print("Could not find string")
