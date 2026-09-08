"use client";

import React, { useState, useEffect, useRef } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { ResultInspectionSection } from "@/components/landing/result-inspection-section";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { ModelApisSection } from "@/components/landing/model-apis-section";
import { HardwareDeploymentSection } from "@/components/landing/hardware-deployment-section";
import { DeploymentOptionsSection } from "@/components/landing/deployment-options-section";
import { SupportedStackSection } from "@/components/landing/supported-stack-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { AuthModal } from "@/components/epoch/modals/auth-modal";
import { TokenPromptInput } from "@/components/epoch/primitives/token-prompt-input";
import { PixelFilter } from "@/components/epoch/primitives/pixel-filter";
import { X } from "lucide-react";
import gsap from "gsap";

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">(
    "sign-in",
  );
  const [showFloatingComposer, setShowFloatingComposer] = useState(false);
  const prevShowFloatingComposer = useRef(false);
  const [isFloatingComposerDismissed, setIsFloatingComposerDismissed] =
    useState(false);
  const composerWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (composerWrapperRef.current) {
      gsap.set(composerWrapperRef.current, { xPercent: -50, x: 0 });
    }

    let animationFrameId: number;

    const handleScrollAndResize = () => {
      // Reset dismissal if scrolled back to hero
      if (window.scrollY < 300) {
        setIsFloatingComposerDismissed(false);
      }

      const shouldShow = window.scrollY > window.innerHeight * 0.8;
      setShowFloatingComposer(shouldShow);

      const dockTarget = document.getElementById("composer-dock-target");
      const composerElement = composerWrapperRef.current;

      if (composerElement) {
        if (dockTarget && shouldShow && !isFloatingComposerDismissed) {
          const dockRect = dockTarget.getBoundingClientRect();
          // Check if dock has entered the viewport from the bottom.
          // We keep it docked even if it scrolls past the top of the screen so it naturally scrolls away.
          const hasDockEntered = dockRect.top < window.innerHeight;

          if (hasDockEntered) {
            gsap.to(composerElement, {
              xPercent: 0,
              x: 0,
              y: 0,
              left: dockRect.left,
              top: dockRect.top,
              width: dockRect.width,
              bottom: "auto",
              maxWidth: "none",
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });
            return;
          }
        }

        // Default floating behavior (bottom center)
        gsap.to(composerElement, {
          xPercent: -50,
          x: 0,
          y: 0,
          left: "50%",
          top: "auto",
          bottom: "1.5rem", // 24px (bottom-6)
          width: "100%",
          maxWidth: "56rem", // max-w-4xl
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScrollAndResize);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll(); // initial layout

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFloatingComposerDismissed]);

  // Magical Pixel Dissolve / Assemble Effect
  useEffect(() => {
    if (showFloatingComposer === prevShowFloatingComposer.current) return;
    prevShowFloatingComposer.current = showFloatingComposer;

    if (isFloatingComposerDismissed) return;

    const filterTarget = document.getElementById("shatter-displacement");
    const heroComposer = document.getElementById("hero-composer-wrapper");
    const globalComposerInner = document.getElementById(
      "global-composer-inner",
    );

    if (filterTarget && heroComposer && globalComposerInner) {
      // Temporarily apply the SVG filter to both elements during transition
      heroComposer.style.filter = "url(#pixelate-shatter)";
      globalComposerInner.style.filter = "url(#pixelate-shatter)";

      if (showFloatingComposer) {
        // Hero -> Global Transition (Scroll Down)
        gsap
          .timeline()
          .to(filterTarget, {
            attr: { scale: 120 },
            duration: 0.3,
            ease: "power2.in",
          })
          .add(() => {
            heroComposer.style.opacity = "0";
            globalComposerInner.style.opacity = "1";
            heroComposer.style.pointerEvents = "none";
            globalComposerInner.style.pointerEvents = "auto";
          })
          .to(filterTarget, {
            attr: { scale: 0 },
            duration: 0.3,
            ease: "power2.out",
          })
          .add(() => {
            heroComposer.style.filter = "none";
            globalComposerInner.style.filter = "none";
          });
      } else {
        // Global -> Hero Transition (Scroll Up)
        gsap
          .timeline()
          .to(filterTarget, {
            attr: { scale: 120 },
            duration: 0.3,
            ease: "power2.in",
          })
          .add(() => {
            globalComposerInner.style.opacity = "0";
            heroComposer.style.opacity = "1";
            globalComposerInner.style.pointerEvents = "none";
            heroComposer.style.pointerEvents = "auto";
          })
          .to(filterTarget, {
            attr: { scale: 0 },
            duration: 0.3,
            ease: "power2.out",
          })
          .add(() => {
            heroComposer.style.filter = "none";
            globalComposerInner.style.filter = "none";
          });
      }
    }
  }, [showFloatingComposer, isFloatingComposerDismissed]);

  return (
    <div className="min-h-screen bg-[#151515] text-[#F0EFE2] font-mono selection:bg-[#75bf00] selection:text-black">
      <PixelFilter />

      {/* Top Header Navbar */}
      <LandingNavbar
        onOpenDashboard={() => {
          setAuthModalMode("sign-in");
          setAuthModalOpen(true);
        }}
        onOpenSignIn={() => {
          setAuthModalMode("sign-in");
          setAuthModalOpen(true);
        }}
        onOpenSignUp={() => {
          setAuthModalMode("sign-up");
          setAuthModalOpen(true);
        }}
        dark={true}
      />

      {/* Main Landing Sections */}
      <main>
        {/* 1. Hero Section with Natural Language Token Composer */}
        <LandingHero
          onLaunchPrompt={(params) => {
            setAuthModalMode("sign-in");
            setAuthModalOpen(true);
          }}
          dark={true}
        />

        {/* 2. Reality & Capability Architecture Canvas Section */}
        <ResultInspectionSection
          onOpenSignIn={() => {
            setAuthModalMode("sign-in");
            setAuthModalOpen(true);
          }}
          dark={true}
        />

        {/* 3. Feature Showcase Sticky Scroll Section */}
        <FeatureShowcase
          onOpenSignIn={() => {
            setAuthModalMode("sign-in");
            setAuthModalOpen(true);
          }}
          dark={true}
        />

        {/* 4. Model APIs & Build Your Own Stack Section */}
        <ModelApisSection dark={true} />

        {/* 5. Hardware Deployment Section */}
        <HardwareDeploymentSection />

        {/* 6. Deployment Options Section */}
        <DeploymentOptionsSection />

        {/* 7. Supported Stack Section */}
        <SupportedStackSection />
        
        {/* 8. FAQ Section */}
        <FaqSection />

        {/* 9. Footer CTA & Footer */}
        <FooterCtaSection />
      </main>

      {/* Global Floating Composer that appears on scroll and docks using GSAP */}
      <div
        ref={composerWrapperRef}
        className="fixed z-50 pointer-events-none"
        style={{
          left: "50%",
          bottom: "1.5rem",
          width: "100%",
          maxWidth: "56rem",
        }}
      >
        <div
          id="global-composer-inner"
          className="w-full group pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div className="relative rounded-[2px] w-full px-2 sm:px-4">
            <button
              onClick={() => setIsFloatingComposerDismissed(true)}
              className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 w-6 h-6 bg-[#1a1a1a] border border-[#333333] rounded-full flex items-center justify-center text-[#C8C7BA] hover:text-[#F0EFE2] hover:bg-[#252525] transition-all z-10 shadow-lg"
            >
              <X size={12} />
            </button>
            <TokenPromptInput
              onSubmit={(prompt) => {
                setAuthModalMode("sign-in");
                setAuthModalOpen(true);
              }}
              dark={true}
              hideHeader={true}
              showSuggestions={false}
            />
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
