"use client";

import React, { useState, useEffect } from "react";

export function SplitPaneShowcase() {
 const [leftWidth, setLeftWidth] = useState(50);
 const [isDragging, setIsDragging] = useState(false);

 useEffect(() => {
 const handleMouseMove = (e: MouseEvent) => {
 if (!isDragging) return;
 const container = document.getElementById("split-pane-container");
 if (container) {
 const rect = container.getBoundingClientRect();
 const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
 if (newWidth > 20 && newWidth < 80) {
 setLeftWidth(newWidth);
 }
 }
 };
 const handleMouseUp = () => setIsDragging(false);

 if (isDragging) {
 document.addEventListener("mousemove", handleMouseMove);
 document.addEventListener("mouseup", handleMouseUp);
 document.body.style.cursor = 'col-resize';
 document.body.style.userSelect = 'none';
 } else {
 document.body.style.cursor = '';
 document.body.style.userSelect = '';
 }

 return () => {
 document.removeEventListener("mousemove", handleMouseMove);
 document.removeEventListener("mouseup", handleMouseUp);
 };
 }, [isDragging]);

 return (
 <div 
 id="split-pane-container" 
 className="w-full h-[300px] border border-border rounded-[6px] overflow-hidden flex bg-muted relative"
 >
 <div style={{ width: `${leftWidth}%` }} className="h-full bg-card flex flex-col">
 <div className="h-10 border-b border-border flex items-center px-6 font-semibold text-xs text-foreground">
 Explorer
 </div>
 <div className="p-6 text-xs text-foreground/40">
 Left Panel Content
 </div>
 </div>
 
 {/* Resizer Handle */}
 <div 
 className={`w-1 h-full cursor-col-resize relative z-10 flex items-center justify-center group ${isDragging ? 'bg-[#0f52ff]' : 'bg-transparent hover:bg-black/20'} transition-colors`}
 onMouseDown={() => setIsDragging(true)}
 >
 <div className={`w-1 h-8 rounded-full ${isDragging ? 'bg-card' : 'bg-black/20 group-hover:bg-card'} transition-colors`} />
 </div>

 <div style={{ width: `${100 - leftWidth}%` }} className="h-full bg-muted/50 flex flex-col">
 <div className="h-10 border-b border-border flex items-center px-6 font-semibold text-xs text-foreground">
 Editor
 </div>
 <div className="p-6 text-xs text-foreground/40">
 Right Panel Content
 </div>
 </div>
 </div>
 );
}
