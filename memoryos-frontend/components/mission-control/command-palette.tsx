import React, { useState } from "react"
import { Search, Sparkles, Database, Box, Server, Lock, Fingerprint } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function CommandPalette({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
 const [query, setQuery] = useState("")

 const items = [
 { prefix: "ask:", label: "Ask AI", icon: Sparkles },
 { prefix: "access:", label: "Search Access applications", icon: Lock },
 { prefix: "aig:", label: "Search AI Gateways", icon: Server },
 { prefix: "ais:", label: "Search AI Search instances", icon: Fingerprint },
 { prefix: "containers:", label: "Search Container applications", icon: Box },
 { prefix: "d1:", label: "Search D1 databases", icon: Database },
 ]

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-[640px] p-0 overflow-hidden bg-card rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-border gap-0 sm:max-w-[640px] top-[15%] translate-y-0" showCloseButton={false}>
 {/* Search Input Header */}
 <div className="flex items-center px-6 py-3 border-b border-border">
 <Search className="size-4 text-foreground/40 mr-3 shrink-0" />
 <input
 autoFocus
 className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground/40 h-8"
 placeholder="Search products, pages, and features..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 />
 <button 
 onClick={() => onOpenChange(false)}
 className="flex items-center justify-center text-[10px] font-medium text-foreground/50 bg-muted border border-border rounded px-1.5 py-0.5 ml-2 hover:bg-black/10 transition-colors"
 >
 Esc
 </button>
 </div>

 {/* Content Area */}
 <div className="p-2 py-3 max-h-[400px] overflow-y-auto">
 {!query && (
 <div className="px-3 mb-2">
 <h3 className="text-xs font-medium text-foreground/50">Search tips</h3>
 </div>
 )}

 <div className="space-y-0.5">
 {items.filter(item => !query || item.label.toLowerCase().includes(query.toLowerCase()) || item.prefix.includes(query.toLowerCase())).map((item, idx) => (
 <button 
 key={item.prefix}
 className={cn(
 "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors group",
 idx === 0 && !query ? "bg-muted" : "hover:bg-muted"
 )}
 >
 <div className="flex items-center text-foreground/70 group-hover:text-foreground">
 <item.icon className="size-4 mr-3 shrink-0 text-foreground/40 group-hover:text-foreground/60" />
 <span className="font-semibold text-foreground/80">{item.prefix}</span>
 <span className="mx-2 text-foreground/30">—</span>
 <span>{item.label}</span>
 </div>
 {idx === 0 && !query && (
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/40"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center gap-6 px-6 py-3 bg-muted/50 border-t border-border text-[11px] font-medium text-foreground/40">
 <div className="flex items-center gap-1.5">
 <span className="flex items-center gap-0.5">
 <span className="bg-card border border-border rounded px-1 py-0.5 leading-none">↑</span>
 <span className="bg-card border border-border rounded px-1 py-0.5 leading-none">↓</span>
 </span>
 <span>to navigate</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="bg-card border border-border rounded px-1.5 py-0.5 leading-none font-sans">↵</span>
 <span>to select</span>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 )
}
