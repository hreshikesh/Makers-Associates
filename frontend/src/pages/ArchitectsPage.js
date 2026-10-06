import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Star, ShieldCheck, MapPin, Search, X,
  MessageCircle, Sun, Compass, Power, Images, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SunPathSimulator from "@/components/site/SunPathSimulator";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

/* ============================================================================
   DATA
============================================================================ */
import { ARCHITECTS } from "./data/ArchitectData";
const STYLES = ["Tropical Modernism", "Minimalist & Zen", "Classic Indian", "Contemporary Luxury"];
const VASTU = ["Strictly Compliant", "Flexible", "Not Required"];
const SCOPES = ["Villa", "Apartment", "Commercial"];

/* ============================================================================
   PAGE
============================================================================ */
export default function ArchitectsPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [style, setStyle] = useState("");
  const [vastu, setVastu] = useState("");
  const [scope, setScope] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(null); // { pro, index }

  const filtering = Boolean(style || vastu || scope);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARCHITECTS
      .filter((p) => !q || [p.name, p.firm, p.style, p.location].some((s) => s.toLowerCase().includes(q)))
      .map((p) => {
        let got = 0, max = 0;
        if (style) { max += 50; if (p.style === style) got += 50; }
        if (vastu) { max += 30; if (p.vastu === vastu) got += 30; else if (p.vastu === "Flexible" && vastu !== "Not Required") got += 15; }
        if (scope) { max += 20; if (p.scopes.includes(scope)) got += 20; }
        return { ...p, score: max ? Math.round((got / max) * 100) : null };
      })
      .filter((p) => p.score === null || p.score >= 40)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.rating - a.rating);
  }, [style, vastu, scope, query]);

  const clear = () => { setStyle(""); setVastu(""); setScope(""); setQuery(""); };

  const handleWhatsApp = (pro) => {
    const text = encodeURIComponent(`Hi ${pro.name.split(" ")[1]}, I was exploring your portfolio on ConstructONS™. I love your ${pro.style} work and would like to discuss my project.`);
    window.open(`https://wa.me/${pro.phone}?text=${text}`, "_blank", "noopener");
  };

  const totalProjects = ARCHITECTS.reduce((n, p) => n + p.projects, 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://constructons.com/marketplace/architects#webpage",
        "url": "https://constructons.com/marketplace/architects",
        "name": "Elite Residential Architects & Design Studios | ConstructONS",
        "description": "Browse and connect with vetted residential architects, Vastu planning specialists, and luxury villa designers."
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
            "item": "https://constructons.com/marketplace/architects"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Architects",
            "item": "https://constructons.com/marketplace/architects"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] text-[#000F1B] selection:bg-[#FF6600] selection:text-white flex flex-col">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
      
      <SEO
        title="Residential Architects, Elevation Designers & Vastu Planners"
        description="Connect with verified residential architects, interior designers, and elevation specialists. Filter by Tropical Modernism, Minimalist, Luxury, and custom planning styles."
        canonical="/marketplace/architects"
        keywords="home architects India, luxury villa designer, modular house planners, residential design studio, elevation designs, Vastu home design"
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
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF6600] uppercase">Architectural Studio</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  The people who decide how your home <br className="hidden lg:block" /> <em className="text-[#FF6600] not-italic">feels</em> before a brick is laid.
                </h1>
                <p className="mt-6 text-base md:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Meet the vetted architects behind India's most considered homes. Compare their style, Vastu approach, and past work—then talk to them directly.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                  <button onClick={() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] transition px-8 py-4 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5 cursor-pointer">
                    Browse Architects <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-8 text-left">
                    {[[`${totalProjects}+`, "Homes Designed"], ["4.8★", "Average Rating"]].map(([n, l]) => (
                      <div key={l}>
                        <div className="text-2xl font-black text-white">{n}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 hidden lg:grid grid-cols-2 gap-4">
              {[ARCHITECTS[0], ARCHITECTS[2], ARCHITECTS[1], ARCHITECTS[3]].map((p, i) => (
                <motion.div key={p.id}
                  initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`overflow-hidden rounded-2xl bg-white/5 border border-white/10 ${i % 2 ? "mt-12" : ""} ${i < 2 ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                  <img src={p.images[0]} alt={`${p.style} project`} className="w-full h-full object-cover hover:scale-105 transition duration-700" loading="lazy" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== SUN PATH SIMULATOR (VASTU) ===================== */}
        <section className="py-16 md:py-28 bg-white border-b border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-10 md:mb-12 text-center md:text-left mx-auto md:mx-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4">
                <Sun className="w-3.5 h-3.5" /> Interactive Design Tool
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000F1B] mb-4">
                Good architects design walls.<br /> Great ones design <span className="text-[#FF6600]">light.</span>
              </h2>
              <p className="text-sm md:text-base text-[#111111]/60 leading-relaxed">
                Choose which way your plot faces, pick a date, then drag through the day. Rotate the 3D model to see which façade catches the sun, when, and how much. This is the spatial thinking that sits behind every Vastu-aware layout.
              </p>
            </div>

            <SunPathSimulator />
          </div>
        </section>

        {/* ===================== DIRECTORY ===================== */}
        <section id="directory" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#000F1B] tracking-tight">Find your architect</h2>
                <p className="text-sm text-[#111111]/60 mt-2">Filter by style, vastu, or scope. Results re-rank by how closely they fit.</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, firm, or location..."
                  className="w-full bg-white border border-black/10 rounded-full pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6600] shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-black/5 p-5 md:p-6 mb-10 space-y-5 shadow-sm">
              <FilterRow label="Design Style" options={STYLES} value={style} onChange={setStyle} />
              <FilterRow label="Vastu Needs" options={VASTU} value={vastu} onChange={setVastu} />
              <FilterRow label="Project Scope" options={SCOPES} value={scope} onChange={setScope} />

              {(filtering || query) && (
                <div className="flex items-center justify-between pt-4 border-t border-black/5 text-xs font-bold text-[#111111]/50 uppercase tracking-wider">
                  <span>Showing {results.length} of {ARCHITECTS.length} architects</span>
                  <button onClick={clear} className="text-[#FF6600] hover:text-[#FF0000] flex items-center gap-1 cursor-pointer"><X className="w-3.5 h-3.5" /> Clear all</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {results.map((pro, i) => (
                  <ArchitectCard key={pro.id} pro={pro} index={i} reduce={reduce}
                    onOpen={(idx = 0) => setView({ pro, index: idx })} onChat={() => handleWhatsApp(pro)} />
                ))}
              </AnimatePresence>
            </div>

            {results.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-black/5 grid place-items-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#111111]/30" />
                </div>
                <h3 className="text-xl font-bold text-[#000F1B] mb-2">No studio fits all of that</h3>
                <p className="text-sm text-[#111111]/60 mb-6">Loosen one filter, or let us recommend someone for you.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={clear} className="px-6 py-3 rounded-full bg-[#000F1B] text-white text-sm font-bold transition hover:bg-[#FF6600] cursor-pointer">Clear filters</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================== CTA ===================== */}
        <section className="bg-[#000F1B] text-white py-20 md:py-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Design it well once. <br /><span className="text-[#FF6600]">Then we build it exactly as drawn.</span></h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
              Once your plans are final, the ConstructONS™ execution team takes over, with a single point of contact, multi-level quality checks, and every rupee visible.
            </p>
            <button onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] shadow-[0_0_20px_rgba(255,90,0,0.3)] text-white px-8 py-4 rounded-full font-bold text-sm transition hover:-translate-y-0.5 cursor-pointer">
              Get an Architect Recommendation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <PortfolioModal view={view} setView={setView} onChat={handleWhatsApp} />
    </div>
  );
}

/* ============================================================================
   FILTER ROW
============================================================================ */
function FilterRow({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="md:w-28 text-xs font-bold uppercase tracking-wider text-[#111111]/50 shrink-0">{label}</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => {
          const on = value === o;
          return (
            <button key={o} onClick={() => onChange(on ? "" : o)} aria-pressed={on}
              className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
                on ? "bg-[#000F1B] text-white border-[#000F1B]" : "bg-white text-[#111111]/70 border-black/10 hover:border-[#FF6600] hover:text-[#FF6600]"}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   ARCHITECT CARD
============================================================================ */
function ArchitectCard({ pro, index, reduce, onOpen, onChat }) {
  return (
    <motion.article layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.45, delay: index * 0.04 }}
      className="bg-white rounded-3xl overflow-hidden border border-black/5 flex flex-col group shadow-sm hover:shadow-xl hover:border-black/15 transition-all duration-300">

      <button onClick={() => onOpen(0)} className="relative block h-72 w-full overflow-hidden bg-[#000F1B] cursor-pointer" aria-label={`Open ${pro.name}'s portfolio`}>
        <img src={pro.images[0]} alt={`${pro.style} by ${pro.firm}`} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

        {pro.score !== null && (
          <span className="absolute top-4 left-4 bg-[#FF6600] text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" /> {pro.score}% Match
          </span>
        )}

        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-[#000F1B] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
          <Images className="w-4 h-4 text-[#FF6600]" /> {pro.images.length} Photos
        </span>
      </button>

      <div className="p-6 md:p-8 flex-1 flex flex-col relative">
        <div className="absolute -top-10 left-6 w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white z-10">
          <img src={pro.avatar} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex justify-between items-start mt-10 mb-4">
          <div>
            <h3 className="text-2xl font-bold text-[#000F1B] leading-tight mb-1">{pro.name}</h3>
            <div className="text-sm font-semibold text-[#FF6600]">{pro.firm}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> {pro.badge}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#F5F6F8] border border-black/5 text-[#000F1B]">{pro.style}</span>
          <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#F5F6F8] border border-black/5 text-[#000F1B] inline-flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#FF6600]" /> Vastu: {pro.vastu}
          </span>
          {pro.scopes.map((s) => <span key={s} className="px-3 py-1 rounded-md text-xs font-semibold border border-black/10 text-[#111111]/70">{s}</span>)}
        </div>

        <p className="text-sm text-[#111111]/70 leading-relaxed line-clamp-3 mb-6 flex-1">"{pro.philosophy}"</p>

        <div className="flex items-center justify-between mb-6 bg-[#F9FAFB] border border-black/5 p-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Rating</span>
            <div className="flex items-center gap-1 text-sm font-bold text-[#000F1B]">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" /> {pro.rating}
            </div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Experience</span>
            <div className="text-sm font-bold text-[#000F1B]">{pro.experience}</div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Location</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#FF6600]" /> {pro.location.split(" ")[1]}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button onClick={() => onOpen(0)} className="py-3.5 rounded-xl bg-[#F5F6F8] border border-black/5 hover:bg-[#000F1B] hover:text-white text-[#000F1B] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
            <Images className="w-4 h-4" /> View Portfolio
          </button>
          <button onClick={onChat} className="py-3.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <MessageCircle className="w-4 h-4 fill-current" /> Chat to Book
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ============================================================================
   PORTFOLIO MODAL
============================================================================ */
function PortfolioModal({ view, setView, onChat }) {
  const pro = view?.pro;
  const [i, setI] = useState(0);
  useEffect(() => { if (view) setI(view.index); }, [view]);

  const step = useCallback((d) => pro && setI((n) => (n + d + pro.images.length) % pro.images.length), [pro]);

  useEffect(() => {
    if (!view) return;
    const onKey = (e) => {
      if (e.key === "Escape") setView(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [view, step, setView]);

  return (
    <AnimatePresence>
      {pro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${pro.name} portfolio`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView(null)} className="absolute inset-0 bg-[#000F1B]/90 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-6xl h-[90vh] lg:h-[700px] bg-white rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-black/10">

            {/* Left: Gallery */}
            <div className="relative lg:w-[60%] h-1/2 lg:h-full bg-black flex flex-col">
              <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.img key={i} src={pro.images[i]} alt={`${pro.firm} project ${i + 1}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover" />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <button onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/90 grid place-items-center text-white hover:text-[#000F1B] transition cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                <button onClick={() => step(1)} aria-label="Next photo" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/90 grid place-items-center text-white hover:text-[#000F1B] transition cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
                <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur text-white px-4 py-2 rounded-lg">{i + 1} / {pro.images.length}</span>
              </div>
              <div className="flex gap-2 p-3 bg-[#000F1B]">
                {pro.images.map((img, n) => (
                  <button key={n} onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`}
                    className={`h-16 flex-1 rounded-xl overflow-hidden border-2 transition cursor-pointer ${n === i ? "border-[#FF6600]" : "border-transparent opacity-50 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Details Panel */}
            <div className="relative lg:w-[40%] flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 flex flex-col bg-white">
              <button onClick={() => setView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center cursor-pointer transition"><X className="w-4 h-4 text-[#000F1B]" /></button>

              <div className="flex items-center gap-4 mb-8 pt-4">
                <img src={pro.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-black/10 shadow-sm" />
                <div>
                  <h3 className="text-2xl font-bold text-[#000F1B] leading-tight mb-1">{pro.name}</h3>
                  <div className="text-sm font-semibold text-[#FF6600]">{pro.firm}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="bg-[#000F1B] text-white px-3 py-1.5 rounded-md text-xs font-bold">{pro.style}</span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />{pro.badge}</span>
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2">Design Philosophy</h4>
              <p className="text-sm leading-relaxed text-[#000F1B]/80 mb-8 italic border-l-2 border-[#FF6600] pl-4 bg-[#F9FAFB] py-3 rounded-r-xl">“{pro.philosophy}”</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-black/5 flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/40">Rating</div>
                  <div className="text-base font-bold text-[#000F1B] flex items-center gap-1"><Star className="w-4 h-4 text-[#F59E0B] fill-current" /> {pro.rating}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-black/5 flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/40">Projects</div>
                  <div className="text-base font-bold text-[#000F1B]">{pro.projects} Delivered</div>
                </div>
              </div>

              <div className="text-sm font-semibold text-[#000F1B]/60 mb-8 space-y-3">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" /> Operates in {pro.location}</div>
                <div className="flex items-center gap-2"><Compass className="w-4 h-4 text-[#FF6600]" /> Vastu Planning: {pro.vastu}</div>
              </div>

              <div className="mt-auto">
                <button onClick={() => { onChat(pro); setView(null); }}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                  <MessageCircle className="w-5 h-5 fill-current" /> Chat on WhatsApp to Book
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}