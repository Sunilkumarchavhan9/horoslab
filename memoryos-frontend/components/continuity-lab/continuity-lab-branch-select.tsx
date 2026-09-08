"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, GitBranch, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type ContinuityLabBranchSelectProps = {
  value: string;
  defaultBranch?: string | null;
  onChange: (branch: string) => void;
  className?: string;
};

export function ContinuityLabBranchSelect({
  value,
  defaultBranch,
  onChange,
  className,
}: ContinuityLabBranchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const branches = useMemo(() => {
    const primary = defaultBranch?.trim() || "main";
    const list = [primary, "main", "master", "develop"].filter(Boolean);
    return [...new Set(list)];
  }, [defaultBranch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => b.toLowerCase().includes(q));
  }, [branches, search]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 max-w-[14rem] items-center gap-1.5 text-sm font-medium text-[#F0EFE2] hover:text-[#F0EFE2]/85"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <GitBranch className="size-4 shrink-0 text-[#F0EFE2]/65" />
        <span className="truncate">{value || "main"}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 overflow-hidden rounded-md border border-[#2F2F2F] bg-[#1d1d1d] shadow-2xl">
          <div className="border-b border-[#2F2F2F] p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branches..."
                className="h-9 w-full rounded-md border border-transparent bg-transparent pl-8 pr-2 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/45 focus:border-[#3A3A3A] focus:outline-none"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#F0EFE2]/45">No branches found</li>
            ) : (
              filtered.map((branch) => (
                <li key={branch}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={branch === value}
                    onClick={() => {
                      onChange(branch);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#F0EFE2]/80 hover:bg-white/[0.06]",
                      branch === value && "bg-white/[0.08]",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3 shrink-0",
                        branch === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{branch}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
