import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Cookie, X, Check, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export const COOKIE_STORAGE_KEY = "[Your Brand]s_cookie_consent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    experience: true,
  });

  // Check saved consent state safely
  const checkConsent = useCallback(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        // Show after a brief delay for smooth entry
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      } else {
        // Already consented — keep hidden
        setIsVisible(false);
      }
    } catch (e) {
      // In case localStorage is blocked, show banner safely
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    // Capture the cleanup function returned by checkConsent
    const cleanupTimer = checkConsent();

    // 🛠️ Developer / Tester helper attached to global window object
    window.MakersAssociatesConsent = {
      reset: () => {
        try {
          localStorage.removeItem(COOKIE_STORAGE_KEY);
          setIsVisible(true);
          console.log(
            "%c[[Your Brand]s] Cookie consent reset! Banner is now visible.",
            "color: #B89416; font-weight: bold;"
          );
        } catch (e) {
          console.error(e);
        }
      },
      get: () => {
        try {
          const data = localStorage.getItem(COOKIE_STORAGE_KEY);
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }
      },
    };

    return () => {
      // Clean up timer if component unmounts before 600ms
      if (typeof cleanupTimer === "function") cleanupTimer();
      delete window.MakersAssociatesConsent;
    };
  }, [checkConsent]);

  const saveConsent = (settings) => {
    const payload = {
      ...settings,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("[[Your Brand]s] Unable to save to localStorage:", err);
    }

    // Broadcast standard event for Google Analytics / Facebook Pixel / GTM
    window.dispatchEvent(
      new CustomEvent("[Your Brand]s-consent-updated", { detail: payload })
    );

    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      experience: true,
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      essential: true,
      analytics: false,
      experience: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Cookie and Privacy Consent"
      data-testid="[Your Brand]s-cookie-banner"
      className="fixed z-50 bottom-3 inset-x-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md md:max-w-lg font-['Poppins'] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden relative">
        {/* Top [Your Brand]s Orange Accent Line */}
        <div className="h-1.5 w-full bg-[#B89416]" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#B89416]/10 grid place-items-center shrink-0">
                <Cookie className="w-4 h-4 text-[#B89416]" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#B89416] tracking-wider uppercase">
                  [Your Brand]s™ Privacy
                </span>
                <h2 className="text-sm sm:text-base font-bold text-[#252A2A] leading-tight">
                  Cookie & Privacy Preferences
                </h2>
              </div>
            </div>

            {/* Dismiss Cross */}
            <button
              type="button"
              onClick={handleEssentialOnly}
              aria-label="Close and accept essential only"
              className="text-[#252A2A]/40 hover:text-[#252A2A] p-1.5 rounded-lg hover:bg-[#F2F2F2] transition min-h-[36px] min-w-[36px] grid place-items-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-2.5 text-xs text-[#252A2A]/70 leading-relaxed">
            We use cookies to maintain your authenticated customer portal sessions, secure project documents, and analyze ecosystem usage for a seamless home construction journey.
          </p>

          {/* Custom Settings (Accordion) */}
          {showDetails && (
            <div className="mt-4 pt-3.5 border-t border-black/5 space-y-2.5 text-xs">
              {/* Essential */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F2F2F2]/60 border border-black/5">
                <div>
                  <div className="font-semibold text-[#252A2A]">Essential & Auth</div>
                  <div className="text-[11px] text-[#252A2A]/60">
                    Required for portal logins, live site tracking, and security.
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#252A2A]/40 px-2 py-0.5 bg-black/5 rounded">
                  Always Active
                </span>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-black/5 hover:border-black/10 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#252A2A]">Ecosystem Analytics</div>
                  <div className="text-[11px] text-[#252A2A]/60">
                    Helps us refine site performance and reliability.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-[#B89416] focus:ring-[#B89416] border-black/20"
                />
              </label>

              {/* Personalization */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-black/5 hover:border-black/10 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#252A2A]">Personalized Insights</div>
                  <div className="text-[11px] text-[#252A2A]/60">
                    Saves your estimate preferences and package selections.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.experience}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, experience: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-[#B89416] focus:ring-[#B89416] border-black/20"
                />
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            {!showDetails ? (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#B89416] hover:bg-[#B89416] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition min-h-[44px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept All</span>
                </button>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-black/10 bg-[#F2F2F2] hover:bg-black/5 px-4 py-2.5 text-xs font-semibold text-[#252A2A] transition min-h-[44px]"
                >
                  Essential Only
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#B89416] hover:bg-[#B89416] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition min-h-[44px]"
              >
                Save My Preferences
              </button>
            )}
          </div>

          {/* Bottom Accordion Trigger & Privacy Link */}
          <div className="mt-3.5 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-[#252A2A]/60">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="inline-flex items-center gap-1 font-semibold text-[#252A2A] hover:text-[#B89416] transition"
            >
              <span>{showDetails ? "Simple view" : "Customize cookies"}</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <Link
              to="/contact"
              className="text-[#252A2A]/50 hover:text-[#B89416] hover:underline transition"
            >
              Privacy & Support
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}