"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bug, Lightbulb, Headphones, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DhyraFeedbackWidgetProps {
  dark?: boolean;
}

/**
 * Pixel-precise 6-block brand glyph matching user screenshot:
 * 2 columns x 3 rows of square blocks.
 */
export function BrandFeedbackLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("h-3.5 w-3.5 shrink-0", className)}
    >
      {/* Column 1 */}
      <rect x="1" y="1" width="3.6" height="3.6" rx="0.4" />
      <rect x="1" y="6.2" width="3.6" height="3.6" rx="0.4" />
      <rect x="1" y="11.4" width="3.6" height="3.6" rx="0.4" />
      {/* Column 2 */}
      <rect x="6.2" y="1" width="3.6" height="3.6" rx="0.4" />
      <rect x="6.2" y="6.2" width="3.6" height="3.6" rx="0.4" />
      <rect x="6.2" y="11.4" width="3.6" height="3.6" rx="0.4" />
    </svg>
  );
}

export function DhyraFeedbackWidget({ dark = true }: DhyraFeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<"Bug" | "Feature" | "Feedback" | "Support">("Support");
  const [feedbackText, setFeedbackText] = useState("");
  const [includeSessionInfo, setIncludeSessionInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setFeedbackText("");
        setIsOpen(false);
      }, 1300);
    }, 400);
  };

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 select-none font-sans">
      {/* Send Feedback Modal Popover with Dashed Borders matching Image 2 & 3 */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full right-0 mb-3 w-[360px] sm:w-[380px] border border-dashed shadow-2xl p-4 space-y-3.5 rounded-xs animate-in fade-in zoom-in-95 duration-100",
            dark
              ? "border-[#333333] bg-[#121212] text-[#F0EFE2]"
              : "border-[#c9cec4] bg-white text-[#171a17]"
          )}
        >
          {/* Header with Title and Boxed Dashed Close Button */}
          <div className="flex items-center justify-between border-b border-dashed border-[#282828] pb-3">
            <h3 className={cn("font-medium text-sm tracking-tight", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
              Send Feedback
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={cn(
                "p-1 border border-dashed rounded-xs transition-colors flex items-center justify-center",
                dark
                  ? "border-[#2e2e2e] bg-[#181818] text-[#C8C7BA] hover:text-[#F0EFE2] hover:border-[#444]"
                  : "border-[#d8ddd3] bg-[#f5f7f3] text-[#666] hover:text-[#111]"
              )}
              title="Close"
            >
              <X size={13} />
            </button>
          </div>

          {/* Category Switcher Tabs: Bug, Feature, Feedback, Support (No truncation) */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "Bug", label: "Bug", icon: <Bug size={13} className="shrink-0" /> },
              { id: "Feature", label: "Feature", icon: <Lightbulb size={13} className="shrink-0" /> },
              { id: "Feedback", label: "Feedback", icon: null },
              { id: "Support", label: "Support", icon: <Headphones size={13} className="shrink-0" /> },
            ].map((tab) => {
              const isSelected = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id as typeof category)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 border border-dashed rounded-xs text-xs transition-all whitespace-nowrap",
                    isSelected
                      ? dark
                        ? "border-[#4a4a4a] bg-[#292929] text-[#F0EFE2] font-medium shadow-xs"
                        : "border-[#b8bfb2] bg-[#f0f4ee] text-[#171a17] font-medium"
                      : dark
                        ? "border-[#282828] bg-[#1a1a1a] text-[#889284] hover:text-[#F0EFE2] hover:border-[#383838]"
                        : "border-[#e0e4dd] bg-[#fafbfa] text-[#6b7367] hover:text-[#171a17] hover:border-[#ccd2c6]"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Textarea Input within Dashed Container */}
          <div className="border border-dashed border-[#282828] rounded-xs bg-[#161616] p-2.5">
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe the issue, suggestion, or question..."
              className={cn(
                "w-full bg-transparent border-0 text-xs leading-relaxed resize-none outline-none transition-colors",
                dark
                  ? "text-[#F0EFE2] placeholder:text-[#666]"
                  : "text-[#171a17] placeholder:text-[#C8C7BA]"
              )}
            />
          </div>

          {/* Session Info Toggle Section with Dashed Separators */}
          <div className="border-t border-b border-dashed border-[#282828] py-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className={cn("text-xs font-medium", dark ? "text-[#d1d5db]" : "text-[#2a3028]")}>
                Include session info
              </div>
              <div className={cn("text-[11px] leading-tight", dark ? "text-[#788274]" : "text-[#788274]")}>
                URL, browser, and screen size to help us debug.
              </div>
            </div>

            {/* Custom Pill Toggle Switch matching Image 2 (Green) & Image 3 (Dark) */}
            <button
              type="button"
              role="switch"
              aria-checked={includeSessionInfo}
              onClick={() => setIncludeSessionInfo(!includeSessionInfo)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none",
                includeSessionInfo
                  ? "bg-[#4d6e00]"
                  : dark ? "bg-[#202020] border border-[#303030]" : "bg-[#d0d6cb]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 rounded-full shadow transform transition duration-200 ease-in-out",
                  includeSessionInfo
                    ? "translate-x-5 bg-[#111111]"
                    : "translate-x-0 bg-[#161616] dark:bg-[#141414] border border-[#2a2a2a]"
                )}
              />
            </button>
          </div>

          {/* Submit Button within Dashed Box */}
          <div className="border border-dashed border-[#282828] p-1 rounded-xs">
            <button
              type="button"
              disabled={!feedbackText.trim() || isSubmitting || isSubmitted}
              onClick={handleSubmit}
              className={cn(
                "w-full py-2 px-4 rounded-xs text-xs font-mono transition-all flex items-center justify-center gap-2",
                isSubmitted
                  ? "bg-[#75bf00] text-black font-semibold"
                  : feedbackText.trim()
                    ? "bg-[#75bf00] text-black font-semibold hover:bg-[#86d900] active:scale-[0.99] cursor-pointer shadow-md"
                    : dark
                      ? "bg-[#1c1c1c] text-[#555] cursor-not-allowed"
                      : "bg-[#f0f3ed] text-[#C8C7BA] cursor-not-allowed"
              )}
            >
              {isSubmitted ? (
                <>
                  <Check size={14} />
                  <span>Feedback Sent</span>
                </>
              ) : isSubmitting ? (
                <span>Sending...</span>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button with Brand 6-Block Glyph matching Image 2 & 3 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 border px-3.5 py-2 text-xs font-sans font-medium transition-all rounded-xs shadow-xl",
          dark
            ? "border-[#383838] bg-[#222222] text-[#F0EFE2] hover:border-[#4c4c4c] hover:bg-[#282828]"
            : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#a0a89d] hover:bg-[#fafbfa]"
        )}
      >
        <BrandFeedbackLogo className={cn("shrink-0", dark ? "text-[#F0EFE2]" : "text-[#171a17]")} />
        <span>Feedback</span>
      </button>
    </div>
  );
}
