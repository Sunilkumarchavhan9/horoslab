"use client";

import { useState, useEffect } from "react";
import { Search, AlertCircle, Database, Code2, TerminalSquare, Network, Layers, CheckCircle2 } from "lucide-react";

const FEATURES = [
  {
    num: "01",
    tab: "AGENT MEMORY",
    heading: "Persistent context for coding agents",
    description: "Preferences, project state, bug history, and prior decisions stay available across sessions.",
    bullets: [
      "List unresolved bugs and continue last decision thread",
      "Retrieve prior architecture decisions to avoid drift",
      "Inject latest bug fix context automatically"
    ],
    bgClass: "bg-primary/5",
    visualContent: (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b border-border text-[9px] text-muted-foreground uppercase flex items-center gap-2 font-mono">
          <Search size={10} /> MEMORYOS_SEARCH_TOOLS
        </div>
        <div className="p-4 space-y-3 font-mono text-[10px]">
          <div className="bg-card border border-border rounded-lg p-3 flex justify-between items-start">
             <div className="flex flex-col gap-1">
                <div className="text-foreground font-bold flex items-center gap-2"><AlertCircle size={10} className="text-muted-foreground" /> retrieve project blockers</div>
                <div className="text-muted-foreground pl-4">List unresolved bugs and continue last decision thread</div>
             </div>
             <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">Match</span>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 flex justify-between items-start">
             <div className="flex flex-col gap-1">
                <div className="text-foreground font-bold flex items-center gap-2"><Database size={10} className="text-muted-foreground" /> retrieve prior architecture decisions</div>
             </div>
             <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">Match</span>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex justify-between items-start shadow-sm">
             <div className="flex flex-col gap-1">
                <div className="text-primary font-bold flex items-center gap-2"><Code2 size={10} className="text-primary" /> retrieve latest bug fix context</div>
             </div>
             <span className="bg-primary text-primary-foreground border border-primary px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">Match</span>
          </div>
        </div>
      </div>
    )
  },
  {
    num: "02",
    tab: "TEAM MEMORY",
    heading: "Shared workspace intelligence",
    description: "MemoryOS stores project-level memory so teams and agents can resume work with the same context model.",
    bullets: [
      "Resume current sprint from continuity contract",
      "Load MemoryOS retrieval + trust diagnostics",
      "Generate plan from prior decisions and open risks"
    ],
    bgClass: "bg-chart-2/5",
    visualContent: (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b border-border text-[9px] text-muted-foreground uppercase flex items-center gap-2 font-mono">
          <TerminalSquare size={10} /> YOUR_AI_AGENT
        </div>
        <div className="p-4 text-[11px] space-y-4 font-mono">
           <div className="text-muted-foreground flex items-start gap-2">
             <span className="text-chart-2 mt-0.5"><CheckCircle2 size={12}/></span> Resume current MemoryOS sprint from continuity contract and latest trusted context.
           </div>
           <div className="text-muted-foreground flex items-start gap-2">
             <span className="text-chart-2 mt-0.5"><CheckCircle2 size={12}/></span> MemoryOS retrieval + trust diagnostics loaded.
           </div>
           <div className="text-muted-foreground flex items-start gap-2">
             <span className="text-chart-2 mt-0.5"><CheckCircle2 size={12}/></span> Plan generated from prior decisions and open risks.
           </div>
           <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center justify-between mt-6">
             <span className="text-primary font-bold">memory context injection active</span>
             <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider animate-pulse">Live</span>
           </div>
        </div>
      </div>
    )
  },
  {
    num: "03",
    tab: "TRUST LAYER",
    heading: "Every memory is inspectable",
    description: "Explain, timeline, and revisions turn memory recall into something developers can verify and debug.",
    bullets: [
      "Inspect timeline of all memory events",
      "Trace revisions to previous execution contexts",
      "Full explainability for diagnostic debugging"
    ],
    bgClass: "bg-muted/30",
    visualContent: (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b border-border text-[9px] text-muted-foreground uppercase flex items-center gap-2 font-mono">
          <Network size={10} /> MEMORYOS_MANAGE_CONNECTIONS
        </div>
        <div className="p-4 space-y-3 font-mono text-[11px]">
           {["GitHub", "Notion", "Slack"].map((tool) => (
             <div key={tool} className="bg-card border border-border rounded-lg p-3 flex justify-between items-center">
                <span className="font-bold text-foreground flex items-center gap-2"><Layers size={12} className="text-muted-foreground"/> {tool}</span>
                <span className="bg-chart-2/10 text-chart-2 border border-chart-2/20 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Connected</span>
             </div>
           ))}
           <div className="bg-muted border border-border rounded-lg p-3 mt-4">
              <div className="text-muted-foreground uppercase text-[9px] mb-2 font-bold">AGENT_CONFIG</div>
              <div className="space-y-1 text-foreground/80">
                 <p>runtime: sdk / mcp / http</p>
                 <p>mode: contract-first continuity</p>
                 <p>trust: timeline + revisions + explain</p>
              </div>
           </div>
        </div>
      </div>
    )
  },
  {
    num: "04",
    tab: "CONTROL SURFACE",
    heading: "Control plane, APIs, and policies",
    description: "Search, archive, review, and govern memory through the MemoryOS control plane and unified API surface.",
    bullets: [
      "Write memory: /process + status + archive",
      "Recover context: /retrieve + /continue + /resume",
      "Inspect trust: /timeline + /revisions + /explain"
    ],
    bgClass: "bg-primary/5",
    visualContent: (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b border-border text-[9px] text-muted-foreground uppercase flex items-center gap-2 font-mono">
          <Code2 size={10} /> PLATFORM_SURFACE_API
        </div>
        <div className="p-4 space-y-4 font-mono">
           <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-foreground font-bold mb-2 flex items-center justify-between text-[11px]">
                 Write memory
                 <span className="text-muted-foreground font-normal text-[9px]">MemoryOS exposes focused routes</span>
              </div>
              <div className="text-primary bg-primary/10 border border-primary/20 px-2 py-1.5 rounded w-fit text-[10px]">/process + status + archive</div>
           </div>
           <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-foreground font-bold mb-2 flex items-center justify-between text-[11px]">
                 Recover context
                 <span className="text-muted-foreground font-normal text-[9px]">Recover exact context</span>
              </div>
              <div className="text-primary bg-primary/10 border border-primary/20 px-2 py-1.5 rounded w-fit text-[10px]">/retrieve + /continue + /resume</div>
           </div>
           <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-foreground font-bold mb-2 flex items-center justify-between text-[11px]">
                 Inspect trust
                 <span className="text-muted-foreground font-normal text-[9px]">Inspect why a memory was saved</span>
              </div>
              <div className="text-primary bg-primary/10 border border-primary/20 px-2 py-1.5 rounded w-fit text-[10px]">/timeline + /revisions + /explain</div>
           </div>
        </div>
      </div>
    )
  }
];

