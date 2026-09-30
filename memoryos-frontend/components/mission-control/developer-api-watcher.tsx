"use client";

import React, { useState } from "react";
import { Eye, ShieldAlert, GitCommit, Search, Play, ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, StatusBadge, CodeBlock } from "./developer-shared-components";

// --- Mock Data ---
const PACKAGES = [
 { id: "pkg_1", name: "@stripe/stripe-js", fromVersion: "2.1.0", toVersion: "3.0.0", severity: "Critical", status: "Mission Active" },
 { id: "pkg_2", name: "react-router-dom", fromVersion: "6.4.0", toVersion: "6.22.0", severity: "Warning", status: "Completed" },
 { id: "pkg_3", name: "aws-sdk", fromVersion: "2.1400.0", toVersion: "3.400.0", severity: "Critical", status: "Review Required" }
];

const DIFF_CODE = `@@ -1,5 +1,5 @@
-import { loadStripe } from '@stripe/stripe-js';
+import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';

-const stripePromise = loadStripe(process.env.STRIPE_KEY);
+const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY, {
+ apiVersion: "2023-10-16"
+});`;

export function DeveloperAPIWatcher() {
 const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-2">
 <DeveloperHeader 
 title="API Watcher" 
 description="Dhyra continuously monitors your external dependencies. When breaking changes are detected, migration missions are automatically generated."
 />
 <div className="relative">
 <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
 <input 
 type="text" 
 placeholder="Search dependencies..." 
 className="pl-9 pr-4 py-2 bg-card dark:bg-[#111] border border-border dark:border-white/10 rounded-md text-[13px] outline-none focus:border-[#0f52ff]"
 />
 </div>
 </div>

 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Package</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Update</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Severity</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Migration Status</th>
 </tr>
 </thead>
 <tbody>
 {PACKAGES.map((pkg) => (
 <tr 
 key={pkg.id} 
 onClick={() => setSelectedPackage(pkg)}
 className={cn(
 "border-b border-border dark:border-white/5 last:border-0 cursor-pointer transition-colors",
 selectedPackage.id === pkg.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <td className="px-6 py-3">
 <div className="flex items-center gap-2">
 <span className="text-[13px] font-mono font-medium text-foreground dark:text-[#F0EFE2]">{pkg.name}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <div className="flex items-center gap-1.5 text-[12px] font-mono">
 <span className="text-muted-foreground dark:text-muted-foreground">{pkg.fromVersion}</span>
 <ArrowDownUp className="size-3 text-[#C8C7BA] rotate-90" />
 <span className="text-foreground dark:text-[#F0EFE2] font-semibold">{pkg.toVersion}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <StatusBadge status={pkg.severity} />
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] font-medium text-[#0f52ff]">{pkg.status}</span>
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
 <Eye className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Dependency Inspector</span>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Breaking Change Diff</span>
 <CodeBlock code={DIFF_CODE} language="diff" />
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Impacted Repositories</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-3 text-[13px]">
 <div className="flex items-center justify-between p-2 hover:bg-accent dark:hover:bg-card/5 rounded-md cursor-pointer transition-colors">
 <div className="flex items-center gap-2">
 <GitCommit className="size-4 text-muted-foreground" />
 <span className="font-medium">acme/payments-api</span>
 </div>
 <StatusBadge status="Critical" />
 </div>
 <div className="flex items-center justify-between p-2 hover:bg-accent dark:hover:bg-card/5 rounded-md cursor-pointer transition-colors">
 <div className="flex items-center gap-2">
 <GitCommit className="size-4 text-muted-foreground" />
 <span className="font-medium">acme/frontend-core</span>
 </div>
 <StatusBadge status="Warning" />
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3 mt-4">
 <div className="p-6 rounded-md border border-[#0f52ff]/30 bg-[#0f52ff]/5 flex flex-col items-center justify-center text-center gap-3">
 <ShieldAlert className="size-6 text-[#0f52ff]" />
 <div>
 <h4 className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] mb-1">Generate Migration Mission</h4>
 <p className="text-[12px] text-muted-foreground dark:text-muted-foreground max-w-[250px]">Deploy Claude to automatically upgrade the package and fix type errors across impacted repositories.</p>
 </div>
 <button className="mt-2 px-6 py-2 bg-[#0f52ff] hover:bg-[#0b3ec2] text-[#F0EFE2] rounded-md text-[13px] font-medium transition-colors flex items-center gap-2">
 <Play className="size-3" /> Execute Mission
 </button>
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
