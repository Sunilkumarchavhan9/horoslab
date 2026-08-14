"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, CheckCircle2, XCircle, Code2, History, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, StatusBadge, CodeBlock } from "./developer-shared-components";

// --- Mock Data ---
const VERIFIERS = [
 { id: "ver_1", name: "Security Audit (Semgrep)", language: "Python", version: "v2.1.0", runs: "12.4k", passRate: "98.2%", status: "Active" },
 { id: "ver_2", name: "E2E Test Suite (Playwright)", language: "TypeScript", version: "v1.4.2", runs: "8.1k", passRate: "92.4%", status: "Active" },
 { id: "ver_3", name: "Compliance Check (SOC2)", language: "Rego", version: "v1.0.0", runs: "145", passRate: "100%", status: "Active" }
];

const CONFIG_CODE = `import { Verifier, Context } from "@epoch/sdk";
import { execSync } from "child_process";

export default class SecurityAudit extends Verifier {
 name = "Security Audit (Semgrep)";
 version = "v2.1.0";

 async execute(ctx: Context) {
 const { repository, prNumber } = ctx.payload;
 
 // Pull target repository
 await ctx.exec(\`git clone \${repository} . \`);
 await ctx.exec(\`gh pr checkout \${prNumber}\`);

 // Run Semgrep CI
 try {
 const output = execSync('semgrep ci --json').toString();
 const results = JSON.parse(output);
 
 if (results.errors.length > 0) {
 return this.fail("Security vulnerabilities detected.", results.errors);
 }
 
 return this.pass("No vulnerabilities found.");
 } catch (e) {
 return this.fail("Semgrep execution failed.", e);
 }
 }
}`;

export function DeveloperVerifiers() {
 const [selectedVerifier, setSelectedVerifier] = useState(VERIFIERS[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-2">
 <DeveloperHeader 
 title="Custom Verifiers" 
 description="Write deterministic verification logic in your preferred language to evaluate autonomous mission outcomes before deployment."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-white dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <Plus className="size-4" />
 Create Verifier
 </button>
 </div>

 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Verifier</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Environment</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Total Runs</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Pass Rate</th>
 </tr>
 </thead>
 <tbody>
 {VERIFIERS.map((verifier) => (
 <tr 
 key={verifier.id} 
 onClick={() => setSelectedVerifier(verifier)}
 className={cn(
 "border-b border-border dark:border-white/5 last:border-0 cursor-pointer transition-colors",
 selectedVerifier.id === verifier.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <td className="px-6 py-3">
 <div className="flex flex-col gap-1">
 <span className="text-[13px] font-medium text-foreground dark:text-white">{verifier.name}</span>
 <span className="text-[11px] font-mono text-muted-foreground dark:text-muted-foreground">{verifier.id}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-2">
 <Code2 className="size-3.5 text-muted-foreground" />
 <span className="text-[12px] font-mono text-foreground/80 dark:text-[#ccc]">{verifier.language}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] font-mono text-foreground dark:text-white">{verifier.runs}</span>
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] font-mono text-emerald-600">{verifier.passRate}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <ShieldCheck className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Configuration Inspector</span>
 <span className="ml-auto px-2 py-0.5 rounded-md bg-muted dark:bg-white/10 text-[11px] font-mono text-foreground dark:text-white">
 {selectedVerifier.version}
 </span>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Source Code</span>
 <button className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
 <Copy className="size-3" /> Copy ID
 </button>
 </div>
 <CodeBlock code={CONFIG_CODE} language="typescript" />
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Version History</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-3 text-[13px]">
 <div className="flex items-center justify-between p-2">
 <div className="flex items-center gap-3">
 <History className="size-4 text-muted-foreground" />
 <span className="font-mono text-foreground dark:text-white font-medium">v2.1.0</span>
 </div>
 <span className="text-[11px] text-muted-foreground">Current</span>
 </div>
 <div className="flex items-center justify-between p-2 border-t border-border dark:border-white/5 opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
 <div className="flex items-center gap-3">
 <History className="size-4 text-muted-foreground" />
 <span className="font-mono text-foreground dark:text-white font-medium">v2.0.1</span>
 </div>
 <span className="text-[11px] text-muted-foreground">Oct 14, 2025</span>
 </div>
 <div className="flex items-center justify-between p-2 border-t border-border dark:border-white/5 opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
 <div className="flex items-center gap-3">
 <History className="size-4 text-muted-foreground" />
 <span className="font-mono text-foreground dark:text-white font-medium">v1.4.0</span>
 </div>
 <span className="text-[11px] text-muted-foreground">Jul 02, 2025</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recent Results</span>
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="size-3.5 text-emerald-600" />
 <span className="text-[12px] font-mono text-emerald-700 dark:text-emerald-400">run_8214a</span>
 </div>
 <span className="text-[11px] font-medium text-emerald-600">PASS</span>
 </div>
 <div className="flex items-center justify-between px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="size-3.5 text-emerald-600" />
 <span className="text-[12px] font-mono text-emerald-700 dark:text-emerald-400">run_82149</span>
 </div>
 <span className="text-[11px] font-medium text-emerald-600">PASS</span>
 </div>
 <div className="flex items-center justify-between px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
 <div className="flex items-center gap-2">
 <XCircle className="size-3.5 text-red-600" />
 <span className="text-[12px] font-mono text-red-700 dark:text-red-400">run_82148</span>
 </div>
 <span className="text-[11px] font-medium text-red-600">FAIL</span>
 </div>
 </div>
 </div>

 </div>
 </div>
 );

 return (
 <SplitViewLayout inspector={renderInspector()}>
 {renderMain()}
 </SplitViewLayout>
 );
}
