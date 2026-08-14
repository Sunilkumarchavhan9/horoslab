"use client";

import { useMemo, useState } from "react";
import { Search, Link2, ExternalLink, MessageSquareQuote, Sparkles } from "lucide-react";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { queryRealityGraph, type RealityQueryResult } from "@/lib/reality-api";

const EXAMPLE_QUESTIONS = [
  "Why was authentication changed?",
  "Who decided to migrate to RuntimeBase?",
  "Which PR introduced this service?",
  "Show every discussion related to Mission Runtime.",
];

type QueryCitation = RealityQueryResult["evidence"][number];

export function RealityQueryMode() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RealityQueryResult | null>(null);
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);

  const evidenceCount = result?.evidence.length ?? 0;
  const nodeCount = result?.nodes.length ?? 0;

  const evidenceToShow = useMemo(() => result?.evidence ?? [], [result]);

  const runQuery = async (nextQuestion = question) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed) {
      setError("Ask a question first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await queryRealityGraph({ question: trimmed, limit: 8 });
      setResult(response.result);
      setOpenEvidenceId(response.result.evidence[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reality query failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <Search className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Ask Reality</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
              Ask for evidence, not just answers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
          <Sparkles className="size-3.5" />
          Evidence-backed query
        </div>
      </div>

      <div className="flex flex-col gap-6 p-8 overflow-y-auto">
        <div className="grid gap-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
            Question
          </label>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            placeholder="Ask something like: Why was authentication changed?"
            className="w-full rounded-none border border-border dark:border-[#333] bg-card dark:bg-[#111] px-4 py-3 text-[14px] outline-none focus:border-[#111] dark:focus:border-white min-h-[120px] resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuestion(example);
                  void runQuery(example);
                }}
                className="px-3 py-2 text-[12px] font-medium border border-border dark:border-[#333] bg-muted/40 dark:bg-[#1a1a1a] hover:bg-muted dark:hover:bg-[#222] transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void runQuery()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-3 bg-[#111] dark:bg-white text-white dark:text-foreground text-[13px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors disabled:opacity-60"
            >
              <Search className="size-4" />
              {loading ? "Querying..." : "Ask Reality"}
            </button>
            <div className="text-[12px] text-muted-foreground dark:text-muted-foreground">
              Connected workspace, live sources, and citations.
            </div>
          </div>
        </div>

        {error && (
          <div className="border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {result ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border border-border dark:border-[#333] bg-card dark:bg-[#111]">
              <div className="px-5 py-4 border-b border-border dark:border-[#333] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                    Answer
                  </div>
                  <div className="mt-1 text-[15px] font-medium leading-relaxed">
                    {result.answer}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border dark:divide-[#333] border-b border-border dark:border-[#333]">
                <div className="p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                    Nodes
                  </div>
                  <div className="mt-1 text-[26px] font-mono font-bold">{nodeCount}</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                    Evidence
                  </div>
                  <div className="mt-1 text-[26px] font-mono font-bold">{evidenceCount}</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                    Edges
                  </div>
                  <div className="mt-1 text-[26px] font-mono font-bold">{result.edges.length}</div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                  Supporting Nodes
                </div>
                <div className="space-y-2">
                  {result.nodes.map((node) => (
                    <div key={node.id} className="border border-border dark:border-[#333] bg-muted/20 dark:bg-[#1a1a1a] px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[13px] font-semibold">{node.name}</div>
                          <div className="text-[11px] text-muted-foreground dark:text-muted-foreground">
                            {node.type} · {node.state}
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground dark:text-muted-foreground">
                          {node.sourceConnector ?? "kernel"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.nodes.length === 0 && (
                    <div className="text-[13px] text-muted-foreground dark:text-muted-foreground">
                      No graph nodes matched this question.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-border dark:border-[#333] bg-card dark:bg-[#111]">
              <div className="px-5 py-4 border-b border-border dark:border-[#333]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                  Evidence Cards
                </div>
              </div>

              <div className="divide-y divide-border dark:divide-[#333]">
                {evidenceToShow.map((evidence: QueryCitation) => {
                  const isOpen = openEvidenceId === evidence.id;
                  return (
                    <div key={evidence.id} className="p-4">
                      <button
                        type="button"
                        onClick={() => setOpenEvidenceId(isOpen ? null : evidence.id)}
                        className="flex w-full items-start justify-between gap-4 text-left"
                      >
                        <div>
                          <div className="text-[14px] font-semibold leading-snug">{evidence.title}</div>
                          <div className="mt-1 text-[12px] text-muted-foreground dark:text-muted-foreground">
                            {evidence.sourceConnector} · {evidence.author} · {new Date(evidence.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <MessageSquareQuote className="size-4 shrink-0 text-muted-foreground dark:text-muted-foreground" />
                      </button>

                      {isOpen && (
                        <div className="mt-3 space-y-3">
                          <p className="text-[13px] leading-relaxed text-foreground/80 dark:text-[#ddd]">
                            {evidence.summary}
                          </p>
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="px-2 py-1 border border-border dark:border-[#333] bg-muted/40 dark:bg-[#1a1a1a]">
                              workspace: {evidence.workspace}
                            </span>
                            <span className="px-2 py-1 border border-border dark:border-[#333] bg-muted/40 dark:bg-[#1a1a1a]">
                              confidence: {(evidence.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="px-2 py-1 border border-border dark:border-[#333] bg-muted/40 dark:bg-[#1a1a1a]">
                              source: {evidence.sourceId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  void navigator.clipboard.writeText(evidence.id).catch(() => undefined);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold border border-border dark:border-[#333] hover:bg-muted/50 dark:hover:bg-[#1a1a1a]"
                            >
                              <Link2 className="size-3.5" />
                              Copy citation
                            </button>
                            {evidence.sourceUrl ? (
                              <a
                                href={evidence.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold border border-border dark:border-[#333] hover:bg-muted/50 dark:hover:bg-[#1a1a1a]"
                              >
                                <ExternalLink className="size-3.5" />
                                Open source
                              </a>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {evidenceToShow.length === 0 && (
                  <div className="p-4 text-[13px] text-muted-foreground dark:text-muted-foreground">
                    No supporting evidence found yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-border dark:border-[#333] bg-muted/20 dark:bg-[#1a1a1a] p-6 text-[13px] text-muted-foreground dark:text-muted-foreground">
            Ask a question to see a ranked answer with citations.
          </div>
        )}
      </div>
    </div>
  );
}

GlobalRealityRegistry.register({
  id: "query",
  title: "Ask Reality",
  component: RealityQueryMode,
});
