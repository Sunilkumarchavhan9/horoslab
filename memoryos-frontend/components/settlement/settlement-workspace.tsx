"use client"

import { useState, useEffect } from "react"
import { Archive, CheckCircle2, TrendingUp, Lock, Brain, FileText, Play, Pause, SkipBack, FastForward, Target, Activity, Database, ShieldCheck, Download } from "lucide-react"

import { SettlementMissionResults } from "./mission-results"
import { SettlementOutcomes } from "./outcomes"
import { SettlementAudit } from "./audit"
import { SettlementLearning } from "./learning"

export function SettlementWorkspace({ initialLens = 'mission-results' }: { initialLens?: string }) {
  const [activeLens, setActiveLens] = useState(initialLens)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (initialLens) setActiveLens(initialLens)
  }, [initialLens])

  const lenses = [
    { id: 'mission-results', label: 'Mission Results', icon: <Archive className="size-4" /> },
    { id: 'outcomes', label: 'Outcomes', icon: <TrendingUp className="size-4" /> },
    { id: 'audit', label: 'Audit', icon: <Lock className="size-4" /> },
    { id: 'learning', label: 'Learning', icon: <Brain className="size-4" /> },
  ]

  const TIMELINE_STEPS = [
    { id: "s1", time: "11:20", label: "Mission Started", icon: <Target className="size-4"/>, progress: 0 },
    { id: "s2", time: "11:22", label: "Execution", icon: <Activity className="size-4"/>, progress: 15 },
    { id: "s3", time: "11:24", label: "Evidence", icon: <Database className="size-4"/>, progress: 30 },
    { id: "s4", time: "11:26", label: "Verification", icon: <ShieldCheck className="size-4"/>, progress: 45 },
    { id: "s5", time: "11:32", label: "Outcome", icon: <TrendingUp className="size-4"/>, progress: 60 },
    { id: "s6", time: "11:45", label: "Audit Ledger", icon: <Lock className="size-4"/>, progress: 75 },
    { id: "s7", time: "11:50", label: "Learning", icon: <Brain className="size-4"/>, progress: 90 },
    { id: "s8", time: "12:00", label: "Institution Evolved", icon: <CheckCircle2 className="size-4"/>, progress: 100 },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafa]">
      
      {/* Settlement Header */}
      <div className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-black flex items-center gap-2">
               <Archive className="size-5 text-[#0f52ff]" /> Settlement Runtime
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black/60 border border-black/10">
              <Lock className="size-3" /> Immutable Record
            </div>
          </div>
          <p className="text-xs text-black/50">The operational memory, financial ledger, and learning history of the organization.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-md">
           {lenses.map(lens => (
              <button 
                key={lens.id}
                onClick={() => setActiveLens(lens.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeLens === lens.id ? 'bg-white text-black shadow-sm' : 'text-black/60 hover:text-black hover:bg-white/50'}`}
              >
                 <span className={activeLens === lens.id ? 'text-[#0f52ff]' : ''}>{lens.icon}</span> {lens.label}
              </button>
           ))}
        </div>
      </div>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
         
         {/* Left: Timeline Replay Scrubber */}
         <div className="w-[280px] bg-white border-r border-black/5 flex flex-col shrink-0">
            <div className="p-4 border-b border-black/5 font-semibold text-black text-sm flex items-center justify-between">
               Operational Story
               <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-black/5 rounded" onClick={() => setProgress(0)}><SkipBack className="size-3.5 text-black/50" /></button>
                  <button className="p-1 hover:bg-black/5 rounded text-[#0f52ff]" onClick={() => setIsPlaying(!isPlaying)}>
                     {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <button className="p-1 hover:bg-black/5 rounded" onClick={() => setProgress(100)}><FastForward className="size-3.5 text-black/50" /></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
               <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-2 before:w-px before:bg-black/10">
                  {TIMELINE_STEPS.map((step, idx) => {
                     const isPassed = progress >= step.progress
                     const isCurrent = progress >= step.progress && (idx === TIMELINE_STEPS.length - 1 || progress < TIMELINE_STEPS[idx+1].progress)
                     
                     return (
                        <div key={step.id} className="relative cursor-pointer group" onClick={() => setProgress(step.progress)}>
                           <div className={`absolute -left-[29px] top-1 size-4 rounded-full border-2 flex items-center justify-center transition-colors ${isCurrent ? 'bg-[#0f52ff] border-white shadow-[0_0_0_2px_rgba(15,82,255,0.2)]' : isPassed ? 'bg-[#0f52ff] border-white' : 'bg-white border-black/20 group-hover:border-black/40'}`}>
                              {isPassed && !isCurrent && <div className="size-1.5 bg-white rounded-full" />}
                              {isCurrent && <div className="size-1.5 bg-white rounded-full animate-pulse" />}
                           </div>
                           
                           <div className={`text-sm font-semibold transition-colors flex items-center gap-2 ${isCurrent ? 'text-[#0f52ff]' : isPassed ? 'text-black' : 'text-black/40'}`}>
                              {step.label}
                           </div>
                           <div className="text-xs text-black/40">{step.time}</div>
                        </div>
                     )
                  })}
               </div>
            </div>
         </div>

         {/* Center: Live Settlement Canvas (The Active Lens) */}
         <div className="flex-1 bg-[#fafafa] relative overflow-hidden flex flex-col min-w-0">
            {activeLens === 'mission-results' && <SettlementMissionResults />}
            {activeLens === 'outcomes' && <SettlementOutcomes />}
            {activeLens === 'audit' && <SettlementAudit />}
            {activeLens === 'learning' && <SettlementLearning />}
         </div>
      </div>
    </div>
  )
}
