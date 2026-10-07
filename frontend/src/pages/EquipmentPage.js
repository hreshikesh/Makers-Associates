import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Cpu, MapPin, Activity, ShieldCheck, 
  Settings, Zap, Wrench, Power, Focus, Target, Crosshair
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { useLeadModal } from "@/components/site/LeadModalProvider";
import { FLEET } from "./data/Equipment";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

export default function EquipmentPage() {
  const { open: openLead } = useLeadModal();
  const [activeIdx, setActiveIdx] = useState(0);
  const activeMachine = FLEET[activeIdx];

  // Auto-cycle through fleet for immediate engagement (pauses on interaction)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FLEET.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://[Your Brand]s.com/marketplace/equipment#webpage",
        "url": "https://[Your Brand]s.com/marketplace/equipment",
        "name": "Heavy Machinery Fleet & Construction Equipment",
        "description": "Inspect and book our heavy machinery fleet, transit mixers, concrete pumps, and excavators."
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://[Your Brand]s.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Marketplace",
            "item": "https://[Your Brand]s.com/marketplace/equipment"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Equipment",
            "item": "https://[Your Brand]s.com/marketplace/equipment"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] selection:bg-[#B89416] selection:text-white flex flex-col">
      <SEO
        title="Heavy Construction Equipment & Fleet Machinery"
        description="Operate heavy construction machinery with certified operators. Request GPS-enabled transit mixers, concrete pumps, and excavators with IoT telemetry."
        canonical="/marketplace/equipment"
        keywords="construction machinery rental, transit mixers, concrete pumps, heavy excavators India, builder crane booking, site preparation equipment"
        structuredData={structuredData}
      />

      <Header />

      <main className="flex-1">
        
        {/* =================================================
            1. CINEMATIC HERO 
        ================================================= */}
        <section className="relative bg-[#252A2A] pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          {/* Subtle Grid & Gradient */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
          <motion.div 
            className="absolute top-1/2 right-0 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#B89416]/15 blur-[120px] rounded-full pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <BrandLockup tone="dark" size="sm" />
              <span className="ml-3 text-[10px] text-white/50 font-normal uppercase tracking-widest">· Fleet & Machinery</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl">
              The power to build <br className="hidden md:block" />
              <span className="text-[#B89416]">anything.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/60 max-w-2xl leading-relaxed">
              [Your Brand]s™ owns and operates a world-class fleet of heavy machinery. Engineered for precision, tracked by GPS, and maintained for zero-downtime execution.
            </p>
          </div>
        </section>

        {/* =================================================
            2. NEXT-LEVEL HUD FLEET SHOWCASE
        ================================================= */}
        <section className="py-16 md:py-24 px-4 sm:px-6 relative -mt-10">
          <div className="max-w-7xl mx-auto">
            
            <div className="bg-white rounded-[2rem] shadow-2xl border border-black/5 overflow-hidden flex flex-col lg:flex-row">
              
              {/* LEFT: Cinematic HUD Image Viewport */}
              <div className="lg:w-[55%] bg-[#252A2A] p-4 md:p-8 flex items-center justify-center relative min-h-[350px] md:min-h-[600px] overflow-hidden">
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMachine.id}
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 z-0"
                  >
                    <img src={activeMachine.image} alt={activeMachine.name} className="w-full h-full object-cover opacity-60" />
                    
                    {/* Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#252A2A] via-transparent to-[#252A2A]/50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#252A2A]/80 via-transparent to-transparent" />
                  </motion.div>
                </AnimatePresence>

                {/* HUD Elements (Heads Up Display) */}
                <div className="absolute inset-4 md:inset-8 border border-white/10 z-10 pointer-events-none rounded-2xl overflow-hidden">
                  
                  {/* Scanner Line */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-[#B89416]/50 shadow-[0_0_20px_#B89416]"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Corner Crosshairs */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#B89416]/70" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#B89416]/70" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#B89416]/70" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#B89416]/70" />

                  {/* Telemetry Data overlay */}
                  <div className="absolute top-4 left-6 text-[9px] md:text-[10px] font-mono text-[#B89416] tracking-widest uppercase">
                    <span className="inline-block w-1.5 h-1.5 bg-[#B89416] rounded-full animate-pulse mr-2" />
                    Live Link Active
                  </div>
                  <div className="absolute bottom-4 right-6 text-[9px] md:text-[10px] font-mono text-white/50 tracking-widest uppercase text-right">
                    LAT 12.9716 N<br/>
                    LNG 77.5946 E
                  </div>
                  
                  {/* Dynamic Machine Telemetry */}
                  <div className="absolute bottom-4 left-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeMachine.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-[9px] md:text-[10px] font-mono text-white/80 tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-sm"
                      >
                        {activeMachine.telemetry}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Center Target */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                    <Crosshair className="w-16 h-16 text-white" strokeWidth={1} />
                  </div>
                </div>

              </div>

              {/* RIGHT: The Control Panel */}
              <div className="lg:w-[45%] p-6 md:p-10 lg:p-12 flex flex-col justify-center bg-white z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-2 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Fleet Directory
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#252A2A] mb-8">Select Machinery</h2>

                {/* Selection List */}
                <div className="space-y-2 relative">
                  {FLEET.map((machine, index) => {
                    const isActive = activeIdx === index;
                    return (
                      <button
                        key={machine.id}
                        onClick={() => setActiveIdx(index)}
                        className={`w-full text-left p-3 md:p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 relative z-10 group ${
                          isActive ? "text-[#252A2A]" : "text-[#252A2A]/60 hover:bg-black/[0.02]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-machine"
                            className="absolute inset-0 bg-[#B89416]/5 border border-[#B89416]/20 rounded-2xl -z-10"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? "bg-[#B89416] text-white shadow-lg" : "bg-black/5 text-[#252A2A]/40 group-hover:bg-black/10"
                        }`}>
                          <Wrench className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm md:text-base truncate transition-colors ${isActive ? "text-[#B89416]" : "text-[#252A2A]"}`}>
                            {machine.name}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 truncate mt-0.5">
                            {machine.category}
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 transition-transform ${isActive ? "text-[#B89416] translate-x-1" : "opacity-0 -translate-x-2"}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Specs Readout */}
                <div className="mt-8 p-5 rounded-2xl bg-[#F9FAFB] border border-black/5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeMachine.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-[10px] text-[#252A2A]/50 uppercase tracking-widest font-bold mb-1">Live Specifications</div>
                      <div className="font-bold text-base md:text-lg text-[#252A2A] mb-2">{activeMachine.specs}</div>
                      <p className="text-xs md:text-sm text-[#252A2A]/60 leading-relaxed">{activeMachine.use}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            3. TECH-ENABLED FLEET
        ================================================= */}
        <section className="py-16 md:py-24 px-4 bg-white border-y border-black/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="text-[10px] font-bold tracking-[0.2em] text-[#B89416] uppercase mb-2">Smart Architecture</div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#252A2A] tracking-tight">Connected. Tracked. <span className="text-[#B89416]">Optimized.</span></h2>
              <p className="mt-4 text-[#252A2A]/60 text-sm md:text-base max-w-2xl mx-auto">Every piece of equipment in the [Your Brand]s™ ecosystem is embedded with smart technology for zero-delay operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-[#F9FAFB] border border-black/5 hover:border-[#B89416]/30 hover:shadow-lg transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#252A2A] mb-3">Live GPS Tracking</h3>
                <p className="text-sm text-[#252A2A]/60 leading-relaxed">Transit mixers and trucks are monitored in real-time to guarantee material arrives at your site exactly when scheduled.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-[#F9FAFB] border border-black/5 hover:border-[#B89416]/30 hover:shadow-lg transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#252A2A] mb-3">IoT Maintenance Alerts</h3>
                <p className="text-sm text-[#252A2A]/60 leading-relaxed">Sensors track engine health and operational hours, predicting maintenance needs before machinery ever breaks down on site.</p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-[#F9FAFB] border border-black/5 hover:border-[#B89416]/30 hover:shadow-lg transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-[#B89416]/10 text-[#B89416] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#252A2A] mb-3">Portal Integration</h3>
                <p className="text-sm text-[#252A2A]/60 leading-relaxed">Equipment logs automatically sync to the Site Engineer's app, feeding verified data directly into your Daily Progress Reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            4. RENT / REQUEST CTA
        ================================================= */}
        <section className="py-20 md:py-32 px-4">
          <div className="max-w-5xl mx-auto bg-[#252A2A] rounded-[2rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Need machinery for your project?</h2>
              <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mb-10">
                Our heavy equipment fleet is available for independent dispatch. Get verified operators and transparent pricing.
              </p>
              <button 
                onClick={() => openLead({ source: "equipment_rental" })}
                className="inline-flex items-center justify-center gap-2 bg-[#B89416] hover:bg-[#B89416] text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-[0_0_30px_rgba(255,90,0,0.4)] hover:shadow-[0_0_40px_rgba(255,90,0,0.6)] hover:-translate-y-1"
              >
                Request Equipment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}