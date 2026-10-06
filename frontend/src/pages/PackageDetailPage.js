import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Download, Check, X, Star, ChevronDown, Sparkles,
  Calculator, Calendar, ShieldCheck, Clock, Package as PackageIcon
} from "lucide-react";
import LucideIcon from "@/components/site/LucideIcon";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { publicApi } from "@/lib/api";
import { useLeadModal } from "@/components/site/LeadModalProvider";
import { useBrochureModal } from "@/components/site/BrochureModalProvider";
import { FadeIn, SectionLabel } from "@/components/site/Primitives";
import SEO from "@/components/site/SEO";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "specs", label: "Specifications" },
  { key: "scope", label: "Scope & Exclusions" },
  { key: "addons", label: "Add-ons" },
  { key: "schedule", label: "Payment" },
  { key: "faqs", label: "FAQs" },
];

export default function PackageDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedCat, setExpandedCat] = useState(null);
  const [area, setArea] = useState(1500);
  const { open } = useLeadModal();
  const { open: openBrochure } = useBrochureModal();

  useEffect(() => {
    // Preview mode — admin editor stashes unsaved package into sessionStorage.
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") {
      try {
        const raw = sessionStorage.getItem(`cons_pkg_preview_${slug}`);
        if (raw) {
          const previewPkg = JSON.parse(raw);
          setPkg(previewPkg);
          setExpandedCat(previewPkg.spec_categories?.[0]?.name || null);
          publicApi.getSiteSettings().then(setSettings);
          window.scrollTo(0, 0);
          return;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[PackageDetailPage] preview payload unreadable", err);
        /* fall through to normal load */
      }
    }
    publicApi.getPackage(slug).then((p) => {
      setPkg(p);
      setExpandedCat(p.spec_categories?.[0]?.name || null);
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[PackageDetailPage] load failed", err);
      setPkg({});
    });
    publicApi.getSiteSettings().then(setSettings);
    window.scrollTo(0, 0);
  }, [slug]);

  const total = useMemo(() => {
    if (!pkg?.price_per_sqft) return null;
    return pkg.price_per_sqft * area;
  }, [pkg, area]);

  // Combined Product Schema and Breadcrumb List for dynamic index indexing
  const structuredData = useMemo(() => {
    if (!pkg || !pkg.id) return null;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "name": pkg.name,
          "image": pkg.hero_image || "https://constructons.com/icon.svg",
          "description": pkg.description || pkg.tagline,
          "brand": {
            "@type": "Brand",
            "name": "ConstructONS"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": pkg.price_per_sqft || "1499",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": pkg.price_per_sqft || "1499",
              "priceCurrency": "INR",
              "unitText": "SQFT"
            },
            "url": `https://constructons.com/packages/${pkg.slug}`
          }
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
              "name": "Packages",
              "item": "https://constructons.com/packages"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": pkg.name,
              "item": `https://constructons.com/packages/${pkg.slug}`
            }
          ]
        }
      ]
    };
  }, [pkg]);

  if (!pkg) return <div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" /></div>;
  if (!pkg.id) return (<>
      <Header />
      <div className="min-h-[70vh] grid place-items-center text-center">
        <div>
          <div className="text-6xl">📦</div>
          <div className="mt-4 text-2xl font-bold text-brand-navy">Package not found</div>
          <Link to="/#packages" className="mt-4 inline-block btn-primary">View all packages</Link>
        </div>
      </div>
      <Footer settings={settings} />
    </>
  );

  return (
    <>
      <SEO
        title={`${pkg.name} - Turnkey Home Construction Plan`}
        description={`${pkg.tagline || pkg.description}. Discover complete material specs, architectural scope, milestone schedules, and cost calculator for our ${pkg.name}.`}
        canonical={`/packages/${pkg.slug}`}
        keywords={`home construction ${pkg.name}, construction rates per square foot, standard home specification, home building cost calculator, building material lists, house plan details`}
        structuredData={structuredData}
      />

      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-16 bg-brand-navy">
        <div className="absolute inset-0">
          {pkg.hero_image && (
            <img src={pkg.hero_image} alt="" className="w-full h-full object-cover opacity-25" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy/95 to-brand-navySoft" />
        </div>
        <div className="relative container-wide text-white">
          <button onClick={() => navigate("/#packages")} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition mb-6">
            <ArrowLeft className="w-4 h-4" /> All packages
          </button>
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 items-end">
            <div>
              {pkg.is_most_popular && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange text-white text-[10px] font-bold uppercase tracking-widest shadow-glow mb-3">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}
              <div className="section-eyebrow text-brand-orangeLight">Build Package</div>
              <h1 className="mt-2 text-white font-bold text-4xl md:text-6xl">{pkg.name}</h1>
              <p className="mt-4 text-white/70 text-lg max-w-xl">{pkg.tagline}</p>
              <p className="mt-3 text-white/60 text-sm max-w-2xl leading-relaxed">{pkg.description}</p>

              <div className="mt-8 flex flex-wrap items-baseline gap-2">
                <div className="text-5xl font-extrabold text-gradient-orange">{pkg.price_display}</div>
                {pkg.price_unit && <div className="text-white/60 text-lg">{pkg.price_unit}</div>}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={() => open({ package: pkg.name, source: "package_detail" })} data-testid="pkg-cta-consult" className="btn-primary">
                  Get Free Consultation <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openBrochure(pkg.slug, pkg.name)}
                  data-testid="pkg-cta-brochure"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 py-3 transition"
                >
                  <Download className="w-4 h-4" /> Download PDF Brochure
                </button>
                <Link to="/packages/compare" className="inline-flex items-center gap-2 rounded-full text-white/70 hover:text-white text-sm font-medium px-3 py-2 transition">
                  Compare packages →
                </Link>
              </div>
            </div>

            {/* Key stats card */}
            <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/15 p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/50 mb-3">At a glance</div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat icon={Clock} label="Timeline" value={pkg.timeline_months || "8–10 mo"} />
                <MiniStat icon={ShieldCheck} label="Warranty" value={`${pkg.warranty_years || 1} yr`} />
                <MiniStat icon={PackageIcon} label="Min. area" value={`${pkg.min_area_sqft || 800} sqft`} />
                <MiniStat icon={Sparkles} label="AI Platform" value="Included" />
              </div>
              {/* Cost calculator */}
              {pkg.price_per_sqft > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 mb-2">
                    <Calculator className="w-3 h-3" /> Cost Estimator
                  </div>
                  <label className="block">
                    <input
                      type="range"
                      min={pkg.min_area_sqft || 800}
                      max={5000}
                      step={50}
                      value={area}
                      onChange={(e) => setArea(Number(e.target.value))}
                      data-testid="pkg-area-slider"
                      className="w-full accent-orange-500"
                    />
                    <div className="flex items-center justify-between text-xs text-white/60 mt-1">
                      <span>{pkg.min_area_sqft || 800} sqft</span>
                      <span className="font-bold text-white" data-testid="pkg-area-value">{area.toLocaleString("en-IN")} sqft</span>
                      <span>5,000 sqft</span>
                    </div>
                  </label>
                  <div className="mt-3 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-white/70">Estimated Total</div>
                    <div className="text-2xl font-bold text-white" data-testid="pkg-total">
                      ₹{(total / 100000).toFixed(2)} Lakhs
                    </div>
                    <div className="text-[10px] text-white/60">{pkg.price_per_sqft.toLocaleString("en-IN")} × {area.toLocaleString("en-IN")} sqft + GST</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[68px] md:top-16 z-30 bg-white/95 backdrop-blur-xl border-b border-black/5">
        <div className="container-wide overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-2 min-w-max">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                data-testid={`pkg-tab-${t.key}`}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition ${
                  activeTab === t.key
                    ? "bg-brand-navy text-white"
                    : "text-brand-navy/70 hover:bg-brand-navy/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="bg-brand-bg py-14">
        <div className="container-wide">
          {activeTab === "overview" && <OverviewTab pkg={pkg} />}
          {activeTab === "specs" && <SpecsTab pkg={pkg} expanded={expandedCat} setExpanded={setExpandedCat} />}
          {activeTab === "scope" && <ScopeTab pkg={pkg} />}
          {activeTab === "addons" && <AddonsTab pkg={pkg} onEnquire={() => open({ package: pkg.name, source: "package_addons" })} />}
          {activeTab === "schedule" && <ScheduleTab pkg={pkg} />}
          {activeTab === "faqs" && <FaqsTab pkg={pkg} />}
        </div>
      </main>

      {/* Footer CTA */}
      <section className="bg-brand-navy text-white py-16">
        <div className="container-wide grid md:grid-cols-[1.5fr_1fr] gap-8 items-center">
          <div>
            <div className="section-eyebrow text-brand-orangeLight">Ready to build?</div>
            <h2 className="mt-2 text-white">Let’s design your dream home together.</h2>
            <p className="mt-2 text-white/70 max-w-xl">Book a free consultation with our team. We’ll walk you through the plan, materials, timeline & pricing — no obligations.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <button onClick={() => open({ package: pkg.name, source: "package_footer" })} className="btn-primary">
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => openBrochure(pkg.slug, pkg.name)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 px-6 py-3 font-semibold">
              <Download className="w-4 h-4" /> Download Brochure
            </button>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="mt-1 font-bold text-white text-sm">{value}</div>
    </div>
  );
}

function OverviewTab({ pkg }) {
  return (
    <FadeIn>
      <SectionLabel eyebrow={pkg.overview_eyebrow || "Overview"} />
      <h2 className="mt-2 text-brand-navy">{pkg.overview_title || `Why choose ${pkg.name}?`}</h2>
      <p className="mt-4 text-brand-navy/70 leading-relaxed max-w-3xl">{pkg.description}</p>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-6 border border-black/5 shadow-soft">
          <div className="section-eyebrow">{pkg.highlights_eyebrow || "Key Highlights"}</div>
          <ul className="mt-3 space-y-2">
            {(pkg.highlights || []).map((h, i) => (
              <li key={`hl-${h}-${i}`} className="flex items-start gap-2 text-sm text-brand-navy/85">
                <Check className="w-4 h-4 text-brand-orange mt-0.5" /> {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-6 border border-black/5 shadow-soft">
          <div className="section-eyebrow">{pkg.covered_eyebrow || "What's covered"}</div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {(pkg.spec_categories || []).slice(0, 12).map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-xs text-brand-navy/80">
                <LucideIcon name={c.icon || "Check"} className="w-3.5 h-3.5 text-brand-orange" />
                {c.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </FadeIn>
  );
}

function SpecsTab({ pkg, expanded, setExpanded }) {
  const cats = pkg.spec_categories || [];
  return (
    <FadeIn>
      <SectionLabel eyebrow={pkg.specs_eyebrow || "Deep Specifications"} />
      <h2 className="mt-2 text-brand-navy">{pkg.specs_title || "Every material, brand & spec"}</h2>
      <p className="mt-3 text-brand-navy/60 max-w-2xl">{pkg.specs_subtitle || "Full transparency — exact brands and grades of every material used in your home."}</p>

      <div className="mt-8 space-y-3" data-testid="pkg-specs">
        {cats.map((cat) => {
          const isOpen = expanded === cat.name;
          return (
            <div key={cat.name} className="rounded-2xl bg-white border border-black/5 shadow-soft overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : cat.name)}
                data-testid={`pkg-spec-${cat.name}`}
                className="w-full p-4 flex items-center justify-between hover:bg-brand-bg/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange grid place-items-center">
                    <LucideIcon name={cat.icon || "Sparkles"} className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-brand-navy">{cat.name}</div>
                    <div className="text-xs text-brand-navy/60">{cat.items?.length || 0} specifications</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-brand-navy/40 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <div className="rounded-xl border border-black/5 overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                          <thead className="bg-brand-navy text-white">
                            <tr>
                              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest">Item</th>
                              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest">Specification</th>
                              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest">Brand</th>
                              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5">
                            {(cat.items || []).map((it, i) => (
                              <tr key={`spec-${cat.name}-${it.spec}-${i}`} className={i % 2 ? "bg-brand-bg/40" : "bg-white"}>
                                <td className="px-4 py-2 font-semibold text-brand-navy">{it.spec}</td>
                                <td className="px-4 py-2 text-brand-navy/80">{it.value || "-"}</td>
                                <td className="px-4 py-2 text-brand-navy/70">{it.brand || "-"}</td>
                                <td className="px-4 py-2 text-brand-navy/60 text-xs">{it.warranty || it.notes || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </FadeIn>
  );
}

function ScopeTab({ pkg }) {
  return (
    <FadeIn>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-6 border border-black/5 shadow-soft">
          <div className="section-eyebrow">{pkg.scope_eyebrow || "Scope of Work"}</div>
          <h3 className="mt-2 text-brand-navy">{pkg.scope_title || "What's included"}</h3>
          <ul className="mt-4 space-y-2">
            {(pkg.scope_of_work || []).map((s, i) => (
              <li key={`scope-${s}-${i}`} className="flex items-start gap-2 text-sm text-brand-navy/85">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-6 border border-black/5 shadow-soft">
          <div className="section-eyebrow text-red-500">{pkg.exclusions_eyebrow || "Exclusions"}</div>
          <h3 className="mt-2 text-brand-navy">{pkg.exclusions_title || "Not included"}</h3>
          <ul className="mt-4 space-y-2">
            {(pkg.exclusions || []).map((s, i) => (
              <li key={`excl-${s}-${i}`} className="flex items-start gap-2 text-sm text-brand-navy/85">
                <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </FadeIn>
  );
}

function AddonsTab({ pkg, onEnquire }) {
  const addons = pkg.addons || [];
  if (!addons.length) return <div className="text-brand-navy/60">No add-ons available.</div>;
  return (
    <FadeIn>
      <SectionLabel eyebrow={pkg.addons_eyebrow || "Add-ons & Upgrades"} />
      <h2 className="mt-2 text-brand-navy">{pkg.addons_title || "Personalise your home"}</h2>
      <div className="mt-8 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {addons.map((a, i) => (
          <div key={a.slug || a.name || `addon-${i}`} data-testid={`pkg-addon-${i}`} className="rounded-2xl bg-white p-5 border border-black/5 shadow-soft hover:shadow-premium hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-brand-navy">{a.name}</div>
                <div className="mt-1 text-xs text-brand-navy/60">{a.description}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-brand-orange">{a.price}</div>
                <div className="text-[10px] uppercase tracking-widest text-brand-navy/50">{a.unit}</div>
              </div>
              <button onClick={onEnquire} className="text-xs font-semibold text-brand-orange hover:underline">Enquire</button>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

function ScheduleTab({ pkg }) {
  const schedule = pkg.payment_schedule || [];
  const cumulative = schedule.reduce((acc, s, i) => {
    const prev = acc[i - 1] || 0;
    acc.push(prev + (s.percentage || 0));
    return acc;
  }, []);
  return (
    <FadeIn>
      <SectionLabel eyebrow={pkg.schedule_eyebrow || "Payment Schedule"} />
      <h2 className="mt-2 text-brand-navy">{pkg.schedule_title || "Pay as your home is built"}</h2>
      <p className="mt-3 text-brand-navy/60 max-w-2xl">Payments are strictly milestone-based. Each stage is verified & signed off before the next.</p>

      <div className="mt-8 rounded-3xl bg-white border border-black/5 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest">Milestone</th>
              <th className="text-center px-5 py-3 text-[10px] uppercase tracking-widest">% Payable</th>
              <th className="text-center px-5 py-3 text-[10px] uppercase tracking-widest">Cumulative</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {schedule.map((s, i) => (
              <tr key={s.milestone || `sched-${i}`} data-testid={`pkg-schedule-${i}`}>
                <td className="px-5 py-3 font-semibold text-brand-navy">{s.milestone}</td>
                <td className="px-5 py-3 text-center text-brand-orange font-bold">{s.percentage}%</td>
                <td className="px-5 py-3 text-center text-brand-navy/60">{cumulative[i]}%</td>
                <td className="px-5 py-3 text-brand-navy/70 text-xs">{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FadeIn>
  );
}

function FaqsTab({ pkg }) {
  const [openIndex, setOpenIndex] = useState(0);
  const faqs = pkg.package_faqs || [];
  return (
    <FadeIn>
      <SectionLabel eyebrow={pkg.faqs_eyebrow || "Package FAQs"} />
      <h2 className="mt-2 text-brand-navy">{pkg.faqs_title || "Frequently asked questions"}</h2>
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => (
          <div key={f.question || `faq-${i}`} className="rounded-2xl bg-white border border-black/5 shadow-soft overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              data-testid={`pkg-faq-${i}`}
              className="w-full text-left p-5 flex items-center justify-between hover:bg-brand-bg/50 transition"
            >
              <span className="font-semibold text-brand-navy">{f.question}</span>
              <span className={`w-7 h-7 rounded-full grid place-items-center bg-brand-orange/10 text-brand-orange text-lg transition ${openIndex === i ? "rotate-45" : ""}`}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm text-brand-navy/75 leading-relaxed">{f.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}