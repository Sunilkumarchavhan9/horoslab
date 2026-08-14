import React from "react";

export function SkeletonLoader({ className = "" }: { className?: string }) {
 return (
 <div className={`animate-pulse bg-black/10 rounded-[6px] ${className}`} />
 );
}
