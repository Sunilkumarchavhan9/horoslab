import React from "react";

export function LogViewer({ logs }: { logs: { id: string, timestamp: string, level: "info" | "warn" | "error", message: string }[] }) {
 return (
 <div className="w-full bg-[#1e1e1e] rounded-[6px] border border-border overflow-hidden flex flex-col h-[300px] font-mono text-[12px]">
 <div className="flex items-center px-6 py-2 bg-[#2d2d2d] border-b border-[#404040]">
 <div className="flex gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
 <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
 <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
 </div>
 <div className="mx-auto text-[#858585] text-[11px]">sys.log</div>
 </div>
 <div className="flex-1 overflow-y-auto p-6 space-y-1">
 {logs.map((log) => (
 <div key={log.id} className="flex items-start gap-3 hover:bg-card/5 px-1 py-0.5 rounded">
 <span className="text-[#858585] shrink-0">{log.timestamp}</span>
 <span className={`shrink-0 w-12 ${log.level === 'error' ? 'text-[#ff5f56]' : log.level === 'warn' ? 'text-[#ffbd2e]' : 'text-[#27c93f]'}`}>
 [{log.level.toUpperCase()}]
 </span>
 <span className="text-[#d4d4d4] break-all">{log.message}</span>
 </div>
 ))}
 </div>
 </div>
 );
}
