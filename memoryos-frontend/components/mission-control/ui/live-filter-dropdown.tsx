"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveFilterDropdown({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);
    return <div ref={ref} className="relative shrink-0">
        <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className={cn("flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground", value && value !== "All" && "text-foreground")}>
            {label}{value && value !== "All" ? `: ${value}` : ""}<ChevronDown className="size-3" />
        </button>
        {open && <div role="listbox" className="absolute left-0 top-9 z-[60] max-h-72 min-w-40 overflow-y-auto rounded-md border border-border bg-card p-1 text-card-foreground shadow-2xl ring-1 ring-border/60">
            {options.map((option) => <button type="button" role="option" aria-selected={option === (value ?? "All")} key={option} onClick={() => { onChange(option); setOpen(false); }} className={cn("block w-full rounded px-3 py-2 text-left text-xs hover:bg-muted", option === (value ?? "All") ? "font-semibold text-primary" : "text-foreground")}>{option}</button>)}
        </div>}
    </div>;
}
