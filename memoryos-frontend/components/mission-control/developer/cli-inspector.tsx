"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Terminal, Download, Copy, BookOpen, Settings, Key, Command, GitPullRequest, Code2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CliInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Terminal className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="commands" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Command className="size-3.5 mr-2" />
                        Commands
                    </TabsTrigger>
                    <TabsTrigger value="auth" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Key className="size-3.5 mr-2" />
                        Configuration
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Platform</span>
                                <span className="text-sm font-medium text-foreground">{entityData.platform}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Version</span>
                                <span className="text-sm font-mono font-bold text-foreground">{entityData.version}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Status</span>
                                <span className={cn(
                                    "text-sm font-medium",
                                    entityData.status === "Stable" ? "text-emerald-500" :
                                    entityData.status === "Beta" ? "text-indigo-500" :
                                    "text-red-500"
                                )}>{entityData.status}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Release Date</span>
                                <span className="text-sm font-medium text-foreground font-mono text-xs">{entityData.release}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Installation</span>
                            <div className="flex flex-col gap-2 p-4 rounded-md bg-[#0d1117] border border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Terminal className="size-4 text-muted-foreground" />
                                        <span className="text-sm font-mono text-[#c9d1d9]">
                                            {entityData.platform === "macOS" ? `brew install epoch-cli@${entityData.version}` : 
                                             entityData.platform === "Linux" ? `curl -sL https://epoch.ai/install.sh | bash` :
                                             entityData.platform === "Windows" ? `winget install Epoch.CLI` :
                                             `docker pull epoch/cli:${entityData.version}`}
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => void navigator.clipboard?.writeText(entityData.installCommand ?? `npm install -g @epochtm/v12-cli@${entityData.version}`)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy CLI install command">
                                        <Copy className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Release Notes</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    The {entityData.version} release introduces enhanced mission tracking natively in the CLI, allowing you to stream execution logs directly to stdout via `epoch mission watch &lt;id&gt;`.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-medium text-[#0f52ff] cursor-pointer hover:underline">
                                    View full changelog &rarr;
                                </div>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="commands" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mission Commands</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <div className="flex flex-col gap-1 p-3">
                                    <span className="text-sm font-mono font-bold text-emerald-400">epoch mission launch</span>
                                    <span className="text-xs text-muted-foreground">Deploys a mission plan to the runtime and begins execution.</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3">
                                    <span className="text-sm font-mono font-bold text-emerald-400">epoch mission watch</span>
                                    <span className="text-xs text-muted-foreground">Streams live execution logs and state transitions for an active mission.</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3">
                                    <span className="text-sm font-mono font-bold text-emerald-400">epoch mission abort</span>
                                    <span className="text-xs text-muted-foreground">Forcefully halts an active mission and initiates recovery protocols.</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Runtime Commands</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <div className="flex flex-col gap-1 p-3">
                                    <span className="text-sm font-mono font-bold text-blue-400">epoch runtime status</span>
                                    <span className="text-xs text-muted-foreground">Checks the health and availability of all institutional runtime services.</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3">
                                    <span className="text-sm font-mono font-bold text-blue-400">epoch policy validate</span>
                                    <span className="text-xs text-muted-foreground">Locally validates a mission plan against institutional governance rules.</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="auth" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authentication</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                                    The CLI requires a governed API Key to interact with the Epoch Runtime. You can authenticate interactively or via environment variables.
                                </p>
                                <div className="flex flex-col gap-1 p-3 rounded bg-[#0d1117] border border-border/50 font-mono text-[11px] text-[#c9d1d9]">
                                    <span>$ epoch login</span>
                                    <span className="text-emerald-500">✔ Authenticated as Alice Chen (ep_live_94x2...)</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3 rounded bg-[#0d1117] border border-border/50 font-mono text-[11px] text-[#c9d1d9] mt-2">
                                    <span className="text-muted-foreground"># Non-interactive / CI environments</span>
                                    <span>export EPOCH_API_KEY="ep_live_94x2..."</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration Profile</span>
                            <div className="flex flex-col bg-card border border-border rounded-md p-4 gap-3 text-sm">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-muted-foreground">Config Location</span>
                                    <span className="font-mono text-xs">~/.epoch/config.json</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-muted-foreground">Default Environment</span>
                                    <span className="font-mono text-xs">production</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Telemetry</span>
                                    <span className="font-mono text-xs">enabled</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => void navigator.clipboard?.writeText(entityData.installCommand ?? `npm install -g @epochtm/v12-cli@${entityData.version}`)} className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                    <Copy className="size-3.5" />
                    Copy Install
                </button>
                <button type="button" onClick={() => void navigator.clipboard?.writeText("epoch-v12 --help")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Download Binary
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button type="button" onClick={() => void navigator.clipboard?.writeText("epoch-v12 missions enqueue --workspace=<workspace> --mission=<mission> --type=execute")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Code2 className="size-3.5" />
                    Copy Example
                </button>
                <button type="button" onClick={() => window.open("https://www.npmjs.com/package/@epochtm/v12-cli", "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <BookOpen className="size-3.5" />
                    View Docs
                </button>
            </div>
        </Tabs>
    );
}
