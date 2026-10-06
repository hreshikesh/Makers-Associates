import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Loader2, 
  ArrowLeft, 
  Smartphone, 
  FileText, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import SEO from "@/components/site/SEO";
import BrandLockup from "@/components/site/BrandLockup";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";

// Sourced with clean string sanitization and fallback
const GOOGLE_CLIENT_ID = (
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "519701626953-d4dneugq3bphakti7ss79omkc74e2e4q.apps.googleusercontent.com"
).replace(/['"]/g, "").trim();

export default function PortalLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  // 1. Verify if customer is already logged in
  useEffect(() => {
    axios
      .get(`${API_BASE}/customer/me`, { withCredentials: true })
      .then(() => navigate("/portal", { replace: true }))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  // 2. Handle Token Response (wrapped in useCallback)
  const handleGoogleAuthResponse = useCallback(async (response) => {
    if (!response.credential) {
      setError("Unable to obtain Google profile. Please try again.");
      return;
    }

    setSigningIn(true);
    setError(null);

    try {
      await axios.post(
        `${API_BASE}/customer/auth/google`,
        { credential: response.credential },
        { withCredentials: true }
      );
      navigate("/portal", { replace: true });
    } catch (err) {
      console.error("[ConstructONS Auth] Google login error:", err);
      setError(
        err?.response?.data?.detail || "Authentication failed. Access restricted."
      );
      setSigningIn(false);
    }
  }, [navigate]);

  // 3. Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (checking) return;

    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID is missing. Please configure REACT_APP_GOOGLE_CLIENT_ID.");
      return;
    }

    const scriptId = "google-gis-script";
    let script = document.getElementById(scriptId);

    const initGoogleGSI = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleAuthResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const btnContainer = document.getElementById("google-signin-btn-container");
          if (btnContainer) {
            btnContainer.innerHTML = ""; // clean any prior instances
            window.google.accounts.id.renderButton(btnContainer, {
              theme: "outline",
              size: "large",
              shape: "rectangular",
              width: btnContainer.offsetWidth || 340,
              text: "continue_with",
              logo_alignment: "left",
            });
          }
        } catch (e) {
          console.error("[GSI init error]", e);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleGSI;
      document.body.appendChild(script);
    } else {
      initGoogleGSI();
    }
  }, [checking, handleGoogleAuthResponse]);

  if (checking) {
    return (
      <div 
        className="min-h-screen grid place-items-center bg-[#F2F2F2]" 
        role="status" 
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
          <span className="text-sm font-medium text-[#111111]/70 font-['Poppins']">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#F2F2F2] flex flex-col md:grid md:grid-cols-2 font-['Poppins'] relative selection:bg-[#FF6600]/20 selection:text-[#000F1B]"
      data-testid="portal-login"
    >
      <SEO
        title="Client Portal Login"
        description="Sign in to your ConstructONS Client Portal to access live site updates, drawings, and quality milestones."
        canonical="/portal/login"
        noindex={true}
      />

      {/* 📱 Mobile Top Header */}
      <header className="md:hidden bg-[#000F1B] border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
        <Link
          to="/"
          aria-label="Back to ConstructONS Home"
          className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors py-2 px-3 -ml-2 rounded-lg active:bg-white/10 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6600]" aria-hidden="true" />
          <span>Home</span>
        </Link>
        <BrandLockup tone="dark" size="sm" />
      </header>

      {/* 💻 Left Hero Column: Brand Ecosystem Showcase */}
      <div className="hidden md:flex bg-[#000F1B] text-white flex-col justify-between p-10 lg:p-14 xl:p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FF6600]" />

        <div>
          <Link
            to="/"
            aria-label="Back to ConstructONS Home"
            className="inline-flex items-center gap-2.5 text-white/80 hover:text-white text-sm font-medium transition-all py-2 px-3.5 -ml-3 rounded-xl hover:bg-white/10 min-h-[44px] group"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6600] transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>

          <div className="mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full text-xs font-semibold text-[#FF6600] tracking-wider uppercase">
              Customer Portal
            </div>
            <h1 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-white">
              Everything Construction. <br />
              <span className="text-[#FF6600]">Always On.</span>
            </h1>
            <p className="mt-3.5 text-white/70 text-sm lg:text-base leading-relaxed max-w-md">
              Your trusted partner for every stage of home construction. Access live updates, documents, and quality milestones in real time.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-4 max-w-md my-8">
          {[
            {
              Icon: Smartphone,
              title: "Live Site Updates",
              desc: "Daily milestone progress with verified site photos.",
            },
            {
              Icon: FileText,
              title: "Digital Documents & Legal",
              desc: "Architectural drawings, agreements, and approvals stored securely.",
            },
            {
              Icon: Clock,
              title: "Project Timeline & Payments",
              desc: "Transparent milestone tracking with stage-linked payment schedules.",
            },
            {
              Icon: ShieldCheck,
              title: "100+ Quality Checks",
              desc: "Dedicated site engineers conducting standardized quality inspections.",
            },
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#white]/5 border border-white/10 grid place-items-center shrink-0 mt-0.5">
                <item.Icon className="w-4 h-4 text-[#FF6600]" strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="text-xs text-white/60 leading-relaxed mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-white/40 border-t border-white/10 pt-4">
          India's First Integrated Construction Ecosystem
        </div>
      </div>

      {/* 🔐 Right Sign-In Card */}
      <div className="flex-1 grid place-items-center p-6 sm:p-10 lg:p-12">
        <main className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/5 p-8 sm:p-10">
          <BrandLockup tone="light" size="xs" />
          <h2 className="mt-2 text-2xl font-bold text-[#000F1B] tracking-tight">
            Sign in to your portal
          </h2>
          <p className="mt-2 text-sm text-[#111111]/70 leading-relaxed">
            Verify identity with your Google account to access your live home construction project.
          </p>

          {/* Error Notice */}
          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Container */}
          <div className="mt-8 flex justify-center">
            {signingIn ? (
              <div className="w-full py-3.5 px-4 rounded-xl border border-black/10 bg-[#F2F2F2] flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#000F1B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6600]" />
                <span>Creating ConstructONS session...</span>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div 
                  id="google-signin-btn-container" 
                  className="w-full min-h-[44px] flex justify-center" 
                />
              </div>
            )}
          </div>

          <div className="mt-6 text-[12px] text-[#111111]/60 leading-relaxed bg-[#F2F2F2] p-3.5 rounded-xl border border-black/5">
            By signing in, you access ConstructONS™ secure project management. Direct Google authentication is used securely to identify your verified profile.
          </div>

          {/* Switch to Staff Login */}
          <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between text-xs text-[#111111]/70">
            <span>Admin or Site Engineer?</span>
            <Link
              to="/admin/login"
              className="text-[#FF6600] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-[#FF6600] rounded px-1 py-0.5"
            >
              Staff Login &rarr;
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}