import React from "react";
import { CircleCheck, CircleDashed, Clock } from "lucide-react";

export interface TimelineEvent {
 id: string;
 time: string;
 title: string;
 type: "success" | "process" | "pending";
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
 return (
 <div className="relative pl-3 space-y-6 before:absolute before:inset-0 before:ml-[17px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#e2e2e8] before:to-transparent">
 {events.map((event, idx) => (
 <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
 <div className="flex items-center justify-center size-7 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow bg-card border-2 border-[#0f52ff] z-10 rounded-full">
 {event.type === "success" ? (
 <CircleCheck className="size-3.5 text-[#0f52ff]" />
 ) : event.type === "process" ? (
 <CircleDashed className="size-3.5 text-amber-500 animate-spin-slow" />
 ) : (
 <Clock className="size-3.5 text-muted-foreground" />
 )}
 </div>
 <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-3 group-hover:border-[#0f52ff]/40 transition-colors rounded-[6px]">
 <div className="flex items-center justify-between mb-1">
 <span className="text-[13px] font-semibold text-foreground">{event.title}</span>
 <span className="text-[10px] text-muted-foreground font-mono">{event.time}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 );
}
