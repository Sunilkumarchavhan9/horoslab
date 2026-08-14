"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Brain,
  Bot,
  CheckCircle2,
  CircleDot,
  ChevronRight,
  Clock3,
  FileText,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Moon,
  PencilLine,
  Flag,
  RefreshCcw,
  ShieldCheck,
  TerminalSquare,
  User,
  XCircle,
} from "lucide-react";
import type { MemoryOSLaunchContext } from "@/lib/continuity-launch-context";
import type {
  ChatBubble,
  PrReadyArtifact,
  ShellLineEntry,
  WorklogEntry,
} from "@/lib/continuity-lab/chat-events";
import { cn } from "@/lib/utils";

type ContinuityLabSessionMessagesProps = {
  bubbles: ChatBubble[];
  worklog: WorklogEntry[];
  shellLines: ShellLineEntry[];
  launchContext: MemoryOSLaunchContext | null;
  isAgentThinking: boolean;
  agentAsleep: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

const URL_REGEX = /(https?:\/\/[^\s)]+)([),.;!?])?/gi;
const PR_REF_REGEX = /\b([A-Za-z0-9._/-]+)#(\d+)\b/g;
const DIFF_ROW_REGEX =
  /^([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)\s+.*?([+]\d+)\s+([-]\d+)$/;

type StatusCardTone =
  | "approved"
  | "rejected"
  | "revision"
  | "verification"
  | "handoff"
  | "pr"
  | "neutral";

function isNoisyAgentLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^Stopped working$/i.test(trimmed)) return true;
  if (/^MEMORYOS$/i.test(trimmed)) return true;
  if (/continuity context is loaded for this workspace/i.test(trimmed)) return true;
  if (/^Resume confidence\s*\d+%?$/i.test(trimmed)) return true;
  if (/^No strong saved context found/i.test(trimmed)) return true;
  return false;
}

function sanitizeAgentBubbleText(text: string): string {
  const kept = text
    .split(/\r?\n/)
    .filter((line) => !isNoisyAgentLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return kept;
}

function isActivityLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^Worked for\s+/i.test(trimmed)) return true;
  if (/^Thought for\s+/i.test(trimmed)) return true;
  if (/^Accessed knowledge:\s+/i.test(trimmed)) return true;
  if (/^Read\s+/i.test(trimmed)) return true;
  if (/^Edited\s+/i.test(trimmed)) return true;
  if (/^Created\s+\d+\s+Tasks?$/i.test(trimmed)) return true;
  if (/^Viewed CI status\s+/i.test(trimmed)) return true;
  if (/^Pushed branch\s+/i.test(trimmed)) return true;
  if (/^\d+\/\d+\s+.+$/.test(trimmed)) return true;
  if (/^Stopped working$/i.test(trimmed)) return true;
  if (
    /^(cd|git|npm|npx|pnpm|bun|ls|mkdir|echo|cat|find|grep|curl|cp|mv|rm|touch)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

function isActivityMessage(text: string): boolean {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;
  return lines.every(isActivityLine);
}

function normalizeUserText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const markerIndex = trimmed.toLowerCase().indexOf("[resume brief]");
  if (markerIndex >= 0) {
    const beforeMarker = trimmed.slice(0, markerIndex).trim();
    if (beforeMarker) return beforeMarker;
  }
  const firstNonEmptyLine = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstNonEmptyLine ?? text;
}

function classifyStatusCard(text: string): {
  tone: StatusCardTone;
  title: string;
} | null {
  const normalized = text.trim();
  if (!normalized) return null;

  if (/^Reviewer approved /i.test(normalized)) {
    return { tone: "approved", title: "Approval" };
  }
  if (/^Reviewer rejected /i.test(normalized)) {
    return { tone: "rejected", title: "Rejected" };
  }
  if (/requested revision/i.test(normalized) || /^Revision reason:/i.test(normalized)) {
    return { tone: "revision", title: "Revision" };
  }
  if (/^Linked pull request:/i.test(normalized)) {
    return { tone: "pr", title: "Pull Request" };
  }
  if (/Verification evidence attached/i.test(normalized) || /Review note attached/i.test(normalized)) {
    return { tone: "verification", title: "Verification" };
  }
  if (/ handed work to /i.test(normalized)) {
    return { tone: "handoff", title: "Handoff" };
  }
  return null;
}

function openSessionPanel(panel: "changes" | "pr") {
  window.dispatchEvent(
    new CustomEvent("continuity-lab-open-panel", {
      detail: { panel },
    }),
  );
}

function ciStatusLabel(status: PrReadyArtifact["ciStatus"]): string {
  if (status === "passed") return "Checks passed";
  if (status === "failed") return "Checks failing";
  if (status === "merged") return "Merged";
  return "Checks running";
}

