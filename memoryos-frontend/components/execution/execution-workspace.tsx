"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Target, Activity, FileText, Terminal, Brain, FileKey2, Download, ArrowLeft, Share2, Search, X, Cpu, GitPullRequest, Code2, Play, Pause, SkipBack, FastForward, CheckCircle2, User } from "lucide-react"
import { Button } from "@/components/ui/button"

import { ExecutionPlanner } from "./planner"
import { ExecutionWorkers } from "./workers"
import { ExecutionReviews } from "./reviews"
import { ExecutionApprovals } from "./approvals"
import { ExecutionTimeline } from "./timeline"

export function ExecutionWorkspace({ initialLens = 'planner' }: { initialLens?: string }) {
  const [activeLens, setActiveLens] = useState(initialLens === 'human-approvals' ? 'approvals' : initialLens)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(50)

  useEffect(() => {
    setActiveLens(initialLens === 'human-approvals' ? 'approvals' : initialLens || 'planner')
  }, [initialLens])

  const lenses = [
    { id: 'planner', label: 'Planner', icon: <Target className="size-4" /> },
    { id: 'workers', label: 'Workers', icon: <Cpu className="size-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <GitPullRequest className="size-4" /> },
    { id: 'approvals', label: 'Approvals', icon: <ShieldCheck className="size-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Play className="size-4" /> },
  ]

  const TIMELINE_STEPS = [
    { id: "s1", time: "11:20", label: "Mission Started", progress: 0 },
    { id: "s2", time: "11:22", label: "Planner Finished", progress: 15 },
    { id: "s3", time: "11:24", label: "Claude Started", progress: 30 },
    { id: "s4", time: "11:30", label: "PR Created", progress: 50 },
    { id: "s5", time: "11:32", label: "Review Started", progress: 65 },
    { id: "s6", time: "11:38", label: "Approval", progress: 80 },
    { id: "s7", time: "11:41", label: "Verification", progress: 92 },
    { id: "s8", time: "11:42", label: "Settlement", progress: 100 },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafa]">
      
      {/* Mission Header */}
      <div className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-black flex items-center gap-2">
               <Target className="size-5 text-[#0f52ff]" /> Mission #194
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#eef3ff] text-[#0f52ff]">
              <Activity className="size-3 animate-pulse" /> Running
            </div>
            <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
              High Risk
            </div>
          </div>
          <p className="text-xs text-black/50">API Migration and Refactoring</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-md">
           {lenses.map(lens => (
              <button 
                key={lens.id}
                onClick={() => setActiveLens(lens.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeLens === lens.id ? 'bg-white text-[#0f52ff] shadow-sm' : 'text-black/60 hover:text-black hover:bg-white/50'}`}
              >
                 {lens.icon} {lens.label}
              </button>
           ))}
        </div>
      </div>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
         
         {/* Left: Timeline Replay Scrubber */}
         <div className="w-[280px] bg-white border-r border-black/5 flex flex-col shrink-0">
            <div className="p-4 border-b border-black/5 font-semibold text-black text-sm flex items-center justify-between">
               Execution Timeline
               <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-black/5 rounded"><SkipBack className="size-3.5 text-black/50" /></button>
                  <button className="p-1 hover:bg-black/5 rounded text-[#0f52ff]" onClick={() => setIsPlaying(!isPlaying)}>
                     {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <button className="p-1 hover:bg-black/5 rounded"><FastForward className="size-3.5 text-black/50" /></button>
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
                           
                           <div className={`text-sm font-semibold transition-colors ${isCurrent ? 'text-[#0f52ff]' : isPassed ? 'text-black' : 'text-black/40'}`}>
                              {step.label}
                           </div>
                           <div className="text-xs text-black/40">{step.time}</div>
                        </div>
                     )
                  })}
               </div>
            </div>
         </div>

         {/* Center: Live Execution Canvas (The Active Lens) */}
         <div className="flex-1 bg-[#fafafa] relative overflow-hidden flex flex-col min-w-0">
            {activeLens === 'planner' && <ExecutionPlanner />}
            {activeLens === 'workers' && <ExecutionWorkers />}
            {activeLens === 'reviews' && <ExecutionReviews />}
            {activeLens === 'approvals' && <ExecutionApprovals />}
            {activeLens === 'timeline' && <ExecutionTimeline />}
         </div>
      </div>
    </div>
  )
}
