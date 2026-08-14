"use client";

import { useState } from "react";

export function LiveEntityInspector({ entityData }: { entityData: unknown }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(entityData, null, 2));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
    };
    return (
        <div className="flex h-full flex-col overflow-auto p-6">
            <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live backend record</div>
                <button onClick={() => void copy()} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">{copied ? "Copied" : "Copy JSON"}</button>
            </div>
            <pre className="whitespace-pre-wrap break-words rounded border border-border bg-card p-4 font-mono text-xs text-foreground">{JSON.stringify(entityData, null, 2)}</pre>
        </div>
    );
}
