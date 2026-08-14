"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronUp, Circle, GripHorizontal, Play, Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type RunnableBlock = {
  id: string;
  lineIndex: number;
  label: string;
};

export type RunLogEntry = {
  id: string;
  runLabel: string;
  header: string;
  status: "running" | "success" | "error";
  resultMessage: string | null;
};

export type BlueprintWorkspace = {
  id: string;
  path: string;
  label: string;
};

export const DEVIN_GUIDE_SECTIONS = [
  {
    id: "initialize",
    title: "Initialize",
    body: "Add commands for Devin to pull your code from a Git provider and install dependencies.",
  },
  {
    id: "maintenance",
    title: "Maintenance",
    body: "Add commands to keep Devin up-to-date with the latest changes to your repository.",
  },
  {
    id: "knowledge",
    title: "Knowledge",
    body: "Add reference info like lint, test, and build commands for Devin to use.",
  },
] as const;

const ROOT_WORKSPACE: BlueprintWorkspace = {
  id: "root",
  path: "",
  label: "/ (root)",
};

const DEFAULT_OUTPUT_HEIGHT = 176;
const MIN_OUTPUT_HEIGHT = 72;
const MAX_OUTPUT_RATIO = 0.65;
/** Matches `leading-[1.625rem]` on editor lines (16px × 1.625). */
const EDITOR_LINE_HEIGHT_PX = 26;

export function findGuideSectionLineIndex(yaml: string, sectionId: string): number | null {
  const lines = yaml.split("\n");
  const pattern =
    sectionId === "initialize"
      ? /^initialize:/
      : sectionId === "maintenance"
        ? /^maintenance:/
        : /^knowledge:/;
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i].trim())) return i;
  }
  return null;
}

function guideSectionInsertSnippet(sectionId: string): string {
  switch (sectionId) {
    case "initialize":
      return "initialize: |\n  \n";
    case "maintenance":
      return "maintenance: |\n  \n";
    default:
      return "knowledge:\n  - name: example\n    contents: |\n      \n";
  }
}

export function findRunnableBlocks(yaml: string): RunnableBlock[] {
  const lines = yaml.split("\n");
  const blocks: RunnableBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("initialize:")) {
      blocks.push({ id: "initialize", lineIndex: i, label: "Run initialize" });
    }
    if (trimmed.startsWith("maintenance:")) {
      blocks.push({ id: "maintenance", lineIndex: i, label: "Run maintenance" });
    }
    const knowledgeMatch = trimmed.match(/^- name:\s*(.+)/);
    if (knowledgeMatch) {
      const name = knowledgeMatch[1].trim();
      blocks.push({
        id: `knowledge:${name}`,
        lineIndex: i,
        label: `Run knowledge: ${name}`,
      });
    }
  }
  return blocks;
}

export function highlightYamlLine(line: string): ReactNode {
  if (!line.trim()) return "\u00a0";
  const commentMatch = line.match(/^(\s*)(#.*)$/);
  if (commentMatch) {
    return (
      <>
        {commentMatch[1]}
        <span className="text-emerald-400/75">{commentMatch[2]}</span>
      </>
    );
  }
  const kvMatch = line.match(/^(\s*)([\w-]+)(:\s*)(.*)$/);
  if (kvMatch) {
    return (
      <>
        {kvMatch[1]}
        <span className="text-cyan-300/90">{kvMatch[2]}</span>
        <span className="text-white/55">{kvMatch[3]}</span>
        <span className="text-amber-200/85">{kvMatch[4]}</span>
      </>
    );
  }
  const listMatch = line.match(/^(\s*)(-\s+)(.*)$/);
  if (listMatch) {
    return (
      <>
        {listMatch[1]}
        <span className="text-white/55">{listMatch[2]}</span>
        <span className="text-cyan-300/80">{listMatch[3]}</span>
      </>
    );
  }
  return line;
}

export function BlueprintToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[130] flex items-center gap-2.5 rounded-md border border-white/[0.12] bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-white shadow-2xl"
    >
      <Check className="size-4 shrink-0 text-emerald-400" aria-hidden />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 text-white/45 hover:text-white/75"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function AddBlueprintDialog({
  open,
  onOpenChange,
  repoFullName,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoFullName: string;
  onContinue: (directoryPath: string) => void;
}) {
  const [directoryPath, setDirectoryPath] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setDirectoryPath("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function handleContinue() {
    const trimmed = directoryPath.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (!trimmed) return;
    onContinue(trimmed);
    onOpenChange(false);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-blueprint-title"
        className="w-full max-w-md overflow-hidden rounded-md border border-white/[0.1] bg-[#1a1a1a] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <h2 id="add-blueprint-title" className="text-base font-semibold text-white">
              Add blueprint
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Configure setup commands and knowledge for a subdirectory of {repoFullName}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white/75"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-2 px-5 py-4">
          <label htmlFor="blueprint-directory-path" className="text-sm font-medium text-white/85">
            Directory path
          </label>
          <input
            ref={inputRef}
            id="blueprint-directory-path"
            value={directoryPath}
            onChange={(e) => setDirectoryPath(e.target.value)}
            placeholder="packages/api"
            className="h-10 w-full rounded-md border border-[#2563EB]/60 bg-[#111111] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleContinue();
            }}
          />
          <p className="text-xs text-white/40">
            Must be an existing directory in {repoFullName}. Used as the blueprint label.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-transparent px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!directoryPath.trim()}
            className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-4 text-sm font-medium text-white transition hover:bg-[#3B82F6] disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type ContinuityLabBlueprintYamlIdeProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  setupOverlayMessage?: string | null;
  placeholder?: string;
  guideOpen?: boolean;
  fillHeight?: boolean;
  repoFullName?: string;
  className?: string;
};

