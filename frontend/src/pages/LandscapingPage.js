import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, X, MessageCircle, Power, Leaf,
  MapPin, Ruler, Calendar, Sun, Sprout, Droplets
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import PlantRecommender from "@/components/site/PlantRecommender";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

import { LANDSCAPING_SHOWCASE } from "./data/LandscapingShowcaseData";

const SPACE_FILTERS = ["All", "Villa Garden", "Terrace", "Balcony", "Commercial", "Farmhouse"];

const OFFERINGS = [
  { icon: Leaf, label: "Garden Design", desc: "Custom outdoor spaces" },
  { icon: Sprout, label: "Terrace Gardens", desc: "Rooftop green havens" },
  { icon: Droplets, label: "Water Features", desc: "Ponds & fountains" },
  { icon: Sun, label: "Vertical Walls", desc: "Living green walls" },
  { icon: Ruler, label: "Irrigation", desc: "Smart drip systems" },
  { icon: Calendar, label: "Maintenance", desc: "Year-round care" }
];

export default function LandscapingPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [spaceFilter, setSpaceFilter] = useState("All");
  const [view, setView] = useState(null);

  const filtered = useMemo(() => {
    if (spaceFilter === "All") return LANDSCAPING_SHOWCASE;
    return LANDSCAPING_SHOWCASE.filter(item => item.space === spaceFilter);
  }, [spaceFilter]);

  const handleWhatsApp = (item) => {
    const text = item
      ? encodeURIComponent(`Hi, I love your "${item.title}" landscape project in ${item.location}. I'd like to discuss a similar landscape for my property.`)
      : encodeURIComponent(`Hi, I'd like to discuss landscaping services for my property.`);
    window.open(`https://wa.me/917892071052?text=${text}`, "_blank", "noopener");
  };

  const totalGardens = LANDSCAPING_SHOWCASE.length;
  const totalSqft = LANDSCAPING_SHOWCASE.reduce((n, i) => n + parseInt(i.coverage.replace(/[^0-9]/g, "")), 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://constructons.com/marketplace/landscaping#webpage",
        "url": "https://constructons.com/marketplace/landscaping",
        "name": "Garden, Terrace, & Balcony Landscaping Services",
        "description": "Browse premium landscaping portfolios. Discover custom vertical green walls, drip irrigation setups, terrace gardens, and water features."
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://constructons.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Marketplace",
            "item": "https://constructons.com/marketplace/landscaping"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Landscaping",
            "item": "https://constructons.com/marketplace/landscaping"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] text-[#000F1B] selection:bg-[#FF6600] selection:text-white flex flex-col">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
      
      <SEO
        title="Lush Landscape Design, Terrace Gardens & Verticals"
        description="Design your estate, terrace garden, or balcony space. View custom landscaping portfolios, smart irrigation specs, and discover ideal plants with our smart discovery tool."
        canonical="/marketplace/landscaping"
        keywords="landscaping design India, rooftop terrace gardens, vertical living walls, balcony planters, custom backyard garden, drip irrigation installers"
        structuredData={structuredData}
      />

      <Header />

      <main className="flex-1">
        {/* ===================== HERO ===================== */}
        <section className="relative bg-[#000F1B] text-white pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#FF6600]/15 blur-[120px] rounded-full pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center z-10">
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm mx-auto lg:mx-0">
                  <BrandLockup tone="dark" size="sm" />
                  <span className="w-px h-3 bg-white/20 mx-1" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF6600] uppercase">Landscaping Bureau</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  The green thinkers who make your property <br className="hidden lg:block" /> <em className="text-[#FF6600] not-italic">breathe, bloom, and belong</em> to nature.
                </h1>
                <p className="mt-6 text-base md:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  From balcony gardens to villa estates. Curated plants, considered layouts, and outdoor spaces that feel alive from the very first day.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                  <button onClick={() => document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] transition px-8 py-4 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5 cursor-pointer">
                    See Our Work <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-8 text-left">
                    {[[`${totalGardens}+`, "Gardens Created"], [`${(totalSqft / 1000).toFixed(1)}K+`, "Sq. Ft. Greened"]].map(([n, l]) => (
                      <div key={l}>
                        <div className="text-2xl font-black text-white">{n}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Lush Landscape Mosaic */}
            <div className="lg:col-span-5 hidden lg:grid grid-cols-2 gap-4">
              {[LANDSCAPING_SHOWCASE[0], LANDSCAPING_SHOWCASE[5], LANDSCAPING_SHOWCASE[2], LANDSCAPING_SHOWCASE[3]].map((p, i) => (
                <motion.div key={p.id}
                  initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`overflow-hidden rounded-2xl bg-white/5 border border-white/10 ${i % 2 ? "mt-12" : ""} ${i < 2 ? "aspect-[3/4]" : "aspect-[4/5]"} group relative`}>
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <div className="absolute bottom-3 left-3 text-white text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">
                    {p.style}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== PLANT RECOMMENDER ===================== */}
        <section className="py-16 md:py-28 bg-white border-b border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-10 md:mb-12 text-center md:text-left mx-auto md:mx-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4">
                <Leaf className="w-3.5 h-3.5" /> Interactive Discovery Tool
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000F1B] mb-4">
                Which plants will actually <br /><span className="text-[#FF6600]">thrive at your place?</span>
              </h2>
              <p className="text-sm md:text-base text-[#111111]/60 leading-relaxed">
                Every plant has its perfect home. Tell us about your space, your sunlight, and how much care you'd like to give — we'll show you plants that won't just survive, they'll flourish.
              </p>
            </div>

            <PlantRecommender />
          </div>
        </section>

        {/* ===================== LANDSCAPING SHOWCASE ===================== */}
        <section id="showcase" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-3">
                  <Sprout className="w-3.5 h-3.5" /> Our Portfolio
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#000F1B] tracking-tight">Landscapings we've brought to life</h2>
                <p className="text-sm text-[#111111]/60 mt-2">A glimpse of what your outdoor space could become.</p>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {SPACE_FILTERS.map((f) => {
                const on = spaceFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setSpaceFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
                      on ? "bg-[#000F1B] text-white border-[#000F1B]" : "bg-white text-[#111111]/70 border-black/10 hover:border-[#FF6600] hover:text-[#FF6600]"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Masonry-style Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((item, i) => (
                  <ShowcaseCard key={item.id} item={item} index={i} reduce={reduce} onOpen={() => setView(item)} />
                ))}
              </AnimatePresence>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-black/5 grid place-items-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-[#111111]/30" />
                </div>
                <h3 className="text-xl font-bold text-[#000F1B] mb-2">No projects in this category yet</h3>
                <p className="text-sm text-[#111111]/60">Try another filter or view all our work.</p>
              </div>
            )}

            {/* Coming Soon: Packages Teaser */}
            <div className="mt-16 bg-white rounded-3xl border border-black/5 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600] mb-2">What We Offer</div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#000F1B] mb-2">Full-service landscape design & maintenance</h3>
                  <p className="text-sm text-[#111111]/60 leading-relaxed">Landscape packages coming soon. For now, tell us what you're dreaming of — we'll build a custom quote just for you.</p>
                </div>
                <button onClick={() => handleWhatsApp()} className="shrink-0 inline-flex items-center gap-2 bg-[#000F1B] hover:bg-[#FF6600] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition cursor-pointer">
                  <MessageCircle className="w-4 h-4" /> Talk to Us
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-6 border-t border-black/5">
                {OFFERINGS.map((o, idx) => {
                  const Icon = o.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5 p-2">
                      <div className="w-9 h-9 rounded-lg bg-[#FF6600]/10 grid place-items-center shrink-0">
                        <Icon className="w-4 h-4 text-[#FF6600]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#000F1B] truncate">{o.label}</div>
                        <div className="text-[9px] text-[#111111]/50 truncate">{o.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ===================== CTA ===================== */}
        <section className="bg-[#000F1B] text-white py-20 md:py-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">A house is what you live in.<br /><span className="text-[#FF6600]">A garden is what you live with.</span></h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
              Whether it's a small balcony or a sprawling estate, every outdoor space deserves thoughtful design. Talk to our landscape team about your vision.
            </p>
            <button onClick={() => handleWhatsApp()}
              className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] shadow-[0_0_20px_rgba(255,90,0,0.3)] text-white px-8 py-4 rounded-full font-bold text-sm transition hover:-translate-y-0.5 cursor-pointer">
              Talk to Our Landscape Team <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <ShowcaseModal view={view} setView={setView} onChat={handleWhatsApp} />
    </div>
  );
}

/* ============================================================================
   SHOWCASE CARD
============================================================================ */
function ShowcaseCard({ item, index, reduce, onOpen }) {
  return (
    <motion.article layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.45, delay: index * 0.04 }}
      className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-xl hover:border-black/15 transition-all duration-300 group cursor-pointer"
      onClick={onOpen}>

      <div className="relative aspect-[4/5] overflow-hidden bg-[#000F1B]">
        <img src={item.image} alt={item.title} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition duration-700 ease-out group-hover:scale-105 opacity-95 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Style tag top-left */}
        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[#000F1B] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
          {item.style}
        </span>

        {/* Year */}
        <span className="absolute top-3 right-3 bg-[#FF6600] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
          {item.year}
        </span>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-lg font-bold leading-tight mb-1.5">{item.title}</h3>
          <div className="flex items-center gap-3 text-[10px] text-white/80 font-semibold">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#FF6600]" /> {item.location}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-1"><Ruler className="w-3 h-3 text-[#FF6600]" /> {item.coverage}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ============================================================================
   SHOWCASE MODAL (Lightbox)
============================================================================ */
function ShowcaseModal({ view, setView, onChat }) {
  const item = view;

  useEffect(() => {
    if (!view) return;
    const onKey = (e) => { if (e.key === "Escape") setView(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [view, setView]);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView(null)} className="absolute inset-0 bg-[#000F1B]/90 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-5xl h-[90vh] lg:h-[680px] bg-white rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-black/10">

            {/* Left: Image */}
            <div className="relative lg:w-[55%] h-[45%] lg:h-full bg-black">
              <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Right: Details */}
            <div className="relative lg:w-[45%] flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 flex flex-col bg-white">
              <button onClick={() => setView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center cursor-pointer transition z-10"><X className="w-4 h-4 text-[#000F1B]" /></button>

              <div className="pt-4 mb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-[#000F1B] text-white px-3 py-1 rounded-md text-xs font-bold">{item.style}</span>
                  <span className="bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600] px-3 py-1 rounded-md text-xs font-bold">{item.space}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#000F1B] leading-tight mb-2">{item.title}</h3>
                <div className="flex items-center gap-4 text-sm text-[#111111]/60 font-semibold">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#FF6600]" /> {item.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#FF6600]" /> {item.year}</span>
                </div>
              </div>

              <p className="text-sm text-[#000F1B]/80 leading-relaxed mb-6 italic border-l-2 border-[#FF6600] pl-4 bg-[#F9FAFB] py-3 rounded-r-xl">"{item.description}"</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Coverage</div>
                  <div className="text-sm font-bold text-[#000F1B] flex items-center justify-center gap-1"><Ruler className="w-3.5 h-3.5 text-[#FF6600]" /> {item.coverage}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Space Type</div>
                  <div className="text-sm font-bold text-[#000F1B]">{item.space}</div>
                </div>
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3 flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5" /> Featured Plants</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {item.plants.map((p) => (
                  <span key={p} className="px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 inline-flex items-center gap-1.5">
                    <Sprout className="w-3 h-3" /> {p}
                  </span>
                ))}
              </div>

              <div className="mt-auto">
                <button onClick={() => { onChat(item); setView(null); }}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                  <MessageCircle className="w-5 h-5 fill-current" /> I Want Something Like This
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}