"use client";

import { useState } from "react";
import { MemoryOSFullLogo } from "@/components/landing/memoryos-full-logo";

const FAQ_ITEMS = [
  {
    question: "What is Epoch?",
    answer: "Epoch is the Reality Intelligence Runtime. We teach intelligent systems to decode reality, explore unknowns, autonomously experiment across hardware, and deliver verified production results.",
  },
  {
    question: "How does Intelligence Routing work?",
    answer: "Instead of manually calling specific model APIs, you send intent to the Epoch runtime. It continuously adapts models to your physical environment and routes tasks to the best adapted intelligence for the job.",
  },
  {
    question: "How do I deploy my first Reality stack?",
    answer: "Simply enter your intent and constraints in the Composer. Epoch will automatically discover the necessary capabilities, simulate hypotheses, and deploy a verified stack.",
  },
  {
    question: "Which open models are supported?",
    answer: "We support all major open models including Llama 3.1, Mistral, Qwen, DeepSeek, and specialized physical models, continuously updating as new state-of-the-art weights are released.",
  },
  {
    question: "How does deployment optimization work?",
    answer: "Epoch explores your specific environment against multiple execution runtimes to automatically build the perfect stack, optimizing for latency, cost, and safety boundaries.",
  },
  {
    question: "Can I deploy pipelines as APIs?",
    answer: "Yes, every optimized pipeline can be instantly deployed as a scalable REST API or exported as a containerized stack for your own infrastructure.",
  },
  {
    question: "How is this different from using closed-source APIs?",
    answer: "You get the same effortless developer experience as closed APIs, but with complete ownership of the model, transparent pricing, and no vendor lock-in.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We offer isolated GPU infrastructure, end-to-end encryption, and guarantee that your data is never used for training.",
  }
];

export const FaqSection = () => {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <section className="relative w-full py-32 bg-[#151515] overflow-hidden flex flex-col items-center border-t border-dashed border-[#333]">
      {/* Vertical Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[6%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[94%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
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

        {/* Answer Content */}
        <div className="flex items-start gap-5 max-w-5xl w-full text-left px-4 md:px-12">
          <div className="mt-1 flex-shrink-0 text-[#C8C7BA] bg-[#1f1f1f] p-2 rounded-md flex items-center justify-center h-10 w-10">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#f2efe8] mb-3">
              {FAQ_ITEMS[activeFaq].question}
            </h3>
            <p className="text-[#C8C7BA] text-[16px] leading-relaxed max-w-3xl">
              {FAQ_ITEMS[activeFaq].answer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
