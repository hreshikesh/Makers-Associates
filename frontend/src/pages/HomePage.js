import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "@/lib/api";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Hero from "@/components/site/Hero";
import VideoShowcase from "@/components/site/VideoShowcase";
// import HomeCollection from "@/components/site/HomeCollection";
import AIPlatform from "@/components/site/AIPlatform";
import Marketplace from "@/components/site/Marketplace";
import FinancialServices from "@/components/site/FinancialServices";
import WhyConstructONS from "@/components/site/WhyConstructONS";
import CustomerJourney from "@/components/site/CustomerJourney";
import Testimonials from "@/components/site/Testimonials";
import ContactCTA from "@/components/site/ContactCTA";
import FloatingActions from "@/components/site/FloatingActions";
import { RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import SEO, { organizationSchema } from "@/components/site/SEO";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setRetrying(true);
    publicApi
      .bootstrap()
      .then((d) => {
        setData(d);
        setRetrying(false);
      })
      .catch((e) => {
        setError(e?.message || "Network Error");
        setRetrying(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hardReload = () => {
    try {
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch (err) {
      console.warn("[HomePage] cache bust failed (non-fatal)", err);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_r", Date.now().toString());
    window.location.replace(url.toString());
  };

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg grid place-items-center px-6" data-testid="bootstrap-error">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-14 h-14 rounded-full grid place-items-center bg-red-50 text-red-500 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-brand-navy font-bold text-xl">We couldn't reach our servers</h1>
          <p className="mt-2 text-sm text-brand-navy/60">
            This is usually a stale cache from a previous version. Try again — if it keeps happening, do a hard refresh.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={load} disabled={retrying} className="btn-primary text-sm py-2.5 px-5">
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} /> Try again
            </button>
            <button onClick={hardReload} className="btn-ghost text-sm py-2.5 px-5">
              Clear cache & reload
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6600] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="AI-Powered Home Construction Platform"
        description="Build your dream home with ConstructONS. India's premium tech-enabled construction platform. Get transparent pricing from ₹1,499/sqft, real-time live site tracking, and AI design modules."
        canonical="/"
        keywords="home construction India, house construction cost, civil contractors, transparent pricing, turnkey home building, custom home builder, AI floor plans, live CCTV tracking"
        structuredData={organizationSchema}
      />

      <Header />
      <main>
        <Hero />

        <VideoShowcase />

        {/* <HomeCollection homes={data.homes} /> */}
        
        {/* PREMIUM PACKAGES TEASER BANNER */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative bg-[#111111] shadow-2xl">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#FF6600]/20 blur-[100px] rounded-full animate-pulse" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
            </div>
            
            <div className="relative z-10 px-6 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-3">
                  Transparent Pricing.{" "}
                  <span className="bg-gradient-to-r from-[#FF6600] to-[#FF0000] bg-clip-text text-transparent">
                    Zero Surprises.
                  </span>
                </h2>
                <p className="text-white/60 text-sm md:text-base max-w-lg">
                  Explore our curated construction packages designed for every budget. From essential builds to premium custom homes, know exactly what you pay for.
                </p>
              </div>
              <Link 
                to="/packages" 
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6600] to-[#FF0000] hover:opacity-90 text-white px-8 py-4 rounded-full font-bold transition shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_30px_rgba(255,102,0,0.5)] hover:-translate-y-1"
              >
                <span>View All Packages</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <AIPlatform modules={data.ai_modules} />
        <Marketplace items={data.marketplace} />
        <FinancialServices items={data.financial_services} />
        <WhyConstructONS rows={data.comparison} stats={data.stats} />
        <CustomerJourney steps={data.journey} />
        <Testimonials items={data.testimonials} />
        <ContactCTA settings={data.site_settings} />
      </main>
      <Footer settings={data.site_settings} />
      <FloatingActions phone={data.site_settings?.phone} whatsapp={data.site_settings?.whatsapp} />
    </>
  );
}