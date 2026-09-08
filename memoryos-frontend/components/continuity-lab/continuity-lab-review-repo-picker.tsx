"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepoOption } from "@/components/continuity-lab/continuity-lab-repo-select-modal";

type ContinuityLabReviewRepoPickerProps = {
  repos: RepoOption[];
  selected: string | null;
  onSelect: (fullName: string) => void;
  loading?: boolean;
  className?: string;
};

function repoOwnerPrefix(fullName: string): string {
  const slash = fullName.indexOf("/");
  return slash > 0 ? fullName.slice(0, slash) : fullName;
}

function repoName(fullName: string): string {
  const slash = fullName.indexOf("/");
  return slash > 0 ? fullName.slice(slash + 1) : fullName;
}

export function ContinuityLabReviewRepoPicker({
  repos,
  selected,
  onSelect,
  loading = false,
  className,
}: ContinuityLabReviewRepoPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((repo) => repo.fullName.toLowerCase().includes(q));
  }, [repos, search]);

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

  const selectedMeta = repos.find((repo) => repo.fullName === selected);

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-md", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-between gap-3 border border-[#3A3A3A] bg-[#111111] px-4 text-left hover:border-[#4A4A4A]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate text-sm text-[#F0EFE2]">
          {selected ? (
            <>
              <span className="text-[#F0EFE2]/45">{repoOwnerPrefix(selected)}/</span>
              <span>{repoName(selected)}</span>
            </>
          ) : (
            <span className="text-[#F0EFE2]/45">Select repository</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#F0EFE2]/45" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 flex max-h-[min(420px,60vh)] flex-col border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl">
          <div className="border-b border-[#2F2F2F] p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#F0EFE2]/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repos…"
                autoFocus
                className="h-9 w-full border border-[#3A3A3A] bg-[#111111] pl-9 pr-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#6366F1] focus:outline-none"
              />
            </div>
          </div>

          <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto py-1">
            {loading ? (
              <li className="flex items-center justify-center gap-2 py-10 text-sm text-[#F0EFE2]/50">
                <Loader2 className="size-4 animate-spin" />
                Loading repositories…
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-[#F0EFE2]/45">
                {repos.length === 0
                  ? "No repositories found. Connect GitHub in Mission Control."
                  : "No repositories match your search."}
              </li>
            ) : (
              filtered.map((repo) => {
                const checked = repo.fullName === selected;
                return (
                  <li key={repo.fullName}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => {
                        onSelect(repo.fullName);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#141414]",
                        checked && "bg-[#141414]",
                      )}
                    >
                      <Check
                        className={cn(
                          "size-4 shrink-0 text-[#6366F1]",
                          checked ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="text-[#F0EFE2]/45">{repoOwnerPrefix(repo.fullName)}/</span>
                        <span className="text-[#F0EFE2]">{repoName(repo.fullName)}</span>
                      </span>
                      {selectedMeta?.fullName === repo.fullName && repo.private ? (
                        <span className="text-[10px] uppercase tracking-wide text-[#F0EFE2]/35">Private</span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
