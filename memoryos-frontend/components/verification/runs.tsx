"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldCheck, Activity, Clock, CheckCircle2, XCircle, ChevronRight, FileText, FileCheck, Check, Fingerprint, Database, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_RUNS = [
  { id: "vr-104", type: "Security Verification", status: "PASS", mission: "Deploy SDK", verifier: "Security AI", time: "18s", evidence: 24, confidence: "99.3%" },
  { id: "vr-103", type: "Policy Compliance", status: "RUNNING", mission: "API Migration", verifier: "Policy Engine", time: "42s", evidence: 12, confidence: "--" },
  { id: "vr-102", type: "Data Integrity", status: "FAIL", mission: "DB Sync", verifier: "Data Validator", time: "14s", evidence: 4, confidence: "12.4%" },
  { id: "vr-101", type: "Unit Testing", status: "PASS", mission: "Auth Rewrite", verifier: "Jest Runner", time: "8s", evidence: 45, confidence: "100%" },
]

export function VerificationRuns() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  
  const selectedRun = MOCK_RUNS.find(r => r.id === selectedRunId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">Verifier Runs</h1>
              <p className="text-sm text-black/50 mt-1">Every verification executed by HOROS.</p>
            </div>
            <div className="flex items-center gap-3">
               <Button className="bg-black hover:bg-black/80 text-[#F0EFE2] rounded-md shadow-sm h-9 px-4 text-sm font-medium">
                  Run Verification
               </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
             <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
               <input 
                 type="text"
                 placeholder="Search Mission, Institution, Type..."
                 className="w-full pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
               />
             </div>
             <Button variant="outline" className="h-9 px-4 border-black/10 text-black/70 bg-white shadow-sm">
                <Filter className="size-3.5 mr-2" /> Filters
             </Button>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
             <MetricBox label="Running" value="2" highlight />
             <MetricBox label="Passed" value="1,402" color="green" />
             <MetricBox label="Failed" value="14" color="red" />
             <MetricBox label="Avg Time" value="12s" />
             <MetricBox label="Coverage" value="98%" />
             <MetricBox label="Success Rate" value="99.0%" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa] custom-scrollbar">
          <h3 className="text-sm font-semibold text-black/60 uppercase tracking-wider mb-4">Verification Queue</h3>
          <div className="space-y-3 max-w-5xl">
            {MOCK_RUNS.map((run) => (
              <RunCard 
                key={run.id} 
                run={run} 
                isSelected={selectedRunId === run.id}
                onClick={() => setSelectedRunId(run.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Deep Dive Inspector */}
      <AnimatePresence>
        {selectedRun && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-[450px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.04)] relative z-20"
          >
             <div className="p-6 border-b border-black/5 flex justify-between items-start bg-white">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${selectedRun.status === 'PASS' ? 'bg-[#e6ffec] text-[#2da44e] border-[#2da44e]/20' : selectedRun.status === 'FAIL' ? 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]/20' : 'bg-[#eef3ff] text-[#0f52ff] border-[#0f52ff]/20'}`}>
                       {selectedRun.status}
                    </span>
                    <span className="text-xs font-mono text-black/40">{selectedRun.id}</span>
                 </div>
                 <h2 className="text-xl font-semibold text-black leading-tight">{selectedRun.type}</h2>
                 <div className="text-sm text-black/60 mt-1">Mission: {selectedRun.mission}</div>
               </div>
               <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors -mr-2" onClick={() => setSelectedRunId(null)}>
                 <X className="size-5" />
               </button>
             </div>

             {/* Inspector Tabs */}
             <div className="flex border-b border-black/5 px-6 bg-white">
                {['Overview', 'Evidence', 'Claims', 'Logs', 'Certificate'].map((tab, i) => (
                   <button key={tab} className={`py-3 text-[13px] font-medium mr-5 border-b-2 ${i === 0 ? 'border-[#0f52ff] text-[#0f52ff]' : 'border-transparent text-black/50 hover:text-black transition-colors'}`}>
                      {tab}
                   </button>
                ))}
             </div>
             
             <div className="flex-1 overflow-y-auto bg-[#fafafa] p-6">
                
                {/* Pipeline Animation */}
                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-6">Verification Pipeline</h4>
                   
                   <div className="flex flex-col items-center">
                      <PipelineNode icon={<Database className="size-4"/>} label="Evidence Collected" sub={selectedRun.evidence + " Records"} delay={0} status={selectedRun.status} />
                      <PipelineEdge delay={0.2} />
                      <PipelineNode icon={<FileCheck className="size-4"/>} label="Claims Extracted" sub="18 Claims" delay={0.4} status={selectedRun.status} />
                      <PipelineEdge delay={0.6} />
                      <PipelineNode icon={<ShieldCheck className="size-4"/>} label="Verifier AI" sub={selectedRun.verifier} delay={0.8} status={selectedRun.status} pulse={selectedRun.status === 'RUNNING'} />
                      <PipelineEdge delay={1.0} />
                      <PipelineNode icon={<Search className="size-4"/>} label="Contradiction Search" sub="0 Found" delay={1.2} status={selectedRun.status} pulse={selectedRun.status === 'RUNNING'} />
                      <PipelineEdge delay={1.4} />
                      <PipelineNode 
                         icon={selectedRun.status === 'FAIL' ? <XCircle className="size-4"/> : selectedRun.status === 'RUNNING' ? <Activity className="size-4"/> : <CheckCircle2 className="size-4"/>} 
                         label={selectedRun.status} 
                         sub={selectedRun.status === 'FAIL' ? 'Policy Violation' : selectedRun.status === 'RUNNING' ? 'Computing...' : 'Verified'} 
                         delay={1.6} 
                         status={selectedRun.status}
                         final
                      />
                      {selectedRun.status === 'PASS' && (
                         <>
                            <PipelineEdge delay={1.8} />
                            <PipelineNode icon={<Fingerprint className="size-4"/>} label="Certificate Issued" sub="Ready" delay={2.0} status="PASS" highlight />
                         </>
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

function MetricBox({ label, value, color, highlight }: any) {
  return (
    <div className={`bg-white rounded-md p-4 border ${highlight ? 'border-[#0f52ff]/40 shadow-[0_4px_20px_rgba(15,82,255,0.06)]' : 'border-black/5 shadow-sm'}`}>
      <div className="text-[11px] font-semibold text-black/50 mb-1">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${color === 'red' ? 'text-[#cf222e]' : color === 'green' ? 'text-[#2da44e]' : highlight ? 'text-[#0f52ff]' : 'text-black'}`}>
         {value}
      </div>
    </div>
  )
}

function RunCard({ run, isSelected, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group rounded-md border bg-white p-5 cursor-pointer transition-all flex items-center gap-6 ${isSelected ? 'border-[#0f52ff] shadow-[0_8px_30px_rgba(15,82,255,0.08)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="shrink-0 flex items-center justify-center">
         <div className={`size-12 rounded-full border-4 flex items-center justify-center ${run.status === 'PASS' ? 'border-[#e6ffec] bg-[#2da44e] text-[#F0EFE2]' : run.status === 'FAIL' ? 'border-[#ffebe9] bg-[#cf222e] text-[#F0EFE2]' : 'border-[#eef3ff] bg-[#0f52ff] text-[#F0EFE2]'}`}>
            {run.status === 'PASS' ? <CheckCircle2 className="size-6" /> : run.status === 'FAIL' ? <XCircle className="size-6" /> : <Activity className="size-6 animate-pulse" />}
         </div>
      </div>
      
      <div className="flex-1 min-w-0">
         <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-black truncate">{run.type}</h3>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${run.status === 'PASS' ? 'bg-[#e6ffec] text-[#2da44e] border-[#2da44e]/20' : run.status === 'FAIL' ? 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]/20' : 'bg-[#eef3ff] text-[#0f52ff] border-[#0f52ff]/20'}`}>
               {run.status}
            </div>
         </div>
         
         <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col">
               <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-0.5">Mission</span>
               <span className="text-black font-medium truncate">{run.mission}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-0.5">Verifier</span>
               <span className="text-black truncate">{run.verifier}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-0.5">Metrics</span>
               <span className="text-black/70 truncate">{run.time} • {run.evidence} Evid.</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40 mb-0.5">Confidence</span>
               <span className="text-black font-mono font-medium">{run.confidence}</span>
            </div>
         </div>
      </div>
      
      <div className="shrink-0 pl-4 border-l border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-1 text-[#0f52ff] text-sm font-medium">
            Report <ArrowRight className="size-4" />
         </div>
      </div>
    </div>
  )
}

// Pipeline Animation Components
function PipelineNode({ icon, label, sub, delay, status, highlight, pulse, final }: any) {
   return (
      <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay, duration: 0.4 }}
         className={`w-full max-w-[280px] p-3 rounded-md border flex items-center gap-3 relative z-10 transition-colors ${highlight ? 'bg-[#0f52ff] border-[#0f52ff] text-[#F0EFE2] shadow-lg' : final && status === 'FAIL' ? 'bg-[#cf222e] border-[#cf222e] text-[#F0EFE2] shadow-lg' : final && status === 'PASS' ? 'bg-[#2da44e] border-[#2da44e] text-[#F0EFE2] shadow-lg' : 'bg-white border-black/10 shadow-sm'}`}
      >
         <div className={`size-8 rounded-md flex items-center justify-center shrink-0 ${highlight || final ? 'bg-white/20' : 'bg-black/5'}`}>
            <div className={pulse ? 'animate-pulse' : ''}>{icon}</div>
         </div>
         <div>
            <div className={`text-sm font-semibold ${highlight || final ? 'text-[#F0EFE2]' : 'text-black'}`}>{label}</div>
            <div className={`text-xs ${highlight || final ? 'text-[#F0EFE2]/80' : 'text-black/50'}`}>{sub}</div>
         </div>
      </motion.div>
   )
}

function PipelineEdge({ delay }: { delay: number }) {
   return (
      <motion.div 
         initial={{ height: 0, opacity: 0 }}
         animate={{ height: 24, opacity: 1 }}
         transition={{ delay, duration: 0.3 }}
         className="w-px bg-black/20 my-0 relative flex justify-center"
      >
         <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 24, opacity: 1 }}
            transition={{ delay: delay + 0.1, duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
            className="absolute top-0 size-1.5 rounded-full bg-[#0f52ff]"
         />
      </motion.div>
   )
}
