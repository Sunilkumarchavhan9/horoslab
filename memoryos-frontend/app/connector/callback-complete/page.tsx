"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function providerLabel(provider: string): string {
  return provider
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ConnectorCallbackCompleteContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") ?? "connector";
  const status = searchParams.get("status") === "connected" ? "connected" : "error";
  const detail = searchParams.get("detail");
  const label = providerLabel(provider);

  useEffect(() => {
    window.opener?.postMessage(
      { type: "memoryos:connector-result", provider, status },
      window.location.origin,
    );

    const closeTimer = status === "connected"
      ? window.setTimeout(() => window.close(), 900)
      : undefined;
    return () => {
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [provider, status]);

  return (
    <main className="min-h-screen bg-[#0d0d0f] px-6 py-16 text-white">
      <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
        <div className={`mx-auto mb-5 flex size-12 items-center justify-center rounded-full ${status === "connected" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
          {status === "connected" ? "✓" : "!"}
        </div>
        <h1 className="text-xl font-semibold">
          {status === "connected" ? `${label} connected` : `${label} connection failed`}
        </h1>
        <p className="mt-3 text-sm text-white/60">
          {status === "connected"
            ? "Mission Control will refresh in the original tab. This tab will close automatically."
            : detail || "Return to Mission Control and try connecting again."}
        </p>
        <button
          type="button"
          onClick={() => window.close()}
          className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Close tab
        </button>
      </section>
    </main>
  );
}

export default function ConnectorCallbackCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0d0d0f] px-6 py-16 text-white">
          <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
            Loading connector result...
          </section>
        </main>
      }
    >
      <ConnectorCallbackCompleteContent />
    </Suspense>
  );
}
