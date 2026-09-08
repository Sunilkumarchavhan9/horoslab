"use client";

import { useState } from "react";

const SAMPLE_MEMORIES = [
  {
    id: "1",
    content: "Preferred dark mode in all IDEs. Uses VS Code with Vim keybindings. Prefers TypeScript over JavaScript.",
    tags: ["preferences", "tooling"],
    source: "Claude Code",
    ago: "2 hours ago",
    accent: "#4f93ff",
  },
  {
    id: "2",
    content: "Working on MemoryOS — a developer memory infrastructure platform. Monorepo with Next.js frontend and Express backend.",
    tags: ["project", "context"],
    source: "Cursor",
    ago: "5 hours ago",
    accent: "#9b7bff",
  },
  {
    id: "3",
    content: "Prefers concise, no-fluff responses. No emojis unless explicitly requested. Terse summaries preferred.",
    tags: ["communication", "preferences"],
    source: "Claude.ai",
    ago: "1 day ago",
    accent: "#14c38e",
  },
  {
    id: "4",
    content: "Tech stack for main project: Next.js 16, React 19, Tailwind CSS v4, Clerk auth, Prisma with PostgreSQL.",
    tags: ["project", "stack"],
    source: "Claude Code",
    ago: "2 days ago",
    accent: "#f0b429",
  },
  {
    id: "5",
    content: "Follows atomic commit style. Prefers feature branches. Never force-pushes to main.",
    tags: ["git", "workflow"],
    source: "GitHub",
    ago: "3 days ago",
    accent: "#4f93ff",
  },
  {
    id: "6",
    content: "Interested in AI memory infrastructure, LangGraph workflows, and MCP protocol integrations.",
    tags: ["interests", "AI"],
    source: "Claude.ai",
    ago: "5 days ago",
    accent: "#9b7bff",
  },
];

const ALL_TAGS = ["all", "preferences", "project", "tooling", "context", "communication", "stack", "git", "workflow", "AI", "interests"];

function TagPill({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[6px] px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] transition-colors"
      style={
        active
          ? { background: "rgba(79,147,255,0.15)", color: "#4f93ff", border: "1px solid rgba(79,147,255,0.3)" }
          : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      {tag === "all" ? "All" : tag}
    </button>
  );
}

export function MemoriesSection() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = SAMPLE_MEMORIES.filter((m) => {
    const matchesSearch =
      !search || m.content.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.includes(search.toLowerCase()));
    const matchesTag = activeTag === "all" || m.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.05em]">Memories</h1>
          <p className="mt-1 text-[13px] text-[#F0EFE2]/40">{SAMPLE_MEMORIES.length} memories stored across all sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("grid")}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition-colors"
            style={
              view === "grid"
                ? { borderColor: "rgba(79,147,255,0.3)", background: "rgba(79,147,255,0.1)", color: "#4f93ff" }
                : { borderColor: "rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.35)" }
            }
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
              <rect x="0.5" y="0.5" width="5" height="5" rx="1" />
              <rect x="7.5" y="0.5" width="5" height="5" rx="1" />
              <rect x="0.5" y="7.5" width="5" height="5" rx="1" />
              <rect x="7.5" y="7.5" width="5" height="5" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition-colors"
            style={
              view === "list"
                ? { borderColor: "rgba(79,147,255,0.3)", background: "rgba(79,147,255,0.1)", color: "#4f93ff" }
                : { borderColor: "rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.35)" }
            }
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="1" y1="3" x2="12" y2="3" />
              <line x1="1" y1="6.5" x2="12" y2="6.5" />
              <line x1="1" y1="10" x2="12" y2="10" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F0EFE2]/30" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="4.5" />
          <path d="M9.5 9.5L13 13" />
        </svg>
        <input
          type="text"
          placeholder="Search memories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[8px] border border-white/10 bg-[#161616] py-2.5 pl-10 pr-4 text-[13px] text-[#F0EFE2] placeholder-white/25 outline-none transition-colors focus:border-[#4f93ff]/40 focus:bg-[#1a1a1a]"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALL_TAGS.map((tag) => (
          <TagPill key={tag} tag={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-white/8 bg-[#141414] py-16 text-center">
          <p className="mt-3 text-[13px] text-[#F0EFE2]/30">No memories match your search.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((memory) => (
            <div key={memory.id} className="group relative overflow-hidden rounded-[10px] border border-white/8 bg-[#141414] p-4 transition-colors hover:border-white/14 hover:bg-[#181818]" style={{ borderTopColor: memory.accent, borderTopWidth: "2px" }}>
              <p className="text-[13px] leading-[1.6] text-[#F0EFE2]/76">{memory.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {memory.tags.map((tag) => (
                  <span key={tag} className="rounded-[4px] px-2 py-0.5 text-[10px] font-medium tracking-[0.04em]" style={{ background: `${memory.accent}18`, color: memory.accent }}>{tag}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-[#F0EFE2]/30">{memory.source}</span>
                <span className="text-[11px] text-[#F0EFE2]/25">{memory.ago}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((memory) => (
            <div key={memory.id} className="flex items-start gap-4 rounded-[8px] border border-white/8 bg-[#141414] px-4 py-3.5 transition-colors hover:border-white/14 hover:bg-[#181818]">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: memory.accent }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[#F0EFE2]/76">{memory.content}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-[#F0EFE2]/30">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] text-[#F0EFE2]/25">{memory.ago}</span>
                <span className="text-[11px] text-[#F0EFE2]/30">{memory.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
