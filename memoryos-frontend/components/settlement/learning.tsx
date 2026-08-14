"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Lightbulb, AlertTriangle, CheckCircle2, TrendingUp, GitMerge, FileText, Settings, ArrowRight, ArrowDown, Network, Target, ChevronRight, X } from "lucide-react"

const MOCK_LEARNINGS = [
  { id: "L-841", observation: "Security Review consistently delays deployment by 4h.", recommendation: "Assign Security Agent in parallel during PR creation.", confidence: "97%", status: "APPLIED", impact: "High" },
  { id: "L-840", observation: "Missing test coverage causes Verifier rejection.", recommendation: "Require Jest Runner execution before human review.", confidence: "92%", status: "PENDING", impact: "Medium" },
  { id: "L-839", observation: "Database Migrations fail on staging timeouts.", recommendation: "Increase staging DB timeout to 60s in config.", confidence: "85%", status: "DISMISSED", impact: "Low" },
]

export function SettlementLearning() {
  const [selectedLearningId, setSelectedLearningId] = useState<string | null>(null)
  
  const selectedLearning = MOCK_LEARNINGS.find(l => l.id === selectedLearningId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedLearning ? 'lg:w-[500px] lg:flex-none border-r border-black/10' : 'w-full'}`}>
        
        {/* Header */}
        <div className="p-8 border-b border-black/5 bg-white">
           <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-black">Institution Evolution</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#eef3ff] text-[#0f52ff]">
                 <Brain className="size-3" /> AI Feedback Loop
              </div>
           </div>
           <p className="text-sm text-black/50 mb-8">Continuous operational insights extracted from settled missions.</p>
           
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Metric label="Patterns Learned" value="24" icon={<Network/>} highlight />
              <Metric label="Repeated Failures" value="3" icon={<AlertTriangle/>} color="text-[#cf222e]" />
              <Metric label="Successful Missions" value="8,402" icon={<CheckCircle2/>} color="text-[#2da44e]" />
              <Metric label="Recommendations" value="12" icon={<Lightbulb/>} />
              <Metric label="Institution Fitness" value="98%" icon={<TrendingUp/>} color="text-[#0f52ff]" />
           </div>
        </div>

        {/* Learnings Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa] custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_LEARNINGS.map(learning => (
                 <div 
                    key={learning.id}
                    onClick={() => setSelectedLearningId(learning.id)}
                    className={`group cursor-pointer rounded-md bg-white border overflow-hidden transition-all flex flex-col relative ${selectedLearningId === learning.id ? 'border-[#0f52ff] shadow-[0_12px_40px_rgba(15,82,255,0.1)] ring-2 ring-[#0f52ff]/20 z-10 scale-[1.02]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md hover:-translate-y-1'}`}
                 >
                    <div className="p-6 border-b border-black/5 bg-[#fafafa]">
                       <div className="text-[10px] font-bold uppercase tracking-wider text-[#0f52ff] mb-2 flex items-center gap-1.5">
                          <Brain className="size-3" /> Observation Extracted
                       </div>
                       <h3 className="text-lg font-bold text-black leading-snug">{learning.observation}</h3>
                    </div>
                    
                    <div className="p-6 bg-white flex-1">
                       <div className="text-[10px] font-bold uppercase tracking-wider text-[#2da44e] mb-2 flex items-center gap-1.5">
                          <Lightbulb className="size-3" /> AI Recommendation
                       </div>
                       <p className="text-sm text-black/80 font-medium mb-6">"{learning.recommendation}"</p>
                       
                       <div className="grid grid-cols-3 gap-2">
                          <div className="border border-black/5 rounded-md p-2 bg-[#fafafa]">
                             <div className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Confidence</div>
                             <div className="font-bold text-black">{learning.confidence}</div>
                          </div>
                          <div className="border border-black/5 rounded-md p-2 bg-[#fafafa]">
                             <div className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Impact</div>
                             <div className="font-bold text-black">{learning.impact}</div>
                          </div>
                          <div className="border border-black/5 rounded-md p-2 bg-[#fafafa]">
                             <div className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Status</div>
                             <div className={`font-bold ${learning.status === 'APPLIED' ? 'text-[#2da44e]' : learning.status === 'DISMISSED' ? 'text-[#cf222e]' : 'text-yellow-600'}`}>
                                {learning.status}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
           
           {/* Institution Evolution Trend */}
           <div className="mt-8 bg-white border border-black/10 rounded-md p-8">
              <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-8 flex items-center gap-2">
                 <TrendingUp className="size-4 text-[#0f52ff]" /> Institution Version Progression
              </h4>
              <div className="flex items-center justify-between">
                 <VersionNode version="v11" detail="High failure rate" />
                 <VersionEdge />
                 <VersionNode version="v12" detail="Security policies fixed" />
                 <VersionEdge />
                 <VersionNode version="v13" detail="Tests automated" />
                 <VersionEdge />
                 <VersionNode version="v14" detail="Current (98% Fitness)" highlight />
              </div>
           </div>
        </div>
      </div>

      {/* Deep Dive Inspector (Pattern Explorer) */}
      <AnimatePresence>
        {selectedLearning && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 bg-white flex flex-col relative z-20 overflow-hidden shadow-2xl border-l border-black/10"
          >
             <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#fafafa]">
               <div>
                  <div className="text-[#0f52ff] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Network className="size-4" /> Pattern Explorer
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-black">{selectedLearning.id}</h2>
               </div>
               <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors" onClick={() => setSelectedLearningId(null)}>
                 <X className="size-6" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-12 bg-[#fafafa] custom-scrollbar flex flex-col items-center">
                
                {/* Pattern Graph */}
                <div className="w-full max-w-sm flex flex-col">
                   
                   <PatternNode 
                      icon={<Target/>} title="Originating Missions" 
                      detail="Found in 14 settled missions"
                      type="source"
                   />
                   <PatternEdge />
                   
                   <PatternNode 
                      icon={<Brain/>} title="Pattern Extracted" 
                      detail={selectedLearning.observation}
                      type="ai"
                   />
                   <PatternEdge />
                   
                   <PatternNode 
                      icon={<Lightbulb/>} title="AI Recommendation" 
                      detail={selectedLearning.recommendation}
                      type="insight"
                   />
                   <PatternEdge />
                   
                   <PatternNode 
                      icon={<GitMerge/>} title="Institution Proposal" 
                      detail="Merge into Agent Roster Policies"
                      type="action" highlight={selectedLearning.status === 'APPLIED'}
                      status={selectedLearning.status}
                   />
                   
                </div>
                
                {selectedLearning.status === 'APPLIED' && (
                   <div className="mt-12 bg-[#e6ffec] border border-[#2da44e]/30 p-6 rounded-md w-full max-w-md flex flex-col items-center text-center">
                      <div className="size-12 bg-[#2da44e] rounded-full flex items-center justify-center text-white mb-4">
                         <CheckCircle2 className="size-6" />
                      </div>
                      <h4 className="font-bold text-[#2da44e] text-lg mb-1">Institution Evolved</h4>
                      <p className="text-sm text-[#2da44e]/80">This recommendation has been successfully merged into the institution's core operating procedures (v14).</p>
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Metric({ label, value, icon, color, highlight }: any) {
   return (
      <div className={`p-4 rounded-md border flex flex-col justify-between ${highlight ? 'bg-[#0f52ff] border-[#0f52ff] text-white shadow-lg' : 'bg-white border-black/5 shadow-sm text-black'}`}>
         <div className="flex justify-between items-start mb-2">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-white/70' : 'text-black/50'}`}>{label}</div>
            <div className={highlight ? 'text-white' : color || 'text-black/40'}>{icon}</div>
         </div>
         <div className="text-2xl font-bold tracking-tight">{value}</div>
      </div>
   )
}

