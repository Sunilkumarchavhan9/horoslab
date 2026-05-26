"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { intel } from "@/components/developer-console/intel-design";

export function IntelNavSearch({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <motion.div className="relative" whileHover={{ scale: 1.005 }} transition={{ duration: 0.15 }}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9CA3AF]"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-xl border bg-white pr-12 pl-9 text-sm text-[#111827]",
          "placeholder:text-[#9CA3AF] outline-none transition",
          "focus:border-[#D1D5DB] focus:ring-2 focus:ring-black/[0.04]",
        )}
        style={{ borderColor: intel.colors.borderStrong }}
      />
      <kbd
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border bg-[#F9FAFB] px-1.5 py-0.5 font-mono text-[10px] text-[#9CA3AF]"
        style={{ borderColor: intel.colors.borderStrong }}
      >
        ⌘F
      </kbd>
    </motion.div>
  );
}
