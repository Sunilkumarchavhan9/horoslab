import React from "react";

interface DashedSectionProps {
  children: React.ReactNode;
  /** Add a horizontal dashed border at the top of the section */
  borderTop?: boolean;
  /** Add a horizontal dashed border at the bottom of the section */
  borderBottom?: boolean;
  /** Inner content background color class, default: bg-[#151515] */
  bgClass?: string;
  /** Additional wrapper class name */
  className?: string;
}

export function DashedSection({
  children,
  borderTop = false,
  borderBottom = false,
  bgClass = "bg-[#151515]",
  className = ""
}: DashedSectionProps) {
  return (
    <div className={`w-full relative z-10 ${className}`}>
      {/* Horizontal Borders */}
      {borderTop && (
        <div className="absolute top-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />
      )}
      {borderBottom && (
        <div className="absolute bottom-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />
      )}

      {/* Double Vertical Borders & Crosshairs */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="w-full h-full grid grid-cols-[14%_72%_14%] relative">
          {/* Left Margin relative wrapper */}
          <div className="relative h-full">
            {/* Masking strip to hide single global background line under the border */}
            <div className="absolute top-[10px] bottom-[10px] right-[-1px] w-[2px] bg-[#151515] z-10" />
            {/* Double Vertical Border Left (outer line on 14% borderline, inner line pushed inside 10px) */}
            <div className="absolute top-[10px] bottom-[10px] right-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />

            {/* Top Crosshairs */}
            {borderTop && (
              <>
                <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                <div className="absolute top-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
              </>
            )}
            
            {/* Bottom Crosshairs */}
            {borderBottom && (
              <>
                <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] translate-y-[1px]" />
              </>
            )}
          </div>

          <div />

          {/* Right Margin relative wrapper */}
          <div className="relative h-full">
            {/* Masking strip to hide single global background line under the border */}
            <div className="absolute top-[10px] bottom-[10px] left-[-1px] w-[2px] bg-[#151515] z-10" />
            {/* Double Vertical Border Right (outer line on 86% borderline, inner line pushed inside 10px) */}
            <div className="absolute top-[10px] bottom-[10px] left-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />

            {/* Top Crosshairs */}
            {borderTop && (
              <>
                <div className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
              </>
            )}
            
            {/* Bottom Crosshairs */}
            {borderBottom && (
              <>
                <div className="absolute bottom-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full grid grid-cols-[14%_72%_14%] relative z-10">
        <div />
        <div className={`min-w-0 ${bgClass} mx-[10px] border-l border-r border-dashed border-[#333]`}>
          {children}
        </div>
        <div />
      </div>
    </div>
  );
}
