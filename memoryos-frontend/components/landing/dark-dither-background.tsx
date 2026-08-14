export function DarkDitherBackground() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#101210] pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dither-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            {/* Scattered 4x4 squares with varying opacities to simulate noise */}
            <rect x="4" y="4" width="4" height="4" fill="#414641" fillOpacity="0.1" />
            <rect x="16" y="0" width="4" height="4" fill="#414641" fillOpacity="0.2" />
            <rect x="28" y="8" width="4" height="4" fill="#414641" fillOpacity="0.05" />
            <rect x="8" y="16" width="4" height="4" fill="#414641" fillOpacity="0.15" />
            <rect x="20" y="20" width="4" height="4" fill="#414641" fillOpacity="0.08" />
            <rect x="32" y="12" width="4" height="4" fill="#414641" fillOpacity="0.25" />
            <rect x="0" y="28" width="4" height="4" fill="#414641" fillOpacity="0.12" />
            <rect x="12" y="32" width="4" height="4" fill="#414641" fillOpacity="0.18" />
            <rect x="24" y="28" width="4" height="4" fill="#414641" fillOpacity="0.05" />
            <rect x="36" y="36" width="4" height="4" fill="#414641" fillOpacity="0.2" />
            <rect x="4" y="24" width="4" height="4" fill="#414641" fillOpacity="0.1" />
            <rect x="28" y="36" width="4" height="4" fill="#414641" fillOpacity="0.14" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dither-pattern)" />
      </svg>
    </div>
  );
}
