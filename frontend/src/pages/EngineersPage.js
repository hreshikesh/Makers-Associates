import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Star, ShieldCheck, MapPin, Search, X,
  MessageCircle, Power, Images, Zap, HardHat, FileText, Award, Ruler
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SeismicZoneChecker from "@/components/site/SeismicZoneChecker";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

/* ============================================================================
   DATA
============================================================================ */
import { ENGINEERS } from "./data/EngineerData";
const SPECIALIZATIONS = ["Structural", "MEP", "Geotechnical", "Site Supervision", "Civil"];
const CERTIFICATIONS = ["IIT Alumnus", "PE Licensed", "Chartered", "ISO Auditor"];
const PROJECT_TYPES = ["Residential", "Commercial", "High-Rise", "Industrial"];

export default function EngineersPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [spec, setSpec] = useState("");
  const [cert, setCert] = useState("");
  const [ptype, setPtype] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(null);

  const filtering = Boolean(spec || cert || ptype);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENGINEERS
      .filter((p) => !q || [p.name, p.firm, p.specialization, p.location].some((s) => s.toLowerCase().includes(q)))
      .map((p) => {
        let got = 0, max = 0;
        if (spec) { max += 50; if (p.specialization === spec) got += 50; }
        if (cert) { 
          max += 30;
          const matches = p.credentials.some(c => 
            (cert === "IIT Alumnus" && c.includes("IIT")) ||
            (cert === "PE Licensed" && c.includes("PE")) ||
            (cert === "Chartered" && p.badge.includes("Chartered")) ||
            (cert === "ISO Auditor" && c.includes("ISO"))
          );
          if (matches) got += 30;
        }
        if (ptype) { max += 20; if (p.projectTypes.includes(ptype)) got += 20; }
        return { ...p, score: max ? Math.round((got / max) * 100) : null };
      })
      .filter((p) => p.score === null || p.score >= 40)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.rating - a.rating);
  }, [spec, cert, ptype, query]);

  const clear = () => { setSpec(""); setCert(""); setPtype(""); setQuery(""); };

  const handleWhatsApp = (pro) => {
    const text = encodeURIComponent(`Hi ${pro.name.split(" ")[1]}, I found your profile on ConstructONS™. I need engineering consultation for my ${pro.specialization.toLowerCase()} requirements. Can we discuss?`);
    window.open(`https://wa.me/${pro.phone}?text=${text}`, "_blank", "noopener");
  };

  const totalProjects = ENGINEERS.reduce((n, p) => n + p.projects, 0);
  const avgExp = Math.round(ENGINEERS.reduce((n, p) => n + parseInt(p.experience), 0) / ENGINEERS.length);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://constructons.com/marketplace/engineers#webpage",
        "url": "https://constructons.com/marketplace/engineers",
        "name": "Structural, Geotechnical & MEP Civil Engineers",
        "description": "Discover chartered structural engineers, soil test specialists, and MEP advisors for stable residential construction."
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
            "item": "https://constructons.com/marketplace/engineers"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Engineers",
            "item": "https://constructons.com/marketplace/engineers"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] text-[#000F1B] selection:bg-[#FF6600] selection:text-white flex flex-col">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
      
      <SEO
        title="Chartered Structural Engineers & MEP Consultants"
        description="Hire certified structural engineers, MEP planners, and geotechnical surveyors. Match by PE License, IIT Alumnus credentials, and use our seismic zone validator tool."
        canonical="/marketplace/engineers"
        keywords="structural engineers India, geotechnical soil testing, MEP designers, chartered civil engineer, residential structural blueprints, seismic code analysis"
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
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF6600] uppercase">Engineering Bureau</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  The minds who make sure your home <br className="hidden lg:block" /> <em className="text-[#FF6600] not-italic">stands strong</em> for the next 100 years.
                </h1>
                <p className="mt-6 text-base md:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Vetted structural, MEP, geotechnical & site engineers — the people behind every column, beam, and load calculation of a well-built home.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                  <button onClick={() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] transition px-8 py-4 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5 cursor-pointer">
                    Browse Engineers <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-8 text-left">
                    {[[`${totalProjects}+`, "Projects Certified"], [`${avgExp}yrs`, "Avg. Experience"]].map(([n, l]) => (
                      <div key={l}>
                        <div className="text-2xl font-black text-white">{n}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Blueprint/Technical Grid Instead of Photos */}
            <div className="lg:col-span-5 hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: Ruler, label: "Floor Plans", sub: "IS-Compliant Drawings" },
                { icon: HardHat, label: "Load Analysis", sub: "Structural Calc." },
                { icon: Zap, label: "MEP Schematics", sub: "Mech · Elec · Plumb" },
                { icon: FileText, label: "Soil Reports", sub: "Geotech Certified" }
              ].map((t, i) => {
                const Icon = t.icon;
                return (
                  <motion.div key={i}
                    initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className={`rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden hover:border-[#FF6600]/40 transition ${i % 2 ? "mt-12" : ""} aspect-square`}>
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(to right,#FF6600 1px,transparent 1px),linear-gradient(to bottom,#FF6600 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-[#FF6600]/15 grid place-items-center border border-[#FF6600]/20">
                        <Icon className="w-6 h-6 text-[#FF6600]" />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="text-sm font-bold text-white">{t.label}</div>
                      <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mt-1">{t.sub}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== SEISMIC ZONE CHECKER ===================== */}
        <section className="py-16 md:py-28 bg-white border-b border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-10 md:mb-12 text-center md:text-left mx-auto md:mx-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4">
                <ShieldCheck className="w-3.5 h-3.5" /> Live Compliance Tool
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000F1B] mb-4">
                Before you build,<br /> know what your land <span className="text-[#FF6600]">demands.</span>
              </h2>
              <p className="text-sm md:text-base text-[#111111]/60 leading-relaxed">
                India is divided into four seismic zones under IS 1893:2016. Enter your PIN code to instantly see your zone, risk level, and the specific structural precautions your engineer is required to design for.
              </p>
            </div>

            <SeismicZoneChecker />
          </div>
        </section>

        {/* ===================== DIRECTORY ===================== */}
        <section id="directory" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#000F1B] tracking-tight">Find your engineer</h2>
                <p className="text-sm text-[#111111]/60 mt-2">Filter by specialization, credentials, or project type. Results re-rank by how closely they fit.</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, firm, or city..."
                  className="w-full bg-white border border-black/10 rounded-full pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6600] shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-black/5 p-5 md:p-6 mb-10 space-y-5 shadow-sm">
              <FilterRow label="Specialization" options={SPECIALIZATIONS} value={spec} onChange={setSpec} />
              <FilterRow label="Certifications" options={CERTIFICATIONS} value={cert} onChange={setCert} />
              <FilterRow label="Project Type" options={PROJECT_TYPES} value={ptype} onChange={setPtype} />

              {(filtering || query) && (
                <div className="flex items-center justify-between pt-4 border-t border-black/5 text-xs font-bold text-[#111111]/50 uppercase tracking-wider">
                  <span>Showing {results.length} of {ENGINEERS.length} engineers</span>
                  <button onClick={clear} className="text-[#FF6600] hover:text-[#FF0000] flex items-center gap-1 cursor-pointer"><X className="w-3.5 h-3.5" /> Clear all</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {results.map((pro, i) => (
                  <EngineerCard key={pro.id} pro={pro} index={i} reduce={reduce}
                    onOpen={(idx = 0) => setView({ pro, index: idx })} onChat={() => handleWhatsApp(pro)} />
                ))}
              </AnimatePresence>
            </div>

            {results.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-black/5 grid place-items-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#111111]/30" />
                </div>
                <h3 className="text-xl font-bold text-[#000F1B] mb-2">No engineer fits all of that</h3>
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Design is only half the story. <br /><span className="text-[#FF6600]">Great engineering makes it last generations.</span></h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
              Once your structural drawings are approved, the ConstructONS™ execution team ensures every column, beam, and connection is built exactly to code — with third-party quality audits at every stage.
            </p>
            <button onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] shadow-[0_0_20px_rgba(255,90,0,0.3)] text-white px-8 py-4 rounded-full font-bold text-sm transition hover:-translate-y-0.5 cursor-pointer">
              Get an Engineer Recommendation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <CredentialsModal view={view} setView={setView} onChat={handleWhatsApp} />
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
   ENGINEER CARD
============================================================================ */
function EngineerCard({ pro, index, reduce, onOpen, onChat }) {
  return (
    <motion.article layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.45, delay: index * 0.04 }}
      className="bg-white rounded-3xl overflow-hidden border border-black/5 flex flex-col group shadow-sm hover:shadow-xl hover:border-black/15 transition-all duration-300">

      {/* Technical Stat Band */}
      <div className="relative bg-[#000F1B] p-5 md:p-6 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "25px 25px" }} />
        
        {pro.score !== null && (
          <span className="absolute top-4 right-4 bg-[#FF6600] text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5 z-10">
            <Zap className="w-3.5 h-3.5 fill-current" /> {pro.score}% Match
          </span>
        )}

        <div className="relative z-10 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Certified</div>
            <div className="text-lg font-black text-white">{pro.projects}</div>
            <div className="text-[9px] text-white/60 font-semibold">Projects</div>
          </div>
          <div className="border-l border-white/10 pl-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Zone</div>
            <div className="text-lg font-black text-[#FF6600]">{pro.zoneCoverage.split(" ")[1] || "All"}</div>
            <div className="text-[9px] text-white/60 font-semibold">Coverage</div>
          </div>
          <div className="border-l border-white/10 pl-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Experience</div>
            <div className="text-lg font-black text-white">{pro.experience}</div>
            <div className="text-[9px] text-white/60 font-semibold">Practice</div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-7 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FF6600]/20 shadow-md shrink-0">
            <img src={pro.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-[#000F1B] leading-tight mb-0.5">{pro.name}</h3>
            <div className="text-sm font-semibold text-[#FF6600] truncate">{pro.firm}</div>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0 mt-1.5">
              <ShieldCheck className="w-3 h-3" /> {pro.badge}
            </span>
          </div>
        </div>

        {/* Credentials */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {pro.credentials.map((c) => (
            <span key={c} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#F5F6F8] border border-black/5 text-[#000F1B] uppercase tracking-wider inline-flex items-center gap-1">
              <Award className="w-2.5 h-2.5 text-[#FF6600]" /> {c}
            </span>
          ))}
        </div>

        {/* Specialization chip */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#000F1B] text-white inline-flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-[#FF6600]" /> {pro.specialization}
          </span>
          {pro.projectTypes.map((s) => <span key={s} className="px-3 py-1 rounded-md text-xs font-semibold border border-black/10 text-[#111111]/70">{s}</span>)}
        </div>

        <p className="text-sm text-[#111111]/70 leading-relaxed line-clamp-2 mb-5 flex-1 italic border-l-2 border-[#FF6600]/40 pl-3">"{pro.philosophy}"</p>

        <div className="flex items-center justify-between mb-5 bg-[#F9FAFB] border border-black/5 p-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Rating</span>
            <div className="flex items-center gap-1 text-sm font-bold text-[#000F1B]">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" /> {pro.rating}
            </div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Codes</span>
            <div className="text-sm font-bold text-[#000F1B]">{pro.isCodes.length} IS</div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Location</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#FF6600]" /> {pro.location.split(",")[0]}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button onClick={() => onOpen(0)} className="py-3.5 rounded-xl bg-[#F5F6F8] border border-black/5 hover:bg-[#000F1B] hover:text-white text-[#000F1B] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
            <FileText className="w-4 h-4" /> View Credentials
          </button>
          <button onClick={onChat} className="py-3.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <MessageCircle className="w-4 h-4 fill-current" /> Chat to Consult
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ============================================================================
   CREDENTIALS MODAL
============================================================================ */
function CredentialsModal({ view, setView, onChat }) {
  const pro = view?.pro;
  const [i, setI] = useState(0);
  useEffect(() => { if (view) setI(view.index); }, [view]);

  const step = useCallback((d) => pro && setI((n) => (n + d + pro.techImages.length) % pro.techImages.length), [pro]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${pro.name} credentials`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView(null)} className="absolute inset-0 bg-[#000F1B]/90 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-6xl h-[90vh] lg:h-[700px] bg-white rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-black/10">

            {/* Left: Tech Snapshots */}
            <div className="relative lg:w-[55%] h-1/2 lg:h-full bg-black flex flex-col">
              <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.img key={i} src={pro.techImages[i]} alt={`${pro.firm} technical snapshot ${i + 1}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover" />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Tech Label */}
                <div className="absolute top-4 left-4 bg-[#FF6600] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Technical Documentation
                </div>

                <button onClick={() => step(-1)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/90 grid place-items-center text-white hover:text-[#000F1B] transition cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                <button onClick={() => step(1)} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/90 grid place-items-center text-white hover:text-[#000F1B] transition cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
                <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur text-white px-4 py-2 rounded-lg">{i + 1} / {pro.techImages.length}</span>
              </div>
              <div className="flex gap-2 p-3 bg-[#000F1B]">
                {pro.techImages.map((img, n) => (
                  <button key={n} onClick={() => setI(n)} aria-label={`View doc ${n + 1}`}
                    className={`h-16 flex-1 rounded-xl overflow-hidden border-2 transition cursor-pointer ${n === i ? "border-[#FF6600]" : "border-transparent opacity-50 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Credentials Panel */}
            <div className="relative lg:w-[45%] flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 flex flex-col bg-white">
              <button onClick={() => setView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center cursor-pointer transition z-10"><X className="w-4 h-4 text-[#000F1B]" /></button>

              <div className="flex items-center gap-4 mb-6 pt-4">
                <img src={pro.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#FF6600]/20 shadow-sm" />
                <div>
                  <h3 className="text-2xl font-bold text-[#000F1B] leading-tight mb-1">{pro.name}</h3>
                  <div className="text-sm font-semibold text-[#FF6600]">{pro.firm}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-[#000F1B] text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-[#FF6600]" /> {pro.specialization}
                </span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />{pro.badge}</span>
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2">Engineering Philosophy</h4>
              <p className="text-sm leading-relaxed text-[#000F1B]/80 mb-6 italic border-l-2 border-[#FF6600] pl-4 bg-[#F9FAFB] py-3 rounded-r-xl">"{pro.philosophy}"</p>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3">Credentials</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {pro.credentials.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#F5F6F8] border border-black/10 text-[#000F1B] inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#FF6600]" /> {c}
                  </span>
                ))}
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3">Compliance Standards</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {pro.isCodes.map((code) => (
                  <span key={code} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600] inline-flex items-center gap-1.5 font-mono">
                    <FileText className="w-3.5 h-3.5" /> {code}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Rating</div>
                  <div className="text-base font-bold text-[#000F1B] flex items-center justify-center gap-1"><Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" />{pro.rating}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Projects</div>
                  <div className="text-base font-bold text-[#000F1B]">{pro.projects}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Zones</div>
                  <div className="text-base font-bold text-[#000F1B]">{pro.zoneCoverage.split(" ")[1] || "All"}</div>
                </div>
              </div>

              <div className="text-sm font-semibold text-[#000F1B]/60 mb-6 space-y-2">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6600]" /> Based in {pro.location}</div>
                <div className="flex items-center gap-2"><HardHat className="w-4 h-4 text-[#FF6600]" /> Handles: {pro.projectTypes.join(", ")}</div>
              </div>

              <div className="mt-auto">
                <button onClick={() => { onChat(pro); setView(null); }}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                  <MessageCircle className="w-5 h-5 fill-current" /> Chat on WhatsApp to Consult
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}