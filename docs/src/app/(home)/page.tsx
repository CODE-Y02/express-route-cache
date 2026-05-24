"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import HeroSection from "@/components/home/HeroSection";
import PlaygroundSection from "@/components/home/PlaygroundSection";
import StampedeSection from "@/components/home/StampedeSection";
import KeyAnatomySection from "@/components/home/KeyAnatomySection";
import ComparisonSection from "@/components/home/ComparisonSection";
import StudioSection from "@/components/home/StudioSection";
import FooterSection from "@/components/home/FooterSection";

export default function HomePage() {
  return (
    <TooltipProvider>
      <div
        id="main-content"
        tabIndex={-1}
        className="outline-none relative min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground"
      >
        {/* Decorative Grid and Ambient Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb,220,38,38),0.07),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30" />

        {/* Glow circles */}
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

        <HeroSection />
        <PlaygroundSection />
        <StampedeSection />
        <KeyAnatomySection />
        <ComparisonSection />
        <StudioSection />
        <FooterSection />
      </div>
    </TooltipProvider>
  );
}
