"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";

export function ContactForm() {
  const [areas, setAreas] = useState<string[]>([]);

  const toggleArea = (area: string) => {
    setAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const [topicOpen, setTopicOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  const topicOptions = [
    { value: "general", label: "General inquiry" },
    { value: "support", label: "Technical support" },
    { value: "sales", label: "Sales" },
    { value: "partnership", label: "Partnership" }
  ];

  const areaOptions = [
    "Pipeline Building",
    "Model Optimization",
    "GPU Hosting",
    "Enterprise / Custom SLA",
    "Other"
  ];

  return (
    <div className="w-full max-w-[640px] pt-12 pb-24 text-[#A0A0A0]">
      
      {/* Header */}
      <h1 className="text-xl md:text-2xl lg:text-[28px] sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-[#C8C7BA] mb-12 whitespace-nowrap mt-8">
        Get in <span className="bg-[#75bf00] text-black px-2">touch</span> with the team.
      </h1>
      <p className="text-[14px] md:text-[15px] lg:text-[16px] leading-relaxed mb-16 max-w-[480px] text-[#C8C7BA]">
        Drop a note and we will route it to the right person. Most inquiries get a reply within a few hours.
      </p>

      {/* Form */}
      <form className="flex flex-col gap-10 font-sans" onSubmit={(e) => e.preventDefault()}>
        
        {/* Name */}
        <div className="flex flex-col">
          <label className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] mb-2 flex gap-1">
            Name <span className="text-[#75bf00]">*</span>
          </label>
          <input 
            type="text" 
            placeholder="Jane Smith"
            className="w-full bg-transparent border-b border-[#333] pb-3 text-[#C8C7BA] placeholder-[#555] outline-none focus:border-[#75bf00] transition-colors"
          />
        </div>

        {/* Company */}
        <div className="flex flex-col">
          <label className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] mb-2 flex gap-1">
            Company
          </label>
          <input 
            type="text" 
            placeholder="Acme Inc."
            className="w-full bg-transparent border-b border-[#333] pb-3 text-[#C8C7BA] placeholder-[#555] outline-none focus:border-[#75bf00] transition-colors"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] mb-2 flex gap-1">
            Email <span className="text-[#75bf00]">*</span>
          </label>
          <input 
            type="email" 
            placeholder="jane@acme.com"
            className="w-full bg-transparent border-b border-[#333] pb-3 text-[#C8C7BA] placeholder-[#555] outline-none focus:border-[#75bf00] transition-colors"
          />
        </div>

        {/* Custom Topic Select */}
        <div className="flex flex-col relative z-20">
          <label className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] mb-2 flex gap-1">
            What can we help with?
          </label>
          
          <div 
            onClick={() => setTopicOpen(!topicOpen)}
            className={`w-full bg-transparent border-b pb-3 cursor-pointer flex justify-between items-center transition-colors ${topicOpen ? 'border-[#75bf00]' : 'border-[#333] hover:border-[#555]'}`}
          >
            <span className={selectedTopic ? "text-[#C8C7BA]" : "text-[#C8C7BA]"}>
              {selectedTopic ? topicOptions.find(o => o.value === selectedTopic)?.label : "Select one"}
            </span>
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-200 ${topicOpen ? "rotate-180 text-[#75bf00]" : "text-[#666]"}`} 
            />
          </div>

          {topicOpen && (
            <>
              {/* Invisible overlay to catch outside clicks */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setTopicOpen(false)} 
              />
              {/* Dropdown Menu */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-[#333] rounded-[2px] shadow-2xl z-50 py-1 overflow-hidden"
              >
                {topicOptions.map(opt => (
                  <div 
                    key={opt.value}
                    onClick={() => {
                      setSelectedTopic(opt.value);
                      setTopicOpen(false);
                    }}
                    className={`px-4 py-3 text-[12px] md:text-[13px] lg:text-[14px] cursor-pointer transition-colors ${
                      selectedTopic === opt.value 
                        ? "text-[#75bf00] bg-[#1a2e00]/50" 
                        : "text-[#C8C7BA] hover:bg-[#2a2a2a] hover:text-[#C8C7BA]"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </div>

        {/* Areas of Interest (Pills) */}
        <div className="flex flex-col gap-3 mt-4">
          <label className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA]">
            Which areas are you interested in?
          </label>
          <div className="flex flex-wrap gap-2">
            {areaOptions.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 text-[11px] md:text-[12px] lg:text-[13px] rounded-[2px] transition-all border ${
                  areas.includes(area)
                    ? 'border-[#75bf00] text-[#75bf00] bg-[#1a2e00] shadow-[0_0_10px_rgba(117,191,0,0.1)]'
                    : 'border-[#333] text-[#C8C7BA] hover:border-[#666] hover:text-[#C8C7BA] bg-transparent'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="flex flex-col mt-4">
          <label className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] mb-2 flex gap-1">
            Tell us more <span className="text-[#75bf00]">*</span>
          </label>
          <textarea 
            placeholder="Describe your project, timeline, and any specific requirements..."
            rows={4}
            className="w-full bg-transparent border-b border-[#333] pb-3 text-[#C8C7BA] placeholder-[#555] outline-none focus:border-[#75bf00] transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button 
            type="submit"
            className="group flex items-center gap-2 bg-[#75bf00] text-black px-6 py-3 font-medium text-[12px] md:text-[13px] lg:text-[14px] hover:bg-[#86d900] transition-colors rounded-[2px]"
          >
            Submit
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </form>

    </div>
  );
}
