"use client";

import { PlayCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DhyraMissionDetail } from "@/lib/dhyra-api";

function formatTimelineTime(value?: string | null): string {
 if (!value) return "now";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return value;
 return parsed.toLocaleString();
}

export function MissionDetailTimeline({ mission }: { mission: DhyraMissionDetail }) {
 const feed = mission.timeline?.length
 ? mission.timeline.map((item, index) => ({
 id: item.id ?? `${index}`,
 type: item.stage ?? "event",
 actor: item.stage ?? "System",
 action: item.note ?? "updated the mission",
 time: formatTimelineTime(item.timestamp),
 icon: <CheckCircle2 className="size-3.5 text-[#C8C7BA]" />,
 smallIcon: true,
 }))
 : [
 {
 id: "mission-created",
 type: "status",
 actor: "System",
 action: "created the mission",
 time: mission.updatedAt ?? "now",
 icon: <PlayCircle className="size-3.5 text-[#C8C7BA]" />,
 smallIcon: true,
 },
 ];

 return (
 <div className="w-full flex flex-col pt-2 pb-24 font-sans ml-4 px-6">
 <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Mission Log</h2>
 <span className="text-[13px] text-muted-foreground">Live mission timeline</span>
 </div>
 <div className="relative border-l border-border ml-4 pb-4">
 {feed.map((item, index) => (
 <div key={item.id} className={cn("relative pl-8 group", "my-5")}>
 <div className={cn("absolute -left-[12px] rounded-full flex items-center justify-center z-10 bg-card", item.smallIcon ? "size-6" : "size-6 bg-gray-400 border-2 border-white ")}>
 {item.icon}
 </div>
 <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[14px]">
 <span className="font-semibold text-foreground">{item.actor}</span>
 <span className="text-muted-foreground">{item.action}</span>
 <span className="text-muted-foreground text-[13px] ml-1">· {item.time}</span>
 </div>
 {index < feed.length - 1 && <div className="absolute -bottom-5 left-0 right-0 h-px bg-card" />}
 </div>
 ))}
 </div>
 </div>
 );
}
