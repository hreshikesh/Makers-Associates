import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Building2 } from "lucide-react";
import LucideIcon from "@/components/site/LucideIcon";
import { FadeIn, SectionLabel } from "@/components/site/Primitives";

const SERVICE_VISUALS = {
  paylater: {
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
    accent: "Build now. Pay in milestones.",
  },
  loans: {
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    accent: "Bank-ready construction finance.",
  },
  insurance: {
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80",
    accent: "Protected from foundation to finish.",
  },
  "payment-gateway": {
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80",
    accent: "Escrow-backed milestone payments.",
  },
};

export default function FinancialServices({ items = [] }) {
  if (!items?.length) return null;

  const [featured, ...rest] = items;

  return (
    <section
      id="financial"
      data-testid="financial-section"
      className="relative overflow-hidden py-16 md:py-20 lg:py-24 scroll-mt-20 bg-[#000F1B] font-['Poppins',sans-serif] selection:bg-[#FF6600] selection:text-white"
    >
      {/* Construction grid + beams */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute -top-20 left-1/4 h-[700px] w-px rotate-[12deg] bg-gradient-to-b from-transparent via-[#FF6600]/40 to-transparent" />
        <div className="absolute -top-20 right-1/3 h-[700px] w-px rotate-[12deg] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FF6600]/10 blur-3xl" />
        <div className="absolute top-0 left-0 h-60 w-60 rounded-full bg-[#FF6600]/[0.07] blur-3xl" />
      </div>

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="mb-10 md:mb-12 max-w-3xl">
          <FadeIn>
            <SectionLabel number={6} eyebrow="Financial Services" />
            <h2 className="mt-4 text-white font-bold text-3xl sm:text-4xl md:text-[42px] leading-[1.1] tracking-tight">
              Finance that builds with you.{" "}
              <span className="text-[#FF6600]">Not against you.</span>
            </h2>

            <p className="mt-3 text-white/60 text-sm md:text-base leading-relaxed max-w-2xl">
              From PayLater EMIs to construction loans, insurance and escrow
              payments — every rupee is structured around how homes are actually built.
            </p>
          </FadeIn>
        </div>

        {/* Featured compact card */}
        {featured && (
          <FadeIn>
            <FeaturedCard service={featured} />
          </FadeIn>
        )}

        {/* Remaining grid cards */}
        {rest.length > 0 && (
          <div className="mt-4 md:mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {rest.map((s, i) => (
              <ServiceCard key={s.id || s.slug || i} service={s} index={i} />
            ))}
          </div>
        )}

        {/* Trust strip */}
        <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6">
          {[
            { label: "Milestone escrow", value: "Secure" },
            { label: "Partner banks", value: "Top NBFCs" },
            { label: "Approval", value: "Digital" },
            { label: "Support", value: "Dedicated" },
          ].map((t) => (
            <div key={t.label} className="text-center md:text-left">
              <div className="text-white font-bold text-base md:text-lg">{t.value}</div>
              <div className="text-white/45 text-xs mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   FEATURED — scaled down hero finance card
------------------------------------------------------- */
function FeaturedCard({ service }) {
  const visual = SERVICE_VISUALS[service.slug] || SERVICE_VISUALS.paylater;

  return (
    <motion.article
      data-testid={`finserv-${service.slug}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-[22px] border border-white/10 min-h-[340px] md:min-h-[380px]"
    >
      {/* Background image */}
      <img
        src={visual.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#000F1B] via-[#000F1B]/92 to-[#000F1B]/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#000F1B] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full grid lg:grid-cols-[1.1fr_0.9fr] gap-6 p-6 sm:p-8 md:p-9">
        <div className="flex flex-col justify-center max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6600] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
              <LucideIcon name={service.icon || "CreditCard"} className="w-3 h-3" />
              {service.coming_soon ? "Coming Soon" : "Featured"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              ConstructONS Finance
            </span>
          </div>

          <h3 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
            {service.name}
          </h3>

          <p className="mt-2 text-base md:text-lg font-medium text-[#FF8A4C]">
            {service.tagline}
          </p>

          <p className="mt-2.5 text-white/65 text-xs md:text-sm leading-relaxed max-w-lg">
            {service.description || visual.accent}
          </p>
        </div>

        {/* Specs panel */}
        <div className="flex items-center">
          <div className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-6">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C]">
              <Building2 className="w-3.5 h-3.5" />
              What you get
            </div>

            <ul className="mt-3.5 space-y-2.5">
              {(service.features || []).map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-white/90 text-xs md:text-sm">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#FF6600]/15 text-[#FF6600] shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/40">Built for</div>
                <div className="text-white font-semibold text-xs md:text-sm">Home construction journeys</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#FF6600] grid place-items-center text-white shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* -------------------------------------------------------
   STANDARD scaled down service cards (No explore button)
------------------------------------------------------- */
function ServiceCard({ service, index }) {
  const visual = SERVICE_VISUALS[service.slug] || SERVICE_VISUALS.loans;

  return (
    <motion.article
      data-testid={`finserv-${service.slug}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0B1E30] min-h-[300px] md:min-h-[330px] flex flex-col"
    >
      {/* Top image band */}
      <div className="relative h-36 md:h-40 overflow-hidden shrink-0">
        <img
          src={visual.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E30] via-[#0B1E30]/40 to-transparent" />

        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1">
          <span className="h-5 w-5 rounded-md grid place-items-center bg-[#FF6600] text-white">
            <LucideIcon name={service.icon || "CreditCard"} className="w-3 h-3" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">
            {service.coming_soon ? "Soon" : "Available"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 flex flex-col p-5 md:p-6">
        <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
          {service.name}
        </h3>
        <p className="mt-1 text-[#FF8A4C] text-xs md:text-sm font-semibold">
          {service.tagline}
        </p>
        <p className="mt-2 text-white/55 text-xs md:text-sm leading-relaxed line-clamp-2">
          {service.description || visual.accent}
        </p>

        <ul className="mt-4 space-y-2 flex-1">
          {(service.features || []).slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-white/85">
              <Check className="w-3.5 h-3.5 mt-0.5 text-[#FF6600] shrink-0" />
              <span className="line-clamp-1">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Orange edge accent */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#FF6600] transition-all duration-500 group-hover:w-full" />
    </motion.article>
  );
}