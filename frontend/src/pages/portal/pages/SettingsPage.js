import React, { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Compass, 
  Lock, 
  Save, 
  Loader2, 
  Check, 
  Copy, 
  MessageCircle, 
  ShieldCheck,
  IndianRupee,
  Mail
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
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

export default function SettingsPage() {
  const { user, reload } = usePortal();
  const [saving, setSaving] = useState(false);

  // Form State initialized from authenticated user context
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "+91",
    whatsapp: "+91",
    sameWhatsapp: true,
    current_status: "I own a plot & ready to build",
    plot_location: "",
    plot_size: "",
    style_pref: "Modern",
    budget_range: "₹50 Lakhs - ₹1 Crore",
  });

  useEffect(() => {
    if (user) {
      const phoneVal = user.phone || "+91";
      const waVal = user.whatsapp || "+91";
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: phoneVal,
        whatsapp: waVal,
        sameWhatsapp: !user.whatsapp || user.whatsapp === user.phone,
        current_status: user.current_status || "I own a plot & ready to build",
        plot_location: user.plot_location || "",
        plot_size: user.plot_size || "",
        style_pref: user.style_pref || "Modern",
        budget_range: user.budget_range || "₹50 Lakhs - ₹1 Crore",
      });
    }
  }, [user]);

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

  const handleSyncWhatsappBtn = () => {
    const p = forcePhone(form.phone);
    if (PHONE_RE.test(p)) {
      setForm((prev) => ({ ...prev, whatsapp: p, sameWhatsapp: true }));
      toast.success("WhatsApp synced with Mobile number");
    } else {
      toast.error("Please enter a valid mobile number first");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Optional phone validation: if user enters phone, validate format
    if (form.phone && form.phone !== "+91" && !PHONE_RE.test(form.phone)) {
      toast.error("Enter a valid mobile number (+91 followed by 10 digits)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone === "+91" ? "" : form.phone,
        whatsapp: form.sameWhatsapp ? (form.phone === "+91" ? "" : form.phone) : (form.whatsapp === "+91" ? "" : form.whatsapp),
        current_status: form.current_status,
        plot_location: form.plot_location.trim(),
        plot_size: form.plot_size.trim(),
        style_pref: form.style_pref,
        budget_range: form.budget_range,
      };

      await axios.put(`${API_BASE}/customer/profile`, payload, { withCredentials: true });
      toast.success("Settings & Profile updated successfully!");
      await reload(); // Instantly update global PortalContext
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-['Poppins'] pb-12 selection:bg-[#FF6600]/20 selection:text-[#000F1B]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#000F1B] grid place-items-center shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#FF6600] tracking-wider uppercase">Account & Preferences</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#000F1B] tracking-tight">Account Settings</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] hover:bg-[#FF0000] text-white px-6 py-3 text-xs sm:text-sm font-bold shadow-sm transition min-h-[44px] disabled:opacity-70 self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Personal & Contact Information */}
        <section className="rounded-2xl bg-white border border-black/5 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF6600]" />
              <h2 className="text-sm font-bold text-[#000F1B] uppercase tracking-wider">Personal & Contact Details</h2>
            </div>
            <span className="text-[10px] font-semibold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Identity Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={30}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
              />
            </div>

            {/* Email Address (LOCKED 🔒) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[#000F1B] uppercase tracking-wider flex items-center gap-1">
                  Google Email <Lock className="w-3 h-3 text-[#111111]/40" />
                </label>
                <span className="text-[9px] font-bold text-[#111111]/40 uppercase tracking-wider">Locked</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F5F6F8] px-3.5 py-2.5 text-sm font-medium text-[#111111]/60 cursor-not-allowed">
                <Mail className="w-4 h-4 text-[#111111]/30 shrink-0" />
                <span className="truncate">{form.email || "No email linked"}</span>
              </div>
              <p className="mt-1 text-[10px] text-[#111111]/45">Email is tied to your Google Sign-In and cannot be changed.</p>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={13}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-mono text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#111111]/45">Used for site engineer emergency calls & alerts.</p>
            </div>

            {/* WhatsApp Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[#000F1B] uppercase tracking-wider">
                  WhatsApp Number
                </label>
                <button
                  type="button"
                  onClick={handleSyncWhatsappBtn}
                  className="text-[10px] font-bold text-[#FF6600] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Same as Mobile
                </button>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  maxLength={13}
                  placeholder="+919876543210"
                  disabled={form.sameWhatsapp}
                  className={`w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm font-mono text-[#000F1B] outline-none ${
                    form.sameWhatsapp ? "bg-[#F5F6F8] cursor-not-allowed opacity-80" : "bg-white focus:ring-2 focus:ring-[#FF6600]"
                  }`}
                />
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sameWhatsapp}
                    onChange={(e) => handleSameWhatsappToggle(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#FF6600]"
                  />
                  <span className="text-xs font-semibold text-[#000F1B]">Keep WhatsApp same as mobile</span>
                </label>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Construction & Plot Requirements */}
        <section className="rounded-2xl bg-white border border-black/5 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 border-b border-black/5 pb-3">
            <Building2 className="w-4 h-4 text-[#FF6600]" />
            <h2 className="text-sm font-bold text-[#000F1B] uppercase tracking-wider">Project & Plot Requirements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Current Construction Status */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5">
                Current Construction Status
              </label>
              <select
                value={form.current_status}
                onChange={(e) => setForm({ ...form, current_status: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none cursor-pointer"
              >
                <option value="I own a plot & ready to build">I own a plot & ready to build</option>
                <option value="Floor plan ready, looking for builder">Floor plan ready, looking for builder</option>
                <option value="Looking to buy a plot soon">Looking to buy a plot soon</option>
                <option value="Planning major renovation">Planning major renovation</option>
                <option value="Just exploring packages & estimates">Just exploring packages & estimates</option>
              </select>
            </div>

            {/* Plot Location */}
            <div>
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF6600]" /> Plot City / Location
              </label>
              <input
                type="text"
                value={form.plot_location}
                onChange={(e) => setForm({ ...form, plot_location: e.target.value })}
                placeholder="e.g. Whitefield, Bangalore"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
              />
            </div>

            {/* Plot Size */}
            <div>
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5">
                Approximate Plot Size (Sq.ft)
              </label>
              <input
                type="text"
                value={form.plot_size}
                onChange={(e) => setForm({ ...form, plot_size: e.target.value })}
                placeholder="e.g. 1200 Sq.ft (30 x 40)"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none"
              />
            </div>

            {/* Style Preference */}
            <div>
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#FF6600]" /> Architectural Style Preference
              </label>
              <select
                value={form.style_pref}
                onChange={(e) => setForm({ ...form, style_pref: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none cursor-pointer"
              >
                <option value="Modern">Modern</option>
                <option value="Classic">Classic</option>
                <option value="Contemporary">Contemporary</option>
                <option value="Villa / Duplex">Villa / Duplex</option>
                <option value="Minimalist">Minimalist</option>
              </select>
            </div>

            {/* Target Budget Range */}
            <div>
              <label className="block text-[11px] font-bold text-[#000F1B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#FF6600]" /> Target Budget Range
              </label>
              <select
                value={form.budget_range}
                onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#000F1B] focus:ring-2 focus:ring-[#FF6600] outline-none cursor-pointer"
              >
                <option value="Below ₹50 Lakhs">Below ₹50 Lakhs</option>
                <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                <option value="₹1 Crore - ₹2 Crores">₹1 Crore - ₹2 Crores</option>
                <option value="Above ₹2 Crores">Above ₹2 Crores</option>
              </select>
            </div>

          </div>
        </section>

        {/* Section 3: Account Security & Authentication Badge */}
        <section className="rounded-2xl bg-white border border-black/5 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#000F1B]">Security & Identity</div>
            <p className="text-xs text-[#111111]/60 mt-0.5">
              Your account is secured via direct Google OAuth. No passwords are created or stored.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5F6F8] border border-black/5 text-xs font-semibold text-[#000F1B] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Google One-Tap Active</span>
          </div>
        </section>

        {/* Bottom Sticky Action Bar for Mobile */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] hover:bg-[#FF0000] text-white px-8 py-3.5 text-sm font-bold shadow-md transition min-h-[48px] disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}