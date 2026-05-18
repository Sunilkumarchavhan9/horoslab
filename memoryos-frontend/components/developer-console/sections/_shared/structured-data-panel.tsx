"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type StructuredDataPanelProps = {
  title: string;
  value: unknown;
  emptyMessage?: string;
  maxHeightClassName?: string;
  compactChars?: number;
};

function toPretty(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function compactText(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars).trimEnd()}\n\n... truncated (${input.length - maxChars} chars hidden)`;
}

export function StructuredDataPanel({
  title,
  value,
  emptyMessage = "No data available.",
  maxHeightClassName = "max-h-80",
  compactChars = 2200,
}: StructuredDataPanelProps) {
  const [showFull, setShowFull] = useState(false);
  const pretty = useMemo(() => toPretty(value), [value]);
  const display = showFull ? pretty : compactText(pretty, compactChars);
  const isEmpty = !pretty || pretty === "null" || pretty === "undefined";
  const isTruncated = pretty.length > compactChars;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{title}</CardTitle>
          {isTruncated ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] uppercase tracking-[0.08em]"
              onClick={() => setShowFull((current) => !current)}
            >
              {showFull ? "Compact" : "Full"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={`w-full rounded-md border border-border bg-muted/40 p-3 ${maxHeightClassName}`}>
          <pre className="whitespace-pre-wrap break-words text-[12px] leading-6 text-foreground">
            {isEmpty ? emptyMessage : display}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

