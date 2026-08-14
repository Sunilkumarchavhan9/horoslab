import React from "react";

export function RealtimeIndicator({ className = "" }: { className?: string }) {
 return (
 <span className={`relative flex h-2 w-2 ${className}`}>
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f52ff] opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f52ff]"></span>
 </span>
 );
}
