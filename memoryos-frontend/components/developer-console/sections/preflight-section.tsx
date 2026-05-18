/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { getOrCreateMemoryToken } from "../../../lib/memory-token";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { Icon } from "@/components/ui/icon";
import { StructuredDataPanel } from "./_shared/structured-data-panel";
export function PreflightSection() {
  const [projectId, setProjectId] = useState("");
  const [agentId] = useState("agent-b");
  const [toolTarget, setToolTarget] = useState("Cursor");
  const [taskDescription, setTaskDescription] = useState("");
  const [mode, setMode] = useState("coding");
  const [currentFiles, setCurrentFiles] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preflightData, setPreflightData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"packet" | "memories" | "decisions" | "blockers" | "files" | "missing_context" | "agent_rules">("packet");
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [showFullPacket, setShowFullPacket] = useState(false);
  const [showFullRules, setShowFullRules] = useState<Record<string, boolean>>({});

  const compactText = (input: string, maxChars = 2600) => {
    if (!input) return "";
    const compacted = input
      .replace(/,\s*"expectedType"\s*:\s*"[^"]*"/g, "")
      .replace(/,\s*"input"\s*:\s*\{[^}]*\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (compacted.length <= maxChars) return compacted;
    return `${compacted.slice(0, maxChars).trimEnd()} ... [truncated]`;
  };

  const handleRunPreflight = async () => {
    setLoading(true);
    setError(null);
    setPreflightData(null);

    try {
      const token = await getOrCreateMemoryToken();
      const origin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN === "same-origin" 
        ? "" 
        : (process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN || "");
        
      const response = await fetch(`${origin}/api/preflight`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          agentId,
          tool: toolTarget.toLowerCase(),
          task: taskDescription,
          mode,
          currentFiles: currentFiles.split(',').map(f => f.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to run preflight.");
      }

      const { data } = await response.json();
      setPreflightData(data);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(id);
      
      // Also record session when copying a packet
      if (id.startsWith("copy-")) {
        recordSessionStart(id.replace("copy-", ""));
      }

      setTimeout(() => setCopiedState(null), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const recordSessionStart = async (tool: string) => {
    try {
      const token = await getOrCreateMemoryToken();
      const origin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN === "same-origin" ? "" : (process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN || "");
      const response = await fetch(`${origin}/api/agent-sessions/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          model: "openai/gpt-4o",
          tool,
          mode,
          task: taskDescription || `preflight-${tool}`,
        })
      });
      const payload = await response.json().catch(() => null);
      const sessionId = (payload?.data?.id ?? payload?.id) as string | undefined;
      if (sessionId) {
        setLastSessionId(sessionId);
      }
    } catch {
    }
  };

  return (
    <div className="h-full overflow-y-auto  pb-12 text-foreground">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-background px-6 py-8">
        <DitherBackground
          className="pointer-events-none absolute inset-0 opacity-30"
          accent="var(--color-primary)"
          density={0.56}
          cols={320}
          rows={120}
        />
        
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="inline-flex items-center gap-2 rounded-[8px] bg-card px-3 py-1.5 text-[26px] font-bold tracking-tight text-foreground"
            >
              <Icon name="terminal" className="h-6 w-6 text-primary" />
              Preflight Console
            </motion.h1>
            {lastSessionId ? (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Session linked.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8 max-w-6xl">
        {/* Run Preflight Panel */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden border border-border bg-card p-6"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground"><path d="M12 2L2 22h20L12 2z"/></svg>
          </div>
          <h2 className="mb-6 text-[14px] font-semibold uppercase tracking-widest text-muted-foreground">Run Preflight Checklist</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 relative z-10">
            <div>
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Project ID</label>
              <input value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-[12px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Target Agent/Tool</label>
              <select value={toolTarget} onChange={e => setToolTarget(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-[12px] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option>Cursor</option><option>Claude Code</option><option>OpenCode</option>
                <option>LangGraph</option><option>MCP Agent</option><option>Generic</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-[12px] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option>coding</option><option>planning</option><option>debugging</option>
                <option>pr-review</option><option>handoff</option><option>onboarding</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Task Goal</label>
              <input value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="What are we doing?" className="w-full rounded-md border border-input bg-background px-3 py-2 text-[12px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Open Files (Comma separated)</label>
              <input value={currentFiles} onChange={e => setCurrentFiles(e.target.value)} placeholder="src/app.ts, etc." className="w-full rounded-md border border-input bg-background px-3 py-2 text-[12px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="font-mono text-[11px] text-muted-foreground">memoryos.preflight()</div>
            <motion.button 
              onClick={handleRunPreflight} 
              disabled={loading}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors border ${
                loading
                  ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                  : "border-primary/35 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              }`}
            >
              {loading ? "Generating Context..." : "Run Preflight"}
            </motion.button>
          </div>
          {error && <div className="mt-4 border border-destructive/30 bg-destructive/10 px-4 py-2 text-[12px] text-destructive">{error}</div>}
        </motion.div>

        {/* Preflight Results Area */}
        {preflightData && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-muted">
              <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden bg-card p-5 border-t-2 border-t-chart-2">
                <DitherBackground className="pointer-events-none absolute inset-0 opacity-15" accent="var(--color-chart-2)" density={0.45} cols={80} rows={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Recommended Action</p>
                <p className="mt-2 text-[14px] text-foreground font-medium">{preflightData.nextAction?.title || "Ready"}</p>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden bg-card p-5 border-t-2 border-t-primary">
                <DitherBackground className="pointer-events-none absolute inset-0 opacity-15" accent="var(--color-primary)" density={0.45} cols={80} rows={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tokens Saved</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[24px] font-bold tracking-tight text-primary">{preflightData.tokenSavings?.percentSaved}%</span>
                  <span className="text-[12px] text-muted-foreground">({preflightData.tokenSavings?.savedTokens}t)</span>
                </div>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden bg-card p-5 border-t-2 border-t-chart-5">
                <DitherBackground className="pointer-events-none absolute inset-0 opacity-15" accent="var(--color-chart-5)" density={0.45} cols={80} rows={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Blockers</p>
                <p className="mt-2 text-[24px] font-bold tracking-tight">{preflightData.blockers?.length || 0}</p>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden bg-card p-5 border-t-2 border-t-chart-4">
                <DitherBackground className="pointer-events-none absolute inset-0 opacity-15" accent="var(--color-chart-4)" density={0.45} cols={80} rows={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confidence</p>
                <p className="mt-2 text-[24px] font-bold tracking-tight">{(preflightData.confidence * 100).toFixed(0)}%</p>
              </motion.div>
            </div>

            {/* Main Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
              {[
                { id: "packet", label: "Context Packet" },
                { id: "memories", label: `Memories (${preflightData.relevantMemories?.length || 0})` },
                { id: "decisions", label: `Decisions (${preflightData.decisions?.length || 0})` },
                { id: "blockers", label: `Blockers (${preflightData.blockers?.length || 0})` },
                { id: "files", label: "Relevant Files" },
                { id: "missing_context", label: `Missing Context (${preflightData.missingContext?.length || 0})` },
                { id: "agent_rules", label: "Generated Rules" },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary bg-primary/10"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* TAB: Context Packet */}
            {activeTab === "packet" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border flex justify-between items-center bg-muted/40">
                      <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground">Compiled Packet</h3>
                      <button onClick={() => handleCopy(preflightData.contextPacket, "copy-packet")} className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors bg-muted border border-border px-3 py-1">
                        {copiedState === "copy-packet" ? "Copied!" : "Copy Raw"}
                      </button>
                    </div>
                    <div className="p-5">
                      <StructuredDataPanel
                        title="Context packet"
                        value={
                          showFullPacket
                            ? preflightData.contextPacket
                            : compactText(preflightData.contextPacket, 2400)
                        }
                        maxHeightClassName="max-h-[420px]"
                        compactChars={2400}
                      />
                    </div>
                    <div className="px-5 pb-4">
                      <button
                        type="button"
                        onClick={() => setShowFullPacket((current) => !current)}
                        className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground"
                      >
                        {showFullPacket ? "Show compact view" : "Show full packet"}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-card border border-border p-5">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Start Session in Agent</h3>
                    <div className="space-y-2">
                      {["Cursor", "Claude Code", "OpenCode", "LangGraph", "MCP Agent", "Generic Agent"].map(agent => (
                        <button key={agent} onClick={() => handleCopy(`[MemoryOS Context for ${agent}]\n${preflightData.contextPacket}`, `copy-${agent.toLowerCase().replace(' ', '-')}`)} className="w-full text-left px-4 py-3 bg-muted hover:bg-muted/80 transition-colors border border-border flex justify-between items-center group">
                          <span className="text-[12px] font-medium text-foreground group-hover:text-foreground">{agent}</span>
                          <span className="text-[10px] uppercase tracking-widest text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedState === `copy-${agent.toLowerCase().replace(' ', '-')}` ? "Copied" : "Copy"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                       <h3 className="text-[11px] font-bold uppercase tracking-widest text-destructive mb-3">Do Not Do Rules</h3>
                       <ul className="space-y-2">
                         {preflightData.doNotDo?.map((rule: string, i: number) => (
                           <li key={i} className="text-[11px] text-destructive/80 flex gap-2"><span className="text-destructive font-bold">×</span> {rule}</li>
                         ))}
                         {(!preflightData.doNotDo || preflightData.doNotDo.length === 0) && (
                           <li className="text-[11px] text-muted-foreground">No critical restrictions found.</li>
                         )}
                       </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Memories */}
            {activeTab === "memories" && (
              <div className="bg-card border border-border">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase tracking-widest">
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Content</th>
                      <th className="px-5 py-3 font-medium">Why Selected</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preflightData.relevantMemories?.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-muted transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap"><span className="text-[10px] uppercase tracking-widest font-bold bg-muted px-2 py-1 text-foreground">{m.type}</span></td>
                        <td className="px-5 py-4 text-foreground truncate max-w-md">{m.content}</td>
                        <td className="px-5 py-4 text-muted-foreground">{m.whySelected}</td>
                        <td className="px-5 py-4 text-right flex justify-end gap-2">
                          <button className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1">Inspect</button>
                          <button className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1">Promote</button>
                          <button className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border-r border-border pr-3 mr-1">Explore in Graph</button>
                          <button className="text-[10px] uppercase font-bold text-primary hover:text-foreground transition-colors border border-border px-2 py-1">Explain</button>
                        </td>
                      </tr>
                    ))}
                    {(!preflightData.relevantMemories || preflightData.relevantMemories.length === 0) && (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No memories were retrieved for this task.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: Decisions */}
            {activeTab === "decisions" && (
              <div className="bg-card border border-border p-5">
                <div className="space-y-4">
                  {preflightData.decisions?.map((d: any, i: number) => (
                    <div key={i} className="p-4 border-l-2 border-chart-2 bg-muted">
                      <div className="text-[14px] text-foreground font-medium mb-2">{d.decision}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Source: {d.source} • Confidence: {d.confidence * 100}%</div>
                    </div>
                  ))}
                  {(!preflightData.decisions || preflightData.decisions.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">No active decisions recorded for this context.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Blockers */}
            {activeTab === "blockers" && (
              <div className="bg-card border border-border p-5">
                <div className="space-y-4">
                  {preflightData.blockers?.map((b: any, i: number) => (
                    <div key={i} className="p-4 border-l-2 border-destructive bg-muted">
                      <div className="flex justify-between items-start mb-2">
                         <div className="text-[14px] text-foreground font-medium">{b.blocker}</div>
                         <span className="text-[10px] uppercase tracking-widest font-bold bg-destructive/20 text-destructive px-2 py-0.5">{b.severity}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-2">Suggested Fix: {b.suggestedResolution}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Source: {b.source}</div>
                    </div>
                  ))}
                  {(!preflightData.blockers || preflightData.blockers.length === 0) && (
                    <div className="text-center text-chart-2 py-8 font-medium">No active blockers! Clear path forward.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Relevant Files */}
            {activeTab === "files" && (
              <div className="bg-card border border-border">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase tracking-widest">
                      <th className="px-5 py-3 font-medium">File Path</th>
                      <th className="px-5 py-3 font-medium">Reason</th>
                      <th className="px-5 py-3 font-medium text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preflightData.relevantFiles?.map((f: any, i: number) => (
                      <tr key={i} className="hover:bg-muted transition-colors">
                        <td className="px-5 py-4 font-mono text-primary">{f.path}</td>
                        <td className="px-5 py-4 text-foreground">{f.reason}</td>
                        <td className="px-5 py-4 text-right font-mono text-muted-foreground">{(f.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                    {(!preflightData.relevantFiles || preflightData.relevantFiles.length === 0) && (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">No specific files targeted.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: Missing Context */}
            {activeTab === "missing_context" && (
              <div className="bg-card border border-border p-5">
                <div className="space-y-4">
                  {preflightData.missingContext?.map((mc: any, i: number) => (
                    <div key={i} className="p-4 border-l-2 border-chart-5 bg-muted">
                      <div className="text-[14px] text-foreground font-medium mb-2">Missing: {mc.gap ?? mc.topic ?? "Unknown context gap"}</div>
                      <div className="text-[12px] text-muted-foreground mb-2">Impact: {mc.impact ?? mc.reason ?? "Not specified"}</div>
                      <div className="text-[11px] text-chart-5 font-mono mt-2">Suggestion: {mc.suggestion ?? "Add this context to memory contract before execution."}</div>
                    </div>
                  ))}
                  {(!preflightData.missingContext || preflightData.missingContext.length === 0) && (
                    <div className="text-center text-chart-2 py-8 font-medium">No missing context detected. Agent has everything needed.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Generated Rules */}
            {activeTab === "agent_rules" && (
              <div className="space-y-6">
                {/* CLI Snippet */}
                <div className="bg-muted border border-border p-5 relative">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-chart-2 mb-3">CLI Prep Command</h3>
                  <div className="flex justify-between items-center bg-background border border-border px-4 py-3">
                    <code className="text-[12px] font-mono text-foreground">
                      {`memoryos preflight --project ${projectId} --tool ${toolTarget.toLowerCase().replace(" ", "-")} --mode ${mode} --task "${taskDescription}"`}
                    </code>
                    <button onClick={() => handleCopy(`memoryos preflight --project ${projectId} --tool ${toolTarget.toLowerCase().replace(' ', '-')} --mode ${mode} --task "${taskDescription}"`, "copy-cli")} className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors ml-4 shrink-0">
                      {copiedState === "copy-cli" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* File Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    preflightData.generatedRules?.length
                      ? [
                          {
                            name: "AGENTS.md",
                            content: `# MemoryOS Agent Rules\n${preflightData.generatedRules.map((rule: string, index: number) => `${index + 1}. ${rule}`).join("\n")}`,
                          },
                          {
                            name: "memoryos.preflight.rules.txt",
                            content: preflightData.generatedRules.join("\n"),
                          },
                        ]
                      : [
                          {
                            name: "memoryos.preflight.rules.txt",
                            content: "No generated rules returned yet. Run preflight with a concrete task goal.",
                          },
                        ]
                  ).map((file, i) => (
                     <div key={i} className="bg-card border border-border p-5">
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="text-[12px] font-bold font-mono text-foreground">{file.name}</h3>
                           <button onClick={() => handleCopy(file.content, `copy-file-${i}`)} className="text-[10px] uppercase font-bold text-primary hover:text-foreground transition-colors bg-muted border border-border px-3 py-1">
                             {copiedState === `copy-file-${i}` ? "Copied" : "Copy"}
                           </button>
                        </div>
                        <StructuredDataPanel
                          title={file.name}
                          value={showFullRules[file.name] ? file.content : compactText(file.content, 1200)}
                          maxHeightClassName="max-h-56"
                          compactChars={1200}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowFullRules((prev) => ({
                              ...prev,
                              [file.name]: !prev[file.name],
                            }))
                          }
                          className="mt-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground"
                        >
                          {showFullRules[file.name] ? "Show compact view" : "Show full rules"}
                        </button>
                     </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
