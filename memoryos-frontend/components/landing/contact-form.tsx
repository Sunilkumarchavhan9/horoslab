"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, ChevronRight, Check, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [topicOpen, setTopicOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Model APIs"]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTopicOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const topicOptions = [
    "General inquiry",
    "Technical support",
    "Sales",
    "Partnership",
  ];

  const areaOptions = [
    "Model APIs",
    "Coding plan",
    "Enterprise or custom SLA",
    "Startups program",
    "Other",
  ];

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return;

    setIsSubmitting(true);
    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-[620px] py-16">
        <div className="border border-dashed border-[#75bf00] bg-[#16200a]/50 p-8 rounded-[4px] flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 text-[#75bf00]">
            <CheckCircle2 size={20} />
            <span className="font-mono text-sm uppercase tracking-wider font-semibold">
              Message Routed Successfully
            </span>
          </div>
          <h2 className="text-2xl font-medium text-[#F0EFE2]">
            Thank you, {name || "there"}.
          </h2>
          <p className="text-[14px] text-[#C8C7BA] leading-relaxed">
            Your note has been received and routed to our team. Most inquiries get a reply within a few hours to{" "}
            <span className="text-[#F0EFE2] font-mono">{email}</span>.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setName("");
              setCompany("");
              setEmail("");
              setSelectedTopic("");
              setSelectedAreas(["Model APIs"]);
              setMessage("");
            }}
            className="mt-4 px-4 py-2 border border-dashed border-[#444444] text-[#C8C7BA] hover:text-[#F0EFE2] hover:border-[#75bf00] text-xs font-mono rounded-[2px] transition-colors"
          >
            ← Send another note
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] pt-4 pb-20 text-[#A0A0A0]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-medium tracking-tight text-[#F0EFE2] leading-tight mb-4">
          Get in{" "}
          <span className="bg-[#75bf00] text-black px-2.5 py-0.5 rounded-[2px] font-medium leading-none inline-block">
            touch
          </span>{" "}
          with the team.
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#A8A79D] leading-relaxed max-w-xl">
          Drop a note and we will route it to the right person. Most inquiries get a reply within a few hours.
        </p>
      </div>

      {/* Required fields indicator */}
      <p className="text-[12px] text-[#777777] font-sans mb-8">
        Fields marked * are required.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-9 font-sans">
        {/* Name Field */}
        <div className="flex flex-col">
          <label className="text-[13px] text-[#F0EFE2] font-medium mb-1.5 flex items-center">
            Name <span className="text-[#75bf00] ml-1">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-transparent border-b border-[#333333] py-2 text-[14px] text-[#F0EFE2] placeholder-[#555555] outline-none focus:border-[#75bf00] transition-colors"
          />
        </div>

        {/* Company Field */}
        <div className="flex flex-col">
          <label className="text-[13px] text-[#F0EFE2] font-medium mb-1.5">
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="w-full bg-transparent border-b border-[#333333] py-2 text-[14px] text-[#F0EFE2] placeholder-[#555555] outline-none focus:border-[#75bf00] transition-colors"
          />
        </div>

        {/* Email Field */}
        <div className="flex flex-col">
          <label className="text-[13px] text-[#F0EFE2] font-medium mb-1.5 flex items-center">
            Email <span className="text-[#75bf00] ml-1">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
            className="w-full bg-transparent border-b border-[#333333] py-2 text-[14px] text-[#F0EFE2] placeholder-[#555555] outline-none focus:border-[#75bf00] transition-colors"
          />
        </div>

        {/* What can we help with? Custom Dropdown */}
        <div className="flex flex-col relative" ref={dropdownRef}>
          <label className="text-[13px] text-[#F0EFE2] font-medium mb-1.5">
            What can we help with?
          </label>
          <button
            type="button"
            onClick={() => setTopicOpen(!topicOpen)}
            className={`w-full bg-transparent border-b py-2 text-[14px] flex justify-between items-center text-left transition-colors outline-none cursor-pointer ${
              topicOpen
                ? "border-b-2 border-[#75bf00]"
                : "border-[#333333] hover:border-[#555555]"
            }`}
          >
            <span className={selectedTopic ? "text-[#F0EFE2]" : "text-[#777777]"}>
              {selectedTopic || "Select one"}
            </span>
            {topicOpen ? (
              <ChevronUp size={16} className="text-[#75bf00]" />
            ) : (
              <ChevronDown size={16} className="text-[#666666]" />
            )}
          </button>

          {topicOpen && (
            <div className="absolute top-[calc(100%+2px)] left-0 right-0 bg-[#1e1e1e] border-x border-b border-[#333333] shadow-2xl z-30 py-1 overflow-hidden">
              {topicOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    setSelectedTopic(opt);
                    setTopicOpen(false);
                  }}
                  className={`px-4 py-3 text-[14px] cursor-pointer transition-colors ${
                    selectedTopic === opt
                      ? "bg-[#2a2a2a] text-[#F0EFE2] font-medium"
                      : "text-[#C8C7BA] hover:bg-[#252525] hover:text-[#FFFFFF]"
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Which areas are you interested in? (Pill Buttons) */}
        <div className="flex flex-col">
          <label className="text-[13px] text-[#F0EFE2] font-medium mb-3">
            Which areas are you interested in?
          </label>
          <div className="flex flex-wrap gap-2.5">
            {areaOptions.map((area) => {
              const isSelected = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`px-3.5 py-1.5 text-[12px] sm:text-[13px] rounded-[2px] transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "border-[#75bf00] bg-[#142306] text-[#75bf00] font-medium shadow-[0_0_10px_rgba(117,191,0,0.12)]"
                      : "border-[#2a2a2a] bg-[#161616] text-[#888888] hover:border-[#444444] hover:text-[#cccccc]"
                  }`}
                >
                  {isSelected && <Check size={13} className="text-[#75bf00] stroke-[2.5]" />}
                  <span>{area}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tell us more * Textarea */}
        <div className="flex flex-col">
          <label className="text-[13px] text-[#F0EFE2] font-medium mb-1.5 flex items-center">
            Tell us more <span className="text-[#75bf00] ml-1">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your project, timeline, and any specific requirements..."
            className="w-full bg-transparent border-b border-[#333333] py-2 text-[14px] text-[#F0EFE2] placeholder-[#555555] outline-none focus:border-[#75bf00] transition-colors resize-none min-h-[90px]"
          />
          <span className="text-[11px] font-mono text-[#666666] mt-1.5">
            At least 10 characters
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || message.trim().length < 10}
            className={`px-5 py-2.5 rounded-[2px] font-semibold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer ${
              message.trim().length >= 10 && !isSubmitting
                ? "bg-[#75bf00] text-black hover:bg-[#86dc00] shadow-[0_0_15px_rgba(117,191,0,0.25)]"
                : "bg-[#75bf00]/50 text-black/70 cursor-not-allowed"
            }`}
          >
            <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
