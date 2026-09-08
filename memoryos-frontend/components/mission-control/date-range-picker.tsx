import React, { useState } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DateRangePicker() {
 const [isOpen, setIsOpen] = useState(false)

 // Hardcoded for the UI mockup matching
 const days = [
 [28, 29, 30, 1, 2, 3, 4],
 [5, 6, 7, 8, 9, 10, 11],
 [12, 13, 14, 15, 16, 17, 18],
 [19, 20, 21, 22, 23, 24, 25],
 [26, 27, 28, 29, 30, 31, 1],
 ]

 const quickLinks = [
 "Last 30 minutes",
 "Last 1 hour",
 "Last 6 hours",
 "Last 12 hours",
 "Last 24 hours",
 "Last 7 days",
 "Last 30 days",
 ]

 return (
 <Popover open={isOpen} onOpenChange={setIsOpen}>
 <PopoverTrigger asChild>
 <button className="flex items-center h-[34px] rounded-md px-3 font-medium bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-[13px] text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff]/50">
 <CalendarIcon className="mr-2 h-4 w-4 text-foreground/55 shrink-0" />
 Last 24 hours
 </button>
 </PopoverTrigger>
 <PopoverContent 
 className="w-[520px] p-0 bg-card rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border overflow-hidden text-foreground font-sans z-50" 
 align="end" 
 sideOffset={8}
 >
 <div className="p-3 border-b border-border">
 <input 
 type="text" 
 placeholder="Custom range: 3h, 3 hours, 3 m..."
 className="w-full bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-foreground/40"
 />
 </div>
 
 <div className="flex border-b border-border">
 {/* Left Column: Calendar */}
 <div className="flex-1 p-6 border-r border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-[13px] font-semibold text-foreground">July 2026</span>
 <div className="flex items-center gap-1">
 <button className="flex items-center justify-center size-7 rounded border border-border bg-card hover:bg-accent">
 <ChevronLeft className="size-4 text-foreground/70" />
 </button>
 <button className="flex items-center justify-center size-7 rounded border border-border bg-card hover:bg-accent">
 <ChevronRight className="size-4 text-foreground/70" />
 </button>
 </div>
 </div>
 
 <div className="grid grid-cols-7 gap-1 text-center mb-2">
 {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
 <div key={day} className="text-[11px] font-medium text-foreground/50 py-1">
 {day}
 </div>
 ))}
 </div>
 
 <div className="space-y-1">
 {days.map((week, i) => (
 <div key={i} className="grid grid-cols-7 gap-1 text-center">
 {week.map((day, j) => {
 const isOtherMonth = (i === 0 && day > 20) || (i === 4 && day === 1)
 const isSelected = !isOtherMonth && (day === 20 || day === 21)
 const isFirstSelected = isSelected && day === 20
 const isLastSelected = isSelected && day === 21
 
 return (
 <div 
 key={`${i}-${j}`} 
 className={cn(
 "h-8 flex items-center justify-center text-[13px] cursor-pointer hover:bg-accent",
 isOtherMonth ? "text-foreground/20" : "text-foreground",
 isSelected && "bg-[#111827] text-[#F0EFE2] hover:bg-[#111827]",
 isFirstSelected && "rounded-l-md",
 isLastSelected && "rounded-r-md",
 !isSelected && "rounded-md"
 )}
 >
 {day}
 </div>
 )
 })}
 </div>
 ))}
 </div>
 </div>

 {/* Right Column: Quick Links */}
 <div className="w-48 p-2 py-3 flex flex-col">
 {quickLinks.map((link) => (
 <button 
 key={link}
 className={cn(
 "text-left px-3 py-2 text-[13px] rounded-md transition-colors",
 link === "Last 24 hours" ? "bg-muted font-medium text-foreground" : "text-foreground/70 hover:bg-accent hover:text-foreground"
 )}
 >
 {link}
 </button>
 ))}
 </div>
 </div>

 {/* Inputs Footer */}
 <div className="p-6 grid grid-cols-2 gap-6 border-b border-border bg-black/[0.01]">
 <div>
 <label className="block text-[11px] text-foreground/50 mb-1.5 font-medium">Start</label>
 <div className="relative">
 <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40" />
 <input 
 type="text" 
 defaultValue="2026-07-20 16:10" 
 className="w-full h-8 pl-8 pr-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f52ff]/50"
 />
 </div>
 </div>
 <div>
 <label className="block text-[11px] text-foreground/50 mb-1.5 font-medium">End</label>
 <div className="relative">
 <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40" />
 <input 
 type="text" 
 defaultValue="2026-07-21 16:10" 
 className="w-full h-8 pl-8 pr-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f52ff]/50"
 />
 </div>
 </div>
 </div>

 {/* Action Bar */}
 <div className="p-3 px-6 flex items-center justify-between bg-black/[0.01]">
 <button className="flex items-center gap-1.5 text-[13px] text-foreground/60 hover:text-foreground transition-colors">
 India Standard Time (GMT+5:30)
 <ChevronDown className="size-3.5" />
 </button>
 <Button 
 size="sm" 
 className="btn-glossy-blue h-8 px-6 font-medium "
 onClick={() => setIsOpen(false)}
 >
 Apply
 </Button>
 </div>
 </PopoverContent>
 </Popover>
 )
}
