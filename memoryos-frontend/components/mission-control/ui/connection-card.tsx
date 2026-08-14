import React from "react";
import { Server, Database, Cloud } from "lucide-react";
import { HoverLift } from "./animations";

export type ConnectionCardProps = {
 name: string;
 type: "database" | "api" | "service";
 status: "connected" | "disconnected" | "syncing";
 className?: string;
};

export function ConnectionCard({
 name,
 type,
 status,
 className = "",
}: ConnectionCardProps) {
 const Icon = type === 'database' ? Database : type === 'api' ? Cloud : Server;
 
 return (
 <HoverLift className={`group flex flex-col p-6 bg-card border border-border rounded-[6px] ${className}`}>
 <div className="flex items-start justify-between mb-3">
 <div className="p-1.5 rounded bg-muted text-foreground/60">
 <Icon className="size-4" />
 </div>
 <div className={`size-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
 </div>
 <h4 className="text-[13px] font-semibold text-foreground leading-tight mb-1">{name}</h4>
 <div className="text-[11px] text-foreground/50 capitalize font-medium">{type}</div>
 </HoverLift>
 );
}
