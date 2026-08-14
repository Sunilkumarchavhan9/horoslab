"use client";

import React from 'react';

const purpleGradient = [
  "#1e1b4b", "#312e81", "#818cf8", "#e0e7ff", "#4338ca", 
  "#1e1b4b", "#3730a3", "#c7d2fe", "#e0e7ff", "#312e81", "#1e1b4b"
];
const greenGradient = [
  "#064e3b", "#065f46", "#34d399", "#d1fae5", "#10b981", 
  "#064e3b", "#059669", "#a7f3d0", "#d1fae5", "#065f46", "#064e3b"
];
const cyanGradient = [
  "#164e63", "#155e75", "#22d3ee", "#cffafe", "#06b6d4", 
  "#164e63", "#0891b2", "#a5f3fc", "#cffafe", "#155e75", "#164e63"
];

const renderIsometricBase = (label: string, gradientColors: string[], strokeColor: string) => {
  const gradientId = `stack-grad-${label}`;
  return (
    <svg viewBox="0 0 200 150" className="w-[100px] h-auto overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="-80" y1="50" x2="80" y2="-120" gradientUnits="userSpaceOnUse">
          {gradientColors.map((c, i) => (
            <stop key={i} offset={`${(i / (gradientColors.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        <clipPath id={`stack-clip-${label}`}>
          <rect x="-60" y="-60" width="120" height="120" rx="12" transform="scale(1, 0.5) rotate(45)" />
        </clipPath>
      </defs>
      
      <g transform="translate(100, 90)">
        {/* Side wall */}
        <rect x="-79.88" y="-15" width="159.76" height="16" fill={`url(#${gradientId})`} />
        {/* Bottom face */}
        <g clipPath={`url(#stack-clip-${label})`}>
          <rect x="-100" y="0" width="200" height="100" fill={`url(#${gradientId})`} />
        </g>
        {/* Top face */}
        <g transform="translate(0, -15) scale(1, 0.5) rotate(45)">
          <rect x="-60" y="-60" width="120" height="120" rx="12" fill="white" stroke={strokeColor} strokeWidth="2.5" />
          <g transform="rotate(-45)">
            <text x="0" y="6" textAnchor="middle" fontSize="24" fontWeight="900" fill={strokeColor} letterSpacing="1">
              {label}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
};

export function TrustedStackSection() {
  const stacks = [
    {
      label: "VITE",
      colors: purpleGradient,
      stroke: "#4f46e5",
      downloads: "147m+",
      stars: "81.8k"
    },
    {
      label: "VITEST",
      colors: greenGradient,
      stroke: "#10b981",
      downloads: "67m+",
      stars: "16.8k"
    },
    {
      label: "OXC",
      colors: cyanGradient,
      stroke: "#06b6d4",
      downloads: "10m+",
      stars: "21.8k"
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-[32px] font-medium text-slate-900 mb-4 tracking-tight">A trusted stack to standardize on</h2>
        <p className="text-[19px] text-slate-500 mb-16 max-w-[600px] leading-relaxed">
          Vite+ is built on established open source industry standards, and maintained by the same experts behind these projects.
        </p>

        <div className="flex flex-col gap-10">
          {stacks.map((item, idx) => (
            <div key={idx} className="flex items-center gap-10">
              {/* Icon */}
              <div className="w-[120px] flex justify-center">
                {renderIsometricBase(item.label, item.colors, item.stroke)}
              </div>
              
              {/* Divider 1 */}
              <div className="h-12 w-px bg-slate-200"></div>

              {/* Data Column 1 */}
              <div className="w-[240px]">
                <div className="text-[22px] font-medium text-slate-900 mb-1">{item.downloads}</div>
                <div className="text-[16px] text-slate-500">Weekly npm downloads</div>
              </div>

              {/* Divider 2 */}
              <div className="h-12 w-px bg-slate-200"></div>

              {/* Data Column 2 */}
              <div className="flex-1">
                <div className="text-[22px] font-medium text-slate-900 mb-1">{item.stars}</div>
                <div className="text-[16px] text-slate-500">GitHub stars</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



