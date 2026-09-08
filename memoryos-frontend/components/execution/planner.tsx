"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, RefreshCw, Play, Activity, Cpu, Code2, ShieldCheck, CheckCircle2, User, SearchCode, Beaker, Terminal, Clock, Box, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExecutionPlanner() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  return (
    <div className="flex h-full w-full bg-white relative">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header / KPIs */}
        <div className="p-6 border-b border-black/5 bg-[#fafafa]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold tracking-tight text-black">Mission #194</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#eef3ff] text-[#0f52ff]">
                  <Activity className="size-3 animate-pulse" /> Running
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                  High Risk
                </div>
              </div>
              <p className="text-sm text-black/50">API Migration and Refactoring</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
                <input 
                  type="text"
                  placeholder="Search plan..."
                  className="w-48 pl-9 pr-4 py-2 bg-white border border-black/5 hover:border-black/10 focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
                />
              </div>
              <Button variant="outline" className="rounded-full px-4 h-9 bg-white border-black/10 text-black/70">
                Strategy
              </Button>
              <Button variant="outline" className="rounded-full px-4 h-9 bg-white border-black/10 text-black/70">
                Runtime
              </Button>
              <Button variant="outline" className="rounded-full size-9 p-0 bg-white border-black/10 text-black/70">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
             <MetricCard label="Plan Score" value="94" suffix="/100" />
             <MetricCard label="Steps" value="12" />
             <MetricCard label="Running" value="2" highlight />
             <MetricCard label="ETA" value="4m 20s" />
             <MetricCard label="Cost" value="$0.84" />
             <MetricCard label="Confidence" value="98%" trend="+2%" trendUp />
          </div>
        </div>

        {/* Live Execution Canvas */}
        <div className="flex-1 overflow-auto bg-[#f8f9fa] relative custom-scrollbar flex items-start justify-center p-12">
          {/* Dot Grid Background */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          {/* Canvas Graph */}
          <div className="relative z-10 flex flex-col items-center">
             
             {/* Mission */}
             <PlannerNode 
                id="n1" title="Mission" subtitle="API Migration" icon={<TargetIcon />} status="COMPLETED"
                isSelected={selectedNode === 'n1'} onClick={() => setSelectedNode('n1')}
             />
             <VerticalEdge />
             
             {/* Strategy */}
             <PlannerNode 
                id="n2" title="Strategy" subtitle="Planner Agent" icon={<Activity />} status="COMPLETED"
                isSelected={selectedNode === 'n2'} onClick={() => setSelectedNode('n2')}
             />
             
             {/* Split */}
             <div className="relative h-12 w-[320px]">
                <div className="absolute top-0 left-1/2 w-px h-6 bg-black/10 -translate-x-1/2" />
                <div className="absolute top-6 left-0 right-0 h-px bg-black/10" />
                <div className="absolute top-6 left-0 w-px h-6 bg-black/10" />
                <div className="absolute top-6 right-0 w-px h-6 bg-black/10" />
             </div>
             
             {/* Research & Code Row */}
             <div className="flex gap-[160px]">
                <div className="flex flex-col items-center w-[160px]">
                   <PlannerNode 
                      id="n3" title="Research" subtitle="Claude 4" icon={<SearchCode />} status="COMPLETED"
                      isSelected={selectedNode === 'n3'} onClick={() => setSelectedNode('n3')}
                   />
                   <VerticalEdge />
                   <PlannerNode 
                      id="n5" title="Security" subtitle="SecOps Bot" icon={<ShieldAlert />} status="RUNNING" progress={45}
                      isSelected={selectedNode === 'n5'} onClick={() => setSelectedNode('n5')} hoverStats
                   />
                </div>
                <div className="flex flex-col items-center w-[160px]">
                   <PlannerNode 
                      id="n4" title="Code" subtitle="Claude 4" icon={<Code2 />} status="COMPLETED"
                      isSelected={selectedNode === 'n4'} onClick={() => setSelectedNode('n4')}
                   />
                   <VerticalEdge />
                   <PlannerNode 
                      id="n6" title="Unit Test" subtitle="Jest Runner" icon={<Beaker />} status="RUNNING" progress={80}
                      isSelected={selectedNode === 'n6'} onClick={() => setSelectedNode('n6')} hoverStats
                   />
                </div>
             </div>
             
             {/* Join */}
             <div className="relative h-12 w-[320px]">
                <div className="absolute top-0 left-0 w-px h-6 bg-black/10" />
                <div className="absolute top-0 right-0 w-px h-6 bg-black/10" />
                <div className="absolute top-6 left-0 right-0 h-px bg-black/10" />
                <div className="absolute top-6 left-1/2 w-px h-6 bg-black/10 -translate-x-1/2" />
             </div>
             
             {/* Human Review -> Verification -> Settlement */}
             <PlannerNode 
                id="n7" title="Human Review" subtitle="Engineering" icon={<User />} status="PENDING"
                isSelected={selectedNode === 'n7'} onClick={() => setSelectedNode('n7')}
             />
             <VerticalEdge />
             <PlannerNode 
                id="n8" title="Verification" subtitle="Security Core" icon={<ShieldCheck />} status="PENDING"
                isSelected={selectedNode === 'n8'} onClick={() => setSelectedNode('n8')}
             />
             <VerticalEdge />
             <PlannerNode 
                id="n9" title="Settlement" subtitle="Ledger" icon={<CheckCircle2 />} status="PENDING"
                isSelected={selectedNode === 'n9'} onClick={() => setSelectedNode('n9')}
             />
             
          </div>
        </div>
      </div>

      {/* Right Inspector */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-[400px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.03)] relative z-20"
          >
             <div className="p-5 border-b border-black/5 bg-[#fafafa] flex justify-between items-start">
               <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0f52ff] mb-1">Step Details</div>
                  <h3 className="text-xl font-semibold text-black">{selectedNode === 'n5' ? 'Security Review' : selectedNode === 'n6' ? 'Unit Testing' : 'Node Details'}</h3>
               </div>
               <button className="text-black/40 hover:text-black transition-colors" onClick={() => setSelectedNode(null)}>
                 <Terminal className="size-4" />
               </button>
             </div>
             
             <div className="p-5 flex-1 overflow-y-auto space-y-8">
                
                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Agent</h4>
                   <div className="flex items-center gap-3 p-3 bg-white border border-black/10 rounded-md">
                      <div className="size-8 rounded-full bg-black/5 flex items-center justify-center">
                         <Cpu className="size-4 text-black/60" />
                      </div>
                      <div>
                         <div className="text-sm font-semibold text-black">Claude 4</div>
                         <div className="text-xs text-black/50">Role: Security Auditor</div>
                      </div>
                      <div className="ml-auto text-[10px] font-bold bg-[#eef3ff] text-[#0f52ff] px-2 py-0.5 rounded uppercase">Running</div>
                   </div>
                </div>

                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Inputs</h4>
                   <div className="space-y-2">
                      <div className="text-sm border border-black/5 p-2 rounded flex items-center gap-2">
                         <Code2 className="size-3.5 text-black/40" />
                         <span className="text-black/70">src/api/auth.ts (Modified)</span>
                      </div>
                      <div className="text-sm border border-black/5 p-2 rounded flex items-center gap-2">
                         <Box className="size-3.5 text-black/40" />
                         <span className="text-black/70">Dependencies context</span>
                      </div>
                   </div>
                </div>
                
                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Outputs</h4>
                   <div className="text-sm text-black/40 italic p-3 border border-black/5 rounded bg-[#fafafa]">
                      Generating outputs... (Estimated 14s remaining)
                   </div>
                </div>
                
                <div>
                   <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Evidence Linked</h4>
                   <div className="flex items-center justify-between p-3 border border-black/10 rounded-md hover:border-black/20 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 text-sm text-black/70">
                         <ShieldCheck className="size-4 text-[#0f52ff]" />
                         <span>18 Artifacts generated</span>
                      </div>
                      <span className="text-[#0f52ff] text-xs font-semibold">View</span>
                   </div>
                </div>
                
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetricCard({ label, value, suffix, trend, trendUp, highlight }: any) {
  return (
    <div className={`bg-white rounded-md p-3 border ${highlight ? 'border-[#0f52ff]/30 shadow-[0_0_15px_rgba(15,82,255,0.08)]' : 'border-black/5 shadow-sm'}`}>
      <div className="text-[10px] text-black/40 font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-end justify-between">
        <div className={`text-xl font-bold tracking-tight ${highlight ? 'text-[#0f52ff]' : 'text-black'}`}>
          {value}{suffix && <span className="text-sm font-medium text-black/40 ml-0.5">{suffix}</span>}
        </div>
        {trend && (
          <div className={`text-[10px] font-bold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}

function PlannerNode({ id, title, subtitle, icon, status, progress, isSelected, hoverStats, onClick }: any) {
   
   return (
      <div className="relative group/node" onClick={onClick}>
         <div className={`
            w-[160px] p-3 rounded-md border cursor-pointer transition-all bg-white relative z-10 flex flex-col items-center text-center
            ${isSelected ? 'border-[#0f52ff] ring-1 ring-[#0f52ff] shadow-[0_8px_30px_rgba(15,82,255,0.12)] scale-105' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}
         `}>
            <div className={`size-8 rounded-md flex items-center justify-center mb-2 ${
               status === 'COMPLETED' ? 'bg-black/5 text-black/60' : 
               status === 'RUNNING' ? 'bg-[#0f52ff] text-[#F0EFE2] animate-pulse' : 
               'bg-white border border-black/10 text-black/30'
            }`}>
               {icon}
            </div>
            
            <h4 className="font-semibold text-black text-[13px] leading-tight mb-0.5">{title}</h4>
            <div className="text-[11px] text-black/50">{subtitle}</div>
            
            {status === 'RUNNING' && (
               <div className="w-full mt-3">
                  <div className="flex justify-between text-[9px] font-bold text-[#0f52ff] uppercase tracking-wider mb-1">
                     <span>Running</span>
                     <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#0f52ff] rounded-full" style={{ width: `${progress}%` }} />
                  </div>
               </div>
            )}
         </div>

         {/* Amazing Interaction Hover Stats */}
         {hoverStats && (
            <div className="absolute top-1/2 left-[180px] -translate-y-1/2 w-[200px] bg-black text-[#F0EFE2] p-3 rounded-md shadow-2xl opacity-0 group-hover/node:opacity-100 group-hover/node:translate-x-2 pointer-events-none transition-all z-50">
               <div className="text-[10px] font-bold text-[#F0EFE2]/50 uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Live Metrics</div>
               <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-[#F0EFE2]/60">CPU</span><span className="font-mono">82%</span></div>
                  <div className="flex justify-between"><span className="text-[#F0EFE2]/60">Tokens</span><span className="font-mono">4,021</span></div>
                  <div className="flex justify-between"><span className="text-[#F0EFE2]/60">Latency</span><span className="font-mono">142ms</span></div>
                  <div className="flex justify-between"><span className="text-[#F0EFE2]/60">Tool</span><span className="text-[#4ade80]">grep_search</span></div>
                  <div className="flex justify-between"><span className="text-[#F0EFE2]/60">File</span><span className="truncate max-w-[80px]">auth.ts</span></div>
               </div>
            </div>
         )}
      </div>
   )
}

function VerticalEdge() {
   return (
      <div className="h-8 w-px bg-black/10 relative my-0" />
   )
}

function TargetIcon() {
   return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="10" />
         <circle cx="12" cy="12" r="6" />
         <circle cx="12" cy="12" r="2" />
      </svg>
   )
}
