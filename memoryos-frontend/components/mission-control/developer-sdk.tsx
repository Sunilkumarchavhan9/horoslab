"use client";

import React, { useState } from "react";
import { Terminal, Copy, Box, Check, Play, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, CodeBlock } from "./developer-shared-components";

// --- Mock Data ---
const TABS = ["Overview", "Installation", "Authentication", "Examples", "API Reference", "Changelog"];

const INSTALL_NPM = `npm i @epoch/sdk`;
const INSTALL_PY = `pip install epoch-sdk`;
const INSTALL_GO = `go get github.com/epoch/sdk-go`;

const INIT_CODE = `import { Epoch } from '@epoch/sdk';

const epoch = new Epoch({
 apiKey: process.env.EPOCH_API_KEY,
 environment: 'production'
});

// Initialize the reality fabric connection
await epoch.connect();`;

const RESPONSE_JSON = `{
 "status": "connected",
 "client_id": "cli_9f82a3b1",
 "environment": "production",
 "capabilities": [
 "mission:read",
 "mission:write",
 "reality:stream"
 ],
 "latency_ms": 42
}`;

export function DeveloperSDK() {
 const [activeTab, setActiveTab] = useState("Installation");
 const [lang, setLang] = useState<"ts" | "py" | "go">("ts");

 const renderSidebar = () => (
 <div className="flex flex-col w-full px-6 py-8">
 <div className="flex items-center gap-2 px-3 mb-6">
 <Box className="size-5 text-foreground dark:text-[#F0EFE2]" />
 <span className="font-semibold text-foreground dark:text-[#F0EFE2]">Epoch SDK</span>
 </div>
 
 <div className="flex flex-col gap-1">
 {TABS.map(tab => (
 <button 
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "px-3 py-2 rounded-md text-[13px] font-medium text-left transition-colors",
 activeTab === tab 
 ? "bg-muted dark:bg-white/10 text-foreground dark:text-[#F0EFE2]" 
 : "text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-card/5 hover:text-foreground dark:hover:text-[#F0EFE2]"
 )}
 >
 {tab}
 </button>
 ))}
 </div>
 </div>
 );

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[800px]">
 <DeveloperHeader 
 title="Installation" 
 description="Integrate the Epoch runtime directly into your codebase. The SDK provides type-safe access to Missions, Reality Fabric, and Verification endpoints."
 badge="v1.2.4 (Latest)"
 />

 <div className="mb-12">
 <h3 className="text-[15px] font-semibold tracking-tight mb-4">Package Managers</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div 
 onClick={() => setLang("ts")}
 className={cn(
 "p-6 border rounded-md cursor-pointer transition-all",
 lang === "ts" ? "border-black dark:border-white bg-muted dark:bg-white/5" : "border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-card dark:bg-[#111]"
 )}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] font-medium">npm</span>
 <span className="text-[11px] font-mono text-muted-foreground">TypeScript</span>
 </div>
 <CodeBlock code={INSTALL_NPM} language="bash" />
 </div>
 
 <div 
 onClick={() => setLang("py")}
 className={cn(
 "p-6 border rounded-md cursor-pointer transition-all",
 lang === "py" ? "border-black dark:border-white bg-muted dark:bg-white/5" : "border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-card dark:bg-[#111]"
 )}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] font-medium">pip</span>
 <span className="text-[11px] font-mono text-muted-foreground">Python 3.9+</span>
 </div>
 <CodeBlock code={INSTALL_PY} language="bash" />
 </div>

 <div 
 onClick={() => setLang("go")}
 className={cn(
 "p-6 border rounded-md cursor-pointer transition-all",
 lang === "go" ? "border-black dark:border-white bg-muted dark:bg-white/5" : "border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-card dark:bg-[#111]"
 )}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] font-medium">go get</span>
 <span className="text-[11px] font-mono text-muted-foreground">Go 1.20+</span>
 </div>
 <CodeBlock code={INSTALL_GO} language="bash" />
 </div>
 </div>
 </div>

 <div className="mb-12">
 <h3 className="text-[15px] font-semibold tracking-tight mb-4">Quick Start (TypeScript)</h3>
 <p className="text-[14px] text-muted-foreground dark:text-[#aaa] mb-4 leading-relaxed">
 Initialize the client with your organization's API key. This will automatically open a WebSocket multiplex connection to the Reality Fabric, allowing real-time event streaming and mission orchestration.
 </p>
 <CodeBlock code={INIT_CODE} language="typescript" />
 </div>
 
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Terminal className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Live Connection Test</span>
 <button className="ml-auto px-3 py-1.5 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[12px] font-medium flex items-center gap-2 hover:opacity-90">
 <Play className="size-3" />
 Run
 </button>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-6">
 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Request</span>
 <CodeBlock code={INIT_CODE} language="typescript" />
 </div>
 
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Response (200 OK)</span>
 <span className="text-[11px] font-mono text-emerald-600">42ms</span>
 </div>
 <CodeBlock code={RESPONSE_JSON} language="json" className="bg-card dark:bg-[#111] border-none" />
 </div>
 </div>
 </div>
 );

 return (
 <SplitViewLayout 
 sidebar={renderSidebar()} 
 inspector={renderInspector()}
 >
 {renderMain()}
 </SplitViewLayout>
 );
}
