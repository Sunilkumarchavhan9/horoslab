"use client";

import React from "react";

export function MemoryStarLogo({ className = "h-5 w-5 text-[#75bf00]", tone }: { className?: string; tone?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

export function MemoryOSIcon({ className = "h-5 w-5 text-[#75bf00]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}

export function MemoryOSFullLogo({
  className = "h-6 w-auto",
  iconColor,
  textColor,
}: {
  className?: string;
  iconColor?: string;
  textColor?: string;
}) {
  return (
    <div className={`flex items-center gap-2 font-mono font-bold text-[#F0EFE2] ${className}`}>
      <MemoryStarLogo className="h-5 w-5 text-[#75bf00]" />
      <span>EPOCH</span>
    </div>
  );
}

export function Float({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function Reveal({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}
