"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Code2, Download, Copy, BookOpen, Terminal, CheckCircle2, Package
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SdkInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Code2 className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <BookOpen className="size-3.5 mr-2" />
                        Documentation
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Language</span>
                                <span className="text-sm font-medium text-foreground">{entityData.language}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Version</span>
                                <span className="text-sm font-mono font-bold text-foreground">{entityData.version}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Compatibility</span>
                                <span className="text-sm font-medium text-foreground text-xs">{entityData.compatibility}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Published</span>
                                <span className="text-sm font-medium text-foreground font-mono text-xs">{entityData.published}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Installation</span>
                            <div className="flex items-center justify-between p-4 rounded-md bg-[#0d1117] border border-border/50">
                                <div className="flex items-center gap-3">
                                    <Terminal className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-mono text-[#c9d1d9]">
                                        {entityData.language === "TypeScript" ? `npm install ${entityData.sdkName}` : 
                                         entityData.language === "Python" ? `pip install ${entityData.sdkName}` :
                                         entityData.language === "Go" ? `go get ${entityData.sdkName}` :
                                         `cargo add ${entityData.sdkName}`}
                                    </span>
                                </div>
                                <button type="button" onClick={() => void navigator.clipboard?.writeText(entityData.language === "TypeScript" ? `npm install ${entityData.sdkName}` : entityData.language === "Python" ? `pip install ${entityData.sdkName}` : entityData.language === "Go" ? `go get ${entityData.sdkName}` : `cargo add ${entityData.sdkName}`)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy install command">
                                    <Copy className="size-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Integration Resources</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <button type="button" onClick={() => window.open("/api/openapi", "_blank", "noopener,noreferrer")} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Worker Contract</span>
                                        <span className="text-xs text-muted-foreground">View expected schemas for workers</span>
                                    </div>
                                    <Package className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button type="button" onClick={() => void navigator.clipboard?.writeText("Epoch worker contract: register, lease, execute, evidence, complete")} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Runtime APIs</span>
                                        <span className="text-xs text-muted-foreground">Explore underlying endpoint definitions</span>
                                    </div>
                                    <Code2 className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button type="button" onClick={() => window.open("https://www.npmjs.com/package/@epochtm/v12-sdk", "_blank", "noopener,noreferrer")} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Examples</span>
                                        <span className="text-xs text-muted-foreground">Code snippets and quickstarts</span>
                                    </div>
                                    <Terminal className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="docs" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Migration Guide</span>
                                <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        Upgrading to {entityData.version} introduces strict enforcement of the new Worker Contract schema. Ensure all your workers validate payloads before returning data to the runtime.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-medium text-[#0f52ff]">
                                        Read full migration guide &rarr;
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Release Notes</span>
                                <div className="flex flex-col bg-card border border-border rounded-md p-4 gap-3 text-sm">
                                    <div className="flex items-start gap-2 text-foreground/80">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Added support for `priority` flag in mission requests.</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-foreground/80">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Improved error handling for rate limit thresholds (HTTP 429).</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-foreground/80">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Fixed bug causing memory leaks in long-running listeners.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => void navigator.clipboard?.writeText(entityData.installCommand ?? `npm install ${entityData.sdkName}`)} className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                    <Copy className="size-3.5" />
                    Copy Install
                </button>
                <button type="button" onClick={() => window.open("https://www.npmjs.com/package/@epochtm/v12-sdk", "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <BookOpen className="size-3.5" />
                    Documentation
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button type="button" onClick={() => void navigator.clipboard?.writeText("Epoch worker quickstart: register -> lease -> execute -> complete")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Terminal className="size-3.5" />
                    Examples
                </button>
                <button type="button" onClick={() => { const blob = new Blob([JSON.stringify(entityData, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `epoch-sdk-${entityData.version ?? "contract"}.json`; link.click(); URL.revokeObjectURL(link.href); }} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Download className="size-3.5" />
                    Download
                </button>
            </div>
        </Tabs>
    );
}
