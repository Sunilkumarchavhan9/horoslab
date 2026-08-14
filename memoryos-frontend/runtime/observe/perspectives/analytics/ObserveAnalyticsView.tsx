import React from "react";
import { TrendingUp, TrendingDown, Target, Bot, Banknote, BrainCircuit, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from "@/lib/utils";

export function ObserveAnalyticsView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col border-b border-border pb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Enterprise Analytics</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Quantitative business intelligence and automation metrics across all active institutions.
          </p>
        </div>

        {/* Global Analytics Ledger */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Strategic Performance Metrics</h2>
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm">
             
             {/* Section Controls */}
             <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
               <div className="flex items-center gap-3 w-full max-w-sm">
                  <div className="relative flex-1">
                     <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                     <input type="text" placeholder="Search metrics..." className="w-full bg-background border border-border rounded-sm pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-sm text-[12px] font-medium text-foreground hover:bg-muted/50">
                     <Filter className="size-3" /> Filter
                  </button>
               </div>
             </div>

             <div className="flex flex-col divide-y divide-border/50">
             
             {/* Mission Success */}
             <div className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="flex items-center justify-center size-8 border border-border bg-muted/30 rounded-sm">
                      <Target className="size-4 text-muted-foreground" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mission Success Rate</span>
                      <span className="text-[18px] font-bold text-foreground">98.2%</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 text-[12px] text-foreground font-mono">
                      <TrendingUp className="size-3" /> +1.2% (7d)
                   </div>
                   <span className="text-[11px] text-muted-foreground mt-1">Target: &gt; 95.0%</span>
                </div>
             </div>

             {/* Automation % */}
             <div className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="flex items-center justify-center size-8 border border-border bg-muted/30 rounded-sm">
                      <Bot className="size-4 text-muted-foreground" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Autonomous Execution</span>
                      <span className="text-[18px] font-bold text-foreground">84.5%</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 text-[12px] text-foreground font-mono">
                      <TrendingUp className="size-3" /> +4.5% (7d)
                   </div>
                   <span className="text-[11px] text-muted-foreground mt-1">Human Intervention: 15.5%</span>
                </div>
             </div>

             {/* Compute Cost */}
             <div className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors bg-muted/20">
                <div className="flex items-center gap-4">
                   <div className="flex items-center justify-center size-8 border border-border bg-card rounded-sm shadow-sm">
                      <Banknote className="size-4 text-foreground" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Compute Cost (MTD)</span>
                      <span className="text-[18px] font-bold text-foreground">$12,450</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 text-[12px] text-foreground font-mono">
                      <TrendingDown className="size-3" /> -5.0% (7d)
                   </div>
                   <span className="text-[11px] text-muted-foreground mt-1">Within allocated budget</span>
                </div>
             </div>

             {/* Learning Extracted */}
             <div className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="flex items-center justify-center size-8 border border-border bg-muted/30 rounded-sm">
                      <BrainCircuit className="size-4 text-muted-foreground" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Extracted Learnings</span>
                      <span className="text-[18px] font-bold text-foreground">1,204</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 text-[12px] text-foreground font-mono">
                      <TrendingUp className="size-3" /> +12.0% (7d)
                   </div>
                   <span className="text-[11px] text-muted-foreground mt-1">New behaviors institutionalized</span>
                </div>
             </div>

             </div>
             
             {/* Pagination Footer */}
             <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/10">
               <span className="text-[11px] text-muted-foreground">Showing 1-4 of 24 metrics</span>
               <div className="flex items-center gap-1">
                  <button className="p-1 border border-border rounded-sm bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3.5" /></button>
                  <button className="p-1 border border-border rounded-sm bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"><ChevronRight className="size-3.5" /></button>
               </div>
             </div>
           </div>
        </div>

        {/* Throughput Data Table */}
        <div className="flex flex-col gap-4 mt-2">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Mission Throughput Ledger (7d Rolling)</h2>
           
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm overflow-hidden">
             
             {/* Section Controls */}
             <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
               <div className="flex items-center gap-3 w-full max-w-sm">
                  <div className="relative flex-1">
                     <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                     <input type="text" placeholder="Search mission ledger..." className="w-full bg-background border border-border rounded-sm pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-sm text-[12px] font-medium text-foreground hover:bg-muted/50">
                     <Filter className="size-3" /> Filter
                  </button>
               </div>
             </div>
             
             {/* Table Header */}
             <div className="flex items-center px-6 py-3 bg-muted/30 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <div className="w-[120px]">Date (UTC)</div>
                <div className="flex-1">Total Missions</div>
                <div className="w-[120px] text-right">Autonomous</div>
                <div className="w-[120px] text-right">Human Assist</div>
             </div>

             {/* Table Rows (Mock Sparkline data turned into tabular format) */}
             <div className="flex flex-col divide-y divide-border/50">
                {[
                  { date: "Jul 25", total: 4102, auto: 3486, human: 616 },
                  { date: "Jul 24", total: 3890, auto: 3209, human: 681 },
                  { date: "Jul 23", total: 4210, auto: 3600, human: 610 },
                  { date: "Jul 22", total: 3950, auto: 3250, human: 700 },
                  { date: "Jul 21", total: 3100, auto: 2480, human: 620 },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors">
                     <div className="w-[120px]">
                        <span className="text-[12px] font-mono text-muted-foreground">{row.date}</span>
                     </div>
                     <div className="flex-1 flex flex-col gap-1.5">
                        <span className="text-[12px] font-medium text-foreground">{row.total.toLocaleString()}</span>
                        {/* ASCII block visual bar */}
                        <span className="text-[10px] font-mono tracking-tighter text-muted-foreground leading-none">
                           <span className="text-foreground">
                              {'▓'.repeat(Math.round((row.auto / 4500) * 25))}
                           </span>
                           <span className="text-muted-foreground">
                              {'▒'.repeat(Math.round((row.human / 4500) * 25))}
                           </span>
                           {'░'.repeat(25 - Math.round((row.total / 4500) * 25))}
                        </span>
                     </div>
                     <div className="w-[120px] flex justify-end">
                        <span className="text-[12px] font-mono text-foreground">{row.auto.toLocaleString()}</span>
                     </div>
                     <div className="w-[120px] flex justify-end">
                        <span className="text-[12px] font-mono text-muted-foreground">{row.human.toLocaleString()}</span>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* Model Utilization Matrix (Updated to match OpenRouter/Hermes screenshots) */}
        <div className="flex flex-col gap-4 mt-2">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Model Utilization Matrix (Last 30 Days)</h2>
           
           <div className="flex flex-col border border-border bg-[#0f0f11] rounded-sm shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <h3 className="text-white text-[16px] font-medium">Enterprise Agent Usage</h3>
                    <p className="text-[#a1a1aa] text-[13px] mt-1">Aggregated token consumption across all active models.</p>
                 </div>
              </div>

              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                       data={usageData}
                       margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                       barSize={12}
                    >
                       <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          dy={10}
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          tickFormatter={(value) => `${value}B`}
                       />
                       <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                       
                       <Bar dataKey="DeepSeek V4 Flash" stackId="a" fill="#00A3FF" />
                       <Bar dataKey="MiniMax M3" stackId="a" fill="#00E5FF" />
                       <Bar dataKey="Others" stackId="a" fill="#F5A623" />
                       <Bar dataKey="Step 3.7 Flash" stackId="a" fill="#F56A00" />
                       <Bar dataKey="DeepSeek V4 Pro" stackId="a" fill="#7B61FF" />
                       <Bar dataKey="GLM 5.2" stackId="a" fill="#E91E63" />
                       <Bar dataKey="Nemotron 3 Ultra" stackId="a" fill="#8BC34A" />
                       <Bar dataKey="Nemotron 3 Super" stackId="a" fill="#CDDC39" />
                       <Bar dataKey="Claude Sonnet 5" stackId="a" fill="#FFEB3B" />
                       <Bar dataKey="Claude Opus 4.8" stackId="a" fill="#FF9800" />
                       <Bar dataKey="MiMo-V2.5" stackId="a" fill="#FF5722" radius={[2, 2, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Agent Capability Execution Ledger (Replaces Top 5 List) */}
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm overflow-hidden mt-2">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                 <h2 className="text-[12px] font-bold uppercase tracking-wider text-foreground">Agent Capability Execution Ledger</h2>
              </div>

              {/* Section Controls */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                <div className="flex items-center gap-3 w-full max-w-sm">
                   <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <input type="text" placeholder="Search capabilities..." className="w-full bg-background border border-border rounded-sm pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground" />
                   </div>
                   <button className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-sm text-[12px] font-medium text-foreground hover:bg-muted/50">
                      <Filter className="size-3" /> Filter
                   </button>
                </div>
              </div>
              
              {/* Ledger Header */}
              <div className="flex items-center px-6 py-3 bg-muted/30 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                 <div className="w-[180px]">Capability Lease</div>
                 <div className="flex-1">Governing Policy</div>
                 <div className="w-[140px] text-right">Compute Expenditure</div>
                 <div className="w-[140px] text-right">Verification Rate</div>
                 <div className="w-[100px] text-right">Status</div>
              </div>

              {/* Ledger Rows */}
              <div className="flex flex-col divide-y divide-border/50">
                 {[
                    { capability: "Hermes Agent", policy: "POL-SEC-01 (General Coding)", compute: "307B Tokens", verify: "99.4%", status: "Active", isWarning: false },
                    { capability: "Claude Code", policy: "POL-INF-12 (Infrastructure)", compute: "85.9B Tokens", verify: "98.1%", status: "Active", isWarning: false },
                    { capability: "pi Agent", policy: "POL-COM-04 (Communications)", compute: "71.0B Tokens", verify: "94.2%", status: "Degraded", isWarning: true },
                    { capability: "Oh-My-Pi", policy: "POL-SEC-02 (Sandboxed)", compute: "29.5B Tokens", verify: "100%", status: "Active", isWarning: false },
                    { capability: "Kilo Code", policy: "POL-SEC-01 (General Coding)", compute: "27.3B Tokens", verify: "99.1%", status: "Active", isWarning: false }
                 ].map((row, idx) => (
                    <div key={idx} className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors group cursor-default">
                       <div className="w-[180px] flex items-center gap-2">
                          <Bot className={cn("size-4", row.isWarning ? "text-foreground" : "text-muted-foreground")} />
                          <span className={cn("text-[13px] font-medium", row.isWarning ? "text-foreground" : "text-foreground")}>{row.capability}</span>
                       </div>
                       
                       <div className="flex-1">
                          <span className="text-[12px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{row.policy}</span>
                       </div>
                       
                       <div className="w-[140px] flex justify-end">
                          <span className="text-[12px] font-mono text-foreground">{row.compute}</span>
                       </div>
                       
                       <div className="w-[140px] flex justify-end">
                          <span className="text-[12px] font-mono text-foreground">{row.verify}</span>
                       </div>
                       
                       <div className="w-[100px] flex justify-end">
                          <span className={cn(
                             "text-[10px] font-mono px-2 py-0.5 rounded-sm border",
                             row.isWarning ? "border-foreground bg-muted/50 text-foreground" : "border-border bg-card text-muted-foreground"
                          )}>
                             {row.status}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/10">
                <span className="text-[11px] text-muted-foreground">Showing 1-5 of 365 entries</span>
                <div className="flex items-center gap-1">
                   <button className="p-1 border border-border rounded-sm bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3.5" /></button>
                   <button className="p-1 border border-border rounded-sm bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"><ChevronRight className="size-3.5" /></button>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// --- Mock Data and Helpers ---
const usageData = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date(2026, 5, 26 + i); // Jun 26 to Jul 25
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  
  // Sine wave multiplier to create realistic looking variation
  const m = 1 + Math.sin(i / 4) * 0.15 + (i / 30) * 0.2;
  
  return {
    date: i % 3 === 0 ? `${month} ${day}` : '',
    fullDate: `${month} ${day}, 2026`,
    'DeepSeek V4 Flash': Math.floor(201 * m),
    'MiniMax M3': Math.floor(116 * m),
    'Others': Math.floor(114 * m),
    'Step 3.7 Flash': Math.floor(101 * m),
    'DeepSeek V4 Pro': Math.floor(88.1 * m),
    'GLM 5.2': Math.floor(79.1 * m),
    'Nemotron 3 Ultra': Math.floor(58.4 * m),
    'Nemotron 3 Super': Math.floor(32.5 * m),
    'Claude Sonnet 5': Math.floor(21.2 * m),
    'Claude Opus 4.8': Math.floor(16.7 * m),
    'MiMo-V2.5': Math.floor(13.7 * m),
  };
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    const fullDate = payload[0].payload.fullDate;
    
    return (
      <div className="bg-[#09090b] border border-[#27272a] rounded-md p-3 shadow-xl min-w-[200px]">
        <div className="text-white text-[12px] font-medium mb-3">{fullDate}</div>
        <div className="flex flex-col gap-1.5">
          {/* Reverse payload to match visual stack order (top to bottom) */}
          {[...payload].reverse().map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                 <span className="text-[#a1a1aa]">{entry.name}</span>
              </div>
              <span className="text-white font-mono">{entry.value}B</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-[12px] pt-2 mt-2 border-t border-[#27272a]">
             <span className="text-[#a1a1aa] font-medium">Total</span>
             <span className="text-white font-mono">{total}B</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
