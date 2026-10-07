import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLeadModal } from "@/components/site/LeadModalProvider";

export default function Hero() {
  const { open: openLead } = useLeadModal();

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#252A2A]"
    >
      {/* -------------------------------------------------
          BACKGROUND IMAGE & SMART OVERLAYS
      -------------------------------------------------- */}
      <div className="absolute inset-0">
    
        <img
          src="/hero-construction.png"
          alt="Construction site"
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
        />

        {/* 1. Base darkening */}
        <div className="absolute inset-0 bg-[#252A2A]/25" />

        {/* 2. Strong left-side text protection */}
        <div className="absolute inset-0 w-full bg-gradient-to-r from-[#252A2A]/95 via-[#252A2A]/65 to-[#252A2A]/15 md:w-[85%]" />

        {/* 3. Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#252A2A] to-transparent" />
      </div>

      {/* -------------------------------------------------
          HERO CONTENT
      -------------------------------------------------- */}
      <div className="relative z-10 flex min-h-[100svh] items-center">
        <div className="mx-auto w-full max-w-[1536px] px-5 py-28 sm:px-8 md:px-12 md:py-36 lg:px-16 xl:px-20 2xl:px-24">
          <div className="max-w-4xl">

            {/* AI Integrated Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#B89416]/30 bg-black/40 px-4 py-2 backdrop-blur-md shadow-[0_0_20px_-3px_rgba(255,102,0,0.25)]"
            >
              
             
              <span className="font-[Poppins] text-xs font-medium tracking-wide text-white/90 sm:text-sm">
                India&apos;s First{" "}
                <span className="bg-gradient-to-r from-[#B89416] to-[#B89416] bg-clip-text font-semibold text-transparent">
                  AI-Integrated
                </span>{" "}
                Construction Platform
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-[Poppins] text-4xl font-bold leading-[1.25] tracking-tight text-white sm:text-5xl sm:leading-[1.2] md:text-6xl md:leading-[1.18] lg:text-[64px] lg:leading-[1.15]"
            >
              Your trusted partner for <br className="hidden lg:block" />
              every stage of{" "}
              <span className="bg-gradient-to-r from-[#B89416] to-[#B89416] bg-clip-text text-transparent">
                home construction.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-6 max-w-2xl font-[Poppins] text-base font-light leading-relaxed text-white/80 md:text-lg"
            >
              From the first blueprint to the final handover, we make your
              dream home a reality with transparency, quality and trust.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
            >
              <a
                href="/about"
                className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#B89416] to-[#B89416] px-8 py-3 font-[Poppins] text-base font-medium text-white transition-all duration-300 hover:opacity-95 hover:shadow-[0_8px_30px_rgba(255,102,0,0.35)] sm:w-auto"
              >
                Explore Our Ecosystem
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <button
                type="button"
                onClick={() => openLead({ source: "hero" })}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-8 py-3 font-[Poppins] text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-[#B89416] hover:bg-[#B89416]/10 hover:text-[#B89416] sm:w-auto"
              >
                Talk to an Expert
              </button>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}