export function DeveloperExperienceSection() {
  const [activeTab, setActiveTab] = useState("01");

  useEffect(() => {
    const handleScroll = () => {
      const sections = FEATURES.map(f => document.getElementById(`feature-${f.num}`));
      let current = "01";
      for (const section of sections) {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            current = section.id.replace("feature-", "");
          }
        }
      }
      setActiveTab(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="developer-experience" className="bg-background border-t border-border relative">
      <div className="mx-auto max-w-[1400px]">
        {/* Header Section */}
        <div className="px-6 py-20 lg:px-12 max-w-4xl">
          <h2 className="text-[40px] font-semibold tracking-tight text-foreground leading-[1.1] md:text-[56px] mb-6">
            Your agents are smart.<br />
            Their memory should be too.
          </h2>
          <p className="text-[18px] leading-relaxed text-muted-foreground">
            Continuity infrastructure for real coding sessions. MemoryOS is designed for developer workflows where preference, project state, bug history, and prior decisions need to survive across threads, tools, and model sessions.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row border-t border-border">
          
          {/* Left Sidebar (Sticky Tabs) */}
          <div className="hidden lg:block w-[280px] shrink-0 border-r border-border relative">
             <div className="sticky top-24 pt-12 pb-24 flex flex-col">
                {FEATURES.map(feature => (
                  <a 
                    key={feature.num} 
                    href={`#feature-${feature.num}`}
                    className={`flex items-center gap-4 px-8 py-5 border-l-2 transition-all ${activeTab === feature.num ? 'border-primary text-foreground bg-muted/20' : 'border-transparent text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}
                  >
                     <span className={`font-mono text-[11px] px-2 py-1 rounded transition-colors ${activeTab === feature.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {feature.num}
                     </span>
                     <span className="font-sans text-[12px] font-bold tracking-widest uppercase">{feature.tab}</span>
                  </a>
                ))}
             </div>
          </div>

          {/* Right Content Area (Stacked Cards) */}
          <div className="flex-1 flex flex-col">
             {FEATURES.map((feature, i) => (
                <div key={feature.num} id={`feature-${feature.num}`} className={`flex flex-col xl:flex-row border-b border-border ${i === FEATURES.length - 1 ? 'border-b-0' : ''}`}>
                   
                   {/* Left Visual Pane */}
                   <div className={`w-full xl:w-[55%] p-8 xl:p-16 relative flex items-center justify-center overflow-hidden border-b xl:border-b-0 xl:border-r border-border ${feature.bgClass}`}>
                      {/* Subdued pattern */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                      
                      <div className="relative z-10 w-full max-w-lg shadow-2xl rounded-xl transition-transform duration-500 hover:scale-[1.02]">
                         {feature.visualContent}
                      </div>
                   </div>

                   {/* Right Text Pane */}
                   <div className="w-full xl:w-[45%] p-8 xl:p-16 flex flex-col justify-center bg-card">
                      <span className="font-mono text-[11px] bg-muted text-muted-foreground border border-border px-2 py-1 rounded w-fit mb-8">
                         {feature.num}
                      </span>
                      <h3 className="text-[32px] font-semibold tracking-tight text-foreground mb-4 leading-[1.1]">
                         {feature.heading}
                      </h3>
                      <p className="text-[16px] leading-relaxed text-muted-foreground mb-10">
                         {feature.description}
                      </p>
                      
                      <div className="flex flex-col gap-5 pl-5 border-l-2 border-border">
                         {feature.bullets.map(bullet => (
                            <p key={bullet} className="text-[14px] text-foreground/80 leading-relaxed font-medium">
                               {bullet}
                            </p>
                         ))}
                      </div>
                   </div>
                </div>
             ))}
          </div>

        </div>
      </div>
    </section>
  );
}
