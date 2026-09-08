import React from "react";
import { cn } from "@/lib/utils";
import { 
  MetaLogo, 
  GoogleLogo, 
  NvidiaLogo, 
  MistralLogo, 
  DeepSeekLogo,
  OpenAILogo
} from "@/components/epoch/primitives/brand-icons";

interface FloatingBrandGridProps {
  className?: string;
  pattern: "top-left" | "bottom-right";
}

export function FloatingBrandGrid({ className, pattern }: FloatingBrandGridProps) {
  // We'll define a 5x5 grid.
  // The pattern determines which cells have borders and which have logos.
  
  // A cell can be empty (just border), or contain a logo.
  const renderCell = (id: string, logo?: React.ReactNode, hasBg: boolean = false, hasBorder: boolean = true) => (
    <div 
      key={id} 
      className={cn(
        "w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center transition-all duration-700",
        hasBorder ? "border-r border-b border-dashed border-[#222]" : "",
        hasBg ? "bg-[#222222] shadow-[0_0_15px_rgba(0,0,0,0.5)]" : "bg-transparent",
        logo ? "opacity-90 hover:opacity-100 scale-100" : "opacity-50"
      )}
    >
      {logo && (
        <div className="scale-125 sm:scale-150">
          {logo}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("absolute pointer-events-none select-none z-0", className)}>
      <div className="flex flex-col border-t border-l border-dashed border-[#222]">
        
        {pattern === "top-left" && (
          <>
            <div className="flex">
              {renderCell("tl-0-0", null, false, true)}
              {renderCell("tl-0-1", null, false, true)}
              {renderCell("tl-0-2", <DeepSeekLogo size={20} />, true, true)}
              {renderCell("tl-0-3", null, false, true)}
              {renderCell("tl-0-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("tl-1-0", <MetaLogo size={20} />, true, true)}
              {renderCell("tl-1-1", null, false, true)}
              {renderCell("tl-1-2", null, false, true)}
              {renderCell("tl-1-3", <NvidiaLogo size={20} />, true, true)}
              {renderCell("tl-1-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("tl-2-0", null, false, true)}
              {renderCell("tl-2-1", <GoogleLogo size={20} />, true, true)}
              {renderCell("tl-2-2", null, false, true)}
              {renderCell("tl-2-3", null, false, true)}
              {renderCell("tl-2-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("tl-3-0", null, false, true)}
              {renderCell("tl-3-1", null, false, true)}
              {renderCell("tl-3-2", <MistralLogo size={20} />, true, true)}
              {renderCell("tl-3-3", null, false, true)}
              {renderCell("tl-3-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("tl-4-0", null, false, true)}
              {renderCell("tl-4-1", null, false, true)}
              {renderCell("tl-4-2", null, false, true)}
              {renderCell("tl-4-3", null, false, true)}
              {renderCell("tl-4-4", null, false, true)}
            </div>
          </>
        )}

        {pattern === "bottom-right" && (
          <>
            <div className="flex">
              {renderCell("br-0-0", null, false, true)}
              {renderCell("br-0-1", null, false, true)}
              {renderCell("br-0-2", null, false, true)}
              {renderCell("br-0-3", <OpenAILogo size={20} />, true, true)}
              {renderCell("br-0-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("br-1-0", null, false, true)}
              {renderCell("br-1-1", <GoogleLogo size={20} />, true, true)}
              {renderCell("br-1-2", null, false, true)}
              {renderCell("br-1-3", null, false, true)}
              {renderCell("br-1-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("br-2-0", null, false, true)}
              {renderCell("br-2-1", null, false, true)}
              {renderCell("br-2-2", <MetaLogo size={20} />, true, true)}
              {renderCell("br-2-3", null, false, true)}
              {renderCell("br-2-4", <NvidiaLogo size={20} />, true, true)}
            </div>
            <div className="flex">
              {renderCell("br-3-0", <MistralLogo size={20} />, true, true)}
              {renderCell("br-3-1", null, false, true)}
              {renderCell("br-3-2", null, false, true)}
              {renderCell("br-3-3", null, false, true)}
              {renderCell("br-3-4", null, false, true)}
            </div>
            <div className="flex">
              {renderCell("br-4-0", null, false, true)}
              {renderCell("br-4-1", null, false, true)}
              {renderCell("br-4-2", null, false, true)}
              {renderCell("br-4-3", null, false, true)}
              {renderCell("br-4-4", <DeepSeekLogo size={20} />, true, true)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
