"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, TrendingUp, TrendingDown, ShieldCheck, Clock, CheckCircle2, GitPullRequest, Database, Zap, ArrowRight, ArrowDown, Activity, ChevronRight, X } from "lucide-react"

const MOCK_OUTCOMES = [
  { id: "sm-241", title: "SDK Updated across Fleet", impact: "High", savings: "6 hrs/wk", risk: "-12%", repos: 42, prs: 18, verification: "PASS" },
  { id: "sm-240", title: "Legacy API Deprecated", impact: "Medium", savings: "2 hrs/wk", risk: "-5%", repos: 12, prs: 4, verification: "PASS" },
  { id: "sm-239", title: "Security Patch Applied", impact: "Low", savings: "0 hrs", risk: "0%", repos: 2, prs: 0, verification: "FAIL" },
]

export function SettlementOutcomes() {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null)
  
  const selectedOutcome = MOCK_OUTCOMES.find(o => o.id === selectedOutcomeId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedOutcome ? 'lg:w-[500px] lg:flex-none border-r border-black/10' : 'w-full'}`}>
        
        {/* Header & Global Impact */}
        <div className="p-8 border-b border-black/5 bg-white">
           <h1 className="text-2xl font-bold tracking-tight text-black mb-1">Business Outcomes</h1>
           <p className="text-sm text-black/50 mb-8">Measurable impact and changes applied to the institution.</p>
           
           <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <ImpactMetric label="Risk Reduced" value="42%" trend="up" icon={<ShieldCheck/>} />
              <ImpactMetric label="Time Saved" value="1,204h" trend="up" icon={<Clock/>} />
              <ImpactMetric label="Incidents Prevented" value="18" trend="up" icon={<Zap/>} />
              <ImpactMetric label="Successful Outcomes" value="8,402" icon={<Target/>} />
              <ImpactMetric label="Failed Rollouts" value="23" trend="down" icon={<Activity/>} />
              <ImpactMetric label="Institution Score" value="A+" highlight icon={<TrendingUp/>} />
           </div>
        </div>

        {/* Outcomes List */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa] custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_OUTCOMES.map(outcome => (
                 <div 
                    key={outcome.id}
                    onClick={() => setSelectedOutcomeId(outcome.id)}
                    className={`group cursor-pointer rounded-md bg-white border overflow-hidden transition-all flex flex-col relative ${selectedOutcomeId === outcome.id ? 'border-[#0f52ff] shadow-[0_12px_40px_rgba(15,82,255,0.1)] ring-2 ring-[#0f52ff]/20 z-10 scale-[1.02]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md hover:-translate-y-1'}`}
                 >
                    <div className="p-6 border-b border-black/5">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-black leading-tight">{outcome.title}</h3>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${outcome.impact === 'High' ? 'bg-[#eef3ff] text-[#0f52ff]' : outcome.impact === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-black/5 text-black/50'}`}>
                             {outcome.impact} Impact
                          </div>
                       </div>
                       <div className="text-[10px] font-mono text-black/40">Settlement ID: {outcome.id}</div>
                    </div>
                    
                    <div className="p-6 bg-[#fafafa] flex-1">
                       <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-4">
                          <div className="flex items-center gap-2">
                             <Database className="size-4 text-black/30" />
                             <span className="font-semibold">{outcome.repos} Repos</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <GitPullRequest className="size-4 text-black/30" />
                             <span className="font-semibold">{outcome.prs} PRs Merged</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <ShieldCheck className={`size-4 ${outcome.verification === 'PASS' ? 'text-[#2da44e]' : 'text-[#cf222e]'}`} />
                             <span className={`font-semibold ${outcome.verification === 'PASS' ? 'text-[#2da44e]' : 'text-[#cf222e]'}`}>Verify {outcome.verification}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Activity className="size-4 text-black/30" />
                             <span className="font-semibold">0 Failures</span>
                          </div>
                       </div>
                       
                       <div className="pt-4 mt-2 border-t border-black/5 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                             <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-black/40">Time Saved</div>
                                <div className="font-bold text-[#2da44e]">{outcome.savings}</div>
                             </div>
                             <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-black/40">Risk</div>
                                <div className="font-bold text-[#2da44e]">{outcome.risk}</div>
                             </div>
                          </div>
                          <ChevronRight className="size-5 text-black/20 group-hover:text-[#0f52ff] transition-colors" />
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Deep Dive Inspector (The Operational Story) */}
      <AnimatePresence>
        {selectedOutcome && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 bg-white flex flex-col relative z-20 overflow-hidden shadow-2xl border-l border-black/10"
          >
             <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#fafafa]">
               <div>
                  <div className="text-[#0f52ff] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                     Operational Story Analysis
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-black">{selectedOutcome.title}</h2>
               </div>
               <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors" onClick={() => setSelectedOutcomeId(null)}>
                 <X className="size-6" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar flex flex-col">
                
                {/* 1. Value Chain Graph */}
                <div className="mb-12">
                   <h4 className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-6">Value Generation Chain</h4>
                   <div className="flex justify-between items-center">
                      <ChainNode label="Mission" detail="Goal defined" status="done" />
                      <ChainEdge />
                      <ChainNode label="Execution" detail="Workers coordinated" status="done" />
                      <ChainEdge />
                      <ChainNode label="Result" detail="Code modified" status="done" />
                      <ChainEdge />
                      <ChainNode label="Business Outcome" detail="Hours saved" status="done" highlight />
                      <ChainEdge />
                      <ChainNode label="Institution Impact" detail="Risk reduced" status="done" highlight />
                   </div>
                </div>
                
                {/* 2. Before / After Timeline Comparison */}
                <div className="flex-1 flex flex-col">
                   <h4 className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-6">Institution State Comparison</h4>
                   
                   <div className="flex-1 grid grid-cols-2 gap-8 relative">
                      {/* Divider */}
                      <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 flex justify-center items-center">
                         <div className="bg-white p-2 rounded-full border border-black/10">
                            <ArrowRight className="size-4 text-black/30" />
                         </div>
                      </div>
                      
                      {/* BEFORE */}
                      <div className="bg-[#fff0f0]/30 border border-[#cf222e]/10 rounded-md p-6 flex flex-col">
                         <div className="flex items-center gap-2 text-[#cf222e] font-bold text-sm uppercase tracking-widest mb-6">
                            <Clock className="size-4" /> Before Mission
                         </div>
                         <div className="space-y-4 flex-1">
                            <ComparisonItem icon={<Database/>} title="Legacy SDK v1.2" desc="Present in 42 repositories" type="bad" />
                            <ComparisonItem icon={<ShieldCheck/>} title="Known Vulnerability" desc="CVE-2025-1049 active" type="bad" />
                            <ComparisonItem icon={<Clock/>} title="Manual Updates" desc="Requires 6 engineer hours weekly" type="bad" />
                         </div>
                      </div>
                      
                      {/* AFTER */}
                      <div className="bg-[#f0fff4]/30 border border-[#2da44e]/10 rounded-md p-6 flex flex-col shadow-[0_8px_30px_rgba(45,164,78,0.05)]">
                         <div className="flex items-center gap-2 text-[#2da44e] font-bold text-sm uppercase tracking-widest mb-6">
                            <CheckCircle2 className="size-4" /> After Settlement
                         </div>
                         <div className="space-y-4 flex-1">
                            <ComparisonItem icon={<Database/>} title="Modern SDK v2.0" desc="Successfully migrated 42/42" type="good" />
                            <ComparisonItem icon={<ShieldCheck/>} title="Vulnerability Resolved" desc="Cryptographically verified" type="good" />
                            <ComparisonItem icon={<Clock/>} title="Automated" desc="0 manual hours required" type="good" />
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ImpactMetric({ label, value, icon, trend, highlight }: any) {
   return (
      <div className={`p-4 rounded-md border flex flex-col justify-between ${highlight ? 'bg-[#0f52ff] border-[#0f52ff] text-white shadow-lg' : 'bg-white border-black/5 shadow-sm text-black'}`}>
         <div className="flex justify-between items-start mb-2">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-white/70' : 'text-black/50'}`}>{label}</div>
            <div className={highlight ? 'text-white' : 'text-black/40'}>{icon}</div>
         </div>
         <div className="flex items-end gap-2">
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {trend === 'up' && <TrendingUp className={`size-4 mb-1 ${highlight ? 'text-white' : 'text-[#2da44e]'}`} />}
            {trend === 'down' && <TrendingDown className={`size-4 mb-1 ${highlight ? 'text-white' : 'text-[#cf222e]'}`} />}
         </div>
      </div>
   )
}

function ChainNode({ label, detail, status, highlight }: any) {
   return (
      <div className={`flex flex-col items-center text-center relative z-10 w-[140px] p-3 rounded-md border ${highlight ? 'bg-[#0f52ff] border-[#0f52ff] text-white shadow-md scale-110' : 'bg-white border-black/10'}`}>
         <div className={`text-xs font-bold mb-0.5 ${highlight ? 'text-white' : 'text-black'}`}>{label}</div>
         <div className={`text-[10px] ${highlight ? 'text-white/80' : 'text-black/50'}`}>{detail}</div>
      </div>
   )
}

function ChainEdge() {
   return (
      <div className="flex-1 h-px bg-black/10 mx-2 relative">
         <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-3 text-black/20" />
      </div>
   )
}

function ComparisonItem({ icon, title, desc, type }: any) {
   return (
      <div className={`flex items-start gap-3 p-3 rounded-md border ${type === 'good' ? 'bg-white border-[#2da44e]/20 text-black' : 'bg-white border-[#cf222e]/20 text-black'}`}>
         <div className={`p-2 rounded flex-shrink-0 ${type === 'good' ? 'bg-[#e6ffec] text-[#2da44e]' : 'bg-[#ffebe9] text-[#cf222e]'}`}>
            {icon}
         </div>
         <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-black/60">{desc}</div>
         </div>
      </div>
   )
}
