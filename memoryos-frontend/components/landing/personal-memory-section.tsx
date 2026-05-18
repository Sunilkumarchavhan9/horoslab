"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Reveal } from "./motion";
import { motion } from "framer-motion";
import { MessageSquare, GitPullRequest, Activity, FileText, Shield, Database, GitBranch, Hash, Terminal, Cloud, Brain } from "lucide-react";
import { MemoryStarLogo } from "./memory-star-logo";

function ClaudeMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <g fill="currentColor">
        <path d="m14.375 6.48l.49.28v.209l-.14.489l-5.937 1.397l-.558-1.387zm0 0" />
        <path d="m12.155 2.373l.683.143l.182.224l.173.535l-.072.342l-3.983 5.447L7.81 7.737l3.673-4.82z" />
        <path d="m8.719 1.522l.419-.28l.349.14l.349.49l-.957 5.748l-.65-.441l-.279-.769l.49-4.33z" />
        <path d="m4.239 1.614l.43-.55L4.95 1l.558.081l.275.216l2.004 4.442l.724 2.11l-.848.471l-3.231-5.864z" />
        <path d="m2.154 4.665l-.14-.56l.42-.488l.488.07h.14l2.933 2.165l.908.698l1.257.978l-.698 1.187l-.629-.489l-.419-.419l-4.05-2.863z" />
        <path d="M1.316 8.296L1 7.946v-.31l.316-.108l3.562.21l3.491.279l-.113.695l-6.66-.346z" />
        <path d="M3.411 11.931h-.698l-.278-.32v-.382l1.186-.838l4.82-3.068l.487.833z" />
        <path d="m4.738 13.883l-.28.07l-.418-.21l.07-.35l4.12-5.446l.558.768l-3.072 4.05z" />
        <path d="m8.23 14.581l-.21.28l-.419.14l-.349-.28l-.21-.42L8.09 8.646l.629.07z" />
        <path d="M11.791 13.045v.558l-.07.21l-.279.14l-.489-.066l-3.356-4.996l1.331-1.014l1.117 2.025l.105.733z" />
        <path d="m13.398 12.207l.07.349l-.21.279l-.21-.07l-1.187-.838l-1.815-1.606l-1.397-.978l.419-1.326l.698.419l.42.768z" />
        <path d="m12.49 8.645l1.746.14l.419.28l.279.418v.302l-.768.327l-3.911-.978l-1.606-.07l.419-1.466l1.117.838z" />
      </g>
    </svg>
  );
}

function CursorMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="m20.42 6.73l-8-4.62a.82.82 0 0 0-.83 0L3.58 6.73c-.22.12-.35.36-.35.61v9.32c0 .25.13.48.35.61l8.01 4.62c.26.15.57.15.83 0l8.01-4.62c.22-.12.35-.36.35-.61V7.34c0-.25-.13-.48-.35-.61Zm-.5.98L12.19 21.1c-.05.09-.19.05-.19-.05v-8.77c0-.18-.09-.34-.25-.43L4.16 7.47c-.09-.05-.05-.19.05-.19h15.46c.22 0 .36.24.25.43"
      />
    </svg>
  );
}

