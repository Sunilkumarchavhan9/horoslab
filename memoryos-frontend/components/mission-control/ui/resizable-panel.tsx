import React from "react";
import { ResizablePanelGroup, ResizablePanel as BaseResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export function ResizablePanel({ children, leftPanel, rightPanel }: { children?: React.ReactNode, leftPanel: React.ReactNode, rightPanel: React.ReactNode }) {
 return (
 <ResizablePanelGroup orientation="horizontal" className="w-full rounded-[6px] border border-border overflow-hidden bg-card">
 <BaseResizablePanel defaultSize={25} minSize={15}>
 <div className="h-full bg-black/[0.01]">
 {leftPanel}
 </div>
 </BaseResizablePanel>

 <ResizableHandle withHandle />

 <BaseResizablePanel defaultSize={75}>
 <div className="h-full p-6">
 {rightPanel}
 </div>
 </BaseResizablePanel>
 </ResizablePanelGroup>
 );
}
