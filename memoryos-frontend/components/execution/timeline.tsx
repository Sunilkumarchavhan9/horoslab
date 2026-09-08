"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, FastForward, SkipBack, ShieldCheck, Target, Activity, FileText, CheckCircle2, User, GitPullRequest, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const TIMELINE_STEPS = [
  { id: "s1", time: "11:20", label: "Mission Started", icon: <Target className="size-4"/>, progress: 0 },
  { id: "s2", time: "11:22", label: "Planner Finished", icon: <Activity className="size-4"/>, progress: 15 },
  { id: "s3", time: "11:24", label: "Claude Started", icon: <Code2 className="size-4"/>, progress: 30 },
  { id: "s4", time: "11:30", label: "PR Created", icon: <GitPullRequest className="size-4"/>, progress: 50 },
  { id: "s5", time: "11:32", label: "Review Started", icon: <FileText className="size-4"/>, progress: 65 },
  { id: "s6", time: "11:38", label: "Approval", icon: <User className="size-4"/>, progress: 80 },
  { id: "s7", time: "11:41", label: "Verification", icon: <ShieldCheck className="size-4"/>, progress: 92 },
  { id: "s8", time: "11:42", label: "Settlement", icon: <CheckCircle2 className="size-4"/>, progress: 100 },
]

export function ExecutionTimeline() {
  const [progress, setProgress] = useState(50) // 0 to 100
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Calculate which step is currently active based on progress
  const activeStepIndex = [...TIMELINE_STEPS].reverse().findIndex(s => progress >= s.progress)
  const activeStep = TIMELINE_STEPS[TIMELINE_STEPS.length - 1 - (activeStepIndex === -1 ? 0 : activeStepIndex)]

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafa]">
      
      <div className="p-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
         
         <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-black mb-4">Mission Replay</h1>
            <p className="text-lg text-black/50">Watch the entire execution unfold exactly as it happened.</p>
         </div>

         {/* Visual Replay Representation (The "Screen") */}
         <div className="w-full aspect-[21/9] bg-white border border-black/10 rounded-md shadow-xl overflow-hidden relative mb-12 flex flex-col">
            <div className="p-4 border-b border-black/5 bg-[#f6f8fa] flex justify-between items-center text-sm">
               <span className="font-semibold text-black">Live Execution State</span>
               <span className="text-black/50 font-mono">{activeStep.time} • Progress: {progress.toFixed(0)}%</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative p-8">
               {/* Background Grid */}
               <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
               
               <div className="flex flex-wrap justify-center gap-4 relative z-10">
                  {TIMELINE_STEPS.map((step, idx) => {
                     const isVisible = progress >= step.progress
                     const isCurrent = step.id === activeStep.id
                     
                     return (
                        <motion.div
                           key={step.id}
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ 
                              opacity: isVisible ? 1 : 0.2, 
                              scale: isVisible ? 1 : 0.9,
                              borderColor: isCurrent ? 'rgba(15,82,255,1)' : isVisible ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
                           }}
                           className={`w-[180px] p-4 rounded-md border bg-white flex flex-col items-center text-center transition-shadow ${isCurrent ? 'shadow-[0_8px_30px_rgba(15,82,255,0.15)] ring-2 ring-[#0f52ff]/20' : 'shadow-sm'}`}
                        >
                           <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${isCurrent ? 'bg-[#0f52ff] text-[#F0EFE2]' : isVisible ? 'bg-black/5 text-black' : 'bg-black/5 text-black/30'}`}>
                              {step.icon}
                           </div>
                           <h4 className={`text-sm font-semibold mb-1 ${isCurrent ? 'text-[#0f52ff]' : isVisible ? 'text-black' : 'text-black/40'}`}>{step.label}</h4>
                           <div className={`text-xs ${isVisible ? 'text-black/50' : 'text-black/30'}`}>{step.time}</div>
                        </motion.div>
                     )
                  })}
               </div>
            </div>
         </div>

         {/* Scrubber Controls */}
         <div className="w-full max-w-3xl bg-white border border-black/10 rounded-md p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
               <Button variant="outline" size="icon" className="rounded-full size-10 border-black/10 text-black hover:bg-black/5" onClick={() => setProgress(0)}>
                  <SkipBack className="size-4" />
               </Button>
               <Button 
                 size="icon" 
                 className={`rounded-full size-14 shadow-md transition-colors ${isPlaying ? 'bg-black text-[#F0EFE2] hover:bg-black/80' : 'bg-[#0f52ff] hover:bg-[#0f52ff]/90 text-[#F0EFE2]'}`}
                 onClick={() => setIsPlaying(!isPlaying)}
               >
                  {isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
               </Button>
               <Button variant="outline" size="icon" className="rounded-full size-10 border-black/10 text-black hover:bg-black/5" onClick={() => setProgress(100)}>
                  <FastForward className="size-4" />
               </Button>
               
               <div className="ml-auto text-sm font-medium text-black/50">
                  {activeStep.time} / 11:42
               </div>
            </div>
            
            {/* Custom Slider */}
            <div className="relative h-2 w-full bg-black/10 rounded-full cursor-pointer group" onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect()
               const x = e.clientX - rect.left
               setProgress(Math.max(0, Math.min(100, (x / rect.width) * 100)))
            }}>
               <div className="absolute inset-y-0 left-0 bg-[#0f52ff] rounded-full" style={{ width: `${progress}%` }} />
               <div 
                 className="absolute top-1/2 -translate-y-1/2 size-4 bg-white border-2 border-[#0f52ff] rounded-full shadow hover:scale-125 transition-transform"
                 style={{ left: `calc(${progress}% - 8px)` }}
               />
               
               {/* Markers */}
               {TIMELINE_STEPS.map(step => (
                  <div 
                     key={step.id}
                     className="absolute top-4 -translate-x-1/2 text-[10px] font-semibold text-black/40 whitespace-nowrap"
                     style={{ left: `${step.progress}%` }}
                  >
                     <div className="w-0.5 h-2 bg-black/10 mx-auto mb-1" />
                     {step.time}
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
