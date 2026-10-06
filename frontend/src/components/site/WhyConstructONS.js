"use client";

import React, { useRef, useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { publicApi } from "@/lib/api"; // Added API import to fetch real CMS stats

/* -------------------------------------------------------------------------- */
/*                        DYNAMIC LUCIDE ICON HELPER                          */
/* -------------------------------------------------------------------------- */

function DynamicLucideIcon({ name, className = "h-6 w-6 text-[#FF6600]" }) {
  if (!name) return <LucideIcons.Home className={className} strokeWidth={2} />;

  // If name is already a valid React Component
  if (typeof name === "function" || typeof name === "object") {
    const CustomIcon = name;
    return <CustomIcon className={className} strokeWidth={2} />;
  }

  if (LucideIcons[name]) {
    const IconComponent = LucideIcons[name];
    return <IconComponent className={className} strokeWidth={2} />;
  }

  const pascalName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  if (LucideIcons[pascalName]) {
    const IconComponent = LucideIcons[pascalName];
    return <IconComponent className={className} strokeWidth={2} />;
  }

  return <LucideIcons.Home className={className} strokeWidth={2} />;
}

/* -------------------------------------------------------------------------- */
/*                        BRAND WORDMARK (Gradient Text)                      */
/* -------------------------------------------------------------------------- */

function BrandText({ className = "" }) {
  return (
    <span
      className={`bg-gradient-to-r from-[#FF6600] to-[#FF0000] bg-clip-text text-transparent ${className}`}
    >
      ConstructONS
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DEFAULT CONTENT                               */
/* -------------------------------------------------------------------------- */

const DEFAULT_TRADITIONAL = [
  "No fixed pricing",
  "No live tracking",
  "Paper based documents",
  "Manual updates",
  "No dashboard",
  "Delays & cost overrun",
  "Limited after-sales",
  "No tech integration",
];

const DEFAULT_CONSTRUCTONS = [
  "Transparent package pricing",
  "AI-powered live tracking",
  "Digital documents",
  "Real-time updates",
  "On-time delivery guarantee",
  "Live milestone tracking",
  "10 year warranty",
  "AI + IoT + Cloud platform",
];

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function WhyConstructONS({
  traditionalPoints = DEFAULT_TRADITIONAL,
  constructonsPoints = DEFAULT_CONSTRUCTONS,
}) {
  const [liveStats, setLiveStats] = useState([]);

  // Fetch real stats from the backend CMS
  useEffect(() => {
    publicApi.bootstrap()
      .then((data) => {
        if (data && data.stats && data.stats.length > 0) {
          setLiveStats(data.stats);
        }
      })
      .catch((err) => console.error("Failed to load CMS stats:", err));
  }, []);

  return (
    <section
      id="why"
      data-testid="why-section"
      className="relative scroll-mt-20 bg-[#F8F9FA] font-sans selection:bg-[#FF6600] selection:text-white"
    >
      {/* 1. HERO SPOTLIGHT */}
      <MaskRevealHero />

      {/* 2. COMPARISON */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <ComparisonGrid
          traditional={traditionalPoints}
          constructons={constructonsPoints}
        />
      </div>

      {/* 3. LIVE CMS STATS BANNER */}
      {liveStats.length > 0 && <StatsBanner stats={liveStats} />}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SPOTLIGHT HERO                                  */
/* -------------------------------------------------------------------------- */

function MaskRevealHero() {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex h-[24rem] w-full cursor-none select-none items-center justify-center overflow-hidden bg-[#000F1B] sm:h-[28rem] md:h-[32rem]"
    >
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <p className="max-w-4xl text-xl font-bold leading-snug text-white/30 sm:text-3xl md:text-5xl">
          Building better with{" "}
          <span className="text-white/60">technology</span>, transparency, and{" "}
          <span className="text-white/60">AI-powered tracking</span> — from
          blueprint to handover.
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#FF6600] px-6 text-center transition-opacity duration-300"
        style={{
          WebkitMaskImage: `radial-gradient(circle ${isHovered ? 260 : 60}px at ${pos.x}% ${pos.y}%, black 100%, transparent 100%)`,
          maskImage: `radial-gradient(circle ${isHovered ? 260 : 60}px at ${pos.x}% ${pos.y}%, black 100%, transparent 100%)`,
        }}
      >
        <p className="max-w-4xl text-xl font-extrabold leading-snug text-white sm:text-3xl md:text-5xl">
          Traditional Construction leave you guessing.
          <br />
          <span className="text-[#000F1B]">We give you total control.</span>
        </p>
      </div>

      <div
        className="pointer-events-none absolute z-30 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 transition-transform duration-75"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            COMPARISON GRID                                 */
/* -------------------------------------------------------------------------- */

function ComparisonGrid({ traditional = [], constructons = [] }) {
  return (
    <div className="w-full">
      <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
        <span className="inline-block rounded-full border border-[#FF6600]/20 bg-[#FF6600]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF6600]">
          Side-By-Side Comparison
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#000F1B] sm:text-4xl md:text-5xl">
          The <BrandText /> Advantage
        </h2>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          See how tech-driven execution eliminates the risks of traditional
          construction.
        </p>
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-slate-300 sm:p-8 md:p-10">
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">The Old Way</span>
                <h3 className="mt-1 text-xl font-extrabold text-slate-800 sm:text-2xl">Traditional Construction</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">Opaque</span>
            </div>
            <ul className="space-y-4">
              {traditional.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3.5 text-sm font-medium text-slate-600 sm:text-base">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500">
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-6 text-xs font-semibold text-slate-400">
            Higher risk of cost revisions & unexpected delays.
          </div>
        </div>

        <div className="my-2 flex items-center justify-center lg:my-0">
          <div className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#FF6600] text-lg font-black text-white shadow-lg shadow-[#FF6600]/30 sm:h-16 sm:w-16 sm:text-xl">
            VS
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#000F1B] p-6 text-white shadow-xl sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-[#FF6600]/20 blur-3xl" />
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6600]">Next-Gen Standard</span>
                <h3 className="mt-1 text-xl font-extrabold sm:text-2xl">
                  <BrandText />
                </h3>
              </div>
              <span className="rounded-full border border-[#FF6600]/30 bg-[#FF6600]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6600]">Recommended</span>
            </div>
            <ul className="space-y-4">
              {constructons.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3.5 text-sm font-semibold text-slate-200 sm:text-base">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs font-semibold text-slate-400">
            <span>Guaranteed deliverables backed by technology.</span>
            <span className="font-bold text-[#FF6600]">100% Tracked →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STATS BANNER (Real Data)                      */
/* -------------------------------------------------------------------------- */

function StatsBanner({ stats }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
      <div className="flex flex-col items-center rounded-full bg-[#030914] px-6 py-5 text-white shadow-2xl md:flex-row md:justify-around md:px-12 md:py-6 gap-y-6 md:gap-y-0">
        {stats.map((s, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-4 py-2 md:py-0 w-full md:w-auto justify-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D1829]">
                <DynamicLucideIcon name={s.icon} className="h-6 w-6 text-[#FF6600]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {s.value}
                </span>
                <span className="text-xs font-semibold text-slate-400 sm:text-sm">
                  {s.label}
                </span>
              </div>
            </div>
            {idx < stats.length - 1 && (
              <div className="hidden h-10 w-[1px] bg-white/10 md:block" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}