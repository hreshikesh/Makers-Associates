import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Star, ShieldCheck, MapPin, Search, X,
  MessageCircle, Power, Palette, PaintRoller, Clock, Home, Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import StylePersonalityQuiz from "@/components/site/StylePersonalityQuiz";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

import { INTERIOR_DESIGNERS } from "./data/InteriorDesignerData";
const STYLES = ["Minimalist", "Bohemian", "Modern Indian", "Scandinavian", "Luxe Contemporary", "Rustic"];
const ROOM_FOCUS = ["Full Home", "Kitchen & Dining", "Bedroom", "Living Area", "Commercial Space"];
const BUDGETS = ["Economy", "Mid-Range", "Premium", "Luxury"];

export default function InteriorDesignersPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [style, setStyle] = useState("");
  const [room, setRoom] = useState("");
  const [budget, setBudget] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(null);

  const filtering = Boolean(style || room || budget);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTERIOR_DESIGNERS
      .filter((p) => !q || [p.name, p.studio, p.style, p.location].some((s) => s.toLowerCase().includes(q)))
      .map((p) => {
        let got = 0, max = 0;
        if (style) { max += 50; if (p.style === style) got += 50; }
        if (room) { max += 30; if (p.roomFocus.includes(room)) got += 30; }
        if (budget) { max += 20; if (p.budget === budget) got += 20; }
        return { ...p, score: max ? Math.round((got / max) * 100) : null };
      })
      .filter((p) => p.score === null || p.score >= 40)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.rating - a.rating);
  }, [style, room, budget, query]);

  const clear = () => { setStyle(""); setRoom(""); setBudget(""); setQuery(""); };

  const handleQuizMatch = (matchStyles) => {
    if (matchStyles?.length) setStyle(matchStyles[0]);
  };

  const handleWhatsApp = (pro) => {
    const text = encodeURIComponent(`Hi ${pro.name.split(" ")[0]}, I found your studio on ConstructONS™. I love your ${pro.style} work and would like to discuss styling my home.`);
    window.open(`https://wa.me/${pro.phone}?text=${text}`, "_blank", "noopener");
  };

  const totalProjects = INTERIOR_DESIGNERS.reduce((n, p) => n + p.projects, 0);
  const avgTurnaround = "8–12 wks";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://constructons.com/marketplace/interior#webpage",
        "url": "https://constructons.com/marketplace/interior",
        "name": "Residential Interior Designers & Design Studios",
        "description": "Discover verified residential interior designers, modular kitchen planners, and full home styling studios."
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
            "item": "https://constructons.com/marketplace/interior"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Interior Designers",
            "item": "https://constructons.com/marketplace/interior"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] text-[#000F1B] selection:bg-[#FF6600] selection:text-white flex flex-col">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
      
      <SEO
        title="Residential Interior Designers & Studio Stylists"
        description="Hire vetted interior designers and modular kitchen specialists. Filter by Minimalist, Scandinavian, and Modern Indian styles with our interactive mood board selector."
        canonical="/marketplace/interior"
        keywords="interior designers India, modular kitchen planners, living room styling, luxury home decorators, scandinavian interior design, custom home decor"
        structuredData={structuredData}
      />

      <Header />

      <main className="flex-1">
        {/* ===================== HERO ===================== */}
        <section className="relative bg-[#000F1B] text-white pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          
          {/* Warmer glow: amber + orange blend for interior warmth */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-[30rem] h-[30rem] bg-[#FF6600]/15 blur-[120px] rounded-full pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-[25rem] h-[25rem] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center z-10">
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm mx-auto lg:mx-0">
                  <BrandLockup tone="dark" size="sm" />
                  <span className="w-px h-3 bg-white/20 mx-1" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF6600] uppercase">Interior Studio</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  The stylists who turn a house <br className="hidden lg:block" /> into <em className="text-[#FF6600] not-italic">the home</em> you'll never want to leave.
                </h1>
                <p className="mt-6 text-base md:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Vetted interior designers who blend function, mood, and Indian sensibilities. Find your aesthetic soulmate — then let them make it real.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                  <button onClick={() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] transition px-8 py-4 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5 cursor-pointer">
                    Browse Designers <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-8 text-left">
                    {[[`${totalProjects}+`, "Homes Styled"], [avgTurnaround, "Avg. Turnaround"]].map(([n, l]) => (
                      <div key={l}>
                        <div className="text-2xl font-black text-white">{n}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* MOOD BOARD MOSAIC */}
            <div className="lg:col-span-5 hidden lg:grid grid-cols-2 gap-4">
              {[INTERIOR_DESIGNERS[0], INTERIOR_DESIGNERS[3], INTERIOR_DESIGNERS[1], INTERIOR_DESIGNERS[2]].map((p, i) => (
                <motion.div key={p.id}
                  initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`overflow-hidden rounded-2xl bg-white/5 border border-white/10 ${i % 2 ? "mt-12" : ""} ${i < 2 ? "aspect-[3/4]" : "aspect-[4/5]"} group relative`}>
                  <img src={p.moodImages[0]} alt={`${p.style} interior`} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <div className="absolute bottom-3 left-3 text-white text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">
                    {p.style}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== STYLE PERSONALITY QUIZ ===================== */}
        <section className="py-16 md:py-28 bg-white border-b border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-10 md:mb-12 text-center md:text-left mx-auto md:mx-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4">
                <PaintRoller className="w-3.5 h-3.5" /> Interactive Discovery Tool
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000F1B] mb-4">
                Not sure what your style is?<br /> <span className="text-[#FF6600]">Take the quiz.</span>
              </h2>
              <p className="text-sm md:text-base text-[#111111]/60 leading-relaxed">
                Four visual questions. Sixty seconds. We'll tell you which interior aesthetic truly fits how you live — and instantly match you with designers who bring that vision to life.
              </p>
            </div>

            <StylePersonalityQuiz onMatchFound={handleQuizMatch} />
          </div>
        </section>

        {/* ===================== DIRECTORY ===================== */}
        <section id="directory" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#000F1B] tracking-tight">Find your designer</h2>
                <p className="text-sm text-[#111111]/60 mt-2">Filter by style, room focus, or budget. Results re-rank by how closely they fit.</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, studio, or city..."
                  className="w-full bg-white border border-black/10 rounded-full pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6600] shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-black/5 p-5 md:p-6 mb-10 space-y-5 shadow-sm">
              <FilterRow label="Design Style" options={STYLES} value={style} onChange={setStyle} />
              <FilterRow label="Room Focus" options={ROOM_FOCUS} value={room} onChange={setRoom} />
              <FilterRow label="Budget Tier" options={BUDGETS} value={budget} onChange={setBudget} />

              {(filtering || query) && (
                <div className="flex items-center justify-between pt-4 border-t border-black/5 text-xs font-bold text-[#111111]/50 uppercase tracking-wider">
                  <span>Showing {results.length} of {INTERIOR_DESIGNERS.length} designers</span>
                  <button onClick={clear} className="text-[#FF6600] hover:text-[#FF0000] flex items-center gap-1 cursor-pointer"><X className="w-3.5 h-3.5" /> Clear all</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {results.map((pro, i) => (
                  <DesignerCard key={pro.id} pro={pro} index={i} reduce={reduce}
                    onOpen={(idx = 0) => setView({ pro, index: idx })} onChat={() => handleWhatsApp(pro)} />
                ))}
              </AnimatePresence>
            </div>

            {results.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-black/5 grid place-items-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#111111]/30" />
                </div>
                <h3 className="text-xl font-bold text-[#000F1B] mb-2">No designer fits all of that</h3>
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">A beautiful structure <br />deserves an <span className="text-[#FF6600]">equally beautiful soul.</span></h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
              Great interiors are what turn 'my house' into 'my home.' Once your designer's vision is locked, the ConstructONS™ execution team makes every detail come alive — on time, on budget, exactly as imagined.
            </p>
            <button onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] shadow-[0_0_20px_rgba(255,90,0,0.3)] text-white px-8 py-4 rounded-full font-bold text-sm transition hover:-translate-y-0.5 cursor-pointer">
              Get a Designer Recommendation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <MoodBoardModal view={view} setView={setView} onChat={handleWhatsApp} />
    </div>
  );
}

/* ============================================================================
   FILTER ROW
============================================================================ */
function FilterRow({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="md:w-32 text-xs font-bold uppercase tracking-wider text-[#111111]/50 shrink-0">{label}</div>
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
   DESIGNER CARD
============================================================================ */
function DesignerCard({ pro, index, reduce, onOpen, onChat }) {
  return (
    <motion.article layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.45, delay: index * 0.04 }}
      className="bg-white rounded-3xl overflow-hidden border border-black/5 flex flex-col group shadow-sm hover:shadow-xl hover:border-black/15 transition-all duration-300">

      {/* Mood Photo with Style & Budget overlay */}
      <button onClick={() => onOpen(0)} className="relative block h-64 w-full overflow-hidden bg-[#000F1B] cursor-pointer" aria-label={`Open ${pro.name}'s mood board`}>
        <img src={pro.moodImages[0]} alt={`${pro.style} by ${pro.studio}`} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition duration-700 ease-out group-hover:scale-105 opacity-95 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {pro.score !== null && (
          <span className="absolute top-4 right-4 bg-[#FF6600] text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5 z-10">
            <PaintRoller className="w-3.5 h-3.5 fill-current" /> {pro.score}% Match
          </span>
        )}

        {/* Bottom overlay: style + budget */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="bg-white/95 backdrop-blur text-[#000F1B] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">{pro.style}</span>
          <span className="bg-[#000F1B]/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg">{pro.budget}</span>
        </div>
      </button>

      {/* SIGNATURE COLOR PALETTE STRIP */}
      <div className="flex h-2">
        {pro.palette.map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} title={c} />
        ))}
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col relative">
        <div className="absolute -top-10 left-6 w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white z-10">
          <img src={pro.avatar} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex justify-between items-start mt-10 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-[#000F1B] leading-tight mb-1 truncate">{pro.name}</h3>
            <div className="text-sm font-semibold text-[#FF6600] truncate">{pro.studio}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0 shadow-sm ml-2">
            <ShieldCheck className="w-3.5 h-3.5" /> {pro.badge}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {pro.roomFocus.map((r) => (
            <span key={r} className="px-3 py-1 rounded-md text-xs font-semibold bg-[#F5F6F8] border border-black/5 text-[#000F1B] inline-flex items-center gap-1.5">
              <Home className="w-3 h-3 text-[#FF6600]" /> {r}
            </span>
          ))}
        </div>

        <p className="text-sm text-[#111111]/70 leading-relaxed line-clamp-2 mb-5 flex-1 italic border-l-2 border-[#FF6600]/40 pl-3">"{pro.philosophy}"</p>

        {/* Materials strip */}
        <div className="mb-5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2 flex items-center gap-1">
            <Palette className="w-3 h-3" /> Signature Materials
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pro.materials.map((m) => (
              <span key={m} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F9FAFB] border border-black/5 text-[#111111]/70">{m}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 bg-[#F9FAFB] border border-black/5 p-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Rating</span>
            <div className="flex items-center gap-1 text-sm font-bold text-[#000F1B]">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" /> {pro.rating}
            </div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Homes</span>
            <div className="text-sm font-bold text-[#000F1B]">{pro.projects}</div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Turnaround</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><Clock className="w-3 h-3 text-[#FF6600]" /> {pro.turnaround}</div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">City</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><MapPin className="w-3 h-3 text-[#FF6600]" /> {pro.location.split(",")[0]}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button onClick={() => onOpen(0)} className="py-3.5 rounded-xl bg-[#F5F6F8] border border-black/5 hover:bg-[#000F1B] hover:text-white text-[#000F1B] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
            <Palette className="w-4 h-4" /> View Mood Board
          </button>
          <button onClick={onChat} className="py-3.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <MessageCircle className="w-4 h-4 fill-current" /> Chat to Style
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ============================================================================
   MOOD BOARD MODAL
============================================================================ */
function MoodBoardModal({ view, setView, onChat }) {
  const pro = view?.pro;
  const [i, setI] = useState(0);
  useEffect(() => { if (view) setI(view.index); }, [view]);

  const step = useCallback((d) => pro && setI((n) => (n + d + pro.moodImages.length) % pro.moodImages.length), [pro]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${pro.name} mood board`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView(null)} className="absolute inset-0 bg-[#000F1B]/90 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-6xl h-[90vh] lg:h-[720px] bg-white rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-black/10">

            {/* Left: Mood Gallery */}
            <div className="relative lg:w-[60%] h-1/2 lg:h-full bg-black flex flex-col">
              <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.img key={i} src={pro.moodImages[i]} alt={`${pro.studio} interior ${i + 1}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover" />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-4 left-4 bg-[#FF6600] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <PaintRoller className="w-3.5 h-3.5" /> Mood Board
                </div>

                <button onClick={() => step(-1)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/90 grid place-items-center text-white hover:text-[#000F1B] transition cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                <button onClick={() => step(1)} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/90 grid place-items-center text-white hover:text-[#000F1B] transition cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
                <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur text-white px-4 py-2 rounded-lg">{i + 1} / {pro.moodImages.length}</span>
              </div>
              <div className="flex gap-2 p-3 bg-[#000F1B]">
                {pro.moodImages.map((img, n) => (
                  <button key={n} onClick={() => setI(n)} aria-label={`View photo ${n + 1}`}
                    className={`h-16 flex-1 rounded-xl overflow-hidden border-2 transition cursor-pointer ${n === i ? "border-[#FF6600]" : "border-transparent opacity-50 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Details Panel */}
            <div className="relative lg:w-[40%] flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 flex flex-col bg-white">
              <button onClick={() => setView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center cursor-pointer transition z-10"><X className="w-4 h-4 text-[#000F1B]" /></button>

              <div className="flex items-center gap-4 mb-6 pt-4">
                <img src={pro.avatar} alt="" className="w-16 h-16 rounded-3xl object-cover border border-black/10 shadow-sm" />
                <div>
                  <h3 className="text-2xl font-bold text-[#000F1B] leading-tight mb-1">{pro.name}</h3>
                  <div className="text-sm font-semibold text-[#FF6600]">{pro.studio}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-[#000F1B] text-white px-3 py-1.5 rounded-md text-xs font-bold">{pro.style}</span>
                <span className="bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold">{pro.budget} Tier</span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />{pro.badge}</span>
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2">Design Philosophy</h4>
              <p className="text-sm leading-relaxed text-[#000F1B]/80 mb-6 italic border-l-2 border-[#FF6600] pl-4 bg-[#F9FAFB] py-3 rounded-r-xl">"{pro.philosophy}"</p>

              {/* Signature Palette */}
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Signature Palette</h4>
              <div className="flex gap-2 mb-6">
                {pro.palette.map((c, idx) => (
                  <div key={idx} className="flex-1 group relative">
                    <div className="h-16 rounded-xl border border-black/5 shadow-sm" style={{ background: c }} />
                    <div className="text-[9px] font-bold text-center text-[#111111]/50 mt-1 font-mono">{c}</div>
                  </div>
                ))}
              </div>

              {/* Materials */}
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3">Signature Materials</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {pro.materials.map((m) => (
                  <span key={m} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#F5F6F8] border border-black/10 text-[#000F1B] inline-flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-[#FF6600] fill-current" /> {m}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Rating</div>
                  <div className="text-base font-bold text-[#000F1B] flex items-center justify-center gap-1"><Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" />{pro.rating}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Homes</div>
                  <div className="text-base font-bold text-[#000F1B]">{pro.projects}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Delivery</div>
                  <div className="text-base font-bold text-[#000F1B]">{pro.turnaround}</div>
                </div>
              </div>

              <div className="text-sm font-semibold text-[#000F1B]/60 mb-6 space-y-2">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" /> Based in {pro.location}</div>
                <div className="flex items-center gap-2"><Home className="w-4 h-4 text-[#FF6600]" /> Specializes in: {pro.roomFocus.join(", ")}</div>
              </div>

              <div className="mt-auto">
                <button onClick={() => { onChat(pro); setView(null); }}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                  <MessageCircle className="w-5 h-5 fill-current" /> Chat on WhatsApp to Style
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}