import React from "react";

export function SkeletonGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1351 892"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M0 0.5H1351" stroke="url(#paint0_linear_55_3)" strokeDasharray="3 3" />
        <path d="M0 53.5H1351" stroke="url(#paint1_linear_55_3)" strokeDasharray="3 3" />
        <path d="M41 0.5V891.5" stroke="#2D2D2D" strokeDasharray="3 3" />
        <path d="M0 838.5H691" stroke="url(#paint2_linear_55_3)" strokeDasharray="3 3" />
        <path d="M0 891.5H1351" stroke="url(#paint3_linear_55_3)" strokeDasharray="3 3" />
        <path d="M1312 0.5L1312 891.5" stroke="#2D2D2D" strokeDasharray="3 3" />
        <path d="M1351 836.5H1286V891.5" stroke="#2D2D2D" strokeDasharray="3 3" />
        <path d="M421 53.5L421 891.5" stroke="url(#paint4_linear_55_3)" strokeDasharray="3 3" />
        <path d="M691 53.5L691 891.5" stroke="url(#paint5_linear_55_3)" strokeDasharray="3 3" />
        <defs>
          <linearGradient id="paint0_linear_55_3" x1="0" y1="1" x2="1351" y2="1" gradientUnits="userSpaceOnUse">
            <stop offset="0.480769" stopColor="#2D2D2D" />
          </linearGradient>
          <linearGradient id="paint1_linear_55_3" x1="0" y1="54" x2="1351" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0.586538" stopColor="#2D2D2D" />
          </linearGradient>
          <linearGradient id="paint2_linear_55_3" x1="0" y1="839" x2="691" y2="839" gradientUnits="userSpaceOnUse">
            <stop offset="0.480769" stopColor="#2D2D2D" />
          </linearGradient>
          <linearGradient id="paint3_linear_55_3" x1="0" y1="892" x2="1351" y2="892" gradientUnits="userSpaceOnUse">
            <stop offset="0.586538" stopColor="#2D2D2D" />
          </linearGradient>
          <linearGradient id="paint4_linear_55_3" x1="421" y1="53.5" x2="421" y2="891.5" gradientUnits="userSpaceOnUse">
            <stop offset="0.480769" stopColor="#2D2D2D" />
          </linearGradient>
          <linearGradient id="paint5_linear_55_3" x1="691" y1="53.5" x2="691" y2="891.5" gradientUnits="userSpaceOnUse">
            <stop offset="0.480769" stopColor="#2D2D2D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
