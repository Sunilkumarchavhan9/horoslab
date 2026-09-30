"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import type { ComposerSegment, HfModelItem } from "./token-prompt-input";
import {
  BAAILogo,
  DeepSeekLogo,
  GoogleLogo,
  HuggingFaceLogo,
  MetaLogo,
  MistralLogo,
  MiniMaxLogo,
  InclusionAILogo,
  XiaomiLogo,
  PoolsideLogo,
  UpstageLogo,
  OpenAILogo,
  QwenLogo,
  NvidiaLogo,
  FluxLogo,
  TEILogo,
  VLLMLogo,
  SGLangLogo,
  DiffusersLogo,
  KimiLogo,
  MicrosoftLogo,
} from "./brand-icons";

type Props = {
  segments: ComposerSegment[];
  suggestions: HfModelItem[];
  dark?: boolean;
  onChange: (segments: ComposerSegment[]) => void;
  onSubmit?: () => void;
};

export type SegmentedInlineComposerHandle = {
  insertModelAtCaret: (model: HfModelItem) => void;
  animateTokensIn: () => void;
};

const isEntity = (node: Node | null): node is HTMLElement =>
  node instanceof HTMLElement && Boolean(node.dataset.entity);

function BrandIcon({ model }: { model: ComposerSegment & { type: "model" } }) {
  const iconType = String(model.metadata?.iconType ?? "");
  const value = `${model.id} ${model.label} ${String(model.metadata?.provider ?? "")} ${String(model.metadata?.repositoryId ?? "")}`.toLowerCase();
  const normalizedValue = value.replace(/\s+/g, "");
  const officialMiniMax = ["minimaxai/minimax-h3", "minimaxai/minimax-m2.7", "minimaxai/minimax-m2.5"];
  if (iconType === "minimax" || officialMiniMax.some((modelId) => normalizedValue.includes(modelId))) return <MiniMaxLogo size={13} />;
  if (iconType === "inclusionai" || normalizedValue.includes("inclusionai/")) return <InclusionAILogo size={13} />;
  if (iconType === "xiaomi" || normalizedValue.includes("xiaomimimo/")) return <XiaomiLogo size={13} />;
  if (iconType === "poolside" || normalizedValue.includes("poolside/")) return <PoolsideLogo size={13} />;
  if (iconType === "upstage" || normalizedValue.includes("upstage/")) return <UpstageLogo size={13} />;
  if (iconType === "microsoft" || value.includes("microsoft") || value.includes("deberta") || value.includes("florence") || value.includes("phi-") || value.includes("trellis")) return <MicrosoftLogo size={13} />;
  if (iconType === "nvidia" || value.includes("nvidia") || value.includes("cosmos") || value.includes("gpu") || value.includes("cluster") || value.includes("h100") || value.includes("dynamo")) return <NvidiaLogo size={13} />;
  if (iconType === "google" || value.includes("gemma") || value.includes("google") || value.includes("robocat")) return <GoogleLogo size={13} />;
  if (iconType === "qwen" || value.includes("qwen")) return <QwenLogo size={13} />;
  if (iconType === "meta" || value.includes("llama") || value.includes("meta")) return <MetaLogo size={13} />;
  if (iconType === "deepseek" || value.includes("deepseek")) return <DeepSeekLogo size={13} />;
  if (iconType === "baai" || value.includes("bge") || value.includes("baai")) return <BAAILogo size={13} />;
  if (iconType === "kimi" || iconType === "moonshot" || value.includes("kimi") || value.includes("moonshot")) return <KimiLogo size={13} />;
  if (iconType === "openai" || value.includes("whisper") || value.includes("openai") || value.includes("gpt")) return <OpenAILogo size={13} />;
  if (iconType === "mistral" || value.includes("mistral")) return <MistralLogo size={13} />;
  if (iconType === "flux" || value.includes("flux") || value.includes("black-forest")) return <FluxLogo size={13} />;
  if (iconType === "tei" || value.includes("tei")) return <TEILogo size={13} />;
  return <HuggingFaceLogo size={13} />;
}

