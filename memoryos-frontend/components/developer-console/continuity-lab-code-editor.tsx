"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { languageForPath } from "@/components/developer-console/continuity-lab-demo-workspace";
import { cn } from "@/lib/utils";

type MonacoComponent = ComponentType<{
  path?: string;
  language?: string;
  value?: string;
  theme?: string;
  onChange?: (value: string | undefined) => void;
  options?: Record<string, unknown>;
}>;

export function ContinuityLabCodeEditor({
  path,
  value,
  onChange,
  readOnly,
}: {
  path: string;
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
}) {
  const language = useMemo(() => languageForPath(path), [path]);
  const [Monaco, setMonaco] = useState<MonacoComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@monaco-editor/react")
      .then((mod) => {
        if (!cancelled) setMonaco(() => mod.default as MonacoComponent);
      })
      .catch(() => {
        if (!cancelled) setMonaco(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Monaco) {
    return (
      <EditorFallback value={value} onChange={onChange} readOnly={readOnly} path={path} />
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full bg-[#1e1e1e]">
      <Monaco
        path={path}
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(v) => onChange(v ?? "")}
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 13,
          lineHeight: 20,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 8 },
        }}
      />
    </div>
  );
}

function EditorFallback({
  value,
  onChange,
  readOnly,
  path,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  path?: string;
}) {
  const lines = value.split("\n");
  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden">
      {path ? (
        <p className="shrink-0 border-b border-white/10 px-2 py-1 text-[10px] text-[#6b6b6b]">
          Run <code className="text-[#8e8e8e]">npm install</code> in memoryos-frontend for Monaco
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="shrink-0 select-none overflow-hidden border-r border-white/10 bg-[#1a1a1a] py-2 pr-2 text-right font-mono text-[11px] leading-5 text-[#6b6b6b]">
          {lines.map((_, i) => (
            <div key={i} className="px-2">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className={cn(
            "min-h-0 flex-1 resize-none bg-transparent p-2 font-mono text-[13px] leading-5 text-[#d4d4d4] outline-none",
          )}
        />
      </div>
    </div>
  );
}
