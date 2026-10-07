import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import LucideIcon from "@/components/site/LucideIcon";
import { FadeIn, SectionLabel } from "@/components/site/Primitives";

export default function Marketplace({ items = [] }) {
  return (
    <section
      id="marketplace"
      data-testid="marketplace-section"
      className="relative py-16 md:py-20 lg:py-24 scroll-mt-20 bg-[#F7F7F7] font-['Poppins',sans-serif] selection:bg-[#B89416] selection:text-white"
    >
      <div className="container-wide">
        {/* Header */}
        <div className="mb-10 md:mb-12">
          <FadeIn>
            <SectionLabel number={5} eyebrow="Marketplace" />
            <h2 className="mt-4 text-[#252A2A] font-bold text-3xl sm:text-4xl md:text-[40px] lg:text-[44px] leading-[1.15] tracking-tight">
              Everything You Need.{" "}
              <span className="text-[#B89416]">To Build.</span>
            </h2>
            <p className="mt-4 text-[#252A2A]/60 max-w-xl leading-relaxed text-sm md:text-[15px]">
              One-stop marketplace for materials, equipment, contractors &amp;
              professionals — verified, transparent, and always on.
            </p>
          </FadeIn>
        </div>

        {/* Cards grid — no sibling blur */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {items.map((it, i) => (
            <MarketCard key={it.id || it.slug || i} item={it} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketCard({ item, index }) {
  const fallback =
    "https://images.unsplash.com/photo-1541123356219-284ebe98ae3b?auto=format&fit=crop&w=1200&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      data-testid={`marketplace-${item.slug}`}
      className="group relative w-full aspect-[3/4] sm:aspect-[5/6] rounded-2xl overflow-hidden bg-white border border-black/5 shadow-md hover:shadow-[0_20px_50px_rgba(255,90,0,0.18)] transition-shadow duration-500 cursor-pointer"
    >
      {/* ── Full-bleed image ── */}
      <div className="absolute inset-0 bg-[#EFEFEF]">
        <img
          src={item.image || fallback}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallback;
          }}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-focus-within:scale-105"
        />
        {/* base gradient so title stays readable before banner rises */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#252A2A]/80 via-[#252A2A]/25 to-transparent" />
      </div>

      {/* ── Icon badge ── */}
      {item.icon && (
        <div className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-xl grid place-items-center bg-white/95 text-[#B89416] shadow-md">
          <LucideIcon name={item.icon} className="w-3.5 h-3.5" />
        </div>
      )}

      {/* ── Default bottom title (sits above the rising banner) ── */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-0 group-hover:translate-y-2 group-focus-within:opacity-0 group-focus-within:translate-y-2">
        <div className="font-semibold text-white text-sm leading-tight line-clamp-1 drop-shadow-sm">
          {item.name}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="w-6 h-0.5 rounded-full bg-[#B89416]" />
          <span className="text-[9px] uppercase tracking-widest font-semibold text-white/50">
            Details ↑
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SLIDING BANNER — rises from bottom on hover/focus
         ══════════════════════════════════════════════ */}
      <div
        className="
          absolute inset-x-0 bottom-0 z-20
          translate-y-[calc(100%-0px)] 
          group-hover:translate-y-0 
          group-focus-within:translate-y-0
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          rounded-t-2xl
          bg-gradient-to-br from-[#252A2A] via-[#0B1E30] to-[#252A2A]
          border-t border-white/10
          shadow-[0_-12px_40px_rgba(0,0,0,0.35)]
          text-white
          p-4 sm:p-5
          flex flex-col
          min-h-[58%] sm:min-h-[55%]
        "
      >
        {/* soft glows */}
        <div className="pointer-events-none absolute -top-10 -right-8 w-28 h-28 rounded-full bg-[#B89416]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#B89416]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full">
          {/* pull handle */}
          <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-white/20" />

          {/* icon + label */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center bg-[#B89416]/15 border border-[#B89416]/30 text-[#B89416] shrink-0">
              <LucideIcon
                name={item.icon || "Package"}
                className="w-4 h-4 sm:w-4.5 sm:h-4.5"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8A4C]">
                Available
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight truncate">
                {item.name}
              </h3>
            </div>
          </div>

          <p className="mt-2.5 text-[11px] sm:text-xs text-white/70 leading-relaxed line-clamp-3">
            {item.description}
          </p>

          {/* benefit chips */}
          <ul className="mt-3 space-y-1.5 flex-1">
            {["Verified partners", "Transparent rates", "On-demand"].map(
              (t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 text-[10px] sm:text-[11px] text-white/85"
                >
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B89416] shrink-0" />
                  {t}
                </li>
              )
            )}
          </ul>

          {/* CTA */}
          <Link
            to={`/marketplace/${item.slug}`}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#B89416] hover:bg-[#8F7210] active:bg-[#C44500] text-white text-xs font-semibold px-4 py-2.5 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Explore
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* invisible focus target so keyboard / mobile tap can open the banner */}
      <button
        type="button"
        aria-label={`View ${item.name} details`}
        className="absolute inset-0 z-[15] opacity-0"
        tabIndex={0}
      />
    </motion.div>
  );
}