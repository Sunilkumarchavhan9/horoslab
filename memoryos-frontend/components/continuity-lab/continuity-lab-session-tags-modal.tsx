"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  LAB_SESSION_QUICK_TAGS,
  setLabSessionTags,
} from "@/lib/continuity-lab/session-storage";
import { cn } from "@/lib/utils";

type ContinuityLabSessionTagsModalProps = {
  open: boolean;
  sessionId: string;
  initialTags: string[];
  onClose: () => void;
  onSaved?: () => void;
};

export function ContinuityLabSessionTagsModal({
  open,
  sessionId,
  initialTags,
  onClose,
  onSaved,
}: ContinuityLabSessionTagsModalProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [otherInput, setOtherInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTags(initialTags);
    setOtherInput("");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initialTags, onClose]);

  function addTag(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setTags((prev) => {
      const lower = value.toLowerCase();
      if (prev.some((t) => t.toLowerCase() === lower)) return prev;
      return [...prev, value];
    });
    setOtherInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function toggleQuickTag(tag: string) {
    setTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag],
    );
  }

  function handleSave() {
    setSaving(true);
    setLabSessionTags(sessionId, tags);
    setSaving(false);
    onSaved?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close edit tags"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-session-tags-title"
        className="relative z-10 w-full max-w-md border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6366F1]">
              Session
            </p>
            <h2 id="edit-session-tags-title" className="mt-1 text-lg font-semibold text-[#F0EFE2]">
              Edit session tags
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-[#F0EFE2]/70 hover:bg-[#141414]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[min(70vh,480px)] overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">
              Other tags
            </span>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={otherInput}
                onChange={(e) => setOtherInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(otherInput);
                  }
                }}
                placeholder="Add a tag…"
                className="min-w-0 flex-1 border border-[#2F2F2F] bg-[#111111] px-3 py-2 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/30 outline-none focus:border-[#6366F1]"
              />
              <button
                type="button"
                onClick={() => addTag(otherInput)}
                className="shrink-0 border border-[#3A3A3A] px-3 py-2 text-xs font-medium text-[#F0EFE2] hover:bg-[#141414]"
              >
                Add
              </button>
            </div>
          </label>

          {tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1 border border-[#3A3A3A] bg-[#141414] px-2 py-1 text-[11px] text-[#F0EFE2]/85 hover:border-rose-500/50 hover:text-rose-200"
                    title="Remove tag"
                  >
                    {tag}
                    <X className="size-3 opacity-60" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[11px] text-[#F0EFE2]/35">No tags yet.</p>
          )}

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">
              Quick select tags
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {LAB_SESSION_QUICK_TAGS.map((tag) => {
                const selected = tags.some(
                  (t) => t.toLowerCase() === tag.toLowerCase(),
                );
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => toggleQuickTag(tag)}
                      className={cn(
                        "border px-2.5 py-1 text-[11px] transition",
                        selected
                          ? "border-[#6366F1] bg-[#4338CA]/20 text-indigo-100"
                          : "border-[#2F2F2F] bg-[#111111] text-[#F0EFE2]/70 hover:border-[#3A3A3A]",
                      )}
                    >
                      {tag}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#2F2F2F] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#3A3A3A] px-4 py-2 text-xs font-medium text-[#F0EFE2]/80 hover:bg-[#141414]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-[#6366F1] px-4 py-2 text-xs font-semibold text-[#F0EFE2] hover:bg-[#4F46E5] disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
