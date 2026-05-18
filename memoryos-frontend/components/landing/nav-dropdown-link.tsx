"use client";

import { getNavAsciiVariant } from "@/lib/nav-ascii-variants";
import { useState } from "react";
import { NavAsciiTile } from "./nav-ascii-tile";

type NavDropdownLinkProps = {
  href: string;
  label: string;
  description: string;
};

export function NavDropdownLink({ href, label, description }: NavDropdownLinkProps) {
  const [hovered, setHovered] = useState(false);
  const variant = getNavAsciiVariant(label);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="flex gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[#f6f9ff] focus-visible:bg-[#f6f9ff] focus-visible:outline-none"
    >
      <NavAsciiTile variant={variant} active={hovered} className="h-[76px] w-[76px] shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-[14px] font-semibold text-slate-900">{label}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#5d6f87]">{description}</p>
      </div>
    </a>
  );
}
