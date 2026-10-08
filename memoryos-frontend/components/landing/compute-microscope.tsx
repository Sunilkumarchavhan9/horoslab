import React from 'react';
import { cn } from "@/lib/utils";

// Helper to generate a deterministic pattern of blocks for a single SM row
const generateBlocks = (isOptimized: boolean, seed: number) => {
  const columns = 25; // number of blocks per row
  const blocks = [];
  
  for (let i = 0; i < columns; i++) {
    // Deterministic pseudo-random generation based on seed and index
    const rand = Math.abs(Math.sin(seed * 100 + i * 10)) * 100;
    const isCompute = isOptimized 
      ? (rand > 15)  // 85% utilization
      : (rand > 85); // 15% utilization
      
    blocks.push(isCompute);
  }
  return blocks;
}

export function ComputeMicroscope() {
  const rows = 8; // SM-00 to SM-07
  
  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 font-mono py-12 select-none relative z-10">
      
      {/* Inline styles for the sliding animation to avoid touching tailwind config */}
      <style>{`
        @keyframes slideLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Left: Unoptimized */}
      <div className="flex-1 flex flex-col xl:flex-row items-end xl:items-center gap-6 w-full max-w-xl lg:max-w-none">
        
        {/* Desktop Text (Left aligned in its column) */}
        <div className="hidden xl:block text-right shrink-0 min-w-[160px]">
          <div className="font-bold text-[#F0EFE2] mb-1">Most GPUs today</div>
          <div className="text-[#C8C7BA] text-xs">Idle cycles, memory<br/>stalls, unoptimized<br/>ops</div>
        </div>
        
        {/* Mobile/Tablet Text (Top aligned) */}
        <div className="xl:hidden text-left w-full">
          <div className="font-bold text-[#F0EFE2] mb-1">Most GPUs today</div>
          <div className="text-[#C8C7BA] text-xs">Idle cycles, memory stalls, unoptimized ops</div>
        </div>
        
        <div className="flex flex-col gap-[2px] w-full bg-[#0a0a0a] border border-[#222] p-5 rounded-md relative overflow-hidden">
          <div className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-4">Unoptimized Kernel</div>
          
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-3 h-[18px]">
              <span className="text-[10px] text-[#444] w-8 shrink-0">SM-{rowIndex.toString().padStart(2, '0')}</span>
              <div className="flex-1 flex h-full relative overflow-hidden">
                <div 
                  className="absolute inset-0 flex gap-[2px] w-[200%]"
                  style={{ animation: 'slideLeft 12s linear infinite' }}
                >
                  {/* Render twice for seamless infinite scroll */}
                  {[...generateBlocks(false, rowIndex + 1), ...generateBlocks(false, rowIndex + 1)].map((isCompute, colIndex) => (
                    <div 
                      key={colIndex} 
                      className={cn(
                        "flex-1 h-full rounded-[1px]",
                        isCompute ? "bg-[#75bf00]" : "bg-[#1a1a1a]"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[11px]">
            <span className="text-[#C8C7BA]">~16% utilized · <span className="text-[#F0EFE2]">$840K wasted</span> per $1M</span>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#75bf00] rounded-[1px]" /> <span className="text-[#555]">compute</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#1a1a1a] rounded-[1px] border border-[#333]" /> <span className="text-[#555]">idle</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Center: The Optimizer Engine */}
      <div className="shrink-0 flex items-center justify-center relative py-8 lg:py-0">
        <div className="w-32 h-24 bg-[#111] border border-[#333] shadow-[0_0_30px_rgba(117,191,0,0.05)] rounded-md flex flex-col items-center justify-center relative z-10">
          <div className="text-[#75bf00] font-bold text-[10px] tracking-widest mb-1">HOROS COMPILER</div>
          <div className="text-[9px] text-[#666] text-center px-4 leading-relaxed">optimized kernels for your GPU setup</div>
        </div>
        
        {/* Desktop connection arrows */}
        <div className="hidden lg:block absolute left-[-2rem] top-1/2 -translate-y-1/2 w-8 h-[1px] bg-[#333]">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-[#333]" />
        </div>
        <div className="hidden lg:block absolute right-[-2rem] top-1/2 -translate-y-1/2 w-8 h-[1px] bg-[#333]">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-[#333]" />
        </div>
        
        {/* Mobile connection arrows */}
        <div className="block lg:hidden absolute top-[-1rem] left-1/2 -translate-x-1/2 w-[1px] h-4 bg-[#333]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#333]" />
        </div>
        <div className="block lg:hidden absolute bottom-[-1rem] left-1/2 -translate-x-1/2 w-[1px] h-4 bg-[#333]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#333]" />
        </div>
      </div>

      {/* Right: Optimized */}
      <div className="flex-1 flex flex-col xl:flex-row-reverse items-start xl:items-center gap-6 w-full max-w-xl lg:max-w-none">
        
        {/* Desktop Text */}
        <div className="hidden xl:block text-left shrink-0 min-w-[160px]">
          <div className="font-bold text-[#75bf00] mb-1">After HOROS</div>
          <div className="text-[#C8C7BA] text-xs">Every cycle counts.<br/>Max throughput,<br/>minimal waste</div>
        </div>

        {/* Mobile Text */}
        <div className="xl:hidden text-left w-full">
          <div className="font-bold text-[#75bf00] mb-1">After HOROS</div>
          <div className="text-[#C8C7BA] text-xs">Every cycle counts. Max throughput, minimal waste</div>
        </div>

        <div className="flex flex-col gap-[2px] w-full bg-[#0a0a0a] border border-[#222] p-5 rounded-md relative overflow-hidden shadow-[0_0_40px_rgba(117,191,0,0.05)]">
          <div className="text-[10px] text-[#75bf00] uppercase tracking-wider font-bold mb-4">Optimized Kernel</div>
          
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-3 h-[18px]">
              <span className="text-[10px] text-[#444] w-8 shrink-0">SM-{rowIndex.toString().padStart(2, '0')}</span>
              <div className="flex-1 flex h-full relative overflow-hidden">
                <div 
                  className="absolute inset-0 flex gap-[2px] w-[200%]"
                  style={{ animation: 'slideLeft 6s linear infinite' }} // Faster animation for optimized
                >
                  {[...generateBlocks(true, rowIndex + 10), ...generateBlocks(true, rowIndex + 10)].map((isCompute, colIndex) => (
                    <div 
                      key={colIndex} 
                      className={cn(
                        "flex-1 h-full rounded-[1px]",
                        isCompute ? "bg-[#75bf00] shadow-[0_0_3px_rgba(117,191,0,0.3)]" : "bg-[#1a1a1a]"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center justify-between text-[11px]">
            <span className="text-[#75bf00] font-bold">~88% utilized · <span className="text-[#F0EFE2]">$720K saved</span> per $1M</span>
          </div>
        </div>
      </div>

    </div>
  );
}