function VersionNode({ version, detail, highlight }: any) {
   return (
      <div className={`flex flex-col items-center text-center w-32 relative z-10 p-3 rounded-md border ${highlight ? 'bg-[#0f52ff] border-[#0f52ff] text-white scale-110 shadow-lg' : 'bg-white border-black/10 text-black'}`}>
         <div className={`font-bold mb-1 ${highlight ? 'text-white' : 'text-black'}`}>{version}</div>
         <div className={`text-[10px] ${highlight ? 'text-white/80' : 'text-black/50'}`}>{detail}</div>
      </div>
   )
}

function VersionEdge() {
   return (
      <div className="flex-1 h-px bg-black/10 mx-2 relative">
         <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-4 text-black/20" />
      </div>
   )
}

function PatternNode({ icon, title, detail, type, highlight, status }: any) {
   let border = 'border-black/10'
   let bg = 'bg-white'
   let iconColor = 'text-black/40'
   
   if (type === 'ai') { border = 'border-[#0f52ff]/30'; iconColor = 'text-[#0f52ff]' }
   if (type === 'insight') { border = 'border-yellow-500/30'; iconColor = 'text-yellow-600' }
   if (highlight) { border = 'border-[#2da44e]'; bg = 'bg-[#e6ffec]'; iconColor = 'text-[#2da44e]' }

   return (
      <div className={`w-full p-4 rounded-md border flex gap-4 items-center z-10 shadow-sm ${bg} ${border}`}>
         <div className={`p-3 rounded-md bg-black/5 ${iconColor}`}>{icon}</div>
         <div className="flex-1">
            <div className="flex justify-between items-start mb-0.5">
               <div className="font-bold text-black text-sm">{title}</div>
               {status && (
                  <div className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${status === 'APPLIED' ? 'bg-[#2da44e] text-white' : 'bg-black/10 text-black/60'}`}>{status}</div>
               )}
            </div>
            <div className="text-xs text-black/60 font-medium leading-relaxed">{detail}</div>
         </div>
      </div>
   )
}

function PatternEdge() {
   return (
      <div className="h-8 w-px bg-black/10 relative my-0 flex justify-center self-center">
         <div className="absolute bottom-0 w-2 h-2 border-r border-b border-black/10 transform rotate-45 translate-y-1" />
      </div>
   )
}
