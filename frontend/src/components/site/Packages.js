import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Compass, Scale, Check, Eye, Download, 
  Power, ShieldCheck, X, Loader2
} from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { publicApi } from "@/lib/api";
import { useLeadModal } from "@/components/site/LeadModalProvider";
import { useBrochureModal } from "@/components/site/BrochureModalProvider";
import BrandLockup from "@/components/site/BrandLockup";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { open: openLead } = useLeadModal();
  const { open: openBrochure } = useBrochureModal();
  const [previewPkg, setPreviewPkg] = useState(null);

  useEffect(() => {
    Promise.all([
      publicApi.getPackages(),
      publicApi.getSiteSettings()
    ]).then(([pkgData, setData]) => {
      setPackages(pkgData);
      setSettings(setData);
      setLoading(false);
    });
  }, []);

  const normalPackages = packages.slice(0, 3);
  const customPackages = packages.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="font-['Poppins',sans-serif] selection:bg-[#FF6600] selection:text-white bg-[#F5F6F8]">
     
      
      {/* 
        FIX 1: Removed the top margin/padding on <main> so the dark hero 
        slides smoothly under the transparent header with no white gap. 
      */}
      <main>
        
        {/* =========================================
            1. CINEMATIC HERO SECTION
            FIX 1: Added pt-32 / pt-40 here so content starts below header
        ========================================= */}
        <section className="relative overflow-hidden bg-[#000F1B] pt-32 pb-24 md:pt-40 md:pb-32 lg:pb-40">
          {/* Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#FF6600]/15 blur-[120px] rounded-full"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
            
            {/* 
              FIX 2: Premium Brand Lockup
              Logo image + CONSTRUCT [Orange Power] NS 
            */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-8 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full backdrop-blur-sm"
            >
              <BrandLockup tone="dark" size="sm" className="w-[128px] h-10" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto"
            >
              Transparent Pricing.<br/>
              <span className="text-[#FF6600]">Uncompromising Quality.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
            >
              Choose a construction package that fits your vision. Every package includes dedicated engineers, daily reports, and multi-level quality checks.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/find-my-package" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6600] px-8 py-4 text-sm font-bold text-white hover:bg-[#E04F00] transition shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5">
                <Compass className="w-5 h-5 shrink-0" />
                Find My Perfect Package
              </Link>
              
              {/* FIX 3: Replaced transparent hover with Solid Orange Hover */}
              <Link to="/packages/compare" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-[#FF6600] hover:border-[#FF6600] px-8 py-4 text-sm font-bold text-white transition backdrop-blur-sm">
                <Scale className="w-5 h-5 shrink-0" />
                Compare Specifications
              </Link>
            </motion.div>
          </div>
        </section>

        {/* =========================================
            2. TRUST STRIP
        ========================================= */}
        <div className="bg-white border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-6 md:gap-12 lg:gap-24 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#000F1B]">
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF6600]" /> <span>Zero Hidden Costs</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF6600]" /> <span>Branded Materials Only</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#FF6600]" /> <span>On-Time Delivery Guarantee</span></div>
          </div>
        </div>

        {/* =========================================
            3. PACKAGE GRID
        ========================================= */}
        <section className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Normal Cards (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {normalPackages.map((p, i) => (
                <PackageCard
                  key={p.id} pkg={p} index={i}
                  onQuote={() => openLead({ package: p.name, source: "packages" })}
                  onBrochure={() => openBrochure(p.slug, p.name)}
                  onPreview={() => setPreviewPkg(p)}
                />
              ))}
            </div>

            {/* Custom/Premium Cards (Full Width) */}
            {customPackages.length > 0 && (
              <div className="mt-12 space-y-8">
                {customPackages.map((p, i) => (
                  <CustomPackageCard
                    key={p.id} pkg={p} index={i + 3}
                    onQuote={() => openLead({ package: p.name, source: "packages" })}
                    onBrochure={() => openBrochure(p.slug, p.name)}
                    onPreview={() => setPreviewPkg(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
   

      {/* QUICK PREVIEW MODAL */}
      <PreviewModal
        pkg={previewPkg}
        onClose={() => setPreviewPkg(null)}
        onBrochure={() => { if (previewPkg) openBrochure(previewPkg.slug, previewPkg.name); }}
        onQuote={() => {
          if (previewPkg) {
            openLead({ package: previewPkg.name, source: "packages-preview" });
            setPreviewPkg(null);
          }
        }}
      />
    </div>
  );
}

/* =========================================================================
   CARD COMPONENTS
========================================================================= */

function PackageCard({ pkg, onQuote, onBrochure, onPreview, index }) {
  const isPopular = pkg.is_most_popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full flex"
    >
      <div className={`relative flex w-full flex-col overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] ${
          isPopular
            ? "border-white/10 bg-gradient-to-b from-[#000F1B] to-[#0B1E30] text-white shadow-2xl hover:border-[#FF6600]/50 hover:shadow-[0_20px_50px_rgba(255,90,0,0.25)]"
            : "border-black/5 bg-white text-[#000F1B] shadow-lg hover:border-[#FF6600]/30 hover:shadow-2xl"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]" />
          {isPopular && <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#FF6600]/30 blur-[80px] transition-opacity duration-700 group-hover:opacity-100" />}
        </div>

        {isPopular && (
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-xl bg-[#FF6600] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            Most Popular
          </div>
        )}

        <div className="relative z-10 flex h-full flex-col p-6 sm:p-8">
          <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] ${isPopular ? "text-[#FF8A4C]" : "text-[#FF6600]"}`}>
            {pkg.name}
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
            <div className={`text-3xl sm:text-4xl lg:text-[40px] font-black leading-none tracking-tight ${isPopular ? "text-white" : "text-[#000F1B]"}`}>
              {pkg.price_display}
            </div>
            {pkg.price_unit && <div className={`text-xs sm:text-sm font-semibold ${isPopular ? "text-white/60" : "text-[#000F1B]/50"}`}>{pkg.price_unit}</div>}
          </div>

          <div className={`mt-2.5 text-sm font-semibold ${isPopular ? "text-white" : "text-[#000F1B]"}`}>
            {pkg.tagline}
          </div>
          {/* <div className={`mt-1.5 text-xs leading-relaxed line-clamp-2 ${isPopular ? "text-white/60" : "text-[#000F1B]/60"}`}>
            {pkg.description}
          </div> */}

          {/* <ul className="mt-6 flex-1 space-y-3">
            {(pkg.highlights || []).slice(0, 5).map((h, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-xs sm:text-sm font-medium ${isPopular ? "text-white/90" : "text-[#000F1B]/80"}`}>
                <Check className={`mt-0.5 h-4 w-4 shrink-0 stroke-[3] ${isPopular ? "text-[#FF8A4C]" : "text-[#FF6600]"}`} />
                <span className="line-clamp-2">{h}</span>
              </li>
            ))}
          </ul> */}

          <div className="mt-6 mb-6 h-0.5 w-10 rounded-full bg-[#FF6600] transition-all duration-500 group-hover:w-16" />

          <div className="mt-auto flex flex-col gap-3">
            {/* <div className="flex items-center gap-2">
             
              <button onClick={onPreview} className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition inline-flex items-center justify-center gap-1.5 ${isPopular ? "text-white/90 hover:bg-[#FF6600] hover:text-white" : "text-[#000F1B]/80 hover:bg-[#FF6600] hover:text-white border border-transparent"}`}>
                <Eye className="h-4 w-4" /> Preview
              </button>
              <button onClick={onBrochure} className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition inline-flex items-center justify-center gap-1.5 ${isPopular ? "text-[#FF8A4C] hover:bg-[#FF6600] hover:text-white" : "text-[#FF6600] hover:bg-[#FF6600] hover:text-white border border-transparent"}`}>
                <Download className="h-4 w-4" /> Brochure
              </button>
            </div> */}
            <Link to={`/packages/${pkg.slug}`} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition shadow-sm ${isPopular ? "bg-[#FF6600] text-white hover:bg-[#E04F00]" : "bg-[#000F1B] text-white hover:bg-[#0B1E30]"}`}>
              View Full Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CustomPackageCard({ pkg, onQuote, onBrochure, onPreview, index }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
      <div className="group relative overflow-hidden rounded-3xl border border-[#FF6600]/20 bg-gradient-to-r from-[#000F1B] to-[#0B1E30] text-white shadow-2xl transition-all duration-500 hover:border-[#FF6600]/50 hover:shadow-[0_20px_60px_rgba(255,90,0,0.25)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#FF6600]/15 blur-[100px]" />
          <div className="absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]" />
        </div>

        <div className="relative z-10 grid items-center gap-8 p-8 md:grid-cols-[1fr_auto] lg:p-12">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#FF8A4C]">{pkg.name}</span>
              <span className="rounded-md bg-[#FF6600] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">Tailor-Made</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 mb-3">
              <div className="text-4xl md:text-5xl font-black leading-none text-white tracking-tight">{pkg.price_display}</div>
              {pkg.price_unit && <div className="text-sm font-semibold text-white/60">{pkg.price_unit}</div>}
            </div>

            <div className="text-lg font-bold text-white mb-2">{pkg.tagline}</div>
            <p className="max-w-2xl text-sm leading-relaxed text-white/70 mb-6">{pkg.description}</p>

            {/* <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {(pkg.highlights || []).slice(0, 6).map((h, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-white/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 stroke-[3] text-[#FF8A4C]" />
                  <span>{h}</span>
                </li>
              ))}
            </ul> */}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 md:w-[240px]">
            {/* <div className="flex items-center overflow-hidden rounded-xl bg-white/5 border border-white/10">
              <button onClick={onPreview} className="inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-bold text-white transition hover:bg-[#FF6600] hover:text-white"><Eye className="h-4 w-4" /> Preview</button>
              <span className="h-6 w-px bg-white/20" />
              <button onClick={onBrochure} className="inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-bold text-[#FF8A4C] transition hover:bg-[#FF6600] hover:text-white"><Download className="h-4 w-4" /> Brochure</button>
            </div> */}
            <Link to={`/packages/${pkg.slug}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#000F1B] transition hover:bg-[#F2F2F2]">
              View Full Details <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={onQuote} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6600] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(255,90,0,0.3)] transition hover:bg-[#E04F00]">
              Get Custom Quote <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================================
   PREVIEW MODAL
========================================================================= */
function PreviewModal({ pkg, onClose, onBrochure, onQuote }) {
  if (!pkg) return null;
  const sections = (pkg.spec_categories || pkg.sections || []).slice(0, 6);

  return (
    <AnimatePresence>
      {pkg && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000F1B]/80 p-4 font-['Poppins',sans-serif] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/5 bg-[#F9FAFB] px-6 py-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6600] mb-1">{pkg.name} Package</div>
                <div className="text-xl md:text-2xl font-black text-[#000F1B]">
                  {pkg.price_display} <span className="text-sm font-semibold text-[#000F1B]/50 ml-1">{pkg.price_unit}</span>
                </div>
              </div>
              <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/5 hover:bg-black/10 text-[#000F1B] transition"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {pkg.tagline && <p className="text-base font-bold text-[#000F1B] mb-2">{pkg.tagline}</p>}
              {pkg.description && <p className="text-sm leading-relaxed text-[#111111]/70 mb-8">{pkg.description}</p>}

              {pkg.highlights?.length > 0 && (
                <div className="mb-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF6600] mb-4">Key Highlights</div>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {pkg.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-[#000F1B]/90">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 stroke-[3] text-[#FF6600]" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sections.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF6600] mb-4 border-t border-black/5 pt-6">Specifications Sneak Peek</div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {sections.map((sec, i) => (
                      <div key={i} className="bg-[#F9FAFB] p-4 rounded-xl border border-black/5">
                        <div className="text-xs font-bold text-[#000F1B] mb-3">{sec.name || sec.title}</div>
                        <ul className="space-y-2">
                          {(sec.items || []).slice(0, 4).map((it, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs font-medium text-[#111111]/70">
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#FF6600] mt-0.5" />
                              <span>{typeof it === "string" ? it : `${it.spec}${it.value ? `: ${it.value}` : ""}`}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col sm:flex-row gap-3 border-t border-black/5 bg-[#F9FAFB] p-6">
              <div className="flex flex-1 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                {/* FIX 3: Replaced transparent hover with solid orange hovers */}
                <button onClick={onClose} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-[#000F1B]/70 hover:bg-[#FF6600] hover:text-white transition"><Eye className="h-4 w-4" /> Close</button>
                <span className="w-px bg-black/10" />
                <button onClick={onBrochure} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-[#FF6600] hover:bg-[#FF6600] hover:text-white transition"><Download className="h-4 w-4" /> Brochure</button>
              </div>
              <Link to={`/packages/${pkg.slug}`} onClick={onClose} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#000F1B] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0B1E30] shadow-sm">
                View Full Details <ArrowRight className="h-4 w-4" />
              </Link>
              {(pkg.tier === "premium" || pkg.tier === "custom") && (
                <button onClick={onQuote} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#E04F00] shadow-[0_4px_14px_rgba(255,90,0,0.3)]">
                  Get Custom Quote
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}