function VSCodeMark() {
  return (
    <svg viewBox="0 0 128 128" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <mask
        id="memoryos-vscode-mask"
        width="128"
        height="128"
        x="0"
        y="0"
        maskUnits="userSpaceOnUse"
        style={{ maskType: "alpha" }}
      >
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M90.767 127.126a7.97 7.97 0 0 0 6.35-.244l26.353-12.681a8 8 0 0 0 4.53-7.209V21.009a8 8 0 0 0-4.53-7.21L97.117 1.12a7.97 7.97 0 0 0-9.093 1.548l-50.45 46.026L15.6 32.013a5.33 5.33 0 0 0-6.807.302l-7.048 6.411a5.335 5.335 0 0 0-.006 7.888L20.796 64 1.74 81.387a5.336 5.336 0 0 0 .006 7.887l7.048 6.411a5.33 5.33 0 0 0 6.807.303l21.974-16.68 50.45 46.025a8 8 0 0 0 2.743 1.793Zm5.252-92.183L57.74 64l38.28 29.058V34.943Z"
          clipRule="evenodd"
        />
      </mask>
      <g mask="url(#memoryos-vscode-mask)">
        <path
          fill="currentColor"
          d="M123.471 13.82 97.097 1.12A7.97 7.97 0 0 0 88 2.668L1.662 81.387a5.333 5.333 0 0 0 .006 7.887l7.052 6.411a5.33 5.33 0 0 0 6.811.303l103.971-78.875c3.488-2.646 8.498-.158 8.498 4.22v-.306a8 8 0 0 0-4.529-7.208Z"
        />
        <path
          fill="currentColor"
          d="m123.471 114.181-26.374 12.698A7.97 7.97 0 0 1 88 125.333L1.662 46.613a5.333 5.333 0 0 1 .006-7.887l7.052-6.411a5.33 5.33 0 0 1 6.811-.303l103.971 78.874c3.488 2.647 8.498.159 8.498-4.219v.306a8 8 0 0 1-4.529 7.208"
        />
        <path
          fill="currentColor"
          d="M97.098 126.882A7.98 7.98 0 0 1 88 125.333c2.952 2.952 8 .861 8-3.314V5.98c0-4.175-5.048-6.266-8-3.313a7.98 7.98 0 0 1 9.098-1.549L123.467 13.8A8 8 0 0 1 128 21.01v85.982a8 8 0 0 1-4.533 7.21Z"
        />
      </g>
    </svg>
  );
}

function OpenCodeMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/opencode.svg"
      alt=""
      className="opacity-90 brightness-0 invert"
      style={{ height: "24px", width: "auto" }}
      aria-hidden="true"
    />
  );
}

function WindsurfMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.55 5.067a2.177 2.177 0 0 0-2.18 2.177v4.867a1.77 1.77 0 0 1-1.76 1.76a1.82 1.82 0 0 1-1.472-.766l-4.971-7.1a2.2 2.2 0 0 0-1.81-.942c-1.134 0-2.154.964-2.154 2.153v4.896c0 .972-.797 1.76-1.76 1.76c-.57 0-1.136-.287-1.472-.766L.408 5.16A.224.224 0 0 0 0 5.288v4.245c0 .215.066.423.188.6l5.475 7.818c.324.462.8.805 1.351.93a2.164 2.164 0 0 0 2.645-2.098V11.89c0-.972.787-1.76 1.76-1.76h.002a1.8 1.8 0 0 1 1.472.766l4.972 7.1a2.172 2.172 0 0 0 3.96-1.212v-4.895a1.76 1.76 0 0 1 1.76-1.76h.195a.22.22 0 0 0 .22-.22V5.287a.22.22 0 0 0-.22-.22Z"
      />
    </svg>
  );
}

function MoreMark() {
  return (
    <svg viewBox="0 0 64 18" className="h-[24px] w-auto" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.9 14c-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5s4.9 2.2 4.9 5s-2.2 5-4.9 5m16.5-5c0 2.8-2.2 5-4.9 5s-4.9-2.2-4.9-5s2.2-5 4.9-5s4.9 2.2 4.9 5m11.5 5C32.2 14 30 11.8 30 9s2.2-5 4.9-5s4.9 2.2 4.9 5s-2.2 5-4.9 5m12.4-.3v-1.6h2.3V5.9h-2.3V4.3h6.5c3.2 0 5.3 1.8 5.3 4.7c0 2.9-2.1 4.7-5.3 4.7zm4.4-3.4h1.9c1.7 0 2.8-.9 2.8-2.5s-1.1-2.5-2.8-2.5h-1.9z"
      />
    </svg>
  );
}

const LOGO_URLS = {
  mastra: "https://mastra.ai/brand/logo.svg",
  langgraph: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/langgraph.png",
  zapier: "https://cdn.simpleicons.org/zapier/ff4f00",
  n8n: "https://cdn.simpleicons.org/n8n/ffffff",
};

function MastraMark() {
  return <img src={LOGO_URLS.mastra} alt="" className="h-[24px] w-auto opacity-70 brightness-0 invert transition-all duration-300" aria-hidden="true" />;
}

