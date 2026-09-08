"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, ShieldCheck, Terminal, Search, 
  User, CheckCircle2, AlertTriangle, 
  Activity, Command, Play, Lock, FileCode,
  LayoutDashboard
} from "lucide-react";

const tabs = [
  { 
    id: 'memory', 
    title: 'Persistent Memory', 
    subtitle: 'Infinite context across workflows.', 
  },
  { 
    id: 'command', 
    title: 'Command Center', 
    subtitle: 'Monitor and trace every action.', 
  },
  { 
    id: 'immunity', 
    title: 'Mistake Immunity', 
    subtitle: 'Global learning prevents errors.', 
  },
  { 
    id: 'tooling', 
    title: 'Universal Tooling', 
    subtitle: 'Equip agents with native tools.', 
  }
];

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section className="py-24 bg-white relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row border-b border-slate-200 mb-8 overflow-hidden">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-6 cursor-pointer relative transition-colors ${
                  idx !== tabs.length - 1 ? 'border-b md:border-b-0 md:border-r border-slate-200' : ''
                } ${isActive ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-50'}`}
              >
                <h3 className={`font-semibold text-sm mb-1 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                  {tab.title}
                </h3>
                <p className={`text-sm transition-colors ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                  {tab.subtitle}
                </p>
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content Window */}
        <div className="w-full bg-[#f8fafc] rounded-md border border-slate-200 overflow-hidden shadow-sm relative min-h-[600px] flex">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
               className="w-full h-full flex flex-col md:flex-row absolute inset-0"
             >
                {activeTab === 'memory' && <TabMemory />}
                {activeTab === 'command' && <TabCommand />}
                {activeTab === 'immunity' && <TabImmunity />}
                {activeTab === 'tooling' && <TabTooling />}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Partner Logos */}
        <div className="mt-16 pt-8 border-t border-slate-100">
           <p className="text-center text-xs font-semibold text-slate-400 tracking-wider uppercase mb-8">Trusted by next-generation teams</p>
           <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Logo placeholders */}
             <div className="font-bold text-xl text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-slate-800 rounded-sm"></div> Acme Corp</div>
             <div className="font-bold text-xl text-slate-800 flex items-center gap-2"><Database className="w-6 h-6 text-slate-800"/> DataFlow</div>
             <div className="font-bold text-xl text-slate-800 flex items-center gap-2"><Command className="w-6 h-6 text-slate-800"/> Synthetix</div>
             <div className="font-bold text-xl text-slate-800 flex items-center gap-2"><Activity className="w-6 h-6 text-slate-800"/> Pulse</div>
           </div>
        </div>

      </div>
    </section>
  );
}

