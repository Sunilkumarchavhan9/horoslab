import React from "react";

export function ActivityFeed({ activities }: { activities: { id: string, user: string, action: string, target: string, time: string }[] }) {
 return (
 <div className="w-full bg-card rounded-[6px] border border-border overflow-hidden">
 <div className="px-6 py-3 border-b border-border bg-black/[0.01]">
 <h3 className="text-[13px] font-semibold text-foreground">Activity Feed</h3>
 </div>
 <div className="divide-y divide-black/5">
 {activities.map((act) => (
 <div key={act.id} className="p-6 hover:bg-muted/50 transition-colors">
 <div className="flex items-start justify-between gap-6">
 <div className="text-[13px] text-foreground/60 leading-snug">
 <span className="font-semibold text-foreground">{act.user}</span>
 {" "}{act.action}{" "}
 <span className="font-medium text-foreground">{act.target}</span>
 </div>
 <span className="text-[11px] text-foreground/40 shrink-0 whitespace-nowrap">{act.time}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
