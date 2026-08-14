import React from 'react';

export function NewMemoryOsLogo({ className = "w-[24px] h-[24px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 169 162" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_n_55_3)">
        <path d="M65 18.25L81.25 0H104V73H65V18.25Z" fill="currentColor"/>
      </g>
      <g filter="url(#filter1_n_55_3)">
        <path d="M104 104.643V162H65V89H91L104 104.643Z" fill="currentColor"/>
      </g>
      <g filter="url(#filter2_n_55_3)">
        <path d="M169 47V120H130V57.4286L146.25 47H169Z" fill="currentColor"/>
      </g>
      <g filter="url(#filter3_n_55_3)">
        <path d="M14 47L0 63V47H14Z" fill="currentColor"/>
      </g>
      <g filter="url(#filter4_n_55_3)">
        <path d="M22.75 47L39 60.0357V120H0V60.0357L13 47H22.75Z" fill="currentColor"/>
      </g>
      <defs>
        <filter id="filter0_n_55_3" x="65" y="0" width="39" height="73" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="1860" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_55_3">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter id="filter1_n_55_3" x="65" y="89" width="39" height="73" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="1860" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_55_3">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter id="filter2_n_55_3" x="130" y="47" width="39" height="73" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="1860" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_55_3">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter id="filter3_n_55_3" x="0" y="47" width="14" height="16" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="1860" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_55_3">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter id="filter4_n_55_3" x="0" y="47" width="39" height="73" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="1860" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_55_3">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
