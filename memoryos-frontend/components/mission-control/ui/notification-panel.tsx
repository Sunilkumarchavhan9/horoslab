import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationPanel({ notifications }: { notifications: { id: string, title: string, desc: string, isRead: boolean, time: string }[] }) {
 return (
 <div className="w-[320px] bg-card border border-border rounded-[6px] overflow-hidden flex flex-col max-h-[400px]">
 <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/50">
 <div className="flex items-center gap-2">
 <Bell className="size-4 text-foreground/60" />
 <span className="font-semibold text-sm text-foreground">Notifications</span>
 </div>
 <span className="text-[11px] font-medium text-foreground/50 bg-muted px-2 py-0.5 rounded-full">
 {notifications.filter(n => !n.isRead).length} new
 </span>
 </div>
 <div className="flex-1 overflow-y-auto">
 {notifications.length === 0 ? (
 <div className="py-8 text-center text-sm text-foreground/40">No new notifications</div>
 ) : (
 <div className="divide-y divide-black/5">
 {notifications.map((n) => (
 <div key={n.id} className={`p-6 hover:bg-muted/50 transition-colors cursor-pointer relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
 {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0f52ff]" />}
 <div className="flex items-start justify-between gap-2 mb-1">
 <h4 className={`text-[13px] ${!n.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>{n.title}</h4>
 <span className="text-[10px] text-foreground/40 whitespace-nowrap">{n.time}</span>
 </div>
 <p className="text-[12px] text-foreground/60 leading-relaxed line-clamp-2">{n.desc}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="p-2 border-t border-border bg-black/[0.01]">
 <Button variant="ghost" className="w-full text-[12px] h-8 text-foreground/60 hover:text-foreground rounded-[4px]">
 Mark all as read
 </Button>
 </div>
 </div>
 );
}
