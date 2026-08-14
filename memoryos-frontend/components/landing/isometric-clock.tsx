import React from "react";
import { Database, Activity, Info } from "lucide-react";

export function IsometricClock() {
  return (
    <div className="relative w-full h-[350px] flex items-center justify-center font-sans mt-4 perspective-1000">
      <div 
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transform: "scale(0.85) rotateX(60deg) rotateZ(45deg)",
          width: "280px",
          height: "280px",
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0 rounded-full border border-slate-200 bg-white"
            style={{
              transform: "translateZ(px)",
              boxShadow: i === 0 ? "0 30px 60px rgba(0,0,0,0.15)" : "none",
            }}
          />
        ))}

        <div 
          className="absolute inset-0 rounded-full bg-white border border-slate-100 flex items-center justify-center"
          style={{ transform: "translateZ(24px)", transformStyle: "preserve-3d" }}
        >
          <div className="absolute inset-4 rounded-full opacity-30" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)", backgroundSize: "12px 12px" }} />
          
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="140" cy="140" r="126" fill="none" stroke="#f8fafc" strokeWidth="16" />
            <circle 
              cx="140" cy="140" r="126" 
              fill="none" 
              stroke="#c084fc"
              strokeWidth="16" 
              strokeDasharray="791"
              strokeDashoffset="250"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
          </svg>
        </div>

        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "translateZ(30px)" }}
        >
          <span className="text-slate-400 text-sm font-semibold mb-1 tracking-wide">Work Duration</span>
          <span 
            className="text-[#0b162c] text-[48px] font-mono font-bold leading-none tracking-tight mb-3" 
            style={{ textShadow: "0px 4px 10px rgba(0,0,0,0.05)" }}
          >
            01:40:52
          </span>
          <span className="text-slate-400 text-sm font-semibold mb-2">Remaining Time</span>
          <div className="bg-purple-100/80 text-purple-700 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
            <Info size={14} /> 6h 19m left today
          </div>
        </div>



      </div>
    </div>
  );
}


