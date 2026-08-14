"use client";

import React, { useState } from "react";
import { Wrench, ChevronRight, Play, Database, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, CodeBlock, ParameterTable, StatusBadge } from "./developer-shared-components";

// --- Mock Data ---
const MCP_GROUPS = [
 {
 name: "Mission Tools",
 icon: Globe,
 tools: [
 { id: "createMission", name: "createMission", desc: "Initialize a new autonomous mission" },
 { id: "abortMission", name: "abortMission", desc: "Force halt a running mission" },
 { id: "getMissionState", name: "getMissionState", desc: "Fetch current execution graph" },
 ]
 },
 {
 name: "Institution Tools",
 icon: Database,
 tools: [
 { id: "queryPolicies", name: "queryPolicies", desc: "Check if an action violates active policies" },
 { id: "allocateBudget", name: "allocateBudget", desc: "Request compute budget for an agent" },
 ]
 },
 {
 name: "Verification Tools",
 icon: Shield,
 tools: [
 { id: "runE2E", name: "runE2ETestSuite", desc: "Execute integration tests in staging" },
 { id: "securityScan", name: "runSecurityScan", desc: "Scan payload for vulnerabilities" },
 ]
 }
];

const PARAMS = [
 { name: "title", type: "string", required: true, description: "The human-readable title of the mission." },
 { name: "repository", type: "string", required: true, description: "The target GitHub repository (e.g. org/repo)." },
 { name: "branch", type: "string", required: false, description: "Specific branch to target. Defaults to main." },
 { name: "autoDeploy", type: "boolean", required: false, description: "Whether to automatically deploy upon verification." },
];

const SCHEMA_JSON = `{
 "$schema": "http://json-schema.org/draft-07/schema#",
 "type": "object",
 "properties": {
 "title": { "type": "string" },
 "repository": { "type": "string" },
 "branch": { "type": "string", "default": "main" },
 "autoDeploy": { "type": "boolean", "default": false }
 },
 "required": ["title", "repository"]
}`;

const MCP_RESPONSE = `{
 "jsonrpc": "2.0",
 "id": "req_88f2a",
 "result": {
 "missionId": "mis_9102b",
 "status": "pending",
 "estimatedCost": "$0.45",
 "assignedAgent": "Claude 3.5 Sonnet"
 }
}`;

export function DeveloperMCP() {
 const [activeTool, setActiveTool] = useState("createMission");

 const renderSidebar = () => (
 <div className="flex flex-col w-full py-6">
 <div className="px-6 mb-6">
 <h2 className="text-[14px] font-semibold text-foreground dark:text-white">Tool Explorer</h2>
 </div>
 
 <div className="flex flex-col gap-6">
 {MCP_GROUPS.map(group => (
 <div key={group.name} className="flex flex-col">
 <div className="flex items-center gap-2 px-6 mb-2 text-muted-foreground dark:text-muted-foreground">
 <group.icon className="size-3.5" />
 <span className="text-[11px] font-bold uppercase tracking-wider">{group.name}</span>
 </div>
 
 <div className="flex flex-col">
 {group.tools.map(tool => (
 <button
 key={tool.id}
 onClick={() => setActiveTool(tool.id)}
 className={cn(
 "flex items-center justify-between px-6 py-2 text-[13px] text-left transition-colors",
 activeTool === tool.id
 ? "bg-muted dark:bg-white/10 text-foreground dark:text-white font-medium border-r-2 border-[#111] dark:border-white"
 : "text-muted-foreground dark:text-[#aaa] hover:bg-accent dark:hover:bg-card/5"
 )}
 >
 {tool.name}
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 );

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[800px]">
 <DeveloperHeader 
 title={activeTool} 
 description="Initialize a new autonomous mission. This tool requires the 'mission:write' capability and will automatically trigger a policy compliance check."
 badge="MCP Tool"
 />

 <div className="flex items-center gap-3 mb-10">
 <StatusBadge status="active" />
 <span className="text-[12px] text-muted-foreground flex items-center gap-1.5"><Shield className="size-3" /> Requires 'mission:write'</span>
 <span className="text-[12px] text-muted-foreground flex items-center gap-1.5"><Globe className="size-3" /> Global Scope</span>
 </div>

 <div className="mb-12">
 <h3 className="text-[15px] font-semibold tracking-tight mb-4">Parameters</h3>
 <ParameterTable parameters={PARAMS} />
 </div>

 <div className="mb-12">
 <h3 className="text-[15px] font-semibold tracking-tight mb-4">JSON Schema</h3>
 <CodeBlock code={SCHEMA_JSON} language="json" />
 </div>
 
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Wrench className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">MCP Inspector</span>
 <button className="ml-auto px-3 py-1.5 bg-[#111] dark:bg-white text-white dark:text-black rounded-md text-[12px] font-medium flex items-center gap-2 hover:opacity-90">
 <Play className="size-3" />
 Execute
 </button>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-6">
 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Call Arguments</span>
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px] font-mono">
 <span className="text-[#0f52ff]">title</span>: "Fix payment gateway timeout"<br/>
 <span className="text-[#0f52ff]">repository</span>: "acme/payments-api"<br/>
 <span className="text-[#0f52ff]">autoDeploy</span>: true
 </div>
 </div>
 
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tool Response</span>
 <span className="text-[11px] font-mono text-emerald-600">85ms</span>
 </div>
 <CodeBlock code={MCP_RESPONSE} language="json" className="bg-card dark:bg-[#111] border-none" />
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
