"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryOSFullLogo } from "@/components/landing/memoryos-full-logo";
import { HorosLogo } from "@/components/horos/primitives/horos-logo";

const FAQ_ITEMS = [
  {
    question: "What is HOROS?",
    answer: "HOROS is a Frontier Intelligence Engineering System. It connects models, data, context, runtime, compute, workloads, and real-world evidence into one continuous loop for building, testing, verifying, deploying, and evolving intelligence against reality.",
  },
  {
    question: "How does Intelligence Routing work?",
    answer: "Instead of manually orchestrating APIs, HOROS routes your mission through a comprehensive intelligence loop—from capability discovery and simulation to physical world deployment. It automatically composes the best model, data, and compute stack for your specific environment.",
  },
  {
    question: "How do I deploy my first Reality stack?",
    answer: "You define your mission and constraints. HOROS searches the intelligence graph to compose a candidate system, runs it through experimental verification, and upon reaching the required assurance level, deploys the verified pipeline directly to your reality.",
  },
  {
    question: "Which open models are supported?",
    answer: "HOROS integrates with any frontier open model (Llama 3.1, Mistral, Qwen, DeepSeek) through optimized runtimes like vLLM and SGLang. Models are continuously adapted based on real-world evidence and settlement feedback from your deployments.",
  },
  {
    question: "How does deployment optimization work?",
    answer: "HOROS explores your environment against multiple execution paths to automatically build the perfect stack. It optimizes models, caching, and routing across heterogeneous GPU clusters to meet strict latency, cost, and safety boundaries.",
  },
  {
    question: "Can I deploy pipelines as APIs?",
    answer: "Yes. Every verified intelligence pipeline can be deployed as a high-performance, scalable API. HOROS manages the entire lifecycle, from traffic routing and continuous telemetry to capturing real-world evidence for the next learning cycle.",
  },
  {
    question: "How is this different from using closed-source APIs?",
    answer: "Unlike closed APIs that treat your workloads as a black box, HOROS gives you a transparent engineering system. You own the models, the context, and the execution trace—allowing your intelligence to continuously learn and evolve from its own mistakes.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. HOROS is designed for true data sovereignty. Your reality stack can be deployed entirely on-premise or within isolated VPCs. Your private data, context, and telemetry never leave your boundary and are used exclusively to teach your own systems.",
  }
];

export const FaqSection = () => {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <section className="relative w-full py-32 bg-[#151515] overflow-hidden flex flex-col items-center">
      {/* Vertical Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      <div className="w-full flex flex-col items-center relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-4">
            Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs">questions</span>
          </h2>
          <p className="text-[#C8C7BA] text-lg">
            Can't find what you're looking for? <a href="#" className="text-[#75bf00] hover:underline">Get in touch</a>
          </p>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-3 max-w-5xl mb-16">
          {FAQ_ITEMS.map((faq, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFaq(idx)}
              className={`px-4 py-2.5 text-sm md:text-base font-medium transition-colors ${activeFaq === idx
                  ? "bg-[#75bf00] text-black"
                  : "bg-[#1f1f1f] text-[#C8C7BA] hover:bg-[#2a2a2a] hover:text-[#f2efe8]"
                }`}
            >
              {faq.question}
            </button>
          ))}
        </div>

        {/* Dotted line */}
        <div className="w-full max-w-5xl h-px border-t border-dashed border-[#333] mb-12" />

        <div className="flex items-start gap-5 max-w-5xl w-full text-left px-4 md:px-12">
          <div className="mt-2 flex-shrink-0 text-[#C8C7BA] flex items-start justify-center">
            <HorosLogo variant="icon" className="h-6 w-auto" />
          </div>
          <div>
            <motion.h3 
              key={`q-${activeFaq}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[17px] font-bold text-[#f2efe8] mb-3"
            >
              {FAQ_ITEMS[activeFaq].question}
            </motion.h3>
            <motion.p
              key={`a-${activeFaq}`}
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.03 } },
                hidden: {},
              }}
              className="text-[#C8C7BA] text-[16px] leading-relaxed max-w-3xl"
            >
              {FAQ_ITEMS[activeFaq].answer.split(" ").map((word, i) => (
                <span key={i}>
                  <motion.span
                    variants={{
                      visible: { opacity: 1, x: 0 },
                      hidden: { opacity: 0, x: -6 },
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                  {" "}
                </span>
              ))}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};