function readSegments(root: HTMLElement): ComposerSegment[] {
  const result: ComposerSegment[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) result.push({ type: "text", value: node.textContent });
      return;
    }
    if (node instanceof HTMLElement && node.classList.contains("text-token")) {
      if (node.textContent) result.push({ type: "text", value: node.textContent });
      return;
    }
    if (!isEntity(node)) return;
    try { result.push(JSON.parse(node.dataset.entity ?? "") as ComposerSegment); } catch { /* ignore malformed transient DOM */ }
  });
  return result;
}

function renderSegments(root: HTMLElement, segments: ComposerSegment[], animate = true) {
  root.replaceChildren();
  const animatedElements: HTMLElement[] = [];

  segments.forEach((segment) => {
    if (segment.type === "text") {
      const textSpan = document.createElement("span");
      textSpan.className = "inline text-token";
      textSpan.textContent = segment.value;
      root.appendChild(textSpan);
      animatedElements.push(textSpan);
      return;
    }
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.entity = JSON.stringify(segment);
    chip.className = "mx-0.5 inline-flex cursor-pointer select-none items-center rounded-xs border border-[#383838] bg-[#222222] px-1.5 py-0.5 align-middle text-xs font-medium text-[#F0EFE2] transition-all hover:border-[#75bf00] hover:shadow-[0_0_8px_rgba(117,191,0,0.25)] active:scale-95";
    chip.textContent = "";
    if (segment.type === "model") {
      const icon = document.createElement("span");
      icon.className = "mr-1 inline-flex items-center";
      createRoot(icon).render(<BrandIcon model={segment as ComposerSegment & { type: "model" }} />);
      chip.appendChild(icon);
    }
    const label = document.createElement("span");
    label.textContent = segment.label;
    chip.appendChild(label);
    root.appendChild(chip);
    animatedElements.push(chip);
  });

  if (animate) {
    const textElements = animatedElements.filter((el) => el.dataset.entity === undefined);
    if (textElements.length > 0) {
      gsap.killTweensOf(textElements);
      gsap.fromTo(
        textElements,
        { y: 4, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.28,
          stagger: 0.02,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }
  }
}

function caretAt(root: HTMLElement, node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  root.focus();
}

function adjacentEntity(root: HTMLElement, direction: "before" | "after") {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    const length = range.startContainer.textContent?.length ?? 0;
    if ((direction === "before" && range.startOffset !== 0) || (direction === "after" && range.startOffset !== length)) return null;
    const sibling = direction === "before" ? range.startContainer.previousSibling : range.startContainer.nextSibling;
    return isEntity(sibling) ? sibling : null;
  }
  const children = Array.from(range.startContainer.childNodes);
  const index = direction === "before" ? range.startOffset - 1 : range.startOffset;
  const sibling = children[index] ?? null;
  return isEntity(sibling) ? sibling : null;
}

export const SegmentedInlineComposer = forwardRef<SegmentedInlineComposerHandle, Props>(function SegmentedInlineComposer({ segments, suggestions, dark = true, onChange, onSubmit }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const internalChange = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!editorRef.current || internalChange.current) {
      internalChange.current = false;
      return;
    }
    renderSegments(editorRef.current, segments);
  }, [segments]);

  const updateMentionMenu = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (!selection?.rangeCount || !node || node.nodeType !== Node.TEXT_NODE) {
      setMenu(null);
      return;
    }
    const text = node.textContent?.slice(0, selection.anchorOffset) ?? "";
    const mention = text.match(/(?:^|\s)@([^\s@]*)$/);
    if (!mention) { setMenu(null); return; }
    setQuery(mention[1]);
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();
    setMenu(editorRect ? { x: rect.left - editorRect.left, y: rect.bottom - editorRect.top + 4 } : null);
  };

  const publish = () => {
    if (!editorRef.current) return;
    internalChange.current = true;
    onChange(readSegments(editorRef.current));
  };

  const saveCaret = () => {
    const root = editorRef.current;
    const selection = window.getSelection();
    if (!root || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (root.contains(range.startContainer)) savedRange.current = range.cloneRange();
  };

  const removeEntity = (entity: HTMLElement) => {
    const parent = entity.parentNode;
    if (!parent || !editorRef.current) return;
    const text = document.createTextNode("");
    parent.replaceChild(text, entity);
    caretAt(editorRef.current, text, 0);
    publish();
  };

  const insert = useCallback((model: HfModelItem) => {
    const selection = window.getSelection();
    if (!editorRef.current) return;
    const range = savedRange.current?.cloneRange() ?? (selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null);
    if (!range || !selection) return;
    const node = range.startContainer;
    const before = node.textContent?.slice(0, range.startOffset) ?? "";
    const match = before.match(/(?:^|\s)@([^\s@]*)$/);
    if (match && node.nodeType === Node.TEXT_NODE) {
      const start = range.startOffset - match[1].length - 1;
      range.setStart(node, start);
      range.deleteContents();
    }
    const entity: ComposerSegment = { type: "model", id: model.repositoryId ?? model.id, label: model.name, metadata: { repositoryId: model.repositoryId ?? model.id, provider: model.org.split(",")[0], task: model.task, iconType: model.iconType, revision: model.revision ?? null, commitSha: model.commitSha ?? null, artifactDigest: model.artifactDigest ?? null } };
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.entity = JSON.stringify(entity);
    chip.className = "mx-0.5 inline-flex cursor-pointer select-none items-center rounded-xs border border-[#383838] bg-[#222222] px-1.5 py-0.5 align-middle text-xs font-medium text-[#F0EFE2]";
    chip.textContent = "";
    const icon = document.createElement("span");
    icon.className = "mr-1 inline-flex items-center";
    createRoot(icon).render(<BrandIcon model={entity as ComposerSegment & { type: "model" }} />);
    chip.appendChild(icon);
    const label = document.createElement("span");
    label.textContent = model.name;
    chip.appendChild(label);
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange.current = range.cloneRange();
    internalChange.current = true;
    onChange(readSegments(editorRef.current));
    setMenu(null);
  }, [onChange]);

  useImperativeHandle(
    ref,
    () => ({
      insertModelAtCaret: insert,
      animateTokensIn: () => {
        if (!editorRef.current) return;
        const textElements = (Array.from(editorRef.current.children) as HTMLElement[]).filter(
          (el) => el.dataset.entity === undefined
        );
        if (textElements.length > 0) {
          gsap.killTweensOf(textElements);
          gsap.fromTo(
            textElements,
            { y: 4, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.28,
              stagger: 0.02,
              ease: "power2.out",
              clearProps: "transform,opacity",
            }
          );
        }
      },
    }),
    [insert]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { setMenu(null); return; }
    if (event.key === "Enter" && !event.shiftKey && !menu) {
      event.preventDefault();
      onSubmit?.();
      return;
    }
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    const entity = adjacentEntity(editorRef.current!, event.key === "Backspace" ? "before" : "after");
    if (entity) { event.preventDefault(); removeEntity(entity); }
  };

  const filtered = suggestions.filter((model) => model.name.toLowerCase().includes(query.toLowerCase()) || model.id.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  return (
    <>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={() => { publish(); saveCaret(); updateMentionMenu(); }} onKeyDown={onKeyDown} onKeyUp={saveCaret} onMouseUp={saveCaret} onClick={() => { saveCaret(); setMenu(null); }} className={cn("relative min-h-[44px] w-full cursor-text text-xs leading-relaxed outline-none md:text-sm", dark ? "text-[#F0EFE2]" : "text-[#171a17]")} />
      {menu && filtered.length > 0 && (
        <div style={{ left: menu.x, top: menu.y }} className={cn("absolute z-[100] w-72 border p-1.5 shadow-2xl rounded-xs", dark ? "border-[#333] bg-[#181818] text-[#F0EFE2]" : "border-[#c9cec4] bg-white text-[#171a17]")}>
          {filtered.map((model) => <button key={model.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insert(model)} className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-xs hover:bg-[#282828]"><BrandIcon model={{ type: "model", id: model.repositoryId ?? model.id, label: model.name, metadata: { provider: model.org, repositoryId: model.repositoryId ?? model.id, iconType: model.iconType } }} /><span className="truncate">{model.name}</span></button>)}
        </div>
      )}
    </>
  );
});
