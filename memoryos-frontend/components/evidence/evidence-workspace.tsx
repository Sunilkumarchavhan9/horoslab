"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Target, Activity, FileText, Terminal, Brain, FileKey2, Download, ArrowLeft, ArrowRight, Share2, Search, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EvidenceWorkspace({ id, onClose }: { id: string, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "artifacts", label: "Artifacts" },
    { id: "logs", label: "Logs" },
    { id: "claims", label: "Claims" },
    { id: "verification", label: "Verification" },
    { id: "audit", label: "Audit" },
    { id: "raw", label: "Raw JSON" },
  ]

  return (
    <div className="absolute inset-0 z-50 bg-[#fafafa] flex flex-col">
      {/* Workspace Header */}
      <div className="bg-white border-b border-black/5 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors -ml-2">
            <ArrowLeft className="size-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="size-8 bg-[#0f52ff]/10 rounded-md flex items-center justify-center text-[#0f52ff]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-black tracking-tight leading-none text-[15px]">Evidence Record {id}</h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest bg-[#eef3ff] text-[#0f52ff]">Verified</span>
              </div>
              <div className="text-xs text-black/40 mt-0.5">Mission: MISSION-241 • Trace: tr-92f8a1</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-white border-black/10 text-black/70 hover:bg-black/5">
            <Share2 className="size-3.5 mr-2" /> Share
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-white border-black/10 text-black/70 hover:bg-black/5">
            <Download className="size-3.5 mr-2" /> Export Bundle
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-black/5 px-6 flex items-center gap-6 shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-3.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-[#0f52ff]' : 'text-black/50 hover:text-black/80'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="evidenceTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f52ff]" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto bg-[#fafafa] relative">
          
          {activeTab === 'overview' && (
            <div className="p-8 max-w-5xl mx-auto">
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-semibold text-black tracking-tight mb-2">Evidence Trace</h2>
                <p className="text-sm text-black/50">Every piece of evidence is cryptographically connected.</p>
              </div>
              
              {/* Interactive Timeline Graph */}
              <div className="flex flex-col items-center max-w-2xl mx-auto pb-20">
                
                <TraceNode 
                  icon={<Target className="size-5" />}
                  title="Mission"
                  subtitle="MISSION-241"
                  isActive={selectedNode === 'mission'}
                  onClick={() => setSelectedNode('mission')}
                />
                
                <TraceConnector />
                
                <TraceNode 
                  icon={<Activity className="size-5" />}
                  title="Execution"
                  subtitle="Planner & Workers"
                  isActive={selectedNode === 'execution'}
                  onClick={() => setSelectedNode('execution')}
                />
                
                <TraceConnector />
                
                <TraceNode 
                  icon={<FileText className="size-5" />}
                  title="Artifacts"
                  subtitle="8 outputs generated"
                  isActive={selectedNode === 'artifacts'}
                  onClick={() => setSelectedNode('artifacts')}
                />
                
                <TraceConnector />
                
                <TraceNode 
                  icon={<Terminal className="size-5" />}
                  title="Logs"
                  subtitle="4,021 events captured"
                  isActive={selectedNode === 'logs'}
                  onClick={() => setSelectedNode('logs')}
                />
                
                <TraceConnector />
                
                <TraceNode 
                  icon={<Brain className="size-5" />}
                  title="Claims"
                  subtitle="3 assertions supported"
                  isActive={selectedNode === 'claims'}
                  onClick={() => setSelectedNode('claims')}
                />
                
                <TraceConnector />
                
                <TraceNode 
                  icon={<ShieldCheck className="size-5" />}
                  title="Verification"
                  subtitle="PASS by Security Core"
                  isActive={selectedNode === 'verification'}
                  onClick={() => setSelectedNode('verification')}
                />
                
                <TraceConnector />
                
                <TraceNode 
                  icon={<FileKey2 className="size-5" />}
                  title="Certificate"
                  subtitle="cert-89a2bf (SHA-256)"
                  isActive={selectedNode === 'certificate'}
                  onClick={() => setSelectedNode('certificate')}
                  isEnd
                />
                
              </div>
            </div>
          )}
          
          {activeTab !== 'overview' && (
            <div className="flex items-center justify-center h-full text-black/40 text-sm">
              <div className="text-center">
                <FileText className="size-8 mx-auto mb-3 opacity-20" />
                <p>Content for the <strong>{activeTab}</strong> tab goes here.</p>
                <p className="mt-1">In a full implementation, this would load the dedicated views.</p>
              </div>
            </div>
          )}

        </div>

        {/* Inspector Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-[400px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.02)] absolute inset-y-0 right-0 z-20"
            >
              <div className="p-5 border-b border-black/5 flex justify-between items-center bg-[#fafafa]">
                <h3 className="font-semibold text-black capitalize">{selectedNode} Details</h3>
                <button className="p-1.5 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors" onClick={() => setSelectedNode(null)}>
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Context Metadata</div>
                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex justify-between py-2 border-b border-black/5">
                    <span className="text-black/50">ID</span>
                    <span className="font-mono text-black">node-{selectedNode}-821</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-black/5">
                    <span className="text-black/50">Timestamp</span>
                    <span className="text-black">Oct 24, 2026 14:32</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-black/5">
                    <span className="text-black/50">Source</span>
                    <span className="text-black">HOROS Runtime</span>
                  </div>
                </div>
                
                <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Related Data</div>
                <div className="p-4 border border-black/10 border-dashed rounded-md text-center text-sm text-black/50">
                  <Search className="size-5 mx-auto mb-2 opacity-50" />
                  Select specific items in the graph to inspect cryptographic links and JSON payloads.
                </div>
              </div>
              <div className="p-5 border-t border-black/5 bg-[#fafafa]">
                <Button className="w-full bg-[#0f52ff] hover:bg-[#0f52ff]/90 text-[#F0EFE2] shadow-sm shadow-[#0f52ff]/20">
                  View Full Object
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TraceNode({ icon, title, subtitle, isActive, onClick, isEnd }: any) {
  return (
    <div 
      className={`w-full max-w-sm rounded-md border p-4 flex items-center justify-between cursor-pointer transition-all ${isActive ? 'bg-white border-[#0f52ff] shadow-[0_8px_30px_rgba(15,82,255,0.12)] ring-1 ring-[#0f52ff] scale-105 relative z-10' : 'bg-white border-black/10 hover:border-black/20 hover:shadow-md'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={`size-12 rounded-md flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-[#0f52ff] text-[#F0EFE2]' : 'bg-black/5 text-black/50'}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-black text-[15px]">{title}</h3>
          <p className="text-xs text-black/50 font-medium">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className={`size-5 transition-colors ${isActive ? 'text-[#0f52ff]' : 'text-black/20'}`} />
    </div>
  )
}

function TraceConnector() {
  return (
    <div className="h-10 w-px bg-gradient-to-b from-[#0f52ff]/30 via-black/10 to-[#0f52ff]/30 my-1 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-black/20" />
    </div>
  )
}
