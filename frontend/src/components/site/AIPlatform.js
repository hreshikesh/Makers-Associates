import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HardHat,
  Cpu,
  Activity,
  Bot,
  Clock,
} from "lucide-react";
import LucideIcon from "@/components/site/LucideIcon";
import { FadeIn, SectionLabel } from "@/components/site/Primitives";

const AUTO_ROTATE_MS = 5000;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80";

/* -------------------------------------------------------
   PROGRESS BAR
------------------------------------------------------- */
const ProgressBar = ({ cycleKey, duration, isPaused }) => (
  <div className="relative h-1 w-full bg-black/10 overflow-hidden rounded-full">
    <div
      key={cycleKey}
      className="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-[#FF6600] to-[#FF0000]"
      style={{
        animation: `aiProgressFill ${duration}ms linear forwards`,
        animationPlayState: isPaused ? "paused" : "running",
      }}
    />
  </div>
);

export default function AIPlatform({ modules = [] }) {
  const items = useMemo(
    () =>
      (modules || []).map((m, i) => ({
        id: m.id || m.slug || `ai-module-${i}`,
        slug: m.slug || `ai-module-${i}`,
        name: m.name || `AI Module ${i + 1}`,
        tagline: m.tagline || "Intelligent Automation",
        description:
          m.description ||
          m.tagline ||
          "An intelligent module that automates workflows and surfaces real-time construction insights.",
        image: m.image || FALLBACK_IMAGE,
        icon: m.icon || "Sparkles",
      })),
    [modules]
  );

  const count = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (count <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTO_ROTATE_MS);
  }, [count]);

  useEffect(() => {
    if (!isPaused) startInterval();
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, startInterval]);

  useEffect(() => setActiveIndex(0), [count]);

  const handleSelect = useCallback(
    (idx) => {
      setActiveIndex(idx);
      startInterval();
    },
    [startInterval]
  );

  const handleNext = useCallback(() => {
    setActiveIndex((p) => (p + 1) % count);
    startInterval();
  }, [count, startInterval]);

  const handlePrev = useCallback(() => {
    setActiveIndex((p) => (p - 1 + count) % count);
    startInterval();
  }, [count, startInterval]);

  const handleImageError = (e) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  const activeModule = items[activeIndex];

  return (
    <section
      id="ai-platform"
      data-testid="ai-platform-section"
      className="relative py-16 md:py-20 lg:py-24 scroll-mt-20 bg-white text-[#111111] overflow-hidden font-['Poppins',sans-serif] selection:bg-[#FF6600] selection:text-white"
    >
      <style>{`
        @keyframes aiProgressFill { from { width: 0%; } to { width: 100%; } }
      `}</style>

      {/* ambient glow */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6600]/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF0000]/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative container-wide">
        {/* ═══════════ HEADER ═══════════ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <FadeIn className="max-w-3xl">
            <SectionLabel number={4} eyebrow="AI Platform (SaaS)" />

            <h2 className="mt-4 font-bold text-3xl sm:text-4xl md:text-[40px] lg:text-[44px] leading-[1.15] tracking-tight">
              AI-Powered Platform.{" "}
              <span className="bg-gradient-to-r from-[#FF6600] to-[#FF0000] bg-clip-text text-transparent">
                Everything In Control.
              </span>
            </h2>

            <p className="mt-4 text-[#111111]/60 max-w-2xl leading-relaxed text-sm md:text-[15px]">
              Every ConstructONS home will ship with the AI Platform — an
              intelligent construction OS that keeps you in control with
              real-time insights, automation and recommendations.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-xs font-semibold">
              <Clock className="w-4 h-4" /> Coming Soon 
            </div>
          </FadeIn>

          {/* Controls only (no CTAs) */}
          {count > 1 && (
            <div className="flex items-center gap-3 self-start md:self-end shrink-0">
              <button
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? "Play showcase" : "Pause showcase"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/10 hover:border-[#FF6600] text-[#111111]/70 hover:text-[#111111] font-mono text-xs uppercase tracking-wider transition-all duration-300 shadow-sm"
              >
                {isPaused ? (
                  <Play size={13} className="text-[#FF6600] fill-[#FF6600]" />
                ) : (
                  <Pause size={13} className="text-[#FF6600] fill-[#FF6600]" />
                )}
                <span>{isPaused ? "Play" : "Pause"}</span>
              </button>

              <div className="flex items-center gap-1 bg-white border border-black/10 rounded-full p-1 shadow-sm">
                <button
                  onClick={handlePrev}
                  aria-label="Previous module"
                  className="p-1.5 rounded-full hover:bg-black/5 text-[#111111]/60 hover:text-[#111111] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-mono text-xs font-semibold text-[#111111]/50">
                  {String(activeIndex + 1).padStart(2, "0")}/
                  {String(count).padStart(2, "0")}
                </span>
                <button
                  onClick={handleNext}
                  aria-label="Next module"
                  className="p-1.5 rounded-full hover:bg-black/5 text-[#111111]/60 hover:text-[#111111] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════ SHOWCASE STAGE ═══════════ */}
        {count > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* ───── LEFT : Module Hero ───── */}
            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              data-testid={`ai-module-${activeModule.slug}`}
              className="lg:col-span-7 relative bg-[#111111] rounded-3xl overflow-hidden border border-black/5 shadow-[0_20px_60px_rgba(17,17,17,0.18)] min-h-[420px] sm:min-h-[520px] flex flex-col justify-end group"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <img
                    src={activeModule.image}
                    alt={activeModule.name}
                    onError={handleImageError}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/65 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/85 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(#FF6600_1px,transparent_1px)] [background-size:14px_14px] opacity-[0.08] pointer-events-none" />
                </motion.div>
              </AnimatePresence>

              {/* badges */}
              <div className="absolute top-5 left-5 right-5 z-10 flex items-start justify-between gap-3">
                <span className="bg-white/95 backdrop-blur-md border border-black/5 rounded-full px-3.5 py-1 text-[#111111] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Clock size={14} className="text-[#FF6600]" /> Coming Soon
                </span>

                <div className="w-10 h-10 rounded-full grid place-items-center bg-black/55 backdrop-blur-md border border-white/15 text-[#FF6600] shadow-[0_0_18px_rgba(255,102,0,0.35)] shrink-0">
                  <LucideIcon
                    name={activeModule.icon}
                    className="w-[18px] h-[18px]"
                  />
                </div>
              </div>

              {/* content — no buttons */}
              <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`info-${activeIndex}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                  >
                    <span className="inline-flex items-center gap-2 text-[#FF6600] font-mono text-[11px] font-bold uppercase tracking-[0.18em] mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF6600] animate-pulse" />
                      AI Module #{String(activeIndex + 1).padStart(2, "0")} ·{" "}
                      {activeModule.tagline}
                    </span>

                    <h3 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-3">
                      {activeModule.name}
                    </h3>

                    <p className="text-white/70 text-sm sm:text-[15px] leading-relaxed mb-6 line-clamp-3">
                      {activeModule.description}
                    </p>

                    {/* Coming Soon pill only — no CTA button */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white font-semibold uppercase text-[11px] tracking-wider px-5 py-3 rounded-xl">
                        <Clock size={14} className="text-[#FF6600]" />
                        Coming Soon
                      </span>


                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ───── RIGHT : Module Selector ───── */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-black/[0.07] shadow-sm p-3 sm:p-4 flex flex-col">
              <div className="flex items-center justify-between px-2 pb-3 mb-1 border-b border-black/5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#111111]/40">
                  Platform Modules
                </span>
                <span className="font-mono text-[10px] text-[#FF6600] font-bold">
                  Coming Soon
                </span>
              </div>

              <div className="divide-y divide-black/5 overflow-y-auto">
                {items.map((m, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div key={m.id} className="py-1.5 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onMouseEnter={() => handleSelect(idx)}
                        onFocus={() => handleSelect(idx)}
                        onClick={() => handleSelect(idx)}
                        aria-current={isActive}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-between gap-4 group ${
                          isActive
                            ? "bg-[#111111] shadow-lg border border-[#FF6600]/30"
                            : "border border-transparent hover:bg-black/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border ${
                              isActive
                                ? "border-[#FF6600]/50"
                                : "border-black/10"
                            }`}
                          >
                            <img
                              src={m.image}
                              alt={m.name}
                              onError={handleImageError}
                              loading="lazy"
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-[#111111]/35" />
                            <div className="absolute inset-0 grid place-items-center text-white">
                              <LucideIcon name={m.icon} className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`font-semibold text-sm sm:text-[15px] tracking-tight truncate ${
                                  isActive ? "text-white" : "text-[#111111]"
                                }`}
                              >
                                {m.name}
                              </h4>
                              {isActive && (
                                <span className="h-2 w-2 rounded-full bg-[#FF6600] shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isActive
                                  ? "text-white/55"
                                  : "text-[#111111]/50"
                              }`}
                            >
                              {m.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider ${
                              isActive ? "text-[#FF6600]" : "text-[#111111]/35"
                            }`}
                          >
                            Soon
                          </span>
                          <div
                            className={`w-8 h-8 rounded-full grid place-items-center transition-all ${
                              isActive
                                ? "bg-gradient-to-br from-[#FF6600] to-[#FF0000] text-white"
                                : "bg-black/5 text-[#111111]/40 group-hover:bg-[#111111] group-hover:text-white"
                            }`}
                          >
                            <Clock size={14} />
                          </div>
                        </div>
                      </button>

                      {isActive && (
                        <div className="px-3.5 pt-1.5">
                          <ProgressBar
                            cycleKey={`${activeIndex}-${isPaused}`}
                            duration={AUTO_ROTATE_MS}
                            isPaused={isPaused}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ DASHBOARD PREVIEW ═══════════ */}
        <FadeIn delay={0.2} className="mt-10 lg:mt-14">
          <div className="relative rounded-3xl border border-black/5 bg-[#111111] p-1 shadow-[0_20px_60px_rgba(17,17,17,0.15)]">
            {/* Coming Soon overlay badge */}
            <div className="absolute top-5 right-5 z-20">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6600] text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                <Clock size={13} /> Coming Soon
              </span>
            </div>

            <div className="rounded-[22px] overflow-hidden bg-[#111111]/50 relative">
              <div className="px-4 py-2 flex items-center gap-2 border-b border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6600]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6600]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6600]" />
                <div className="ml-3 text-white/60 text-xs font-mono">
                  app.constructons.in / dashboard
                </div>
              </div>
              <div className="relative">
                <img
                  src="/dashboard.png"
                  alt="ConstructONS AI Platform Dashboard — Coming Soon"
                  className="w-full h-auto object-cover object-top"
                />
                {/* subtle dim so it feels locked / preview */}
                <div className="absolute inset-0 bg-[#111111]/25 pointer-events-none" />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ═══════════ VALUE BAR — no button ═══════════ */}
        <div className="mt-10 pt-8 border-t border-black/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: "Real-Time Insights",
                sub: "Live site progress tracking",
              },
              {
                icon: Cpu,
                title: "Smart Automation",
                sub: "Zero manual follow-ups",
              },
              {
                icon: Bot,
                title: "AI Recommendations",
                sub: "Cost & timeline optimised",
              },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-white border border-black/10 text-[#FF6600] shadow-sm">
                  <Icon size={20} />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    {title}
                  </h5>
                  <p className="text-[11px] text-[#111111]/50">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}