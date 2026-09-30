"use client";

import { ArrowUp } from "lucide-react";
import { TokenPromptInput } from "@/components/dhyra/primitives/token-prompt-input";

export function DhyraSecurityTrust() {
  return (
    <section className="w-full flex flex-col pt-20 border-t border-dashed border-[#222]">
      
      {/* Top Half: Security Badges */}
      <div className="flex flex-col mb-32 w-full">
        <h2 className="text-5xl lg:text-[64px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2] mb-16">
          Decision Engine & <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative -ml-1">Governance</span>.
        </h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-0 text-left">
          
          <div className="flex flex-col md:pr-10 lg:pr-12">
            <DataLockIcon size={32} className="mb-5" />
            <h3 className="text-[#F0EFE2] font-medium text-[20px] tracking-tight mb-2">Authority Engine</h3>
            <p className="text-[#888] text-[15px] leading-relaxed">
              Humans own intent and high-impact automation decisions.
            </p>
          </div>

          <div className="flex flex-col md:border-l md:border-dashed border-[#333] md:pl-10 lg:pl-12 md:pr-10 lg:pr-12">
            <WorkspacesGridIcon size={32} className="mb-5" />
            <h3 className="text-[#F0EFE2] font-medium text-[20px] tracking-tight mb-2">Simulation Sandbox</h3>
            <p className="text-[#888] text-[15px] leading-relaxed">
              Simulate and benchmark counterfactuals safely.
            </p>
          </div>

          <div className="flex flex-col md:border-l md:border-dashed border-[#333] md:pl-10 lg:pl-12 md:pr-10 lg:pr-12">
            <NoTrainingBookIcon size={32} className="mb-5" />
            <h3 className="text-[#F0EFE2] font-medium text-[20px] tracking-tight mb-2">Policy & Risk</h3>
            <p className="text-[#888] text-[15px] leading-relaxed">
              Enforce strict risk boundaries automatically.
            </p>
          </div>

          <div className="flex flex-col md:border-l md:border-dashed border-[#333] md:pl-10 lg:pl-12">
            <Soc2FileIcon size={32} className="mb-5" />
            <h3 className="text-[#F0EFE2] font-medium text-[20px] tracking-tight mb-2">Independent Verify</h3>
            <p className="text-[#888] text-[15px] leading-relaxed">
              Verify claims with immutable evidence.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom Half: Request Model CTA */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 py-20 border-t border-dashed border-[#222]">
        
        <div className="w-full md:w-[45%]">
          <h2 className="text-4xl lg:text-[48px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2]">
            If you need a specific<br/>reality surface in <span className="text-[#75bf00]">Dhyra</span>,<br/>describe what you need
          </h2>
        </div>

        <div className="w-full md:w-[55%] min-w-0">
          <TokenPromptInput
            dark={true}
            hideHeader={true}
            showSuggestions={false}
            cardClassName="!bg-[#151515] !border-dashed !border-[#333] !rounded-[2px] w-full"
            onSubmit={(prompt) => console.log("Dhyra request:", prompt)}
          />
        </div>

      </div>

    </section>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function DataLockIcon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17L10 14H14L12 17Z" fill="#75bf00" stroke="#75bf00" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}

function WorkspacesGridIcon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="3" width="7" height="7" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="3" width="7" height="7" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="14" width="7" height="7" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="14" width="7" height="7" fill="#75bf00" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function NoTrainingBookIcon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 3H8C9.5913 3 11.1174 3.63214 12.2426 4.75736C13.3679 5.88258 14 7.4087 14 9V21C14 19.4087 13.3679 17.8826 12.2426 16.7574C11.1174 15.6321 9.5913 15 8 15H2V3Z" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 3H16C14.4087 3 12.8826 3.63214 11.7574 4.75736C10.6321 5.88258 10 7.4087 10 9V21C10 19.4087 10.6321 17.8826 11.7574 16.7574C12.8826 15.6321 14.4087 15 16 15H22V3Z" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 7L9 11M9 7L5 11" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 7L19 11M19 7L15 11" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Soc2FileIcon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 13H16" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 9H10" stroke="#F0EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 18L12 21L19 15" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