// ==========================================
// TAB 1: Persistent Memory (Code + Graph)
// ==========================================
function TabMemory() {
  return (
    <div className="w-full h-full flex">
      {/* Code Side (Left) */}
      <div className="w-1/2 p-12 bg-white flex flex-col justify-center border-r border-slate-200">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-[#1A1F2E] rounded-md shadow-xl overflow-hidden border border-slate-700/50 mb-6 transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="px-4 py-2 bg-[#0F131E] border-b border-slate-700/50 flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <div className="p-5 font-mono text-[13px] leading-relaxed text-slate-300">
              <span className="text-purple-400">const</span> state <span className="text-purple-400">=</span> <span className="text-blue-400">await</span> memoryos.<span className="text-blue-400">save</span>(&#123;
              <br/>  agent_id: <span className="text-amber-300">"dev_agent_01"</span>,
              <br/>  context: &#123;
              <br/>    ticket: <span className="text-amber-300">"AUTH-942"</span>,
              <br/>    files_touched: [<span className="text-amber-300">"auth.ts"</span>, <span className="text-amber-300">"session.ts"</span>],
              <br/>    last_error: <span className="text-amber-300">"Token Expired"</span>
              <br/>  &#125;
              <br/>&#125;);
            </div>
          </div>
          <div className="bg-[#1A1F2E] rounded-md shadow-xl overflow-hidden border border-slate-700/50 transform rotate-1 hover:rotate-0 transition-transform">
            <div className="p-5 font-mono text-[13px] leading-relaxed text-slate-300">
              <span className="text-purple-400">const</span> context <span className="text-purple-400">=</span> <span className="text-blue-400">await</span> memoryos.<span className="text-blue-400">load</span>(&#123;
              <br/>  ticket: <span className="text-amber-300">"AUTH-942"</span>
              <br/>&#125;);
              <br/><br/>
              <span className="text-slate-500">// Agent resumes exactly where it left off</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Side (Right) */}
      <div className="w-1/2 bg-[#FAFAFA] flex flex-col">
        {/* Mock Dashboard Header */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-2 font-medium text-sm text-slate-700">
             <LayoutDashboard className="w-4 h-4 text-slate-400" />
             Acme Inc. / Agents / dev_agent_01
          </div>
          <div className="flex gap-4">
             <Search className="w-4 h-4 text-slate-400" />
             <div className="w-6 h-6 rounded-full bg-slate-200"></div>
          </div>
        </div>
        
        {/* Mock Dashboard Content */}
        <div className="p-8 flex-1">
          <div className="bg-white border border-slate-200 rounded-md shadow-sm h-full p-6">
            <h4 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0015FF]" />
              Memory State Graph
            </h4>
            
            {/* Visual Node Graph Mockup */}
            <div className="relative w-full h-[300px] border border-slate-100 bg-slate-50/50 rounded-md overflow-hidden">
               {/* Nodes */}
               <div className="absolute left-10 top-20 bg-blue-50 border border-blue-200 p-3 rounded-md text-[11px] font-medium text-[#0015FF]/90 shadow-sm">
                 Ticket: AUTH-942
               </div>
               <div className="absolute left-10 top-40 bg-purple-50 border border-purple-200 p-3 rounded-md text-[11px] font-medium text-purple-700 shadow-sm">
                 Agent: dev_agent_01
               </div>
               <div className="absolute right-20 top-30 bg-green-50 border border-green-200 p-4 rounded-md text-[12px] font-medium text-green-700 shadow-sm w-48">
                 <div className="mb-2 text-slate-500 text-[10px] uppercase">Stored Context</div>
                 files: auth.ts, session.ts<br/>
                 error: Token Expired
               </div>
               
               {/* Edges */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none">
                 <path d="M 120,95 L 200,95 C 250,95 250,140 280,140" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                 <path d="M 130,175 L 200,175 C 250,175 250,140 280,140" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
               </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TAB 2: Command Center (Full Dashboard)
// ==========================================
function TabCommand() {
  return (
    <div className="w-full h-full bg-[#FAFAFA] flex flex-col">
       {/* Top Nav */}
       <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-6 font-medium text-sm text-slate-600">
             <div className="flex items-center gap-2 text-slate-900 font-semibold">
               <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
                 <Command className="w-3.5 h-3.5 text-[#F0EFE2]" />
               </div>
               MemoryOS
             </div>
             <span className="text-slate-300">/</span>
             <span className="hover:text-slate-900 cursor-pointer">Tracing</span>
             <span className="hover:text-slate-900 cursor-pointer">Logs</span>
             <span className="hover:text-slate-900 cursor-pointer">Metrics</span>
          </div>
       </div>

       {/* Dashboard Content */}
       <div className="flex-1 p-8 flex gap-8">
          {/* Main Feed */}
          <div className="flex-1 space-y-4">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-semibold text-slate-900">Active Traces</h2>
               <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 flex items-center gap-2 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live
               </div>
             </div>
             
             {/* Trace Items */}
             {[
               { id: "TRC-9921", agent: "frontend_agent", task: "Update migration scripts", status: "Running", time: "Just now" },
               { id: "TRC-9920", agent: "qa_agent", task: "Run integration tests", status: "Completed", time: "2m ago" },
               { id: "TRC-9919", agent: "backend_agent", task: "Deploy staging environment", status: "Failed", time: "15m ago" },
             ].map((trace, i) => (
               <div key={i} className="bg-white border border-slate-200 p-4 rounded-md shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer">
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-md flex items-center justify-center ${trace.status === 'Running' ? 'bg-blue-50 text-[#0015FF]' : trace.status === 'Failed' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                     <Activity className="w-5 h-5" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-mono font-medium text-slate-500">{trace.id}</span>
                       <span className="text-[13px] font-semibold text-slate-900">{trace.task}</span>
                     </div>
                     <div className="text-xs text-slate-500 flex items-center gap-2">
                       <User className="w-3 h-3" /> {trace.agent}
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <span className={`text-xs font-medium px-2 py-1 rounded-md ${trace.status === 'Running' ? 'bg-blue-50 text-[#0015FF]/90' : trace.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                     {trace.status}
                   </span>
                   <span className="text-[11px] text-slate-400">{trace.time}</span>
                 </div>
               </div>
             ))}
          </div>

          {/* Sidebar Detail */}
          <div className="w-[320px] bg-white border border-slate-200 rounded-md shadow-sm p-6 h-fit">
             <h3 className="font-semibold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-4">Trace Details: TRC-9921</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Agent</span>
                 <span className="font-medium text-slate-900">frontend_agent</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Duration</span>
                 <span className="font-medium text-slate-900">45s</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Tokens Used</span>
                 <span className="font-medium text-slate-900">14,205</span>
               </div>
               <div className="pt-4 border-t border-slate-100">
                 <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 block">Live Thought Log</span>
                 <div className="bg-slate-50 rounded-md p-3 font-mono text-[11px] text-slate-600 space-y-2 border border-slate-100 h-40 overflow-hidden relative">
                    <p>{">"} Analyzing migration.ts</p>
                    <p>{">"} Found syntax error on line 42</p>
                    <p>{">"} Applying fix using replace_file</p>
                    <p className="text-[#0015FF] animate-pulse">{">"} Running tests...</p>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
                 </div>
               </div>
             </div>
          </div>
       </div>
    </div>
  );
}

// ==========================================
// TAB 3: Mistake Immunity (Code + Rules)
// ==========================================
function TabImmunity() {
  return (
    <div className="w-full h-full flex">
      {/* Code Side (Left) */}
      <div className="w-1/2 p-12 bg-white flex flex-col justify-center border-r border-slate-200 relative overflow-hidden">
        {/* Red warning gradient background */}
        <div className="absolute inset-0 bg-red-50/30"></div>
        <div className="relative z-10 w-full max-w-md mx-auto">
          
          <div className="bg-[#1A1F2E] rounded-md shadow-2xl overflow-hidden border border-red-500/30">
            <div className="px-4 py-2 bg-[#0F131E] border-b border-slate-700/50 flex gap-1.5 items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider">Intercepted</span>
            </div>
            <div className="p-5 font-mono text-[13px] leading-relaxed text-slate-300">
              <span className="text-slate-500">// Agent attempts dangerous command</span>
              <br/>
              <span className="text-green-400">agent</span>.<span className="text-blue-400">execute</span>(
              <br/>  <span className="text-amber-300">"git push origin main --force"</span>
              <br/>);
              <br/><br/>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-400 mt-2">
                <span className="font-bold">Error:</span> Execution blocked by Immunity Rule. 
                <br/>Reason: Direct force push to main branch is strictly prohibited.
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Dashboard Side (Right) */}
      <div className="w-1/2 bg-[#FAFAFA] flex flex-col">
        {/* Mock Dashboard Header */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-2 font-medium text-sm text-slate-700">
             <ShieldCheck className="w-4 h-4 text-slate-400" />
             Mistake Immunity Rules
          </div>
        </div>
        
        {/* Mock Dashboard Content */}
        <div className="p-8 flex-1">
          <div className="bg-white border border-slate-200 rounded-md shadow-sm h-full p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Active Rules</h4>
                <p className="text-xs text-slate-500 mt-1">Globally enforced agent constraints</p>
              </div>
              <div className="px-3 py-1.5 bg-blue-50 text-[#0015FF] rounded-md text-xs font-semibold">
                + Add Rule
              </div>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
               {[
                 { title: "No Force Pushes to Main", status: "Active", hits: 14, icon: FileCode },
                 { title: "Require Env Var Encryption", status: "Active", hits: 3, icon: Lock },
                 { title: "Block Drop Table Commands", status: "Active", hits: 0, icon: Database },
               ].map((rule, i) => (
                 <div key={i} className={`p-4 rounded-md border ${i === 0 ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded bg-white border ${i === 0 ? 'border-red-200 text-red-500' : 'border-slate-200 text-slate-400'} flex items-center justify-center shadow-sm`}>
                         <rule.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[13px] font-semibold ${i === 0 ? 'text-red-900' : 'text-slate-700'}`}>{rule.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{rule.hits} interceptions</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${i === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {rule.status}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TAB 4: Universal Tooling (Terminal UI)
// ==========================================
function TabTooling() {
  return (
    <div className="w-full h-full bg-[#FAFAFA] flex items-center justify-center p-12">
       
       {/* macOS Terminal Window */}
       <div className="w-full max-w-3xl bg-[#1A1F2E] rounded-md shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col h-[400px]">
          {/* Header */}
          <div className="h-10 bg-[#0F131E] border-b border-slate-700/50 flex items-center px-4 relative">
             <div className="flex gap-1.5 absolute left-4">
                <div className="w-3 h-3 rounded-full bg-[#ED6A5E] border border-[#D04E42]"></div>
                <div className="w-3 h-3 rounded-full bg-[#F4BF4F] border border-[#D6A243]"></div>
                <div className="w-3 h-3 rounded-full bg-[#61C554] border border-[#4A9F40]"></div>
             </div>
             <div className="w-full text-center text-xs font-mono text-slate-400">
                memoryos — claude-3-opus — agent-harness
             </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono text-[13px] leading-loose text-slate-300 flex-1 overflow-y-auto">
             <div className="flex gap-2">
               <span className="text-green-400">❯</span>
               <span className="text-[#F0EFE2]">How do I deploy this to Vercel?</span>
             </div>
             
             <div className="mt-4 mb-4 text-slate-400">
               Let me check the MCP tools for deployment guides.
             </div>

             <div className="bg-[#0F131E] border border-slate-700 rounded-md p-4 mb-4">
               <div className="text-blue-400 mb-2 font-bold flex items-center gap-2">
                 <Terminal className="w-4 h-4" /> Tool Call: mcp__fetch_docs
               </div>
               <div className="text-slate-400 pl-6 border-l border-slate-700">
                 query: "Vercel deployment nextjs"
               </div>
             </div>

             <div className="text-slate-400">
               The Vercel deployment requires a <span className="text-[#F0EFE2] bg-slate-800 px-1 rounded">vercel.json</span> config. 
               <br/>I will use the <span className="text-blue-400">write_file</span> tool to create it for you now.
             </div>

             <div className="mt-4 flex gap-2">
               <span className="text-green-400">❯</span>
               <span className="text-[#F0EFE2] border-r-4 border-white animate-pulse pr-1">write_f</span>
             </div>
          </div>
       </div>

    </div>
  );
}


