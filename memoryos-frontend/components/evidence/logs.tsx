"use client"

import { useState } from "react"
import { Search, Filter, MoreHorizontal, Play, Pause, Terminal, AlertTriangle, Info, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_LOGS = [
  { id: "log-1", time: "12:21:05", level: "INFO", message: "Mission Created", mission: "MISSION-241", agent: "System", runtime: "Epoch Core", traceId: "tr-92f8a1" },
  { id: "log-2", time: "12:22:12", level: "INFO", message: "Planner Started", mission: "MISSION-241", agent: "Planner Agent", runtime: "Epoch Core", traceId: "tr-92f8a1" },
  { id: "log-3", time: "12:23:45", level: "INFO", message: "Claude Running", mission: "MISSION-241", agent: "Claude Reviewer", runtime: "Agent Runtime", traceId: "tr-92f8a1" },
  { id: "log-4", time: "12:24:02", level: "WARNING", message: "Rate limit approaching", mission: "MISSION-241", agent: "Claude Reviewer", runtime: "API Gateway", traceId: "tr-92f8a1" },
  { id: "log-5", time: "12:24:30", level: "INFO", message: "GitHub PR Opened", mission: "MISSION-241", agent: "GitOps Bot", runtime: "Integration", traceId: "tr-92f8a1" },
  { id: "log-6", time: "12:25:15", level: "INFO", message: "Verification PASS", mission: "MISSION-241", agent: "Verifier", runtime: "Security Core", traceId: "tr-92f8a1" },
  { id: "log-7", time: "12:26:00", level: "INFO", message: "Settlement Completed", mission: "MISSION-241", agent: "System", runtime: "Ledger", traceId: "tr-92f8a1" },
]

export function EvidenceLogs({ onOpenWorkspace }: { onOpenWorkspace?: (id: string) => void }) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(true)
  
  const selectedLog = MOCK_LOGS.find(l => l.id === selectedLogId)

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Logs</h1>
            <p className="text-sm text-black/50 mt-1">All runtime events and system execution traces.</p>
          </div>
          <Button 
            variant="outline"
            className="rounded-full px-5 text-sm h-9 border-black/10 text-black/70 hover:bg-black/5"
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? <><Pause className="size-4 mr-2" /> Pause Stream</> : <><Play className="size-4 mr-2" /> Resume Stream</>}
          </Button>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-6 py-4 border-b border-black/5 flex flex-col sm:flex-row sm:items-center gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
            <input 
              type="text"
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <FilterBadge label="Mission" />
            <FilterBadge label="Agent" />
            <FilterBadge label="Runtime" />
            <div className="w-px h-4 bg-black/10 mx-1"></div>
            <FilterBadge label="ERROR" color="red" />
            <FilterBadge label="WARNING" color="yellow" />
            <FilterBadge label="INFO" color="blue" />
          </div>
        </div>

        {/* Streaming Log Viewer */}
        <div className="flex-1 overflow-y-auto bg-black p-4 font-mono text-[13px] custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-1">
            {MOCK_LOGS.map((log) => (
              <div 
                key={log.id} 
                onClick={() => setSelectedLogId(log.id)}
                className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-1.5 rounded cursor-pointer transition-colors ${selectedLogId === log.id ? 'bg-[#0f52ff]/20' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-white/40 min-w-[70px]">{log.time}</span>
                  <span className={`min-w-[60px] font-semibold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARNING' ? 'text-yellow-400' : 'text-[#4ade80]'}`}>
                    {log.level}
                  </span>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 truncate">
                  <span className="text-white/90 font-medium truncate">{log.message}</span>
                  <div className="flex items-center gap-3 mt-1 sm:mt-0 text-[11px] opacity-60 ml-auto shrink-0">
                    <span className="truncate max-w-[100px]">{log.mission}</span>
                    <span className="truncate max-w-[100px]">{log.agent}</span>
                    <span className="truncate max-w-[100px]">{log.runtime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedLog && (
        <div className="w-[400px] border-l border-black/10 bg-[#fafafa] flex flex-col overflow-y-auto hidden lg:flex shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-10">
          <div className="p-5 border-b border-black/5 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black">Log Inspector</h3>
              <button className="text-black/40 hover:text-black" onClick={() => setSelectedLogId(null)}>
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-md mt-1 ${selectedLog.level === 'ERROR' ? 'bg-red-100 text-red-600' : selectedLog.level === 'WARNING' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {selectedLog.level === 'ERROR' ? <ShieldAlert className="size-5" /> : selectedLog.level === 'WARNING' ? <AlertTriangle className="size-5" /> : <Info className="size-5" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-black leading-tight">{selectedLog.message}</h2>
                <div className="text-xs text-black/50 mt-1">{selectedLog.time}</div>
              </div>
            </div>
          </div>
          
          <div className="p-5 flex-1 space-y-6">
            <div>
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-2">Raw JSON</div>
              <div className="bg-[#1e1e1e] rounded-md p-4 text-[12px] font-mono text-[#d4d4d4] overflow-x-auto">
                <pre>
{JSON.stringify({
  timestamp: selectedLog.time,
  level: selectedLog.level,
  message: selectedLog.message,
  context: {
    mission_id: selectedLog.mission,
    agent_id: selectedLog.agent,
    runtime_env: selectedLog.runtime,
    trace_id: selectedLog.traceId
  }
}, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Metadata & Context</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black/50">Mission</span>
                  <span className="font-medium text-[#0f52ff] hover:underline cursor-pointer">{selectedLog.mission}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black/50">Agent</span>
                  <span className="font-medium text-black">{selectedLog.agent}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black/50">Trace ID</span>
                  <span className="font-medium text-black font-mono text-xs">{selectedLog.traceId}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-black/5 bg-white mt-auto">
            <Button className="w-full bg-black text-white hover:bg-black/80" onClick={() => onOpenWorkspace?.(selectedLog.id)}>
              View Linked Evidence
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterBadge({ label, color }: { label: string, color?: "red" | "yellow" | "blue" }) {
  const colorClasses = {
    red: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    blue: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
  }
  
  return (
    <button className={`px-3 py-1 rounded-full border text-[12px] font-medium transition-colors shrink-0 ${color ? colorClasses[color] : 'bg-white border-black/10 text-black/70 hover:bg-black/5'}`}>
      {label}
    </button>
  )
}
