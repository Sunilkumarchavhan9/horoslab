"use client";

import { useEffect, useRef, useState } from "react";

export function SeamlessVideoBackground({ src }: { src: string }) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const transitionDuration = 1.0; // 1 second crossfade

  useEffect(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    let rafId: number;

    const checkTime = () => {
      const active = activeVideo === 1 ? v1 : v2;
      const inactive = activeVideo === 1 ? v2 : v1;

      if (active.duration && active.currentTime >= active.duration - transitionDuration) {
        inactive.currentTime = 0;
        inactive.play();
        setActiveVideo(activeVideo === 1 ? 2 : 1);
      }

      rafId = requestAnimationFrame(checkTime);
    };

    rafId = requestAnimationFrame(checkTime);

    return () => cancelAnimationFrame(rafId);
  }, [activeVideo]);

  return (
    <>
      <video
        ref={video1Ref}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 z-[-1] h-full w-full object-cover pointer-events-none transition-opacity duration-1000 ease-in-out ${
          activeVideo === 1 ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        ref={video2Ref}
        muted
        playsInline
        className={`absolute inset-0 z-[-2] h-full w-full object-cover pointer-events-none transition-opacity duration-1000 ease-in-out ${
          activeVideo === 2 ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src={src} type="video/mp4" />
      </video>
    </>
  );
}
