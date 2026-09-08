import React from "react";

/**
 * Global SVG Filter definitions for the "pixary" shatter effect.
 * This is rendered once at the root and can be applied to any element via CSS:
 * filter: url(#pixelate-shatter);
 */
export function PixelFilter() {
  return (
    <svg className="hidden pointer-events-none absolute w-0 h-0">
      <filter id="pixelate-shatter" x="-50%" y="-50%" width="200%" height="200%">
        {/* Generate blocky noise. A low baseFrequency creates large pixel blocks. */}
        <feTurbulence 
          id="shatter-turbulence"
          type="fractalNoise" 
          baseFrequency="0.1 0.1" 
          numOctaves="1" 
          result="noise" 
        />
        {/* Quantize the noise into distinct bands to create a sharp, block-like pixelated displacement */}
        <feComponentTransfer in="noise" result="blockyNoise">
          <feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
          <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
          <feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
        </feComponentTransfer>
        {/* Displace the element (shatter it) based on the blocky noise */}
        <feDisplacementMap 
          id="shatter-displacement"
          in="SourceGraphic" 
          in2="blockyNoise" 
          scale="0" 
          xChannelSelector="R" 
          yChannelSelector="G" 
        />
      </filter>
    </svg>
  );
}
