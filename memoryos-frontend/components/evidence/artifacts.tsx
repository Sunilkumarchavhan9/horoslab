"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Upload, FileText, CheckCircle2, FileJson, Image as ImageIcon, ShieldCheck, Download, MoreHorizontal, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_ARTIFACTS = [
  { id: "art-1", name: "Deployment Report", mission: "MISSION-241", agent: "Claude Reviewer", type: "PDF", verified: true, time: "2 min ago", size: "2.4 MB" },
  { id: "art-2", name: "Security Patch Diff", mission: "MISSION-241", agent: "SecOps Bot", type: "Patch", verified: true, time: "15 min ago", size: "14 KB" },
  { id: "art-3", name: "API Response JSON", mission: "MISSION-241", agent: "API Watcher", type: "JSON", verified: false, time: "1 hour ago", size: "45 KB" },
  { id: "art-4", name: "Architecture Diagram", mission: "MISSION-240", agent: "Architect Agent", type: "Image", verified: true, time: "3 hours ago", size: "1.2 MB" },
]

export function EvidenceArtifacts({ onOpenWorkspace }: { onOpenWorkspace?: (id: string) => void }) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null)
  
  const selectedArtifact = MOCK_ARTIFACTS.find(a => a.id === selectedArtifactId)

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Artifacts</h1>
            <p className="text-sm text-black/50 mt-1">What outputs did the missions produce?</p>
          </div>
          <Button className="bg-[#0f52ff] hover:bg-[#0f52ff]/90 text-white rounded-full px-5 shadow-sm transition-all shadow-[#0f52ff]/20">
            <Upload className="size-4 mr-2" /> Upload Artifact
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 border-b border-black/5 bg-black/[0.01]">
          <MetricCard label="Artifacts Generated" value="1,204" />
          <MetricCard label="Verified" value="982" trend="+12%" trendUp={true} />
          <MetricCard label="Pending" value="215" />
          <MetricCard label="Rejected" value="7" />
          <MetricCard label="Storage Used" value="4.2 GB" />
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
            <input 
              type="text"
              placeholder="Search by mission, agent, or type..."
              className="w-full pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
            />
          </div>
          <Button variant="outline" className="rounded-full px-4 text-sm h-9 border-black/10 text-black/70 hover:bg-black/5">
            <Filter className="size-3.5 mr-2" /> Filter
          </Button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MOCK_ARTIFACTS.map((artifact) => (
              <ArtifactCard 
                key={artifact.id} 
                artifact={artifact} 
                isSelected={selectedArtifactId === artifact.id}
                onClick={() => setSelectedArtifactId(artifact.id)}
                onOpenWorkspace={() => onOpenWorkspace?.(artifact.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedArtifact && (
        <div className="w-[400px] border-l border-black/10 bg-[#fafafa] flex flex-col overflow-y-auto hidden lg:flex shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-10">
          <div className="p-5 border-b border-black/5 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black">Inspector</h3>
              <button className="text-black/40 hover:text-black" onClick={() => setSelectedArtifactId(null)}>
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            
            <div className="aspect-video bg-black/5 rounded-md border border-black/10 flex items-center justify-center mb-4 relative overflow-hidden group">
               {selectedArtifact.type === 'PDF' && <FileText className="size-12 text-black/20" />}
               {selectedArtifact.type === 'Image' && <ImageIcon className="size-12 text-black/20" />}
               {selectedArtifact.type === 'JSON' && <FileJson className="size-12 text-black/20" />}
               {selectedArtifact.type === 'Patch' && <FileText className="size-12 text-black/20" />}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <Button variant="secondary" size="sm" className="rounded-full bg-white text-black hover:bg-gray-100">Preview</Button>
               </div>
            </div>
            
            <h2 className="text-lg font-semibold text-black truncate">{selectedArtifact.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 font-medium text-black/60">{selectedArtifact.type}</span>
              <span className="text-xs text-black/40">{selectedArtifact.size}</span>
            </div>
          </div>
          
          <div className="p-5 flex-1 space-y-6">
            <div>
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Verification</div>
              {selectedArtifact.verified ? (
                <div className="flex items-center gap-2 text-sm text-[#0f52ff] bg-[#0f52ff]/5 p-3 rounded-md border border-[#0f52ff]/10">
                  <ShieldCheck className="size-4" />
                  <span className="font-medium">Verified Cryptographically</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-black/60 bg-black/5 p-3 rounded-md border border-black/10">
                  <Clock className="size-4" />
                  <span className="font-medium">Verification Pending</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Metadata</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black/50">Mission</span>
                  <span className="font-medium text-black">{selectedArtifact.mission}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black/50">Agent</span>
                  <span className="font-medium text-black">{selectedArtifact.agent}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black/50">Created</span>
                  <span className="font-medium text-black">{selectedArtifact.time}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Dependencies</div>
              <div className="text-sm text-black/50 p-4 border border-black/10 rounded-md bg-white border-dashed text-center">
                No dependencies tracked.
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-black/5 bg-white mt-auto flex gap-2">
            <Button className="flex-1 bg-black text-white hover:bg-black/80" onClick={() => onOpenWorkspace?.(selectedArtifact.id)}>
              Open Evidence
            </Button>
            <Button variant="outline" className="w-12 px-0 text-black/60">
              <Download className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, trend, trendUp }: { label: string, value: string, trend?: string, trendUp?: boolean }) {
  return (
    <div className="bg-white rounded-md p-4 border border-black/5 shadow-sm">
      <div className="text-[11px] text-black/40 font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold tracking-tight text-black">{value}</div>
        {trend && (
          <div className={`text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}

function ArtifactCard({ artifact, isSelected, onClick, onOpenWorkspace }: { artifact: any, isSelected: boolean, onClick: () => void, onOpenWorkspace: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative rounded-md border bg-white p-4 cursor-pointer transition-all ${isSelected ? 'border-[#0f52ff] shadow-[0_8px_30px_rgba(15,82,255,0.12)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-md ${isSelected ? 'bg-[#0f52ff]/10 text-[#0f52ff]' : 'bg-black/5 text-black/60'}`}>
          {artifact.type === 'PDF' && <FileText className="size-5" />}
          {artifact.type === 'Image' && <ImageIcon className="size-5" />}
          {artifact.type === 'JSON' && <FileJson className="size-5" />}
          {artifact.type === 'Patch' && <FileText className="size-5" />}
        </div>
        {artifact.verified && (
          <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#0f52ff] bg-[#eef3ff] px-2 py-1 rounded-full">
            <CheckCircle2 className="size-3 mr-1" /> Verified
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold text-black text-sm mb-1 truncate">{artifact.name}</h3>
        <p className="text-[11px] text-black/40 font-medium uppercase tracking-wider">{artifact.mission}</p>
      </div>
      
      <div className="text-xs text-black/60 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-black/20"></span> {artifact.agent}</span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-black/5">
        <span className="text-[11px] text-black/40">{artifact.time}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenWorkspace(); }}
          className="text-xs font-semibold text-[#0f52ff] hover:underline"
        >
          View Evidence
        </button>
      </div>
    </motion.div>
  )
}
