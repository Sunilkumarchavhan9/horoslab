"use client";

import { Zap, GitBranch, Power, Plus, ArrowRight, Settings2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function MissionAutomationView() {
  const automations = [
    { id: "AUT-001", title: "GitHub Push to Main", eventTrigger: "github.push.main", eventIcon: GitBranch, missionAction: "Run Dependency Scan", expectedResult: "Security Audit Artifact", status: "active" },
    { id: "AUT-002", title: "High Memory Alert", eventTrigger: "datadog.monitor.alert", eventIcon: AlertTriangle, missionAction: "Scale Agent Pool", expectedResult: "Infrastructure Config Updated", status: "active" },
    { id: "AUT-003", title: "Nightly Security Audit", eventTrigger: "cron.daily.0200", eventIcon: Clock, missionAction: "Run Compliance Checks", expectedResult: "Compliance Report Artifact", status: "disabled" },
  ];

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm">
            <Zap className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Automation Rules</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Configure operational pipelines mapping events to missions.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-foreground/90 transition-colors">
          <Plus className="size-4" /> Create Rule
        </button>
      </div>

      <div className="flex flex-col w-full h-full overflow-y-auto">
        
        {/* Edge-to-Edge Data Table Header */}
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border sticky top-0 z-10">
          <div className="flex-[0.5] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</div>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rule Name</div>
          <div className="flex-[1.5] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trigger Event</div>
          <div className="flex-[1.5] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Resulting Mission</div>
          <div className="flex-[1.5] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Expected Result</div>
          <div className="w-10"></div>
        </div>

        {/* Data Table Body */}
        <div className="flex flex-col divide-y divide-border">
          {automations.map(auto => {
            const Icon = auto.eventIcon;
            return (
              <div 
                key={auto.id} 
                className={cn(
                  "flex items-center px-8 py-5 transition-colors group cursor-pointer",
                  auto.status === 'active' ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/20 opacity-80"
                )}
              >
                
                <div className="flex items-center gap-2 flex-[0.5]">
                  <Power className={cn("size-4", auto.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground/50')} />
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    auto.status === 'active' ? 'text-emerald-600 dark:text-emerald-500' : 'text-muted-foreground'
                  )}>
                    {auto.status}
                  </span>
                </div>

                <div className="flex flex-col flex-1 pr-4">
                  <span className="text-[14px] font-bold text-foreground group-hover:text-blue-500 transition-colors mb-1">{auto.title}</span>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm w-fit">{auto.id}</span>
                </div>

                <div className="flex items-center flex-[1.5]">
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm bg-card shadow-sm">
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span className="text-[12px] font-mono text-foreground font-medium">{auto.eventTrigger}</span>
                  </div>
                </div>

                <div className="flex items-center flex-[1.5] gap-4">
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-[13px] font-bold text-foreground">{auto.missionAction}</span>
                </div>

                <div className="flex items-center flex-[1.5] gap-4">
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-[13px] font-medium text-muted-foreground">{auto.expectedResult}</span>
                </div>

                <div className="flex justify-end w-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors">
                    <Settings2 className="size-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


