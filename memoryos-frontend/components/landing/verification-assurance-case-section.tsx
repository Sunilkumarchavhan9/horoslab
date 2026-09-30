"use client";

import { Reveal } from "./motion";
import Dither from "@/components/ui/Dither";

export function VerificationAssuranceCaseSection() {
  return (
    <section className="bg-white border-y border-slate-200 text-slate-900 font-sans py-24">
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12 z-10">

        {/* Top Centered Section */}
        <div className="flex flex-col items-center text-center mb-16 mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6">
              Do not let the <span className="text-[#0015FF]">executor</span> <br className="hidden sm:block" />
              grade its own outcome.
            </h2>
            <p className="text-[16px] leading-relaxed text-slate-600 max-w-2xl mx-auto">
              Dhyra separates execution from verification. Every material claim is challenged,
              evidence-linked, and packaged into an inspectable certificate before it can be trusted.
            </p>
          </Reveal>
        </div>

        {/* Bottom Grid: 3 Technical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-200">

          {/* Card 1: Verifiers */}
          <Reveal delay={0.2}>
            <div className="bg-white border-r border-slate-200 overflow-hidden flex flex-col h-full group cursor-pointer">
              <div className="p-6 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    Independent Verifiers <span className="text-slate-500 transition-transform group-hover:translate-x-1">&gt;</span>
                  </h3>
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>

                {/* Code Block Mock */}
                <div className="font-mono text-[12px] leading-loose text-slate-600">
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">1</span> <span><span className="text-pink-600">import</span> <span className="text-slate-900">verifiers</span> <span className="text-pink-600">as</span> <span className="text-slate-900">vf</span></span></div>
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">2</span> <span><span className="text-blue-600">const</span> fact_check = <span className="text-emerald-600">vf.Oracle</span>(</span></div>
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">3</span> <span>&nbsp;&nbsp;&nbsp;&nbsp;claim=<span className="text-yellow-600">"accuracy"</span>,</span></div>
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">4</span> <span>&nbsp;&nbsp;&nbsp;&nbsp;adversarial=<span className="text-pink-600">true</span>,</span></div>
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">5</span> <span>&nbsp;&nbsp;&nbsp;&nbsp;holdout_dataset=dataset,</span></div>
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">6</span> <span>)</span></div>
                  <div className="flex"><span className="text-slate-400 w-6 shrink-0">7</span> <span><span className="text-blue-600">await</span> fact_check.verify(output)</span></div>
                </div>
              </div>
              <div className="p-6 bg-slate-50">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Structural separation of powers. Executors act, verifiers challenge, and the institution cannot mark its own work complete.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Evidence */}
          <Reveal delay={0.3}>
            <div className="bg-white border-r border-slate-200 overflow-hidden flex flex-col h-full group cursor-pointer">
              <div className="p-6 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    Evidence-Linked <span className="text-slate-500 transition-transform group-hover:translate-x-1">&gt;</span>
                  </h3>
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>

                {/* CLI Mock */}
                <div className="font-mono text-[12px] leading-loose text-slate-500">
                  <div className="text-emerald-600">$ dhyra verify \</div>
                  <div className="pl-4">--claim output.accuracy \</div>
                  <div className="pl-4">--evidence ./red_team_logs \</div>
                  <div className="pl-4">--signature crypt_key</div>
                  <br />
                  <div className="text-slate-900 font-medium">&gt; Generating Correctness Certificate...</div>
                  <div className="text-emerald-600">✓ Artifact satisfies defined properties</div>
                  <div className="text-emerald-600">✓ 4 evidence links attached to ledger</div>
                </div>
              </div>
              <div className="p-6 bg-slate-50">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Every consequential mission receives a certificate declaring what was proven, what was contradicted, and what remains unknown.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 3: Negative Evidence */}
          <Reveal delay={0.4}>
            <div className="bg-white overflow-hidden flex flex-col h-full group cursor-pointer">
              <div className="border-b border-slate-100 flex-1 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center p-6 pb-0 mb-6 z-10 bg-white">
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    Counterfactual Lab & Simulation <span className="text-slate-500 transition-transform group-hover:translate-x-1">&gt;</span>
                  </h3>
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>

                <div className="flex-1 w-full h-full relative min-h-[160px]">
                  <div className="absolute inset-0">
                    <Dither
                      waveColor={[0.5176470588235295,0.8,0.08627450980392157]}
                      disableAnimation={false}
                      enableMouseInteraction
                      mouseRadius={0}
                      colorNum={6}
                      pixelSize={3}
                      waveAmplitude={1.2}
                      waveFrequency={4}
                      waveSpeed={0.4}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Test institutional mutations before rollout. Future institutions inherit root causes, verifier additions, and measured fitness.
                </p>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}


