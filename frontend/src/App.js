import React, { Suspense, lazy, useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LeadModalProvider } from "@/components/site/LeadModalProvider";
import { BrochureModalProvider } from "@/components/site/BrochureModalProvider";
import CookieBanner from "./components/site/CookieBanner";
import PublicAIChat from "@/components/site/PublicAIChat";
import BrandLockup from "@/components/site/BrandLockup";
import { Loader2 } from "lucide-react";

// Lazy-loaded Pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const HomeDetailPage = lazy(() => import("@/pages/HomeDetailPage"));
const PackagesPage = lazy(() => import("@/pages/PackagesPage"));
const PackageDetailPage = lazy(() => import("@/pages/PackageDetailPage"));
const PackagesComparePage = lazy(() => import("@/pages/PackagesComparePage"));
const FindMyPackagePage = lazy(() => import("@/pages/FindMyPackagePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const BlogListPage = lazy(() => import("@/pages/BlogListPage"));
const BlogDetailPage = lazy(() => import("@/pages/BlogDetailPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PublicQuotePage = lazy(() => import("@/pages/PublicQuotePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const PortalLogin = lazy(() => import("@/pages/portal/PortalLogin"));
const PortalLayout = lazy(() => import("@/pages/portal/PortalLayout"));
const DashboardPage = lazy(() => import("@/pages/portal/pages/DashboardPage"));
const MyProjectPage = lazy(() => import("@/pages/portal/pages/MyProjectPage"));
const LiveCCTVPage = lazy(() => import("@/pages/portal/pages/LiveCCTVPage"));
const ProgressPage = lazy(() => import("@/pages/portal/pages/ProgressPage"));
const TimelinePage = lazy(() => import("@/pages/portal/pages/TimelinePage"));
const DrawingsPage = lazy(() => import("@/pages/portal/pages/DrawingsPage"));
const MaterialsPage = lazy(() => import("@/pages/portal/pages/MaterialsPage"));
const QualityPage = lazy(() => import("@/pages/portal/pages/QualityPage"));
const DocumentsPage = lazy(() => import("@/pages/portal/pages/DocumentsPage"));
const PaymentsPage = lazy(() => import("@/pages/portal/pages/PaymentsPage"));
const TeamPage = lazy(() => import("@/pages/portal/pages/TeamPage"));
const ApprovalsPage = lazy(() => import("@/pages/portal/pages/ApprovalsPage"));
const MessagesPage = lazy(() => import("@/pages/portal/pages/MessagesPage"));
const SiteReportsPage = lazy(() => import("@/pages/portal/pages/SiteReportsPage"));
const MaintenancePage = lazy(() => import("@/pages/portal/pages/MaintenancePage"));
const SettingsPage = lazy(() => import("@/pages/portal/pages/SettingsPage"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminLeads = lazy(() => import("@/pages/admin/AdminLeads"));
const AdminEntity = lazy(() => import("@/pages/admin/AdminEntity"));
const AdminSiteSettings = lazy(() => import("@/pages/admin/AdminSiteSettings"));
const AdminQuizSubmissions = lazy(() => import("@/pages/admin/AdminQuizSubmissions"));
const AdminPackages = lazy(() => import("@/pages/admin/AdminPackages"));
const AdminProposals = lazy(() => import("@/pages/admin/AdminProposals"));
const AdminCustomQuotes = lazy(() => import("@/pages/admin/AdminCustomQuotes"));
const AdminQuoteTemplates = lazy(() => import("@/pages/admin/AdminQuoteTemplates"));
const AdminProjects = lazy(() => import("@/pages/admin/AdminProjects"));
const AdminClientUsers = lazy(() => import("@/pages/admin/AdminClientUsers"));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage"));
const EquipmentPage = lazy(() => import("@/pages/EquipmentPage"));
const ContractorsPage = lazy(() => import("@/pages/ContractorsPage"));
const ArchitectsPage = lazy(() => import("@/pages/ArchitectsPage"));
const EngineersPage = lazy(() => import("@/pages/EngineersPage"));
const InteriorDesignersPage = lazy(() => import("@/pages/InteriorDesignersPage"));
const SmartHomePage = lazy(() => import("@/pages/SmartHomePage"));
const LandscapingPage = lazy(() => import("@/pages/LandscapingPage"));
const AdminProjectDetail = lazy(() => import("@/pages/admin/AdminProjectDetail"));
/* =========================================================================
   STORYLINE JCB CONSTRUCTION LOADER (Mobile Responsive & Premium)
   ========================================================================= */

function StoryJcbLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("planning"); 
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    // 5.2 Second Smooth Storyline Pacing
    const duration = 5200;
    const interval = 20; 
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = (currentStep / steps) * 100;
      setProgress(currentProgress);

      if (currentProgress < 30) setPhase("planning");
      else if (currentProgress >= 30 && currentProgress < 80) setPhase("building");
      else if (currentProgress >= 80 && currentProgress < 100) setPhase("completed");
      else if (currentProgress >= 100) {
        setPhase("brand");
        clearInterval(timer);
        
        setTimeout(() => setIsFinishing(true), 400);
        setTimeout(() => {
          sessionStorage.setItem("constructons_splash_seen", "true");
          onComplete();
        }, 2000); 
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#000F1B] flex flex-col items-center justify-center overflow-hidden select-none font-['Poppins',sans-serif] text-white p-4"
    >
      {/* Blueprint Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Ambient Orange Backlight Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-[#FF6600]/15 blur-[140px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {phase !== "brand" ? (
        <div className="relative w-full max-w-5xl mx-auto flex flex-col h-full">
          
          {/* Top Brand Lockup Pill */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center justify-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <BrandLockup tone="dark" size="sm" />
          </div>

          {/* Dynamic Storytelling Text Overlay */}
          <div className="absolute top-[25%] sm:top-[30%] w-full text-center flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === "planning" && (
                <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#FF6600] uppercase mb-1">STORY 01 / 03 · PLANNING</div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Every home starts with a vision.</h2>
                </motion.div>
              )}
              {phase === "building" && (
                <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#FF6600] uppercase mb-1">STORY 02 / 03 · EXECUTION</div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Structure rises &amp; details come together.</h2>
                </motion.div>
              )}
              {phase === "completed" && (
                <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#10B981] uppercase mb-1">STORY 03 / 03 · HANDOVER</div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">And it becomes your dream home.</h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* =========================================================
              DOM-BASED RESPONSIVE PROGRESS TRACK
              ========================================================= */}
          <div className="absolute bottom-[20%] sm:bottom-[25%] left-4 right-4 sm:left-12 sm:right-12 h-32 sm:h-48 border-b-2 border-white/20">
            
            {/* Filled Progress Line */}
            <div 
              className="absolute bottom-[-2px] left-0 h-[2px] bg-gradient-to-r from-[#FF6600] to-[#FF7A2E] shadow-[0_0_15px_#FF6600] transition-all duration-75"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />

            {/* STATION 1: Planning (10%) */}
            <div className={`absolute bottom-0 left-[10%] -translate-x-1/2 w-14 h-14 sm:w-20 sm:h-20 transition-opacity duration-700 ${progress > 30 ? "opacity-20 blur-[1px]" : "opacity-100"}`}>
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
                {/* Drafting Table */}
                <rect x="25" y="45" width="50" height="8" fill="#0B1E30" stroke="#38BDF8" strokeWidth="1.5" />
                <path d="M35 53 V90 M65 53 V90" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="35,25 65,25 75,45 25,45" fill="#FF6600" opacity="0.8" />
                {/* Architect */}
                <circle cx="20" cy="35" r="7" fill="#FFF" />
                <path d="M20 42 V80" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
                {/* Engineer */}
                <circle cx="80" cy="35" r="7" fill="#F59E0B" />
                <path d="M80 42 V80" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>

            {/* STATION 2: Crane (50%) */}
            <div className={`absolute bottom-0 left-[50%] -translate-x-1/2 w-20 h-24 sm:w-28 sm:h-32 transition-all duration-700 ${progress < 25 ? "opacity-0 translate-y-4" : progress > 80 ? "opacity-20 blur-[1px]" : "opacity-100 translate-y-0"}`}>
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* Frame */}
                <path d="M20 100 V50 M50 100 V50 M80 100 V50" stroke="#38BDF8" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
                <path d="M20 75 H80 M20 50 H80" stroke="#38BDF8" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
                {/* Crane */}
                <path d="M90 100 V10 M90 20 H10" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                <path d="M90 10 L60 20" stroke="#D97706" strokeWidth="2" />
                <line x1="30" y1="20" x2="30" y2="40" stroke="#FFF" strokeWidth="1.5" strokeDasharray="2 2" />
                <rect x="15" y="40" width="30" height="6" fill="#FF6600" rx="1" />
              </svg>
            </div>

            {/* STATION 3: House (90%) */}
            <div className={`absolute bottom-0 left-[90%] -translate-x-1/2 w-20 h-20 sm:w-28 sm:h-28 transition-all duration-700 ${progress < 75 ? "opacity-0 scale-90 translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}>
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
                {/* House Shape */}
                <path d="M10 100 V50 L50 20 L90 50 V100 Z" fill="#000F1B" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M5 52 L50 18 L95 52" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
                {/* Windows/Doors */}
                <rect x="40" y="65" width="20" height="35" rx="1" fill="#FF6600" fillOpacity="0.85" />
                <rect x="20" y="55" width="12" height="12" rx="1" fill="#38BDF8" fillOpacity="0.7" />
                <rect x="68" y="55" width="12" height="12" rx="1" fill="#38BDF8" fillOpacity="0.7" />
                {/* Sparkle */}
                <motion.circle cx="50" cy="8" r="3" fill="#FF6600" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} />
              </svg>
            </div>

            {/* =========================================================
                THE COMPACT JCB (Drives along the track)
                ========================================================= */}
            <motion.div 
              className="absolute bottom-0 -translate-x-[80%] w-16 h-12 sm:w-24 sm:h-16"
              style={{ left: `${Math.max(0, Math.min(progress, 100))}%` }}
            >
              <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg overflow-visible">
                {/* Exhaust Smoke */}
                <g className={progress > 95 ? "opacity-0 transition-opacity" : "opacity-100"}>
                  <circle cx="20" cy="5" r="3" fill="#FFF" opacity="0.4" className="animate-[nf_float_1.5s_ease-in-out_infinite]" />
                  <circle cx="25" cy="0" r="4" fill="#FFF" opacity="0.2" className="animate-[nf_float_2s_ease-in-out_infinite_0.5s]" />
                </g>

                <g className={progress < 95 ? "animate-[nf_jig_0.3s_linear_infinite]" : ""}>
                  {/* Cabin */}
                  <path d="M15 25 L35 25 L45 45 L10 45 Z" fill="#0F172A" />
                  <path d="M18 28 L32 28 L40 42 L13 42 Z" fill="#38BDF8" opacity="0.6" />
                  
                  {/* Body */}
                  <rect x="30" y="35" width="45" height="15" rx="3" fill="#FF6600" />
                  <rect x="35" y="40" width="12" height="6" rx="1" fill="#0F172A" opacity="0.5" />
                  
                  {/* Arm */}
                  <path d="M50 40 L75 25 L85 45" stroke="#0F172A" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M50 40 L75 25 L85 45" stroke="#FF6600" strokeWidth="2" fill="none" strokeLinecap="round" />
                  
                  {/* Bucket */}
                  <path d="M80 40 L95 40 L90 55 L75 55 Z" fill="#0F172A" stroke="#FF6600" strokeWidth="1" strokeLinejoin="round" />
                </g>

                {/* Tracks / Wheels */}
                <g>
                  <rect x="5" y="50" width="75" height="12" rx="6" fill="#0F172A" stroke="#FF6600" strokeWidth="1.5" />
                  <g className={progress < 95 ? "animate-[spin_1s_linear_infinite]" : ""} style={{ transformOrigin: "15px 56px" }}><circle cx="15" cy="56" r="3.5" fill="#334155" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" /></g>
                  <g className={progress < 95 ? "animate-[spin_1s_linear_infinite]" : ""} style={{ transformOrigin: "35px 56px" }}><circle cx="35" cy="56" r="3.5" fill="#334155" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" /></g>
                  <g className={progress < 95 ? "animate-[spin_1s_linear_infinite]" : ""} style={{ transformOrigin: "55px 56px" }}><circle cx="55" cy="56" r="3.5" fill="#334155" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" /></g>
                  <g className={progress < 95 ? "animate-[spin_1s_linear_infinite]" : ""} style={{ transformOrigin: "70px 56px" }}><circle cx="70" cy="56" r="3.5" fill="#334155" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" /></g>
                </g>
              </svg>
            </motion.div>
          </div>
          
          <div className="absolute bottom-10 font-mono text-[10px] font-bold text-white/30 tracking-[0.2em]">
            PROGRESS: <span className="text-[#FF6600]">{Math.min(Math.round(progress), 100)}%</span>
          </div>

          <style>{`
            @keyframes nf_float {
              0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
              50% { transform: translateY(-4px) scale(1.1); opacity: 0.5; }
            }
            @keyframes nf_jig {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-1px); }
            }
          `}</style>
        </div>
      ) : (
        /* =========================================================
           SCENE 4: FINAL REVEAL (Takes over screen before entry)
           ========================================================= */
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 flex flex-col items-center text-center px-6 my-auto"
        >
          <BrandLockup tone="dark" size="lg" className="w-[260px] h-[96px] drop-shadow-[0_0_30px_rgba(255,90,0,0.6)]" />
        </motion.div>
      )}

      {/* Orange Flash Transition */}
      <AnimatePresence>
        {isFinishing && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 z-[100] origin-bottom bg-[#FF6600]"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Fast Route Fallback Spinner for subsequent inner page transitions */
function PageFallback() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md font-['Poppins',sans-serif]">
      <div className="relative w-12 h-12 mb-3">
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#FF6600] drop-shadow-[0_4px_12px_rgba(255,90,0,0.3)]" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M50 15 L80 32 L80 68 L50 85 L20 68 L20 32 Z M50 15 L50 50 M20 32 L50 50 L80 32 M50 50 L50 85"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
      <div className="text-[10px] font-bold tracking-[0.25em] text-[#000F1B] uppercase animate-pulse">
        Constructing...
      </div>
    </div>
  );
}

/* =========================================================================
   MAIN APP ROUTER COMPONENT
   ========================================================================= */
function App() {
  // Query sessionStorage so the story loader runs ONLY once per session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("constructons_splash_seen");
  });

  return (
    <div className="App font-['Poppins',sans-serif] text-[#111111] bg-white antialiased min-h-screen flex flex-col selection:bg-[#FF6600]/20 selection:text-[#000F1B]">
      
      {/* 🎬 ONE-TIME Storyline JCB Construction Loader */}
      <AnimatePresence>
        {showSplash && (
          <StoryJcbLoader onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <BrowserRouter>
        <LeadModalProvider>
          <BrochureModalProvider>
            <Suspense fallback={!showSplash ? <PageFallback /> : null}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/homes/:slug" element={<HomeDetailPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/packages/compare" element={<PackagesComparePage />} />
                <Route path="/packages/:slug" element={<PackageDetailPage />} />
                <Route path="/find-my-package" element={<FindMyPackagePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={<BlogDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/quote/:token" element={<PublicQuotePage />} />
                <Route path="/marketplace/materials" element={<SuppliersPage />} />
                <Route path="/marketplace/equipment" element={<EquipmentPage />} />
                <Route path="/marketplace/contractors" element={<ContractorsPage />} />
                <Route path="/marketplace/architects" element={<ArchitectsPage />} />
                <Route path="/marketplace/engineers" element={<EngineersPage />} />
                <Route path="/marketplace/interior" element={<InteriorDesignersPage />} />
                <Route path="/marketplace/smart-home" element={<SmartHomePage />} />
                <Route path="/marketplace/landscaping" element={<LandscapingPage />} />

                {/* Customer Portal */}
                <Route path="/portal/login" element={<PortalLogin />} />
                <Route path="/portal" element={<PortalLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="my-project" element={<MyProjectPage />} />
                  <Route path="cctv" element={<LiveCCTVPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="drawings" element={<DrawingsPage />} />
                  <Route path="materials" element={<MaterialsPage />} />
                  <Route path="quality" element={<QualityPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="approvals" element={<ApprovalsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="site-reports" element={<SiteReportsPage />} />
                  <Route path="maintenance" element={<MaintenancePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Admin Panels */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="quiz-submissions" element={<AdminQuizSubmissions />} />
                  <Route path="site-settings" element={<AdminSiteSettings />} />
                  <Route path="packages" element={<AdminPackages />} />
                  <Route path="proposals" element={<AdminProposals />} />
                  <Route path="custom-quotes" element={<AdminCustomQuotes />} />
                  <Route path="quote-templates" element={<AdminQuoteTemplates />} />
                  <Route path="projects" element={<AdminProjects />} />
                  <Route path=":entity" element={<AdminEntity />} />
                  <Route path="client-users" element={<AdminClientUsers />} />
                  <Route path="projects/:projectId" element={<AdminProjectDetail />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>

            {/* AI Assistant */}
            <PublicAIChat />

            <CookieBanner />
            <Toaster position="top-right" richColors closeButton />
          </BrochureModalProvider>
        </LeadModalProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;