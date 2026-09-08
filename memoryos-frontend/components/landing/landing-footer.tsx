import { Reveal } from "./motion";
import { MemoryStarIcon } from "./memory-star-icon";

const FOOTER_COLUMNS = [
  {
    title: "PLATFORM",
    links: [
      { label: "Reality Fabric", href: "#" },
      { label: "Institution Runtime", href: "#" },
      { label: "Decision Graph", href: "#" },
      { label: "Correctness Engine", href: "#" },
      { label: "Evolution Runtime", href: "#" },
      { label: "Institutional Genome", href: "#" },
    ],
  },
  {
    title: "SOLUTIONS",
    links: [
      { label: "Root Cause Intelligence", href: "#" },
      { label: "Autonomous Engineering", href: "#" },
      { label: "Inference Assurance", href: "#" },
      { label: "Evolution Lab", href: "#" },
    ],
  },
  {
    title: "COMPANY",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

function ConnectIcons() {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest text-[#F0EFE2]/70 uppercase">CONNECT</p>
      <div className="mt-6 flex items-center gap-3 text-[#F0EFE2]">
        {/* X (Twitter) */}
        <a href="#" className="hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" /></svg>
        </a>
        {/* GitHub */}
        <a href="#" className="hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" /></svg>
        </a>
        {/* LinkedIn */}
        <a href="#" className="hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor"><path d="M14.82 0H1.18A1.16 1.16 0 000 1.15v13.7A1.16 1.16 0 001.18 16h13.64A1.16 1.16 0 0016 14.85V1.15A1.16 1.16 0 0014.82 0zM4.74 13.68H2.38V5.37h2.36v8.31zM3.56 4.24a1.37 1.37 0 11.02-2.74 1.37 1.37 0 01-.02 2.74zm9.9 9.44h-2.36v-4.04c0-1 0-2.28-1.4-2.28-1.4 0-1.61 1.08-1.61 2.2v4.12H5.73V5.37h2.27v1.14h.03a2.49 2.49 0 012.24-1.23c2.4 0 2.84 1.58 2.84 3.63v4.77z" /></svg>
        </a>
        {/* Reddit */}
        <a href="#" className="hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor"><path d="M16 8.04c0-.98-.78-1.77-1.74-1.77-.42 0-.8.15-1.1.4A5.6 5.6 0 008.35 4.8l.94-2.8 2.7.58a1.3 1.3 0 101.32-2.14 1.3 1.3 0 00-1.12.63L8.8 1.4a.17.17 0 00-.2.11L7.54 4.86c-1.92.21-3.6 1.13-4.5 2.18-.3-.25-.7-.4-1.12-.4a1.76 1.76 0 000 3.52c0 .24.03.48.07.7a5.53 5.53 0 005.7 4.14A5.53 5.53 0 0013.4 11c.04-.22.07-.46.07-.7a1.76 1.76 0 002.54-1.4v-.86zM5.52 7.77a1.08 1.08 0 11-2.17.02 1.08 1.08 0 012.17-.02zm3.3 4.25a2.53 2.53 0 01-1.8.69 2.53 2.53 0 01-1.8-.7.21.21 0 01.3-.29 2.12 2.12 0 001.5.57 2.12 2.12 0 001.5-.58.21.21 0 11.3.3zm2.5-3.15a1.08 1.08 0 110-2.16 1.08 1.08 0 010 2.16z" /></svg>
        </a>
        {/* Discord */}
        <a href="#" className="hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" /></svg>
        </a>
      </div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer id="contact" className="relative overflow-hidden bg-[#0A62F8] text-[#F0EFE2] pt-5 font-sans">

      {/* Top Links Section */}
      <div className="mx-auto max-w-[1240px] px-8 lg:px-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">

          {/* Left Text */}
          <div className="lg:col-span-5">
            <h2 className="text-[26px] font-semibold leading-[1.2] text-[#F0EFE2]">
              Autonomous organization<br />infrastructure.
            </h2>
            <p className="mt-4 text-[12px] text-[#F0EFE2]/80 leading-relaxed max-w-xs">
              Epoch runs the institutions that agents become: mission, authority, execution, proof, settlement, and evolution.
            </p>
          </div>

          {/* Right Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[10px] tracking-widest text-[#F0EFE2]/70 uppercase">
                  {column.title}
                </p>
                <div className="mt-6 flex flex-col gap-4">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-[12px] text-[#F0EFE2] font-medium hover:text-[#F0EFE2]/80 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <ConnectIcons />
          </div>

        </div>
      </div>

      {/* Copyright text placed in the solid blue area just above the image */}
      <div className="w-full flex justify-end px-8 md:px-12 pb-4 pt-4 relative z-20">
        <div className="text-[10px] font-mono tracking-widest text-[#F0EFE2]/70">
          © 2026 · EPOCH INC. · ALL RIGHTS RESERVED
        </div>
      </div>

      {/* Giant Background Text */}
      <div
        className="relative w-full overflow-hidden pt-1 pb-12 z-10 flex flex-col items-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/footer-columns-bg.jpg')" }}
      >

        {/* Huge "Epoch." text container with relative positioning for the icon */}
        <div className="relative inline-flex items-center justify-center pb-4">
          <h1 className="text-[35vw] md:text-[35vw] lg:text-[400px] font-bold tracking-tighter leading-[0.8] text-[#D4AF37]/40 select-none whitespace-nowrap">
            ep<span className="relative">o<div className="absolute top-[56%] left-[53%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"><MemoryStarIcon className="h-[8vw] w-[8vw] md:h-[100px] md:w-[100px] text-[#F0EFE2]" /></div></span>ch.
          </h1>
        </div>
      </div>

    </footer>
  );
}
