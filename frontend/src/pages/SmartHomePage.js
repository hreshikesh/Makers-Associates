import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Search, X, MessageCircle, Power,
  Zap, Lightbulb, Lock, Camera, Thermometer, Speaker, Blinds, Wifi,
  IndianRupee, Clock, Package, Home, Check, Cpu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SmartHomeBuilder from "@/components/site/SmartHomeBuilder";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

import { SMART_HOME_BUNDLES } from "./data/SmartHomeBundleData";

const CATEGORIES = ["Full Home Automation", "Security & Surveillance", "Lighting & Ambience", "Climate Control", "Entertainment"];
const ECOSYSTEMS = ["Amazon Alexa", "Google Home", "Apple HomeKit", "Samsung SmartThings"];
const HOME_SIZES = ["1-2 BHK", "3 BHK", "4+ BHK / Villa"];

const DEVICE_ICONS = {
  lightbulb: Lightbulb, lock: Lock, camera: Camera, thermostat: Thermometer,
  speaker: Speaker, curtain: Blinds, shield: ShieldCheck, bell: Wifi,
  siren: Wifi, strip: Lightbulb, switch: Zap, hub: Cpu, sensor: Wifi,
  fan: Wifi, tv: Camera, projector: Camera, plug: Zap
};

export default function SmartHomePage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [cat, setCat] = useState("");
  const [eco, setEco] = useState("");
  const [size, setSize] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(null);

  const filtering = Boolean(cat || eco || size);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SMART_HOME_BUNDLES
      .filter((p) => !q || [p.name, p.tagline, p.category].some((s) => s.toLowerCase().includes(q)))
      .map((p) => {
        let got = 0, max = 0;
        if (cat) { max += 50; if (p.category === cat) got += 50; }
        if (eco) { max += 30; if (p.ecosystems.includes(eco)) got += 30; }
        if (size) { max += 20; if (p.homeSizes.includes(size)) got += 20; }
        return { ...p, score: max ? Math.round((got / max) * 100) : null };
      })
      .filter((p) => p.score === null || p.score >= 40)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.priceFrom - b.priceFrom);
  }, [cat, eco, size, query]);

  const clear = () => { setCat(""); setEco(""); setSize(""); setQuery(""); };

  const handleWhatsApp = (bundle) => {
    const text = encodeURIComponent(`Hi, I'm interested in the "${bundle.name}" smart home bundle (starting ₹${bundle.priceFrom.toLocaleString("en-IN")}). Can we discuss the setup for my home?`);
    window.open(`https://wa.me/917892071052?text=${text}`, "_blank", "noopener");
  };

  const totalBundles = SMART_HOME_BUNDLES.length;
  const totalDevices = SMART_HOME_BUNDLES.reduce((n, b) => n + b.deviceCount, 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://constructons.com/marketplace/smart-home#webpage",
        "url": "https://constructons.com/marketplace/smart-home",
        "name": "Smart Home Automation Bundles & Integrations",
        "description": "Explore certified and pre-configured smart home ecosystems, voice lighting bundles, and complete home automation suites."
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
            "item": "https://constructons.com/marketplace/smart-home"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Smart Home",
            "item": "https://constructons.com/marketplace/smart-home"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] text-[#000F1B] selection:bg-[#FF6600] selection:text-white flex flex-col">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
      
      <SEO
        title="Smart Home Automation Bundles & Custom Configurator"
        description="Integrate certified smart home systems into your layout. Pick Google, Alexa, or HomeKit compatible pre-built bundles, or map room-by-room tech requirements with our builder."
        canonical="/marketplace/smart-home"
        keywords="home automation packages, smart home devices India, google home lighting, smart locks and surveillance, full home automated systems, smart home builders"
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
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF6600] uppercase">Smart Home Bureau</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  The invisible intelligence that makes your home <br className="hidden lg:block" /> <em className="text-[#FF6600] not-italic">think, save, and secure</em> itself.
                </h1>
                <p className="mt-6 text-base md:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Curated smart home ecosystems — from voice-controlled lighting to full-home automation. Pick a bundle or build your own. Installation, integration, and warranty included.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                  <button onClick={() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] transition px-8 py-4 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5 cursor-pointer">
                    Explore Bundles <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-8 text-left">
                    {[[`${totalBundles}`, "Curated Bundles"], [`${totalDevices}+`, "Devices Ready"]].map(([n, l]) => (
                      <div key={l}>
                        <div className="text-2xl font-black text-white">{n}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* DEVICE CONSTELLATION */}
            <div className="lg:col-span-5 hidden lg:block relative aspect-square max-w-md ml-auto">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6600" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#FF6600" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <line x1="200" y1="200" x2="80" y2="80" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="200" y1="200" x2="320" y2="80" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="200" y1="200" x2="80" y2="320" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="200" y1="200" x2="320" y2="320" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>

              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-[#FF6600] grid place-items-center shadow-[0_0_40px_rgba(255,90,0,0.5)]"
              >
                <Cpu className="w-12 h-12 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-[#FF6600] animate-ping opacity-20" />
              </motion.div>

              {[
                { icon: Lock, label: "Locks", pos: "top-4 left-4" },
                { icon: Camera, label: "Cameras", pos: "top-4 right-4" },
                { icon: Lightbulb, label: "Lighting", pos: "bottom-4 left-4" },
                { icon: Thermometer, label: "Climate", pos: "bottom-4 right-4" }
              ].map((d, i) => {
                const Icon = d.icon;
                return (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                    className={`absolute ${d.pos} w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm grid place-items-center hover:border-[#FF6600]/50 transition group`}
                  >
                    <Icon className="w-8 h-8 text-white group-hover:text-[#FF6600] transition" />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">{d.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== SMART HOME BUILDER ===================== */}
        <section className="py-16 md:py-28 bg-white border-b border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-10 md:mb-12 text-center md:text-left mx-auto md:mx-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4">
                <Zap className="w-3.5 h-3.5" /> Interactive Configurator
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000F1B] mb-4">
                Build your own <span className="text-[#FF6600]">smart home.</span>
              </h2>
              <p className="text-sm md:text-base text-[#111111]/60 leading-relaxed">
                Room by room, feature by feature. See your budget update live, and how much you'll save on energy every year. When you're happy, one tap sends it to our consultant.
              </p>
            </div>

            <SmartHomeBuilder />
          </div>
        </section>

        {/* ===================== DIRECTORY ===================== */}
        <section id="directory" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#000F1B] tracking-tight">Curated bundles</h2>
                <p className="text-sm text-[#111111]/60 mt-2">Pre-designed ecosystems for every home size & lifestyle. Every bundle includes installation & warranty.</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bundle name or category..."
                  className="w-full bg-white border border-black/10 rounded-full pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6600] shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-black/5 p-5 md:p-6 mb-10 space-y-5 shadow-sm">
              <FilterRow label="Category" options={CATEGORIES} value={cat} onChange={setCat} />
              <FilterRow label="Ecosystem" options={ECOSYSTEMS} value={eco} onChange={setEco} />
              <FilterRow label="Home Size" options={HOME_SIZES} value={size} onChange={setSize} />

              {(filtering || query) && (
                <div className="flex items-center justify-between pt-4 border-t border-black/5 text-xs font-bold text-[#111111]/50 uppercase tracking-wider">
                  <span>Showing {results.length} of {SMART_HOME_BUNDLES.length} bundles</span>
                  <button onClick={clear} className="text-[#FF6600] hover:text-[#FF0000] flex items-center gap-1 cursor-pointer"><X className="w-3.5 h-3.5" /> Clear all</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <AnimatePresence mode="popLayout">
                {results.map((b, i) => (
                  <BundleCard key={b.id} bundle={b} index={i} reduce={reduce}
                    onOpen={() => setView(b)} onQuote={() => handleWhatsApp(b)} />
                ))}
              </AnimatePresence>
            </div>

            {results.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-black/5 grid place-items-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#111111]/30" />
                </div>
                <h3 className="text-xl font-bold text-[#000F1B] mb-2">No bundle fits all of that</h3>
                <p className="text-sm text-[#111111]/60 mb-6">Try our custom builder above, or loosen a filter.</p>
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Homes today should do more than shelter you.<br /><span className="text-[#FF6600]">They should anticipate, protect, and save — automatically.</span></h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
              Every ConstructONS™ smart home bundle is designed, installed, and supported by certified partners. Warranty covered, integrations tested, and future-proof from day one.
            </p>
            <button onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E04F00] shadow-[0_0_20px_rgba(255,90,0,0.3)] text-white px-8 py-4 rounded-full font-bold text-sm transition hover:-translate-y-0.5 cursor-pointer">
              Get a Smart Home Consultation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <BundleModal view={view} setView={setView} onQuote={handleWhatsApp} />
    </div>
  );
}

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

function BundleCard({ bundle, index, reduce, onOpen, onQuote }) {
  return (
    <motion.article layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.45, delay: index * 0.04 }}
      className="bg-white rounded-3xl overflow-hidden border border-black/5 flex flex-col group shadow-sm hover:shadow-xl hover:border-black/15 transition-all duration-300">

      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-2 flex-wrap">
          {bundle.ecosystems.slice(0, 3).map((e) => (
            <span key={e} className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/60 bg-[#F5F6F8] border border-black/5 px-2 py-1 rounded">{e.split(" ")[0]}</span>
          ))}
          {bundle.ecosystems.length > 3 && <span className="text-[9px] font-bold text-[#111111]/40">+{bundle.ecosystems.length - 3}</span>}
        </div>
        {bundle.score !== null && (
          <span className="bg-[#FF6600] text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" /> {bundle.score}%
          </span>
        )}
      </div>

      <button onClick={onOpen} className="relative bg-gradient-to-br from-[#000F1B] via-[#0F1E30] to-[#000F1B] px-6 py-8 cursor-pointer overflow-hidden text-left">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#FF6600]/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600] mb-1">{bundle.category}</div>
          <h3 className="text-xl font-bold text-white leading-tight mb-4">{bundle.name}</h3>

          <div className="grid grid-cols-6 gap-2 mb-4">
            {bundle.devices.slice(0, 6).map((d, i) => {
              const Icon = DEVICE_ICONS[d.icon] || Wifi;
              return (
                <div key={i} className="relative aspect-square bg-white/5 border border-white/10 rounded-lg grid place-items-center hover:border-[#FF6600]/40 transition group/dev">
                  <Icon className="w-4 h-4 text-white group-hover/dev:text-[#FF6600] transition" />
                  <div className="absolute -top-1 -right-1 bg-[#FF6600] text-white text-[8px] font-black rounded-full w-4 h-4 grid place-items-center">{d.count}</div>
                </div>
              );
            })}
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/10">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">Starting from</div>
              <div className="text-2xl font-black text-white flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />
                {(bundle.priceFrom / 100000).toFixed(2)}L
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">Installation</div>
              <div className="text-xs font-bold text-white flex items-center gap-1"><Clock className="w-3 h-3 text-[#FF6600]" /> {bundle.installTime}</div>
            </div>
          </div>
        </div>
      </button>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-sm text-[#111111]/70 leading-relaxed mb-4 italic">"{bundle.tagline}"</p>

        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2">What's Included</div>
          <ul className="space-y-1.5">
            {bundle.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#000F1B]/80">
                <div className="w-4 h-4 rounded-full bg-[#FF6600]/15 grid place-items-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#FF6600] stroke-[3]" />
                </div>
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2">Trusted Brands</div>
          <div className="flex flex-wrap gap-1.5">
            {bundle.brands.map((br) => (
              <span key={br} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F9FAFB] border border-black/5 text-[#111111]/70">{br}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 bg-[#F9FAFB] border border-black/5 p-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Devices</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><Package className="w-3 h-3 text-[#FF6600]" /> {bundle.deviceCount}</div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Coverage</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><Home className="w-3 h-3 text-[#FF6600]" /> {bundle.coverage}</div>
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#111111]/40 font-bold mb-0.5">Warranty</span>
            <div className="text-sm font-bold text-[#000F1B] flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#FF6600]" /> {bundle.warranty}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button onClick={onOpen} className="py-3.5 rounded-xl bg-[#F5F6F8] border border-black/5 hover:bg-[#000F1B] hover:text-white text-[#000F1B] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
            <Package className="w-4 h-4" /> View Full Details
          </button>
          <button onClick={onQuote} className="py-3.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <MessageCircle className="w-4 h-4 fill-current" /> Get Quote
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function BundleModal({ view, setView, onQuote }) {
  const b = view;

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
      {b && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${b.name} details`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView(null)} className="absolute inset-0 bg-[#000F1B]/90 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-5xl h-[90vh] lg:h-[720px] bg-white rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-black/10">

            <div className="relative lg:w-[45%] h-[45%] lg:h-full bg-gradient-to-br from-[#000F1B] via-[#0F1E30] to-[#000F1B] p-6 md:p-8 text-white flex flex-col overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "25px 25px" }} />
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF6600]/20 blur-[80px] rounded-full pointer-events-none"
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/15 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#FF6600]/20 self-start">
                  {b.category}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{b.name}</h3>
                <p className="text-sm text-white/60 italic mb-6">"{b.tagline}"</p>

                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Devices Included</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                  {b.devices.map((d, i) => {
                    const Icon = DEVICE_ICONS[d.icon] || Wifi;
                    return (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Icon className="w-4 h-4 text-[#FF6600]" />
                          <span className="text-xs font-black text-white">×{d.count}</span>
                        </div>
                        <div className="text-[10px] font-bold text-white leading-tight">{d.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Total Investment</div>
                  <div className="text-3xl font-black text-white flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" />{(b.priceFrom / 100000).toFixed(2)}L
                  </div>
                  <div className="text-[10px] text-white/40 mt-1">Installation, integration & {b.warranty} warranty included</div>
                </div>
              </div>
            </div>

            <div className="relative lg:w-[55%] flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 flex flex-col bg-white">
              <button onClick={() => setView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center cursor-pointer transition z-10"><X className="w-4 h-4 text-[#000F1B]" /></button>

              <div className="mb-6 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-2">Full Feature List</h4>
                <ul className="space-y-2.5">
                  {b.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#000F1B]/80">
                      <div className="w-5 h-5 rounded-full bg-[#FF6600]/15 grid place-items-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#FF6600] stroke-[3]" />
                      </div>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3">Compatible With</h4>
                <div className="flex flex-wrap gap-2">
                  {b.ecosystems.map((e) => (
                    <span key={e} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#000F1B] text-white">{e}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3">Ideal For</h4>
                <div className="flex flex-wrap gap-2">
                  {b.homeSizes.map((s) => (
                    <span key={s} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#F5F6F8] border border-black/5 text-[#000F1B] inline-flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-[#FF6600]" /> {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mb-3">Trusted Brands</h4>
                <div className="flex flex-wrap gap-2">
                  {b.brands.map((br) => (
                    <span key={br} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600]">{br}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Devices</div>
                  <div className="text-base font-bold text-[#000F1B]">{b.deviceCount}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Install</div>
                  <div className="text-base font-bold text-[#000F1B]">{b.installTime}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-black/5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40 mb-1">Warranty</div>
                  <div className="text-base font-bold text-[#000F1B]">{b.warranty}</div>
                </div>
              </div>

              <div className="mt-auto">
                <button onClick={() => { onQuote(b); setView(null); }}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                  <MessageCircle className="w-5 h-5 fill-current" /> Get Personalized Quote on WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}