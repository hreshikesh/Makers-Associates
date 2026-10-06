import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, ShieldAlert, ShieldCheck, Zap, Loader2, Info } from "lucide-react";
import axios from "axios";

// India Seismic Zones per IS 1893:2016 (simplified mapping by state)
const SEISMIC_ZONE_MAP = {
  // Zone V (Very Severe)
  "Jammu And Kashmir": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Himachal Pradesh": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Uttarakhand": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Sikkim": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Assam": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Manipur": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Nagaland": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Arunachal Pradesh": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Mizoram": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Tripura": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  "Meghalaya": { zone: "V", risk: "Very Severe", color: "#DC2626", pga: "0.36g" },
  // Zone IV (Severe)
  "Delhi": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  "Bihar": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  "Haryana": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  "Punjab": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  "Uttar Pradesh": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  "West Bengal": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  "Gujarat": { zone: "IV", risk: "Severe", color: "#EA580C", pga: "0.24g" },
  // Zone III (Moderate)
  "Kerala": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Maharashtra": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Goa": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Odisha": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Jharkhand": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Chhattisgarh": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Andhra Pradesh": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Tamil Nadu": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Karnataka": { zone: "III", risk: "Moderate", color: "#F59E0B", pga: "0.16g" },
  "Telangana": { zone: "II", risk: "Low", color: "#10B981", pga: "0.10g" },
  "Madhya Pradesh": { zone: "II", risk: "Low", color: "#10B981", pga: "0.10g" },
  "Rajasthan": { zone: "II", risk: "Low", color: "#10B981", pga: "0.10g" }
};

const ZONE_RECOMMENDATIONS = {
  "V": ["Base isolation systems recommended", "IS 13920 ductile detailing MANDATORY", "Shear walls in RCC design", "Minimum M25 concrete grade", "Site-specific soil investigation"],
  "IV": ["IS 1893:2016 compliant design", "Ductile detailing required (IS 13920)", "Special moment resisting frames", "Minimum M25 concrete grade", "Regular structural audits"],
  "III": ["Standard seismic design per IS 1893", "Ductile detailing recommended", "Minimum M20 concrete grade", "Cross-bracing in critical zones"],
  "II": ["Basic seismic provisions", "Standard IS Code compliance", "M20 concrete acceptable", "Regular quality checks"]
};

export default function SeismicZoneChecker() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const check = async () => {
    if (!/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit Indian PIN code");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length) {
        const office = data[0].PostOffice[0];
        const state = office.State;
        const zoneInfo = SEISMIC_ZONE_MAP[state] || { zone: "II", risk: "Low", color: "#10B981", pga: "0.10g" };
        setResult({
          location: `${office.District}, ${state}`,
          area: office.Name,
          ...zoneInfo,
          recommendations: ZONE_RECOMMENDATIONS[zoneInfo.zone]
        });
      } else {
        setError("PIN code not found. Please try another.");
      }
    } catch {
      setError("Unable to fetch data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
      
      {/* INPUT PANEL */}
      <div className="lg:col-span-2 bg-[#000F1B] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6600]/15 text-[#FF6600] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#FF6600]/20">
            <ShieldAlert className="w-3.5 h-3.5" /> IS 1893:2016
          </div>
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3">Check your <span className="text-[#FF6600]">seismic zone</span></h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Enter your PIN code and instantly know your seismic risk category — plus the exact structural precautions your engineer must follow.
          </p>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Site PIN Code</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && check()}
                  placeholder="e.g. 600001"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20"
                />
              </div>
              <button
                onClick={check}
                disabled={loading || pincode.length !== 6}
                className="px-5 py-3.5 rounded-xl bg-[#FF6600] hover:bg-[#E04F00] disabled:bg-white/10 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest transition inline-flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /><span className="hidden sm:inline">Check</span></>}
              </button>
            </div>
            {error && <div className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />{error}</div>}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Zone Legend</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { z: "II", label: "Low", c: "#10B981" },
                { z: "III", label: "Moderate", c: "#F59E0B" },
                { z: "IV", label: "Severe", c: "#EA580C" },
                { z: "V", label: "Very Severe", c: "#DC2626" }
              ].map((z) => (
                <div key={z.z} className="flex items-center gap-2 text-[10px]">
                  <div className="w-3 h-3 rounded-sm" style={{ background: z.c }} />
                  <span className="font-bold text-white/70">Zone {z.z}</span>
                  <span className="text-white/40">· {z.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RESULT PANEL */}
      <div className="lg:col-span-3 bg-white border border-black/5 rounded-3xl p-6 md:p-8 min-h-[400px] shadow-sm flex flex-col">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#F5F6F8] grid place-items-center mb-4">
                <ShieldCheck className="w-10 h-10 text-[#111111]/30" />
              </div>
              <h4 className="text-lg font-bold text-[#000F1B] mb-2">Awaiting Site Data</h4>
              <p className="text-sm text-[#111111]/60 max-w-sm">Enter a PIN code on the left to see the seismic risk profile and mandatory engineering compliance for your area.</p>
            </motion.div>
          ) : (
            <motion.div key={result.location} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-black/5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/50 mb-1">Site Location</div>
                  <div className="text-lg md:text-xl font-bold text-[#000F1B] leading-tight">{result.area}</div>
                  <div className="text-sm text-[#111111]/60 mt-0.5">{result.location}</div>
                </div>
                <div className="text-white px-4 py-2 rounded-xl text-center shrink-0 shadow-md" style={{ background: result.color }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">Zone</div>
                  <div className="text-2xl font-black leading-none">{result.zone}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-black/5">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#111111]/40 mb-1">Risk Category</div>
                  <div className="text-base font-bold" style={{ color: result.color }}>{result.risk}</div>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-black/5">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#111111]/40 mb-1">Peak Ground Accel.</div>
                  <div className="text-base font-bold text-[#000F1B]">{result.pga}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FF6600]/5 to-[#FF6600]/10 border border-[#FF6600]/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-[#FF6600]" />
                  <h5 className="text-xs font-bold text-[#000F1B] uppercase tracking-wider">Engineering Precautions Required</h5>
                </div>
                <ul className="space-y-2.5">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#111111]/80">
                      <div className="w-4 h-4 rounded-full bg-[#FF6600]/15 grid place-items-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6600]" />
                      </div>
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] font-semibold text-[#111111]/40 mt-4 text-center">
                Source: IS 1893:2016 · Bureau of Indian Standards · Data via api.postalpincode.in
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}