export function ContinuityLabBlueprintYamlIde({
  value,
  onChange,
  disabled = false,
  setupOverlayMessage = null,
  placeholder,
  guideOpen = true,
  fillHeight = false,
  repoFullName = "this repository",
  className,
}: ContinuityLabBlueprintYamlIdeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollLineRef = useRef<number | null>(null);
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);

  const [outputOpen, setOutputOpen] = useState(true);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_OUTPUT_HEIGHT);
  const [runLog, setRunLog] = useState<RunLogEntry[]>([]);
  const [lastRunStatus, setLastRunStatus] = useState<"idle" | "success" | "error">("idle");
  const [runningBlockId, setRunningBlockId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<BlueprintWorkspace[]>([ROOT_WORKSPACE]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("root");
  const [addBlueprintOpen, setAddBlueprintOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeGuideSectionId, setActiveGuideSectionId] = useState<string | null>(null);
  const [highlightLineIndex, setHighlightLineIndex] = useState<number | null>(null);

  const runnableBlocks = useMemo(() => findRunnableBlocks(value), [value]);
  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 1);

  const maxOutputHeight = useMemo(() => {
    if (typeof window === "undefined") return 400;
    return Math.round(window.innerHeight * MAX_OUTPUT_RATIO);
  }, []);

  const onResizePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeRef.current = { startY: event.clientY, startH: outputHeight };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [outputHeight]);

  const onResizePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    const delta = resizeRef.current.startY - event.clientY;
    const next = Math.min(
      Math.max(resizeRef.current.startH + delta, MIN_OUTPUT_HEIGHT),
      maxOutputHeight,
    );
    setOutputHeight(next);
    setOutputOpen(true);
  }, [maxOutputHeight]);

  const onResizePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    resizeRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const scrollToLine = useCallback((lineIndex: number, yaml: string) => {
    const scrollTop = Math.max(0, lineIndex * EDITOR_LINE_HEIGHT_PX - EDITOR_LINE_HEIGHT_PX * 2);
    editorScrollRef.current?.scrollTo({ top: scrollTop, behavior: "smooth" });

    const textarea = textareaRef.current;
    if (textarea) {
      const yamlLines = yaml.split("\n");
      let charIndex = 0;
      for (let i = 0; i < lineIndex; i++) {
        charIndex += yamlLines[i].length + 1;
      }
      const lineLength = yamlLines[lineIndex]?.length ?? 0;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(charIndex, charIndex + lineLength);
    }

    setHighlightLineIndex(lineIndex);
    window.setTimeout(() => setHighlightLineIndex(null), 1800);
  }, []);

  useEffect(() => {
    if (pendingScrollLineRef.current === null) return;
    const lineIndex = pendingScrollLineRef.current;
    pendingScrollLineRef.current = null;
    scrollToLine(lineIndex, value);
  }, [value, scrollToLine]);

  function handleGuideSectionClick(sectionId: string) {
    if (disabled) return;
    setActiveGuideSectionId(sectionId);
    const lineIndex = findGuideSectionLineIndex(value, sectionId);
    if (lineIndex !== null) {
      scrollToLine(lineIndex, value);
      return;
    }
    const snippet = guideSectionInsertSnippet(sectionId);
    const next = value.trim() ? `${value.trimEnd()}\n\n${snippet}` : snippet;
    pendingScrollLineRef.current = findGuideSectionLineIndex(next, sectionId);
    onChange(next);
  }

  function mockRunBlock(block: RunnableBlock) {
    if (disabled || runningBlockId) return;
    setOutputOpen(true);
    setRunningBlockId(block.id);
    const entryId = `${block.id}-${Date.now()}`;
    const header =
      block.id === "initialize"
        ? "initialize"
        : block.id === "maintenance"
          ? "maintenance"
          : block.id.replace("knowledge:", "");
    setRunLog((prev) => [
      ...prev,
      {
        id: entryId,
        runLabel: block.label,
        header,
        status: "running",
        resultMessage: null,
      },
    ]);
    window.setTimeout(() => {
      setRunLog((prev) =>
        prev.map((row) =>
          row.id === entryId
            ? {
                ...row,
                status: "success",
                resultMessage: "Command success (exit 0, 0s)",
              }
            : row,
        ),
      );
      setLastRunStatus("success");
      setRunningBlockId(null);
    }, 700);
  }

  function handleAddBlueprint(directoryPath: string) {
    const normalized = directoryPath.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (!normalized) return;
    const exists = workspaces.some((row) => row.path === normalized);
    if (exists) {
      const existing = workspaces.find((row) => row.path === normalized);
      if (existing) setActiveWorkspaceId(existing.id);
      return;
    }
    const id = `ws-${normalized.replace(/[^\w-]+/g, "-")}`;
    const next: BlueprintWorkspace = {
      id,
      path: normalized,
      label: normalized,
    };
    setWorkspaces((prev) => [...prev, next]);
    setActiveWorkspaceId(id);
    setToastMessage(`Blueprint added for ${normalized}`);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-0 flex-col",
        fillHeight && "min-h-0 flex-1",
        className,
      )}
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          guideOpen && "md:grid-cols-[240px_minmax(0,1fr)]",
        )}
      >
        {guideOpen ? (
          <aside className="border-b border-white/[0.06] p-4 md:border-b-0 md:border-r">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Guide
            </p>
            <ul className="space-y-2">
              {DEVIN_GUIDE_SECTIONS.map((section) => {
                const lineIndex = findGuideSectionLineIndex(value, section.id);
                const isActive = activeGuideSectionId === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => handleGuideSectionClick(section.id)}
                      disabled={disabled}
                      className={cn(
                        "flex w-full gap-2.5 rounded-md px-1 py-1.5 text-left transition",
                        isActive
                          ? "bg-white/[0.06]"
                          : "hover:bg-white/[0.04]",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <Circle
                        className={cn(
                          "mt-0.5 size-3 shrink-0",
                          isActive
                            ? "fill-white/70 text-white/70"
                            : lineIndex !== null
                              ? "text-emerald-400/60"
                              : "text-white/25",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            isActive ? "text-white" : "text-white/90",
                          )}
                        >
                          {section.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                          {section.body}
                        </p>
                        {lineIndex !== null ? (
                          <p className="mt-1 font-mono text-[10px] text-white/30">
                            Line {lineIndex + 1}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Workspaces
                </p>
                <span className="text-[10px] text-white/35">{workspaces.length}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {workspaces.map((workspace) => {
                  const active = workspace.id === activeWorkspaceId;
                  return (
                    <li key={workspace.id}>
                      <button
                        type="button"
                        onClick={() => setActiveWorkspaceId(workspace.id)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left text-xs font-medium transition",
                          active
                            ? "border-white/[0.08] bg-white/[0.06] text-white"
                            : "border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white/80",
                        )}
                      >
                        {workspace.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setAddBlueprintOpen(true)}
                className="mt-2 w-full rounded-md border border-dashed border-white/[0.08] px-3 py-2 text-xs text-white/45 transition hover:border-white/[0.14] hover:bg-white/[0.03] hover:text-white/65"
              >
                + Add blueprint
              </button>
            </div>
          </aside>
        ) : null}

        <div className={cn("relative flex min-h-0 flex-col", disabled && "opacity-40")}>
          {setupOverlayMessage ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A0A0A]/60">
              <p className="rounded-md border border-white/[0.08] bg-[#111111] px-4 py-3 text-sm font-medium text-white/75">
                {setupOverlayMessage}
              </p>
            </div>
          ) : null}
          <div
            ref={editorScrollRef}
            className={cn(
              "flex min-h-[280px] flex-1 overflow-y-auto bg-black",
              fillHeight && "min-h-0",
            )}
          >
            <div
              aria-hidden
              className="shrink-0 select-none border-r border-white/[0.06] bg-[#080808] py-2 font-mono text-[11px] leading-relaxed"
            >
              {Array.from({ length: lineCount }, (_, index) => {
                const block = runnableBlocks.find((row) => row.lineIndex === index);
                const highlighted = highlightLineIndex === index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex h-[1.625rem] items-center justify-end gap-0.5 px-1",
                      highlighted && "bg-[#2563EB]/20",
                    )}
                  >
                    {block && !disabled ? (
                      <button
                        type="button"
                        onClick={() => mockRunBlock(block)}
                        disabled={Boolean(runningBlockId)}
                        className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-white/[0.18] text-white/55 transition hover:border-white/35 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                        aria-label={block.label}
                      >
                        <Play className="size-2 fill-current" />
                      </button>
                    ) : (
                      <span className="inline-block size-[18px] shrink-0" />
                    )}
                    <span className="min-w-[1.75rem] pr-1.5 text-right text-white/20">
                      {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative min-h-0 min-w-0 flex-1">
              <pre
                aria-hidden
                className="pointer-events-none whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs leading-[1.625rem] text-sky-100/90"
              >
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className={cn(highlightLineIndex === index && "bg-[#2563EB]/15")}
                  >
                    {highlightYamlLine(line) || "\u00a0"}
                  </div>
                ))}
              </pre>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                spellCheck={false}
                className="absolute inset-0 z-[1] min-h-full w-full resize-none bg-transparent px-3 py-2 font-mono text-xs leading-[1.625rem] text-transparent caret-white placeholder:text-white/25 focus:outline-none disabled:cursor-not-allowed"
                placeholder={placeholder}
              />
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize output panel"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-white/[0.06] bg-[#0a0a0a] hover:bg-white/[0.04]"
          >
            <GripHorizontal className="size-3.5 text-white/25 group-hover:text-white/45" />
          </div>

          <div className="shrink-0 bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-4 py-2.5">
              <button
                type="button"
                onClick={() => setOutputOpen((prev) => !prev)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs font-medium text-white/70 hover:text-white/90"
              >
                <Terminal className="size-3.5 shrink-0 text-white/40" aria-hidden />
                {runningBlockId ? "Running…" : "Ready"}
                {lastRunStatus === "success" ? (
                  <>
                    <Check className="size-3.5 shrink-0 text-emerald-400" aria-hidden />
                    <span className="truncate font-normal text-white/40">Last run: succeeded</span>
                  </>
                ) : null}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                {runLog.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRunLog([]);
                      setLastRunStatus("idle");
                    }}
                    className="inline-flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                    aria-label="Clear output"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOutputOpen((prev) => !prev)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                  aria-label={outputOpen ? "Collapse output" : "Expand output"}
                >
                  {outputOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                </button>
              </div>
            </div>
            {outputOpen ? (
              <div
                style={{ height: outputHeight }}
                className="overflow-y-auto border-t border-white/[0.06] bg-[#080808] px-4 py-4 font-mono text-[11px] leading-relaxed"
              >
                {runLog.length === 0 ? (
                  <p className="text-center text-white/45">
                    Run your setup steps against a live environment with your repository
                    pre-cloned. Results appear here in real time.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {runLog.map((entry) => (
                      <div key={entry.id}>
                        <p className="text-white/55">▶ {entry.runLabel}</p>
                        {entry.status !== "running" ? (
                          <>
                            <p className="mt-1 text-white/35">=== {entry.header} ===</p>
                            <p
                              className={cn(
                                "mt-0.5",
                                entry.status === "success"
                                  ? "text-emerald-300/90"
                                  : "text-red-300/90",
                              )}
                            >
                              {entry.resultMessage}
                            </p>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AddBlueprintDialog
        open={addBlueprintOpen}
        onOpenChange={setAddBlueprintOpen}
        repoFullName={repoFullName}
        onContinue={handleAddBlueprint}
      />
      {toastMessage ? (
        <BlueprintToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}
    </div>
  );
}