function PrReadyCard({ artifact }: { artifact: PrReadyArtifact }) {
  const ciPassed = artifact.ciStatus === "passed" || artifact.ciStatus === "merged";
  const ciFailed = artifact.ciStatus === "failed";
  const numberLabel = artifact.number ? `PR #${artifact.number}` : "Pull request";

  return (
    <button
      type="button"
      onClick={() => openSessionPanel("pr")}
      className="w-full rounded-md border border-indigo-500/35 bg-indigo-500/[0.08] px-3.5 py-3 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/[0.12]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <GitPullRequest className="size-4 shrink-0 text-indigo-300" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/80">
            {numberLabel}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            ciPassed
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
              : ciFailed
                ? "border-rose-500/35 bg-rose-500/10 text-rose-200"
                : "border-amber-500/35 bg-amber-500/10 text-amber-200",
          )}
        >
          {ciPassed ? (
            <CheckCircle2 className="size-3" />
          ) : ciFailed ? (
            <XCircle className="size-3" />
          ) : (
            <RefreshCcw className="size-3" />
          )}
          {ciStatusLabel(artifact.ciStatus)}
        </span>
      </div>

      <p className="mt-2 text-[14px] font-medium leading-6 text-white">
        {artifact.title}
      </p>

      {artifact.branch || artifact.baseBranch ? (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55">
          <GitBranch className="size-3 shrink-0" />
          <span className="truncate">
            {artifact.branch ?? "feature branch"}
            {artifact.baseBranch ? ` → ${artifact.baseBranch}` : ""}
          </span>
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-white/65">
        {typeof artifact.filesChanged === "number" ? (
          <span className="rounded border border-white/10 px-1.5 py-0.5">
            {artifact.filesChanged} file{artifact.filesChanged === 1 ? "" : "s"}
          </span>
        ) : null}
        {typeof artifact.additions === "number" ? (
          <span className="text-emerald-400">+{artifact.additions}</span>
        ) : null}
        {typeof artifact.deletions === "number" ? (
          <span className="text-rose-400">-{artifact.deletions}</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={artifact.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/[0.1]"
        >
          View PR
          <ExternalLink className="size-3" />
        </a>
        <span className="text-[11px] text-indigo-200/70">
          Open readiness panel →
        </span>
      </div>
    </button>
  );
}

function StatusCard({ text, repoFullName }: { text: string; repoFullName?: string | null }) {
  const status = classifyStatusCard(text);
  if (!status) return null;

  const config =
    status.tone === "approved"
      ? {
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/[0.07]",
          text: "text-emerald-100",
          muted: "text-emerald-200/70",
          icon: CheckCircle2,
        }
      : status.tone === "rejected"
        ? {
            border: "border-rose-500/30",
            bg: "bg-rose-500/[0.07]",
            text: "text-rose-100",
            muted: "text-rose-200/70",
            icon: XCircle,
          }
        : status.tone === "revision"
          ? {
              border: "border-amber-500/30",
              bg: "bg-amber-500/[0.07]",
              text: "text-amber-100",
              muted: "text-amber-200/70",
              icon: RefreshCcw,
            }
          : status.tone === "verification"
            ? {
                border: "border-sky-500/30",
                bg: "bg-sky-500/[0.07]",
                text: "text-sky-100",
                muted: "text-sky-200/70",
                icon: ShieldCheck,
              }
            : status.tone === "pr"
              ? {
                  border: "border-indigo-500/30",
                  bg: "bg-indigo-500/[0.07]",
                  text: "text-indigo-100",
                  muted: "text-indigo-200/70",
                  icon: GitPullRequest,
                }
              : {
                  border: "border-white/15",
                  bg: "bg-white/[0.04]",
                  text: "text-white",
                  muted: "text-white/55",
                  icon: Bot,
                };

  const Icon = config.icon;

  return (
    <div className={cn("rounded-md border px-3.5 py-2.5", config.border, config.bg)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", config.muted)} />
        <p className={cn("text-[10px] font-semibold uppercase tracking-wide", config.muted)}>
          {status.title}
        </p>
      </div>
      <div className={cn("mt-1.5 text-[13px] leading-6", config.text)}>
        {renderRichText(text, repoFullName)}
      </div>
    </div>
  );
}

function renderInlineTokens(
  text: string,
  repoFullName?: string | null,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const parts = text.split(/(`[^`]+`)/g);

  parts.forEach((part, idx) => {
    if (!part) return;
    if (part.startsWith("`") && part.endsWith("`")) {
      out.push(
        <code
          key={`code-${idx}`}
          className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.92em] text-white/95"
        >
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }

    let cursor = 0;
    URL_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null = null;
    while ((match = URL_REGEX.exec(part)) !== null) {
      const [full, url, trailing] = match;
      const start = match.index;
      if (start > cursor) {
        out.push(...linkifyPrRefs(part.slice(cursor, start), repoFullName));
      }
      out.push(
        <a
          key={`url-${idx}-${start}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[#38BDF8] underline decoration-[#38BDF8]/50 underline-offset-2 hover:text-[#67E8F9]"
        >
          {url}
        </a>,
      );
      if (trailing)
        out.push(<Fragment key={`trail-${idx}-${start}`}>{trailing}</Fragment>);
      cursor = start + full.length;
    }
    if (cursor < part.length) {
      out.push(...linkifyPrRefs(part.slice(cursor), repoFullName));
    }
  });

  return out;
}

function linkifyPrRefs(
  text: string,
  repoFullName?: string | null,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  PR_REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while ((match = PR_REF_REGEX.exec(text)) !== null) {
    const [full, repoRef, prNum] = match;
    const start = match.index;
    if (start > cursor) out.push(text.slice(cursor, start));
    const fullRepo = repoRef.includes("/") ? repoRef : repoFullName;
    if (fullRepo) {
      out.push(
        <a
          key={`pr-${start}`}
          href={`https://github.com/${fullRepo}/pull/${prNum}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-[#2C3038] bg-[#14161C] px-2 py-0.5 text-[#60A5FA] no-underline transition hover:border-[#3A4150] hover:bg-[#1A1E27] hover:text-[#93C5FD]"
        >
          {full}
        </a>,
      );
    } else {
      out.push(full);
    }
    cursor = start + full.length;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

function renderWorkedRow(trimmed: string, key: string) {
  const match = /^Worked for\s+(.+?)(?:\s+([+-]\d+)\s+([+-]\d+))?$/i.exec(
    trimmed,
  );
  if (!match) return null;
  return (
    <div
      key={key}
      className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[12px] leading-5 text-white/68"
    >
      <Clock3 className="size-3.5 text-white/55" />
      <span>Worked for {match[1]}</span>
      {match[2] ? (
        <span className="font-medium text-emerald-400">{match[2]}</span>
      ) : null}
      {match[3] ? (
        <span className="font-medium text-rose-400">{match[3]}</span>
      ) : null}
    </div>
  );
}

function renderActivityRow(trimmed: string, key: string) {
  const accessedKnowledgeMatch = /^Accessed knowledge:\s+(.+)$/i.exec(trimmed);
  if (accessedKnowledgeMatch) {
    return (
      <div
        key={key}
        className="flex items-start gap-1.5 text-[12px] leading-5 text-white/66"
      >
        <Brain className="mt-0.5 size-3.5 shrink-0 text-white/45" />
        <span className="min-w-0">
          <span className="text-white/72">Accessed knowledge:</span>{" "}
          <span className="text-sky-300/90">{accessedKnowledgeMatch[1]}</span>
        </span>
      </div>
    );
  }

  const thoughtMatch = /^Thought for\s+(.+)$/i.exec(trimmed);
  if (thoughtMatch) {
    return (
      <div
        key={key}
        className="flex items-center gap-1.5 text-[12px] leading-5 text-white/52"
      >
        <Brain className="size-3.5 text-white/50" />
        <span>Thought for {thoughtMatch[1]}</span>
      </div>
    );
  }

  const readMatch = /^Read\s+(.+)$/i.exec(trimmed);
  if (readMatch) {
    return (
      <div
        key={key}
        className="flex items-center gap-1.5 text-[12px] leading-5 text-white/62"
      >
        <FileText className="size-3.5 text-white/50" />
        <span className="min-w-0 truncate">{readMatch[1]}</span>
      </div>
    );
  }

  const editMatch = /^Edited\s+(.+?)(?:\s+([+]\d+)\s+([-]\d+))?$/i.exec(trimmed);
  if (editMatch) {
    return (
      <div
        key={key}
        className="flex items-center gap-1.5 text-[12px] leading-5 text-white/72"
      >
        <PencilLine className="size-3.5 text-white/50" />
        <span className="min-w-0 truncate">{editMatch[1]}</span>
        {editMatch[2] ? (
          <span className="font-medium text-emerald-400">{editMatch[2]}</span>
        ) : null}
        {editMatch[3] ? (
          <span className="font-medium text-rose-400">{editMatch[3]}</span>
        ) : null}
      </div>
    );
  }

  const stoppedMatch = /^Stopped working$/i.exec(trimmed);
  if (stoppedMatch) {
    return (
      <div
        key={key}
        className="flex items-center gap-1.5 text-[12px] leading-5 text-white/45"
      >
        <CircleDot className="size-3.5 text-white/35" />
        <span>Stopped working</span>
      </div>
    );
  }

  const reviewFoundMatch = /^Devin Review found\s+(.+)$/i.exec(trimmed);
  if (reviewFoundMatch) {
    return (
      <div
        key={key}
        className="flex items-center gap-1.5 rounded-md border border-amber-500/35 bg-amber-500/[0.07] px-2 py-1 text-[12px] leading-5 text-amber-100"
      >
        <CircleDot className="size-3.5 text-amber-300/80" />
        <span>Review found {reviewFoundMatch[1]}</span>
      </div>
    );
  }

  if (/went to sleep/i.test(trimmed)) {
    return (
      <div
        key={key}
        className="flex items-center gap-1.5 text-[12px] leading-5 text-white/45"
      >
        <Moon className="size-3.5 text-white/40" />
        <span>{trimmed}</span>
      </div>
    );
  }

  if (/^(cd|git|npm|npx|pnpm|bun|ls|mkdir|echo|cat|find|grep|curl)\b/i.test(trimmed)) {
    return (
      <div
        key={key}
        className="flex items-start gap-1.5 rounded-md border border-[#2A2E36] bg-[#0F1116] px-2.5 py-1.5 text-[12px] leading-5 text-white/84"
      >
        <TerminalSquare className="mt-0.5 size-3.5 shrink-0 text-white/50" />
        <code className="min-w-0 break-all font-mono text-[11.5px] tracking-tight">
          {trimmed}
        </code>
      </div>
    );
  }

  return null;
}

type TimelineRow =
  | { kind: "knowledge"; text: string }
  | { kind: "thought"; text: string }
  | { kind: "read"; text: string }
  | { kind: "edit"; text: string; plus?: string; minus?: string }
  | { kind: "tasks"; count: number }
  | { kind: "step"; step: string; label: string }
  | { kind: "push"; text: string }
  | { kind: "ci"; text: string }
  | { kind: "command"; text: string }
  | { kind: "stopped"; text: string }
  | { kind: "generic"; text: string };

type TimelineGroup = {
  id: string;
  label: string;
  plus?: string;
  minus?: string;
  rows: TimelineRow[];
};

function classifyTimelineRow(line: string): TimelineRow {
  const trimmed = line.trim();
  const knowledgeMatch = /^Accessed knowledge:\s+(.+)$/i.exec(trimmed);
  if (knowledgeMatch) return { kind: "knowledge", text: knowledgeMatch[1] };

  const thoughtMatch = /^Thought for\s+(.+)$/i.exec(trimmed);
  if (thoughtMatch) return { kind: "thought", text: thoughtMatch[1] };

  const readMatch = /^Read\s+(.+)$/i.exec(trimmed);
  if (readMatch) return { kind: "read", text: readMatch[1] };

  const editMatch = /^Edited\s+(.+?)(?:\s+([+]\d+)\s+([-]\d+))?$/i.exec(trimmed);
  if (editMatch) {
    return {
      kind: "edit",
      text: editMatch[1],
      plus: editMatch[2] ?? undefined,
      minus: editMatch[3] ?? undefined,
    };
  }

  const tasksMatch = /^Created\s+(\d+)\s+Tasks?$/i.exec(trimmed);
  if (tasksMatch) {
    return { kind: "tasks", count: Number(tasksMatch[1]) || 0 };
  }

  const stepMatch = /^(\d+\/\d+)\s+(.+)$/.exec(trimmed);
  if (stepMatch) {
    return { kind: "step", step: stepMatch[1], label: stepMatch[2] };
  }

  const ciMatch = /^Viewed CI status\s+(.+)$/i.exec(trimmed);
  if (ciMatch) {
    return { kind: "ci", text: ciMatch[1] };
  }

  const pushMatch = /^Pushed branch\s+(.+)$/i.exec(trimmed);
  if (pushMatch) {
    return { kind: "push", text: pushMatch[1] };
  }

  if (/^Stopped working$/i.test(trimmed)) return { kind: "stopped", text: trimmed };

  if (/^(cd|git|npm|npx|pnpm|bun|ls|mkdir|echo|cat|find|grep|curl)\b/i.test(trimmed)) {
    return { kind: "command", text: trimmed };
  }

  return { kind: "generic", text: line };
}

function parseTimelineGroups(text: string): TimelineGroup[] {
  const lines = text.split(/\r?\n/);
  const groups: TimelineGroup[] = [];
  let current: TimelineGroup | null = null;
  let serial = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const worked = /^Worked for\s+(.+?)(?:\s+([+-]\d+)\s+([+-]\d+))?$/i.exec(trimmed);
    if (worked) {
      current = {
        id: `worked-${serial++}`,
        label: worked[1] ?? "",
        plus: worked[2] ?? undefined,
        minus: worked[3] ?? undefined,
        rows: [],
      };
      groups.push(current);
      continue;
    }
    if (!current) {
      continue;
    }
    current.rows.push(classifyTimelineRow(line));
  }
  return groups;
}

function isTimelineLikeMessage(text: string): boolean {
  return /Worked for\s+/i.test(text) && /(Thought for|Read |Edited |Stopped working|cd |git |npm |npx )/i.test(text);
}

function renderReadTargets(text: string) {
  const segments = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return <span className="truncate">{text}</span>;
  }
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      {segments.map((segment, idx) => (
        <span
          key={`read-${idx}-${segment}`}
          className="inline-flex max-w-full items-center rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-white/86"
          title={segment}
        >
          <span className="truncate">{segment}</span>
        </span>
      ))}
    </span>
  );
}

function TimelineGroupCard({
  group,
  repoFullName,
}: {
  group: TimelineGroup;
  repoFullName?: string | null;
}) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-[13px] text-white/76 marker:content-none">
        <ChevronRight className="size-3.5 text-white/45 transition group-open:rotate-90" />
        <Clock3 className="size-3.5 text-white/40" />
        <span>Worked for {group.label}</span>
        {group.plus ? (
          <span className="ml-1 text-[12px] font-semibold text-emerald-400">
            {group.plus}
          </span>
        ) : null}
        {group.minus ? (
          <span className="text-[12px] font-semibold text-rose-400">
            {group.minus}
          </span>
        ) : null}
      </summary>
      {group.rows.length > 0 ? (
        <div className="ml-2 border-l border-white/12 pl-3 pb-1">
          <div className="space-y-1.5 pt-1.5">
            {group.rows.map((row, idx) => {
              if (row.kind === "knowledge") {
                return (
                  <div key={`${group.id}-knowledge-${idx}`} className="flex items-start gap-1.5 text-[12px] text-white/66">
                    <Brain className="mt-0.5 size-3.5 shrink-0 text-white/42" />
                    <span className="min-w-0">
                      <span className="text-white/70">Accessed knowledge:</span>{" "}
                      <span className="text-sky-300/90">{row.text}</span>
                    </span>
                  </div>
                );
              }
              if (row.kind === "thought") {
                return (
                  <div key={`${group.id}-thought-${idx}`} className="flex items-center gap-1.5 text-[12px] text-white/56">
                    <Brain className="size-3.5 text-white/42" />
                    <span>Thought for {row.text}</span>
                  </div>
                );
              }
              if (row.kind === "read") {
                return (
                  <div key={`${group.id}-read-${idx}`} className="flex items-start gap-1.5 text-[12px] text-white/68">
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-white/42" />
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="text-white/72">Read</span>
                      {renderReadTargets(row.text)}
                    </span>
                  </div>
                );
              }
              if (row.kind === "edit") {
                return (
                  <div key={`${group.id}-edit-${idx}`} className="flex items-center gap-1.5 text-[12px] text-white/76">
                    <PencilLine className="size-3.5 text-white/42" />
                    <span className="truncate text-white/82">Edited {row.text}</span>
                    {row.plus ? <span className="font-medium text-emerald-400">{row.plus}</span> : null}
                    {row.minus ? <span className="font-medium text-rose-400">{row.minus}</span> : null}
                  </div>
                );
              }
              if (row.kind === "tasks") {
                return (
                  <div key={`${group.id}-tasks-${idx}`} className="flex items-center gap-1.5 text-[12px] text-white/70">
                    <Bot className="size-3.5 text-white/45" />
                    <span>
                      Created {row.count} task{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                );
              }
              if (row.kind === "step") {
                return (
                  <div key={`${group.id}-step-${idx}`} className="flex items-center gap-1.5 text-[12px] text-white/72">
                    <CircleDot className="size-3.5 text-white/38" />
                    <span className="rounded-full border border-white/12 bg-white/[0.02] px-1.5 py-0.5 text-[10px] font-medium text-white/68">
                      {row.step}
                    </span>
                    <span className="truncate">{row.label}</span>
                  </div>
                );
              }
              if (row.kind === "ci") {
                return (
                  <div key={`${group.id}-ci-${idx}`} className="flex items-center gap-1.5 text-[12px] text-white/72">
                    <ShieldCheck className="size-3.5 text-white/45" />
                    <span className="truncate">
                      Viewed CI status {renderInlineTokens(row.text, repoFullName)}
                    </span>
                  </div>
                );
              }
              if (row.kind === "push") {
                return (
                  <div key={`${group.id}-push-${idx}`} className="flex items-center gap-1.5 text-[12px] text-white/72">
                    <GitBranch className="size-3.5 text-white/45" />
                    <span className="truncate">
                      Pushed branch {renderInlineTokens(row.text, repoFullName)}
                    </span>
                  </div>
                );
              }
              if (row.kind === "command") {
                return (
                  <div
                    key={`${group.id}-cmd-${idx}`}
                    className="flex items-start gap-1.5 text-[12px] leading-5 text-white/84"
                  >
                    <TerminalSquare className="mt-0.5 size-3.5 shrink-0 text-white/38" />
                    <code className="break-all font-mono text-[11.5px] tracking-tight text-white/86">{row.text}</code>
                  </div>
                );
              }
              if (row.kind === "stopped") {
                return null;
              }
              return (
                <div key={`${group.id}-generic-${idx}`} className="text-[12px] text-white/72">
                  {renderInlineTokens(row.text, repoFullName)}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </details>
  );
}

function renderTimelineBlocks(text: string, repoFullName?: string | null) {
  const groups = parseTimelineGroups(text);
  if (groups.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {groups.map((group) => (
        <TimelineGroupCard key={group.id} group={group} repoFullName={repoFullName} />
      ))}
    </div>
  );
}

function DevinReviewCard({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const title = lines[0] ?? "Devin Review found issues";
  const description = lines[1] ?? "Review found issues. Fix them for this PR.";
  return (
    <div className="rounded-md border border-amber-500/35 bg-amber-500/[0.04] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[14px] font-medium text-amber-100">
        <Flag className="size-3.5 text-amber-300/90" />
        <span>{title}</span>
      </div>
      <p className="mt-1 text-[13px] leading-6 text-amber-100/75">{description}</p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/90">
        <span>Enable auto-fix</span>
        <ChevronRight className="size-3.5 rotate-90 text-white/65" />
      </div>
    </div>
  );
}

function QuotaStrip() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white/70">
      <span>You ran out of free credits. Please subscribe to continue.</span>
      <a
        href="/pricing"
        className="shrink-0 text-[13px] font-medium text-sky-300 hover:text-sky-200"
      >
        Explore plans
      </a>
    </div>
  );
}

function renderAgentSpecialBlocks(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/^Devin Review found/i.test(trimmed)) {
    return <DevinReviewCard text={trimmed} />;
  }
  if (/You ran out of free credits/i.test(trimmed)) {
    return <QuotaStrip />;
  }
  return null;
}

function renderRichText(text: string, repoFullName?: string | null) {
  if (isTimelineLikeMessage(text)) {
    const timeline = renderTimelineBlocks(text, repoFullName);
    if (timeline) return timeline;
  }

  const lines = text.split(/\r?\n/);
  return lines.map((line, lineIndex) => {
    const trimmed = line.trim();
    const diffMatch = DIFF_ROW_REGEX.exec(trimmed);
    if (diffMatch) {
      const [, filePath, additions, deletions] = diffMatch;
      return (
        <button
          key={`diff-chip-${lineIndex}`}
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("continuity-lab-open-panel", {
                detail: { panel: "changes", path: filePath },
              }),
            );
          }}
          className="inline-flex items-center gap-2 rounded border border-[#2F2F2F] bg-[#151515] px-2 py-1 text-[11px] text-white/85 hover:bg-[#1C1C1C]"
        >
          <span className="font-mono">{filePath}</span>
          <span className="text-emerald-400">{additions}</span>
          <span className="text-rose-400">{deletions}</span>
        </button>
      );
    }
    const workedRow = renderWorkedRow(trimmed, `worked-${lineIndex}`);
    const activityRow = renderActivityRow(trimmed, `activity-${lineIndex}`);
    const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    const numberedMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);

    if (workedRow) return workedRow;
    if (activityRow) return activityRow;

    if (bulletMatch) {
      return (
        <div key={`line-${lineIndex}`} className="flex items-start gap-2">
          <span className="mt-1 text-white/70">•</span>
          <span className="min-w-0">
            {renderInlineTokens(bulletMatch[1], repoFullName)}
          </span>
        </div>
      );
    }

    if (numberedMatch) {
      return (
        <div key={`line-${lineIndex}`} className="flex items-start gap-2">
          <span className="mt-0.5 w-4 shrink-0 text-right tabular-nums text-white/75">
            {numberedMatch[1]}.
          </span>
          <span className="min-w-0">
            {renderInlineTokens(numberedMatch[2], repoFullName)}
          </span>
        </div>
      );
    }

    if (!line.length) {
      return <div key={`line-${lineIndex}`} className="h-2" />;
    }

    return (
      <div key={`line-${lineIndex}`}>
        {renderInlineTokens(line, repoFullName)}
      </div>
    );
  });
}

function formatThoughtDuration(sec?: number): string {
  if (sec == null || sec < 1) return "Thought";
  if (sec < 60) return `Thought for ${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `Thought for ${m}m ${s}s` : `Thought for ${m}m`;
}

function UserAvatar() {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#4338CA]/50 bg-[#4338CA]/30 text-indigo-100"
      aria-hidden
    >
      <User className="size-3.5" />
    </span>
  );
}

function AgentAvatar() {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center text-indigo-300/0"
      aria-hidden
    >
      <Bot className="size-3.5" />
    </span>
  );
}

function ThoughtBubble({ bubble }: { bubble: ChatBubble }) {
  return (
    <li className="flex gap-2.5 py-0.5">
      <span className="size-7 shrink-0" aria-hidden />
      <div className="flex min-w-0 max-w-[48rem] items-center gap-1.5 pl-0.5 text-[12px] leading-5 text-white/50">
        <ChevronRight className="size-3.5" />
        <span>{formatThoughtDuration(bubble.thoughtDurationSec)}</span>
      </div>
    </li>
  );
}

function LiveThinking({ elapsedSec }: { elapsedSec: number }) {
  return (
    <li className="flex gap-2.5" aria-live="polite">
      <span className="size-7 shrink-0" aria-hidden />
      <div className="max-w-[48rem] px-0.5 py-0.5">
        <div className="flex items-center gap-2 text-xs text-white/58">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400/40" />
            <span className="relative inline-flex size-2 rounded-full bg-indigo-400/80" />
          </span>
          {elapsedSec > 0 ? `Worked for ${elapsedSec}s` : "Agent is working…"}
        </div>
      </div>
    </li>
  );
}

function formatRelativeTime(timestamp: string): string {
  const delta = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(delta) || delta < 0) return "";
  const sec = Math.floor(delta / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

function liveActivityLabel(entry: WorklogEntry): string | null {
  const raw = (entry.label || "").trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized.startsWith("runtime.desktop_")) {
    if (normalized.includes("preview_url")) return "Desktop preview updated";
    if (normalized.includes("status")) return "Desktop status updated";
    return null;
  }
  if (normalized.startsWith("runtime.")) return null;
  if (normalized.startsWith("memory.")) return null;
  return raw;
}

function compactShellCommand(command: string): string {
  const trimmed = command.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 88) return trimmed;
  return `${trimmed.slice(0, 88)}…`;
}

function LiveActivityRail({
  worklog,
  shellLines,
}: {
  worklog: WorklogEntry[];
  shellLines: ShellLineEntry[];
}) {
  const recentWorklog = worklog
    .slice()
    .reverse()
    .map((entry) => ({
      entry,
      label: liveActivityLabel(entry),
    }))
    .filter((row): row is { entry: WorklogEntry; label: string } => Boolean(row.label))
    .filter((row, index, arr) => {
      if (index === 0) return true;
      return arr[index - 1]?.label !== row.label;
    })
    .slice(0, 4);
  const recentShell = shellLines
    .slice()
    .reverse()
    .filter((entry, index, arr) => index === 0 || arr[index - 1]?.command !== entry.command)
    .slice(0, 3);
  if (recentWorklog.length === 0 && recentShell.length === 0) return null;

  return (
    <li className="flex gap-2.5">
      <span className="size-7 shrink-0" aria-hidden />
      <div className="min-w-0 max-w-[48rem] rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 transition hover:border-white/15">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">
          Live activity
        </p>
        <div className="space-y-1">
          {recentWorklog.map(({ entry, label }) => (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 text-[11px] text-white/60"
            >
              <CircleDot className="size-3 text-white/35" />
              <span className="truncate">{label}</span>
              {entry.detail ? (
                <span className="truncate text-white/40">· {entry.detail}</span>
              ) : null}
              <span className="ml-auto shrink-0 text-white/35">
                {formatRelativeTime(entry.timestamp)}
              </span>
            </div>
          ))}
          {recentShell.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 text-[11px] text-white/60"
            >
              <TerminalSquare className="size-3 text-white/35" />
              <code className="min-w-0 truncate font-mono text-[11px] text-white/70">
                {compactShellCommand(entry.command)}
              </code>
              <span className="ml-auto shrink-0 text-white/35">
                {formatRelativeTime(entry.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}

export function ContinuityLabSessionMessages({
  bubbles,
  worklog,
  shellLines,
  launchContext,
  isAgentThinking,
  agentAsleep,
  messagesEndRef,
}: ContinuityLabSessionMessagesProps) {
  const [thinkingElapsed, setThinkingElapsed] = useState(0);

  useEffect(() => {
    if (!isAgentThinking) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      setThinkingElapsed(
        Math.max(0, Math.floor((Date.now() - started) / 1000)),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isAgentThinking]);

  const displayBubbles = useMemo(() => {
    const filtered: ChatBubble[] = [];
    for (const bubble of bubbles) {
      if (bubble.role === "user") {
        const normalized = normalizeUserText(bubble.text).trim();
        const prev = filtered[filtered.length - 1];
        if (prev && prev.role === "user") {
          const prevNormalized = normalizeUserText(prev.text).trim();
          if (prevNormalized && prevNormalized === normalized) {
            continue;
          }
        }
        filtered.push(bubble);
        continue;
      }

      if (bubble.role === "agent") {
        const sanitized = sanitizeAgentBubbleText(bubble.text);
        if (!sanitized) continue;

        const prev = filtered[filtered.length - 1];
        if (
          prev &&
          prev.role === "agent" &&
          isActivityMessage(prev.text) &&
          isActivityMessage(sanitized)
        ) {
          filtered[filtered.length - 1] = {
            ...prev,
            text: `${prev.text}\n${sanitized}`,
          };
          continue;
        }

        if (
          prev &&
          prev.role === "agent" &&
          sanitizeAgentBubbleText(prev.text) === sanitized
        ) {
          continue;
        }

        filtered.push({ ...bubble, text: sanitized });
        continue;
      }

      filtered.push(bubble);
    }
    return filtered;
  }, [bubbles]);

  if (displayBubbles.length === 0) {
    return <div ref={messagesEndRef} className="h-full w-full" />;
  }

  const repoFullName = launchContext?.repo ?? null;
  const showLiveActivity = false;

  return (
    <ul className="mx-auto w-full max-w-[46rem] space-y-2.5 pb-2">
      {displayBubbles.map((bubble) => {
        if (bubble.variant === "thought") {
          if (!bubble.thoughtDurationSec || bubble.thoughtDurationSec < 1) {
            return null;
          }
          return <ThoughtBubble key={bubble.id} bubble={bubble} />;
        }

        if (bubble.role === "user") {
          const displayUserText = normalizeUserText(bubble.text);
          return (
            <li key={bubble.id} className="flex flex-row-reverse gap-2.5">
              <UserAvatar />
              <div className="max-w-[min(82%,21rem)] rounded-md rounded-br-md border border-[#252A33] bg-[#12151B] px-3 py-2 text-[14px] leading-[1.55] text-white shadow-sm transition hover:border-[#363D4B]">
                <div className="space-y-1 break-words">
                  {renderRichText(displayUserText, repoFullName)}
                </div>
              </div>
            </li>
          );
        }

        if (bubble.role === "agent") {
          if (bubble.variant === "artifact" && bubble.artifact?.type === "pr_ready") {
            return (
              <li key={bubble.id} className="flex gap-2.5">
                <span className="size-7 shrink-0" aria-hidden />
                <div className="min-w-0 max-w-[48rem] px-0.5 py-0.5">
                  <PrReadyCard artifact={bubble.artifact} />
                </div>
              </li>
            );
          }

          const statusCard =
            bubble.variant === "status" ? classifyStatusCard(bubble.text) : null;
          return (
            <li key={bubble.id} className="flex gap-2.5">
              <span className="size-7 shrink-0" aria-hidden />
              {statusCard ? (
                <div className="min-w-0 max-w-[48rem] px-0.5 py-0.5">
                  <StatusCard text={bubble.text} repoFullName={repoFullName} />
                </div>
              ) : (
                <div className="min-w-0 max-w-[48rem] px-0.5 py-0.5 text-[14px] leading-[1.65] text-white/92">
                  {renderAgentSpecialBlocks(bubble.text) ? (
                    <div className="space-y-1.5 break-words px-1 py-0.5">
                      {renderAgentSpecialBlocks(bubble.text)}
                    </div>
                  ) : (
                    <div className="space-y-1.5 break-words px-1 py-0.5">
                      {renderRichText(bubble.text, repoFullName)}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        }

        return (
          <li key={bubble.id} className="flex gap-2.5">
            <AgentAvatar />
            <div
              className={cn(
                "min-w-0 max-w-[92%] rounded-md border px-3 py-2 text-xs",
                "border-amber-500/30 bg-amber-500/10 text-amber-100",
              )}
            >
              <div className="space-y-1 break-words">
                {renderRichText(bubble.text, repoFullName)}
              </div>
            </div>
          </li>
        );
      })}

      {agentAsleep ? (
        <li className="flex items-center gap-2 py-1 pl-9 text-[11px] text-white/35">
          <Moon className="size-3.5 shrink-0" />
          Agent went to sleep
        </li>
      ) : null}

      {isAgentThinking ? <LiveThinking elapsedSec={thinkingElapsed} /> : null}
      {showLiveActivity ? (
        <LiveActivityRail worklog={worklog} shellLines={shellLines} />
      ) : null}

      <div ref={messagesEndRef} />
    </ul>
  );
}
