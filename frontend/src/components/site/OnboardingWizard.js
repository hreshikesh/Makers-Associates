import React, { useState } from "react";
import BrandLockup from "@/components/site/BrandLockup";
import { 
  Building2, 
  Phone, 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2 
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const PHONE_RE = /^\+91[6-9]\d{9}$/;

function forcePhone(raw) {
  let s = String(raw || "").replace(/[^\d+]/g, "");
  if (!s.startsWith("+91")) {
    return "+91" + s.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
  }
  return "+91" + s.slice(3).replace(/\D/g, "").slice(0, 10);
}

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "+91",
    whatsapp: "+91",
    sameWhatsapp: true,
    current_status: "I own a plot & ready to build",
    plot_location: "",
    plot_size: "",
    style_pref: "Modern",
    budget_range: "₹50 Lakhs - ₹1 Crore",
  });

  const handlePhoneChange = (val) => {
    const formatted = forcePhone(val);
    setForm((prev) => ({
      ...prev,
      phone: formatted,
      whatsapp: prev.sameWhatsapp ? formatted : prev.whatsapp,
    }));
  };

  const handleWhatsappChange = (val) => {
    setForm((prev) => ({ ...prev, whatsapp: forcePhone(val) }));
  };

  const handleSameWhatsappToggle = (checked) => {
    setForm((prev) => ({
      ...prev,
      sameWhatsapp: checked,
      whatsapp: checked ? prev.phone : prev.whatsapp,
    }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.name.trim()) {
        toast.error("Please enter your name.");
        return;
      }
      if (!PHONE_RE.test(form.phone)) {
        toast.error("Enter a valid mobile number (+91 followed by 10 digits)");
        return;
      }
    }
    if (step === 2) {
      if (!form.plot_location.trim()) {
        toast.error("Please enter your plot location or city.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        whatsapp: form.sameWhatsapp ? form.phone : form.whatsapp,
        current_status: form.current_status,
        plot_location: form.plot_location,
        plot_size: form.plot_size,
        style_pref: form.style_pref,
        budget_range: form.budget_range,
        site_photos: [],
        onboarding_completed: true,
      };

      await axios.put(`${API_BASE}/customer/profile`, payload, { withCredentials: true });
      toast.success("Welcome to ConstructONS! Setup complete.");
      onComplete();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to complete setup.");
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;
  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins'] text-[#111111] flex flex-col justify-between selection:bg-[#FF6600]/20 selection:text-[#000F1B]">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-black/5 px-4 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BrandLockup tone="light" size="sm" />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#FF6600]/10 text-[10px] font-bold text-[#FF6600] uppercase tracking-wider">
            Quick Onboarding
          </span>
        </div>
        <div className="text-xs text-[#111111]/60 font-semibold">
          Step {step} of {totalSteps}
        </div>
      </header>

      {/* Main Wizard Form Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-black/5 shadow-lg p-6 sm:p-10 relative overflow-hidden">
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F2F2F2]">
            <div
              className="h-full bg-[#FF6600] transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* STEP 1: Contact Information */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6600]/10 grid place-items-center mb-2">
                <Phone className="w-6 h-6 text-[#FF6600]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#000F1B] tracking-tight">Let's verify your details</h1>
                <p className="text-xs text-[#111111]/60 mt-1">We need your mobile number for project and WhatsApp updates.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+919876543210"
                    maxLength={13}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-mono text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#F5F6F8] border border-black/5 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sameWhatsapp}
                      onChange={(e) => handleSameWhatsappToggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#FF6600]"
                    />
                    <span className="text-xs font-semibold text-[#000F1B]">WhatsApp number is same as mobile</span>
                  </label>

                  {!form.sameWhatsapp && (
                    <div className="pt-2">
                      <label className="block text-[10px] font-bold text-[#000F1B] uppercase tracking-wider mb-1">WhatsApp Number *</label>
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => handleWhatsappChange(e.target.value)}
                        placeholder="+919876543210"
                        maxLength={13}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-mono text-[#000F1B] outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Construction Status & Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#000F1B] grid place-items-center mb-2 text-white">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#000F1B] tracking-tight">Your Home Project</h1>
                <p className="text-xs text-[#111111]/60 mt-1">Tell us about your plot location and status.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1">Current Status *</label>
                  <select
                    value={form.current_status}
                    onChange={(e) => setForm({ ...form, current_status: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                  >
                    <option value="I own a plot & ready to build">I own a plot & ready to build</option>
                    <option value="Floor plan ready, looking for builder">Floor plan ready, looking for builder</option>
                    <option value="Looking to buy a plot soon">Looking to buy a plot soon</option>
                    <option value="Planning major renovation">Planning major renovation</option>
                    <option value="Just exploring packages & estimates">Just exploring packages & estimates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1">Plot City / Location *</label>
                  <input
                    type="text"
                    value={form.plot_location}
                    onChange={(e) => setForm({ ...form, plot_location: e.target.value })}
                    placeholder="e.g. Whitefield, Bangalore"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1">Approximate Plot Area (Sq.ft)</label>
                  <input
                    type="text"
                    value={form.plot_size}
                    onChange={(e) => setForm({ ...form, plot_size: e.target.value })}
                    placeholder="e.g. 1200 Sq.ft (30 x 40)"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Style & Budget Preferences */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 grid place-items-center mb-2">
                <Compass className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#000F1B] tracking-tight">Design & Budget</h1>
                <p className="text-xs text-[#111111]/60 mt-1">Select your preferred architectural style and target budget.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-2">Architectural Style Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Modern", "Classic", "Contemporary", "Villa / Duplex"].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setForm({ ...form, style_pref: style })}
                        className={`p-3 rounded-xl border text-xs font-bold transition text-left ${
                          form.style_pref === style
                            ? "bg-[#000F1B] text-white border-[#000F1B]"
                            : "bg-white text-[#000F1B] border-black/10 hover:bg-[#F2F2F2]"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-2">Target Budget Range</label>
                  <select
                    value={form.budget_range}
                    onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                  >
                    <option value="Below ₹50 Lakhs">Below ₹50 Lakhs</option>
                    <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                    <option value="₹1 Crore - ₹2 Crores">₹1 Crore - ₹2 Crores</option>
                    <option value="Above ₹2 Crores">Above ₹2 Crores</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-semibold text-[#000F1B] hover:bg-[#F5F6F8] flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 rounded-xl bg-[#000F1B] hover:bg-[#FF6600] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#FF6600] hover:bg-[#FF0000] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving Setup..." : "Complete & Enter Portal"}
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#111111]/40 border-t border-black/5 bg-white shrink-0">
        ConstructONS™ — India's First Integrated Construction Ecosystem.
      </footer>
    </div>
  );
}