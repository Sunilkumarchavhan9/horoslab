"use client";

import { AlertTriangle, RefreshCw, Scale } from "lucide-react";

export function SettlementOutcomesView() {
  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <Scale className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Settlement Outcomes</h1>
            <p className="text-[13px] text-muted-foreground mt-1">No settlement backend feed is wired into this view yet.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border">
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      <div className="flex items-start gap-3 px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500">
        <AlertTriangle className="size-5 shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <h3 className="text-[13px] font-bold uppercase tracking-wider">Backend missing</h3>
          <p className="text-[13px] mt-1 font-medium">Settlement needs live outcome data before we can render real records here.</p>
        </div>
      </div>

      <div className="p-8 text-[13px] text-muted-foreground">No settlement outcomes are available yet.</div>
    </div>
  );
}
