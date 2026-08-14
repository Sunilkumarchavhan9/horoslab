"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldCheck, Activity, Clock, CheckCircle2, XCircle, ChevronRight, FileText, FileCheck, Check, Database, X, ArrowRight, DollarSign, Users, Target, BookOpen, Fingerprint } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_RESULTS = [
  { id: "sm-241", title: "SDK Migration", institution: "Engineering", duration: "18m", workers: 6, evidence: 42, verification: "PASS", cost: "$4.32", status: "COMPLETE", date: "Today, 11:45 AM" },
  { id: "sm-240", title: "API Deprecation", institution: "Engineering", duration: "45m", workers: 12, evidence: 128, verification: "PASS", cost: "$12.50", status: "COMPLETE", date: "Yesterday, 2:10 PM" },
  { id: "sm-239", title: "Security Patch", institution: "DevOps", duration: "1h 12m", workers: 4, evidence: 14, verification: "FAIL", cost: "$1.20", status: "FAILED", date: "Oct 12, 2026" },
]

export function SettlementMissionResults() {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)
  
  const selectedResult = MOCK_RESULTS.find(r => r.id === selectedResultId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">Mission Results</h1>
              <p className="text-sm text-black/50 mt-1">The complete operational memory of every settled mission.</p>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="outline" className="bg-white border-black/10 text-black/70 shadow-sm h-9 px-4 text-sm font-medium">
                  <FileText className="size-4 mr-2" /> Export
               </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
             <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
               <input 
                 type="text"
                 placeholder="Search Mission, Institution, Status..."
                 className="w-full pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
               />
             </div>
             <Button variant="outline" className="h-9 px-4 border-black/10 text-black/70 bg-white shadow-sm">
                <Filter className="size-3.5 mr-2" /> Filters
             </Button>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             <MetricBox label="Completed" value="8,402" color="green" />
             <MetricBox label="Failed" value="124" color="red" />
             <MetricBox label="Avg Cost" value="$2.40" />
             <MetricBox label="Avg Duration" value="14m" />
             <MetricBox label="Success Rate" value="98.5%" />
          </div>
        </div>

        {/* List Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa] custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {MOCK_RESULTS.map((result) => (
              <ResultCard 
                key={result.id} 
                result={result} 
                isSelected={selectedResultId === result.id}
                onClick={() => setSelectedResultId(result.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Deep Dive Inspector */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-[500px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.04)] relative z-20"
          >
             <div className="p-6 border-b border-black/5 flex justify-between items-start bg-[#fafafa]">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${selectedResult.status === 'COMPLETE' ? 'bg-[#e6ffec] text-[#2da44e] border-[#2da44e]/20' : 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]/20'}`}>
                       Settlement {selectedResult.status}
                    </span>
                    <span className="text-xs font-mono text-black/40">{selectedResult.id}</span>
                 </div>
                 <h2 className="text-2xl font-bold text-black leading-tight">{selectedResult.title}</h2>
                 <div className="text-sm text-black/60 mt-1">Closed {selectedResult.date}</div>
               </div>
               <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors -mr-2" onClick={() => setSelectedResultId(null)}>
                 <X className="size-5" />
               </button>
             </div>

             {/* Inspector Tabs */}
             <div className="flex border-b border-black/5 px-6 bg-[#fafafa]">
                {['Overview', 'Execution', 'Evidence', 'Verification', 'Audit', 'Learning'].map((tab, i) => (
                   <button key={tab} className={`py-3 text-[13px] font-medium mr-5 border-b-2 ${i === 0 ? 'border-[#0f52ff] text-[#0f52ff]' : 'border-transparent text-black/50 hover:text-black transition-colors'}`}>
                      {tab}
                   </button>
                ))}
             </div>
             
             <div className="flex-1 overflow-y-auto bg-white p-6 space-y-8 custom-scrollbar">
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="border border-black/10 rounded-md p-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black/40 mb-2"><DollarSign className="size-3"/> Total Cost</div>
                      <div className="text-2xl font-bold text-black">{selectedResult.cost}</div>
                   </div>
                   <div className="border border-black/10 rounded-md p-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black/40 mb-2"><Clock className="size-3"/> Duration</div>
                      <div className="text-2xl font-bold text-black">{selectedResult.duration}</div>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider">Settlement Links</h4>
                   
                   <InspectorLink icon={<Activity/>} title="Execution Summary" detail={`${selectedResult.workers} Workers Coordinated`} />
                   <InspectorLink icon={<Database/>} title="Evidence Gathered" detail={`${selectedResult.evidence} Immutable Artifacts`} />
                   <InspectorLink icon={<ShieldCheck/>} title="Verification" detail={`Status: ${selectedResult.verification}`} color={selectedResult.verification === 'PASS' ? 'text-[#2da44e]' : 'text-[#cf222e]'} />
                   <InspectorLink icon={<Fingerprint/>} title="Audit Ledger" detail="View Cryptographic Signatures" />
                   <InspectorLink icon={<BookOpen/>} title="Learning & Feedback" detail="2 Patterns Extracted" />
                </div>
                
                <div className="pt-4 border-t border-black/5">
                   <Button className="w-full bg-[#0f52ff] hover:bg-[#0a38b5] text-white">
                      View Full Settlement Report <ArrowRight className="size-4 ml-2" />
                   </Button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InspectorLink({ icon, title, detail, color }: any) {
   return (
      <div className="group cursor-pointer border border-black/5 hover:border-[#0f52ff]/30 hover:bg-[#eef3ff]/50 rounded-md p-4 flex items-center justify-between transition-all">
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md bg-black/5 text-black/60 group-hover:bg-[#0f52ff]/10 group-hover:text-[#0f52ff] transition-colors ${color || ''}`}>
               {icon}
            </div>
            <div>
               <div className="text-sm font-semibold text-black">{title}</div>
               <div className="text-xs text-black/50">{detail}</div>
            </div>
         </div>
         <ChevronRight className="size-4 text-black/20 group-hover:text-[#0f52ff] transition-colors" />
      </div>
   )
}

function MetricBox({ label, value, color }: any) {
  return (
    <div className="bg-white rounded-md p-4 border border-black/5 shadow-sm">
      <div className="text-[11px] font-semibold text-black/50 mb-1">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${color === 'red' ? 'text-[#cf222e]' : color === 'green' ? 'text-[#2da44e]' : 'text-black'}`}>
         {value}
      </div>
    </div>
  )
}

function ResultCard({ result, isSelected, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group rounded-md border bg-white cursor-pointer transition-all flex flex-col ${isSelected ? 'border-[#0f52ff] shadow-[0_8px_30px_rgba(15,82,255,0.08)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="p-5 border-b border-black/5 flex justify-between items-start bg-[#fafafa] rounded-t-xl">
         <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">{result.institution}</span>
               <span className="text-[10px] text-black/30">•</span>
               <span className="text-[10px] font-mono text-black/40">{result.id}</span>
            </div>
            <h3 className="text-lg font-bold text-black">{result.title}</h3>
         </div>
         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${result.status === 'COMPLETE' ? 'bg-[#e6ffec] text-[#2da44e] border-[#2da44e]/20' : 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]/20'}`}>
            {result.status}
         </div>
      </div>
      
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white rounded-b-xl">
         <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1 flex items-center gap-1"><Clock className="size-3"/> Duration</span>
            <span className="text-black font-medium">{result.duration}</span>
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1 flex items-center gap-1"><Users className="size-3"/> Workers</span>
            <span className="text-black">{result.workers}</span>
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1 flex items-center gap-1"><Database className="size-3"/> Evidence</span>
            <span className="text-black">{result.evidence}</span>
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1 flex items-center gap-1"><ShieldCheck className="size-3"/> Verification</span>
            <span className={`font-bold ${result.verification === 'PASS' ? 'text-[#2da44e]' : 'text-[#cf222e]'}`}>{result.verification}</span>
         </div>
         <div className="flex flex-col col-span-2 md:col-span-4 pt-3 mt-1 border-t border-black/5 flex-row justify-between items-center">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 flex items-center gap-1"><DollarSign className="size-3"/> Cost</span>
               <span className="text-black font-mono font-semibold">{result.cost}</span>
            </div>
            <div className="text-[11px] font-semibold text-[#0f52ff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               Open Settlement <ArrowRight className="size-3" />
            </div>
         </div>
      </div>
    </div>
  )
}