function LangGraphMark() {
  return <img src={LOGO_URLS.langgraph} alt="" className="h-[24px] w-auto opacity-70 brightness-0 invert transition-all duration-300" aria-hidden="true" />;
}

function N8nMark() {
  return <img src={LOGO_URLS.n8n} alt="" className="h-[24px] w-auto opacity-70 brightness-0 invert transition-all duration-300" aria-hidden="true" />;
}

function ZapierMark() {
  return <img src={LOGO_URLS.zapier} alt="" className="h-[24px] w-auto opacity-70 brightness-0 invert transition-all duration-300" aria-hidden="true" />;
}

function ToolPill({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <span className="inline-flex h-16 min-w-16 items-center justify-center text-muted-foreground opacity-70 transition duration-300 hover:opacity-100 hover:text-foreground hover:-translate-y-1">
      <span className="grid h-[30px] place-items-center text-current transition duration-300">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function FloatingPill({ delay, x, icon, text }: { delay: number; x: number; icon: ReactNode; text: string }) {
  // Use text length to create varied, organic floating speeds and heights across the pills
  const floatDuration = 3 + (text.length % 3);
  const floatY = 6 + (text.length % 6);

  return (
    <motion.div
      initial={{ opacity: 0, x: x - 20, y: 15 }}
      whileInView={{ opacity: 1, x: x, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 60 }}
      style={{ marginLeft: `${x}px` }}
      className="w-fit pointer-events-auto z-10"
    >
      <motion.div
        animate={{ y: [0, -floatY, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay }}
        className="flex items-center gap-3 bg-card border border-border shadow-lg rounded-xl px-4 py-3 w-fit hover:shadow-primary/20 hover:border-primary/50 transition-all cursor-default"
      >
        <div className="shrink-0">{icon}</div>
        <p className="text-[13px] font-semibold text-foreground tracking-tight whitespace-nowrap">{text}</p>
      </motion.div>
    </motion.div>
  );
}

const PM_FEATURES = [
  {
    num: "01",
    tab: "CONTEXT CAPTURE",
    heading: "Capture developer context from anywhere",
    description: "Capture execution context from code findings, decisions, debugging notes, docs, links, and task history across daily tools.",
    bullets: [
      "Code findings and logic decisions",
      "Debugging notes and stack traces",
      "Docs, links, and task history"
    ],
    bgClass: "bg-blue-500/10",
    visualContent: (
      <div className="bg-background rounded-lg border border-border/20 overflow-hidden p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px] w-full">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><GitBranch className="text-primary w-6 h-6"/></div>
            <div>
              <div className="w-32 h-3 bg-muted rounded-full mb-2"></div>
              <div className="w-20 h-3 bg-muted/50 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="w-full h-16 bg-muted/30 rounded-xl border border-border/10 flex items-center px-4 gap-4">
               <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-500" /></div>
               <div className="w-40 h-2 bg-muted rounded-full"></div>
            </div>
            <div className="w-full h-16 bg-muted/30 rounded-xl border border-border/10 flex items-center px-4 gap-4">
               <div className="w-8 h-8 rounded-lg bg-chart-2/20 flex items-center justify-center"><Activity className="w-4 h-4 text-chart-2" /></div>
               <div className="w-48 h-2 bg-muted rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    num: "02",
    tab: "CONNECTED GRAPH",
    heading: "Turn scattered work into connected memory",
    description: "MemoryOS links related context across sessions so retrieval, revisions, and continuity planning operate from one connected memory graph.",
    bullets: [
      "Unified graph of all developer activity",
      "Seamless retrieval across multiple sessions",
      "Continuity planning grounded in truth"
    ],
    bgClass: "bg-chart-2/10",
    visualContent: (
      <div className="w-full h-full min-h-[300px] bg-background rounded-lg border border-border/20 overflow-hidden p-6 flex items-center justify-center relative">
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 30,30 L 70,70 M 70,30 L 30,70 M 50,20 L 50,80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" className="text-foreground" />
         </svg>
         <div className="relative z-10 flex flex-wrap gap-8 items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-card border border-border/20 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><Brain className="text-primary w-10 h-10"/></div>
            <div className="w-20 h-20 rounded-2xl bg-card border border-border/20 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><Database className="text-chart-2 w-10 h-10"/></div>
            <div className="w-20 h-20 rounded-2xl bg-card border border-border/20 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><Terminal className="text-blue-500 w-10 h-10"/></div>
         </div>
      </div>
    )
  },
  {
    num: "03",
    tab: "GLOBAL SEARCH",
    heading: "Ask MemoryOS across everything you have stored",
    description: "Query company memory directly and get answers grounded in prior work, documents, conversations, constraints, and technical decisions.",
    bullets: [
      "Summarize notes",
      "Connect retrieval + trust",
      "Themes across workspace"
    ],
    bgClass: "bg-purple-500/10",
    visualContent: (
      <div className="bg-background rounded-lg border border-border/20 overflow-hidden p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
        <div className="w-full flex flex-col gap-4 max-w-sm">
          {["Summarize notes", "Connect retrieval + trust", "Themes across workspace"].map((q, i) => (
            <div key={i} className="flex items-center gap-4 bg-card border border-border/20 rounded-full px-6 py-4 shadow-sm transform transition-transform hover:scale-105">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                 <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[15px] text-foreground font-medium truncate">{q}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    num: "04",
    tab: "WORKSPACE SCOPING",
    heading: "Separate memory by workspace and project",
    description: "Scope memory by products, repos, teams, research tracks, or debugging streams so context stays clean, governed, and reusable.",
    bullets: [
      "Frontend",
      "Backend",
      "Research & Debugging Streams"
    ],
    bgClass: "bg-amber-500/10",
    visualContent: (
      <div className="bg-background rounded-lg border border-border/20 overflow-hidden p-6 flex items-center justify-center h-full min-h-[300px] gap-8">
        <div className="w-48 h-56 bg-card border border-border/20 rounded-xl shadow-lg p-5 rotate-[-6deg] hover:rotate-0 transition-transform">
           <div className="text-[13px] font-bold text-foreground mb-6 flex items-center gap-3 tracking-widest uppercase"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Frontend</div>
           <div className="space-y-4">
              <div className="w-full h-6 bg-muted/30 rounded"></div>
              <div className="w-3/4 h-6 bg-muted/30 rounded"></div>
              <div className="w-5/6 h-6 bg-muted/30 rounded"></div>
           </div>
        </div>
        <div className="w-48 h-56 bg-card border border-border/20 rounded-xl shadow-lg p-5 rotate-[6deg] hover:rotate-0 transition-transform -ml-16 mt-16">
           <div className="text-[13px] font-bold text-foreground mb-6 flex items-center gap-3 tracking-widest uppercase"><div className="w-3 h-3 rounded-full bg-chart-2"></div>Backend</div>
           <div className="space-y-4">
              <div className="w-full h-6 bg-muted/30 rounded"></div>
              <div className="w-4/5 h-6 bg-muted/30 rounded"></div>
              <div className="w-2/3 h-6 bg-muted/30 rounded"></div>
           </div>
        </div>
      </div>
    )
  }
];

function PersonalMemoryFeaturesGrid() {
  const [activeTab, setActiveTab] = useState("01");

  useEffect(() => {
    const handleScroll = () => {
      const sections = PM_FEATURES.map(f => document.getElementById(`pm-feature-${f.num}`));
      let current = "01";
      for (const section of sections) {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            current = section.id.replace("pm-feature-", "");
          }
        }
      }
      setActiveTab(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="dark bg-background text-foreground py-24 w-full border-t border-border mt-24">
      <div className="mx-auto max-w-[1400px]">
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row relative gap-8 lg:gap-16 items-start px-6">
          {/* Left Sidebar (Sticky Tabs) */}
          <div className="hidden lg:block w-[280px] shrink-0 relative">
             <div className="sticky top-32 flex flex-col gap-2">
                {PM_FEATURES.map(feature => (
                  <a 
                    key={feature.num} 
                    href={`#pm-feature-${feature.num}`}
                    className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${activeTab === feature.num ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}
                  >
                     <span className={`font-mono text-[11px] px-2 py-1 rounded transition-colors ${activeTab === feature.num ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}>
                        {feature.num}
                     </span>
                     <span className="font-sans text-[12px] font-bold tracking-widest uppercase">{feature.tab}</span>
                  </a>
                ))}
             </div>
          </div>

          {/* Right Content Area (Stacked Cards) */}
          <div className="flex-1 flex flex-col pb-[50vh] relative border-t border-border xl:border-t-0">
             {PM_FEATURES.map((feature, i) => (
                <div 
                  key={feature.num} 
                  id={`pm-feature-${feature.num}`} 
                  className={`sticky flex flex-col xl:flex-row bg-card border-b border-border`}
                  style={{ 
                    top: '6rem', 
                    minHeight: '480px',
                    zIndex: i,
                  }}
                >
                   {/* Left Visual Pane */}
                   <div className={`w-full xl:w-[55%] p-8 xl:p-16 relative flex items-center justify-center overflow-hidden border-b xl:border-b-0 xl:border-r border-border ${feature.bgClass}`}>
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
    </div>
  )
}

export function PersonalMemorySection() {
  return (
    <section className="dark bg-background text-foreground font-sans overflow-hidden">
      
      {/* 1. COMPOSIO STYLE HEADER (Light theme, side by side) */}
      <div className="px-6 py-24">
         <Reveal className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
           
           {/* LEFT: Text Block */}
           <div className="flex-1 w-full text-left lg:pr-10">
             <div className="flex items-center gap-3 mb-8">
                <MemoryStarLogo />
                <span className="px-2 py-0.5 rounded border border-primary/30 bg-primary/5 text-[11px] font-bold tracking-widest text-primary uppercase">Workspace</span>
             </div>
             
             <h3 className="text-[40px] lg:text-[52px] font-semibold tracking-[-0.03em] text-foreground leading-[1.05] mb-6">
               One company brain layer.<br/>
               <span className="text-muted-foreground">Across every workflow.</span>
             </h3>
             
             <p className="text-muted-foreground text-[17px] leading-relaxed mb-8 max-w-lg">
               MemoryOS keeps goals, constraints, decisions, risks, and execution context available across cloud models, local agents, control planes, and shared workspaces.
             </p>
             
             <button className="bg-foreground text-background px-8 py-4 font-bold text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity rounded-sm">
               Learn More
             </button>
           </div>

           {/* RIGHT: Floating Pills Graphic */}
           <div className="flex-1 w-full relative min-h-[460px] flex items-center justify-end">
             {/* Faint background terminal graphic */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full max-w-[500px] h-[380px] bg-muted/10 border border-border rounded-xl shadow-sm overflow-hidden hidden sm:flex flex-col">
               <div className="h-10 border-b border-border bg-card flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  <div className="mx-auto text-[10px] font-mono text-muted-foreground tracking-widest">agent-memory.log</div>
               </div>
               <div className="p-8 font-mono text-xs md:text-[13px] text-muted-foreground/80 leading-relaxed space-y-5">
                  <div>
                    <p className="text-primary font-semibold">{`$ memoryos.search({ query: 'session_context' })`}</p>
                    <p className="text-muted-foreground">{`-> Retrieved 3 graph nodes`}</p>
                  </div>
                  <div>
                    <p className="text-primary font-semibold">{`$ POST /v1/http/sync`}</p>
                    <p className="text-muted-foreground">{`-> 200 OK (Timeline updated)`}</p>
                  </div>
                  <div>
                    <p className="text-primary font-semibold">{`$ memoryos.add({ context: 'resolved_bug_404' })`}</p>
                    <p className="text-muted-foreground">{`-> Appended to team memory workspace`}</p>
                  </div>
                  
                  <div className="pt-4 text-6xl font-bold opacity-[0.03] text-foreground tracking-tighter">
                     MEMORYOS
                  </div>
               </div>
             </div>

             {/* Floating Cascading Pills */}
             <div className="relative w-full max-w-[500px] flex flex-col gap-4 z-10 sm:pr-8 ">
                <FloatingPill x={0} icon={<FileText className="text-blue-500" size={16}/>} text="Summarize the key ideas from my notes" delay={0.1} />
                <FloatingPill x={40} icon={<Activity className="text-chart-2" size={16}/>} text="Which memories connect retrieval and trust?" delay={0.2} />
                <FloatingPill x={80} icon={<MessageSquare className="text-purple-500" size={16}/>} text="What are the main themes across this workspace?" delay={0.3} />
                <FloatingPill x={30} icon={<GitPullRequest className="text-amber-500" size={16}/>} text="Capture developer context from anywhere" delay={0.4} />
                <FloatingPill x={100} icon={<Database className="text-indigo-500" size={16}/>} text="Scope memory by products and repos" delay={0.5} />
                <FloatingPill x={20} icon={<Shield className="text-destructive" size={16}/>} text="Turn scattered work into connected memory" delay={0.6} />
             </div>
           </div>
         </Reveal>
      </div>

      {/* 2. AVAILABLE ACROSS */}
      <div className="px-6 pt-16">
         <Reveal delay={0.06} className="mx-auto max-w-4xl text-center">
           <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase font-semibold">
             AVAILABLE ACROSS
           </p>
           <div 
             className="mt-8 relative flex overflow-hidden w-[100vw] max-w-[100vw] left-1/2 right-1/2 -mx-[50vw] pb-4 group"
             style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
           >
             <div className="flex shrink-0 min-w-max items-center justify-around gap-10 md:gap-14 animate-marquee group-hover:[animation-play-state:paused] pr-10 md:pr-14">
               <ToolPill label="Claude" icon={<ClaudeMark />} />
               <ToolPill label="Mastra" icon={<MastraMark />} />
               <ToolPill label="GPT Agents" icon={<CursorMark />} />
               <ToolPill label="Ollama" icon={<VSCodeMark />} />
               <ToolPill label="LangGraph" icon={<LangGraphMark />} />
               <ToolPill label="n8n" icon={<N8nMark />} />
               <ToolPill label="Zapier" icon={<ZapierMark />} />
               <ToolPill label="Qwen" icon={<OpenCodeMark />} />
               <ToolPill label="DeepSeek" icon={<WindsurfMark />} />
               <ToolPill label="More" icon={<MoreMark />} />
             </div>
             <div className="flex shrink-0 min-w-max items-center justify-around gap-10 md:gap-14 animate-marquee group-hover:[animation-play-state:paused] pr-10 md:pr-14" aria-hidden="true">
               <ToolPill label="Claude" icon={<ClaudeMark />} />
               <ToolPill label="Mastra" icon={<MastraMark />} />
               <ToolPill label="GPT Agents" icon={<CursorMark />} />
               <ToolPill label="Ollama" icon={<VSCodeMark />} />
               <ToolPill label="LangGraph" icon={<LangGraphMark />} />
               <ToolPill label="n8n" icon={<N8nMark />} />
               <ToolPill label="Zapier" icon={<ZapierMark />} />
               <ToolPill label="Qwen" icon={<OpenCodeMark />} />
               <ToolPill label="DeepSeek" icon={<WindsurfMark />} />
               <ToolPill label="More" icon={<MoreMark />} />
             </div>
           </div>
         </Reveal>
      </div>

      {/* 3. STICKY FEATURE SCROLL (Replaces 2x2 grid) */}
      <PersonalMemoryFeaturesGrid />

      {/* 4. FOOTER STATS */}
      <div className="px-6 pb-24 dark bg-background text-foreground border-b border-border">
         <Reveal delay={0.16} className="mx-auto max-w-4xl">
           <div className="grid gap-8 pt-12 text-center sm:grid-cols-3">
             {[
               ["Shared", "team memory"],
               ["Multi-tool", "integrations"],
               ["Fast", "context recall"],
             ].map(([value, label]) => (
               <div key={label} className="group">
                 <p className="text-[32px] md:text-[40px] font-semibold tracking-[-0.03em] text-foreground group-hover:text-primary transition-colors">{value}</p>
                 <p className="mt-2 text-[15px] text-muted-foreground uppercase tracking-widest font-mono text-[11px]">{label}</p>
               </div>
             ))}
           </div>
         </Reveal>
      </div>

    </section>
  );
}
