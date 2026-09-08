"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Server, Activity, Database, Clock, HardDrive, TerminalSquare, Search, Filter, MoreHorizontal, ArrowDown, FolderGit2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_WORKERS = [
  { id: "w-1", name: "Claude 4", status: "RUNNING", mission: "API Migration", files: 23, memory: "512MB", cpu: "28%", task: "Generating PR", logs: ["Generating plan...", "Opening PR...", "Collecting Evidence...", "Waiting Review..."] },
  { id: "w-2", name: "SecOps Bot", status: "RUNNING", mission: "API Migration", files: 12, memory: "128MB", cpu: "64%", task: "Vulnerability Scan", logs: ["Analyzing auth.ts", "Checking rate limits", "Running static analysis", "Found 2 warnings"] },
  { id: "w-3", name: "Jest Runner", status: "COMPLETED", mission: "UI Refactor", files: 45, memory: "256MB", cpu: "0%", task: "Idle", logs: ["Running test suite", "Pass: 124, Fail: 0", "Writing coverage report", "Finished in 14s"] },
]

export function ExecutionWorkers() {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  
  const selectedWorker = MOCK_WORKERS.find(w => w.id === selectedWorkerId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Workers</h1>
            <p className="text-sm text-black/50 mt-1">Who is doing the work right now?</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
               <input 
                 type="text"
                 placeholder="Search workers..."
                 className="w-64 pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
               />
             </div>
             <Button variant="outline" className="rounded-full px-4 text-sm h-9 border-black/10 text-black/70 hover:bg-black/5 bg-white">
               <Filter className="size-3.5 mr-2" /> Filter
             </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {MOCK_WORKERS.map((worker) => (
              <WorkerCard 
                key={worker.id} 
                worker={worker} 
                isSelected={selectedWorkerId === worker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      <AnimatePresence>
        {selectedWorker && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-[450px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.03)] relative z-20"
          >
             <div className="p-5 border-b border-black/5 flex justify-between items-start sticky top-0 bg-white z-10">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-black">{selectedWorker.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${selectedWorker.status === 'RUNNING' ? 'bg-[#eef3ff] text-[#0f52ff]' : 'bg-black/5 text-black/50'}`}>
                       {selectedWorker.status}
                    </span>
                 </div>
                 <div className="text-sm text-black/50">Mission: {selectedWorker.mission}</div>
               </div>
               <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors -mr-2" onClick={() => setSelectedWorkerId(null)}>
                 <X className="size-4" />
               </button>
             </div>
             
             {/* Inspector Tabs */}
             <div className="flex border-b border-black/5 px-5 bg-white sticky top-[77px] z-10">
                {['Overview', 'Logs', 'Tool Calls', 'Evidence', 'Runtime'].map((tab, i) => (
                   <button key={tab} className={`py-3 text-[13px] font-medium mr-5 border-b-2 ${i === 0 ? 'border-[#0f52ff] text-[#0f52ff]' : 'border-transparent text-black/50 hover:text-black'}`}>
                      {tab}
                   </button>
                ))}
             </div>
             
             <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-[#fafafa]">
                
                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Resource Allocation</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-black/5 rounded-md p-3 shadow-sm">
                         <div className="flex items-center gap-2 text-black/50 text-xs mb-1"><Server className="size-3" /> Memory</div>
                         <div className="text-xl font-bold text-black">{selectedWorker.memory}</div>
                      </div>
                      <div className="bg-white border border-black/5 rounded-md p-3 shadow-sm">
                         <div className="flex items-center gap-2 text-black/50 text-xs mb-1"><Cpu className="size-3" /> CPU</div>
                         <div className="text-xl font-bold text-black">{selectedWorker.cpu}</div>
                      </div>
                      <div className="bg-white border border-black/5 rounded-md p-3 shadow-sm">
                         <div className="flex items-center gap-2 text-black/50 text-xs mb-1"><FolderGit2 className="size-3" /> Files Context</div>
                         <div className="text-xl font-bold text-black">{selectedWorker.files}</div>
                      </div>
                      <div className="bg-white border border-black/5 rounded-md p-3 shadow-sm">
                         <div className="flex items-center gap-2 text-black/50 text-xs mb-1"><Clock className="size-3" /> Uptime</div>
                         <div className="text-xl font-bold text-black">4m 12s</div>
                      </div>
                   </div>
                </div>
                
                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Current Execution Output</h4>
                   <div className="bg-[#1e1e1e] rounded-md p-4 text-[12px] font-mono text-[#d4d4d4] overflow-x-auto shadow-inner leading-relaxed">
                      {selectedWorker.logs.map((log, i) => (
                         <div key={i} className="flex gap-3 opacity-80">
                            <span className="text-[#F0EFE2]/30 w-5 text-right">{i+1}</span>
                            <span>{log}</span>
                         </div>
                      ))}
                      {selectedWorker.status === 'RUNNING' && (
                         <div className="flex gap-3 mt-1 animate-pulse text-[#4ade80]">
                            <span className="text-[#F0EFE2]/30 w-5 text-right">{selectedWorker.logs.length + 1}</span>
                            <span>█</span>
                         </div>
                      )}
                   </div>
                </div>
                
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkerCard({ worker, isSelected, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group rounded-md border bg-white cursor-pointer transition-all flex flex-col overflow-hidden ${isSelected ? 'border-[#0f52ff] shadow-[0_12px_40px_rgba(15,82,255,0.08)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="p-5 flex-1">
         <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className={`size-10 rounded-md flex items-center justify-center shrink-0 ${worker.status === 'RUNNING' ? 'bg-[#0f52ff] text-[#F0EFE2] shadow-lg shadow-[#0f52ff]/20' : 'bg-black/5 text-black/50'}`}>
                  <Cpu className="size-5" />
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-black leading-tight">{worker.name}</h3>
                  <div className="text-xs text-black/50 mt-0.5">Mission: {worker.mission}</div>
               </div>
            </div>
            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${worker.status === 'RUNNING' ? 'bg-[#eef3ff] text-[#0f52ff]' : 'bg-black/5 text-black/50'}`}>
               {worker.status === 'RUNNING' && <Activity className="size-3 animate-pulse" />}
               {worker.status}
            </div>
         </div>
         
         <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="text-center p-2 rounded-md bg-[#fafafa] border border-black/5">
               <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-1">CPU</div>
               <div className="font-mono text-sm text-black">{worker.cpu}</div>
            </div>
            <div className="text-center p-2 rounded-md bg-[#fafafa] border border-black/5">
               <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-1">RAM</div>
               <div className="font-mono text-sm text-black">{worker.memory}</div>
            </div>
            <div className="text-center p-2 rounded-md bg-[#fafafa] border border-black/5">
               <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-1">Files</div>
               <div className="font-mono text-sm text-black">{worker.files}</div>
            </div>
         </div>
      </div>
      
      {/* Streaming Terminal Section */}
      <div className="bg-[#111] p-4 text-[11px] font-mono text-[#a3a3a3] border-t-4 border-t-black/5 relative overflow-hidden">
         <div className="flex items-center justify-between mb-3 text-[#F0EFE2]/40">
            <div className="flex items-center gap-1.5"><TerminalSquare className="size-3" /> Live Terminal</div>
            <div className="flex gap-1.5"><div className="size-2 rounded-full bg-red-500"/><div className="size-2 rounded-full bg-yellow-500"/><div className="size-2 rounded-full bg-green-500"/></div>
         </div>
         
         <div className="space-y-1.5 relative z-10">
            {worker.logs.map((log: string, i: number) => (
               <div key={i} className="flex gap-2">
                  <span className="text-[#0f52ff]">❯</span>
                  <span className={i === worker.logs.length - 1 && worker.status === 'RUNNING' ? 'text-[#F0EFE2]' : ''}>{log}</span>
               </div>
            ))}
            {worker.status === 'RUNNING' && (
               <div className="flex gap-2">
                  <span className="text-[#0f52ff]">❯</span>
                  <span className="text-[#4ade80] animate-pulse">█</span>
               </div>
            )}
         </div>
         
         <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
