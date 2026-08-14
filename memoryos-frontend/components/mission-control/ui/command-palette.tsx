"use client";

import React, { useEffect } from "react";
import { Command } from "cmdk";
import { Search, FileText, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
 useEffect(() => {
 const down = (e: KeyboardEvent) => {
 if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
 e.preventDefault();
 setOpen(!open);
 }
 };
 document.addEventListener("keydown", down);
 return () => document.removeEventListener("keydown", down);
 }, [setOpen, open]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
 <div className="w-full max-w-lg bg-card rounded-md shadow-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
 <Command className="w-full" loop>
 <div className="flex items-center border-b border-border px-3 py-2">
 <Search className="size-5 text-foreground/40 mr-2" />
 <Command.Input 
 autoFocus
 className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-foreground/30" 
 placeholder="Search components, missions, or agents..." 
 />
 <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => setOpen(false)}>
 <span className="text-[10px] text-foreground/50 border border-border rounded px-1">ESC</span>
 </Button>
 </div>
 <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
 <Command.Empty className="py-6 text-center text-sm text-foreground/40">No results found.</Command.Empty>
 
 <Command.Group heading="Suggestions" className="text-xs font-medium text-foreground/40 px-2 py-1.5">
 <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent cursor-pointer text-sm text-foreground aria-selected:bg-muted">
 <FileText className="size-4 text-foreground/40" /> Active Missions
 </Command.Item>
 <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent cursor-pointer text-sm text-foreground aria-selected:bg-muted">
 <Settings className="size-4 text-foreground/40" /> Settings
 </Command.Item>
 </Command.Group>
 
 <Command.Group heading="Agents" className="text-xs font-medium text-foreground/40 px-2 py-1.5 mt-2">
 <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent cursor-pointer text-sm text-foreground aria-selected:bg-muted">
 <User className="size-4 text-foreground/40" /> Research Agent alpha-09
 </Command.Item>
 <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent cursor-pointer text-sm text-foreground aria-selected:bg-muted">
 <User className="size-4 text-foreground/40" /> Code Reviewer sys-4
 </Command.Item>
 </Command.Group>
 </Command.List>
 </Command>
 </div>
 {/* Background click to close */}
 <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
 </div>
 );
}
