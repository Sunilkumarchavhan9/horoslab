import { CalculatorResults } from "@/components/landing/calculator-results";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PixelFilter } from "@/components/horos/primitives/pixel-filter";

export default async function CalculatorResultPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const model = (params.model as string) || "Qwen/Qwen3-0.6B";
  const gpu = (params.gpu as string) || "NVIDIA H100 SXM 80 GB";
  const requests = (params.requests as string) || "50,000";
  const quant = (params.quant as string) || "FP16";
  const util = (params.util as string) || "30%";
  const input = (params.input as string) || "512";
  const output = (params.output as string) || "128";
  const units = (params.units as string) || "1";
  const context = (params.context as string) || "8192";

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#F0EFE2] font-sans flex flex-col">
      <PixelFilter />

      {/* Background Dashed Lines - Global Layout */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Inner Lines (Desktop Only) */}
        <div className="hidden md:block absolute left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      <div className="relative z-10 flex flex-col w-full min-h-screen">
        <div className="w-full border-b border-dashed border-[#333] flex justify-center">
          <div className="w-full">
            <LandingNavbar />
          </div>
        </div>

        <main className="flex-grow flex flex-col w-full relative z-10">
          <CalculatorResults
            model={model}
            gpu={gpu}
            quantization={quant}
            utilization={util}
            requestsPerDay={requests}
            inputTokens={input}
            outputTokens={output}
            units={units}
            maxContext={context}
          />
        </main>

        <FooterCtaSection />
      </div>
    </div>
  );
}
