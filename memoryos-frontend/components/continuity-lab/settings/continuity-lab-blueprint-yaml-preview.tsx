"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Maximize2, Pencil, X } from "lucide-react";
import { highlightYamlLine } from "@/components/continuity-lab/settings/continuity-lab-blueprint-yaml-ide";
import { cn } from "@/lib/utils";

const EDITOR_LINE_HEIGHT_PX = 26;

function formatRelativeUpdated(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "Updated just now";
    if (diff < 3_600_000) {
      const minutes = Math.floor(diff / 60_000);
      return `Updated ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }
    if (diff < 86_400_000) {
      const hours = Math.floor(diff / 3_600_000);
      return `Updated ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    const days = Math.floor(diff / 86_400_000);
    if (days < 14) return `Updated ${days} ${days === 1 ? "day" : "days"} ago`;
    return `Updated ${new Date(iso).toLocaleDateString()}`;
  } catch {
    return null;
  }
}

function YamlPreviewBody({
  content,
  maxHeight,
  className,
}: {
  content: string;
  maxHeight?: number;
  className?: string;
}) {
  const lines = content.split("\n");
  const lineCount = Math.max(lines.length, 1);

  return (
    <div
      className={cn("flex overflow-auto bg-black", className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <div
        aria-hidden
        className="shrink-0 select-none border-r border-white/[0.06] bg-[#080808] py-2 font-mono text-[11px] leading-relaxed"
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <div
            key={index}
            className="flex h-[1.625rem] items-center justify-end px-2"
          >
            <span className="min-w-[1.75rem] text-right text-white/20">{index + 1}</span>
          </div>
        ))}
      </div>
      <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs leading-[1.625rem] text-sky-100/90">
        {lines.map((line, index) => (
          <div key={index}>{highlightYamlLine(line) || "\u00a0"}</div>
        ))}
      </pre>
    </div>
  );
}

function PreviewToolbar({
  onCopy,
  onExpand,
  editHref,
  copied,
}: {
  onCopy: () => void;
  onExpand?: () => void;
  editHref?: string;
  copied: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex size-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-white/75"
        aria-label={copied ? "Copied" : "Copy blueprint"}
      >
        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      </button>
      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex size-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-white/75"
          aria-label="Expand preview"
        >
          <Maximize2 className="size-3.5" />
        </button>
      ) : null}
      {editHref ? (
        <Link
          href={editHref}
          className="inline-flex size-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-white/75"
          aria-label="Edit blueprint"
        >
          <Pencil className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function BlueprintExpandModal({
  open,
  onClose,
  title,
  subtitle,
  content,
  updatedAt,
  editHref,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  content: string;
  updatedAt?: string | null;
  editHref: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [content]);

  if (!open || typeof document === "undefined") return null;

  const updatedLabel = formatRelativeUpdated(updatedAt);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blueprint-preview-title"
        className="flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-white/[0.1] bg-[#1a1a1a] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <h2 id="blueprint-preview-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-white/50">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PreviewToolbar
              onCopy={() => void handleCopy()}
              editHref={editHref}
              copied={copied}
            />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white/75"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <YamlPreviewBody content={content} className="max-h-[min(60vh,520px)]" />
        </div>
        {updatedLabel ? (
          <div className="border-t border-white/[0.08] px-5 py-3">
            <p className="text-xs text-white/40">{updatedLabel}</p>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ContinuityLabBlueprintYamlPreview({
  content,
  updatedAt,
  editHref,
  maxHeight = 280,
  className,
}: {
  content: string;
  updatedAt?: string | null;
  editHref: string;
  maxHeight?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [content]);

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-white/[0.08] bg-[#0a0a0a]",
          className,
        )}
      >
        <div className="flex justify-end border-b border-white/[0.06] px-2 py-1">
          <PreviewToolbar
            onCopy={() => void handleCopy()}
            onExpand={() => setExpanded(true)}
            copied={copied}
          />
        </div>
        <YamlPreviewBody content={content} maxHeight={maxHeight} />
      </div>

      <BlueprintExpandModal
        open={expanded}
        onClose={() => setExpanded(false)}
        title="Organization blueprint"
        subtitle="Applies to every session in this organization"
        content={content}
        updatedAt={updatedAt}
        editHref={editHref}
      />
    </>
  );
}

export { formatRelativeUpdated, EDITOR_LINE_HEIGHT_PX };
