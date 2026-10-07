import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, Lightbulb, Lock, Camera, Thermometer, Speaker, Blinds, 
  Check, ArrowRight, RotateCcw, TrendingDown, Zap, IndianRupee
} from "lucide-react";

const ROOMS = [
  { id: "living", label: "Living Room", icon: Home },
  { id: "bedroom", label: "Master Bedroom", icon: Home },
  { id: "kitchen", label: "Kitchen", icon: Home },
  { id: "entry", label: "Entry & Foyer", icon: Home }
];

const FEATURES = [
  { id: "lighting", label: "Smart Lighting", icon: Lightbulb, price: 4500, save: 180, desc: "Color + tunable white" },
  { id: "locks", label: "Smart Locks", icon: Lock, price: 12000, save: 0, desc: "Fingerprint + app control" },
  { id: "camera", label: "Security Camera", icon: Camera, price: 6500, save: 0, desc: "4K night vision" },
  { id: "climate", label: "Climate Control", icon: Thermometer, price: 9500, save: 850, desc: "AC + fan automation" },
  { id: "voice", label: "Voice Hub", icon: Speaker, price: 5000, save: 0, desc: "Alexa / Google Home" },
  { id: "blinds", label: "Motor. Blinds", icon: Blinds, price: 8500, save: 220, desc: "Auto sunrise / sunset" }
];

export default function SmartHomeBuilder() {
  const [selections, setSelections] = useState({});
  const [activeRoom, setActiveRoom] = useState(ROOMS[0].id);

  const toggleFeature = (roomId, featureId) => {
    setSelections((prev) => {
      const room = prev[roomId] || {};
      return { ...prev, [roomId]: { ...room, [featureId]: !room[featureId] } };
    });
  };

  const reset = () => setSelections({});

  const summary = useMemo(() => {
    let totalPrice = 0;
    let monthlySavings = 0;
    let deviceCount = 0;
    let roomsCovered = 0;

    Object.entries(selections).forEach(([roomId, features]) => {
      const roomHasSelection = Object.values(features).some(Boolean);
      if (roomHasSelection) roomsCovered++;
      Object.entries(features).forEach(([fId, on]) => {
        if (on) {
          const f = FEATURES.find((x) => x.id === fId);
          if (f) {
            totalPrice += f.price;
            monthlySavings += f.save;
            deviceCount++;
          }
        }
      });
    });

    const maxPossible = ROOMS.length * FEATURES.length;
    const score = Math.round((deviceCount / maxPossible) * 100);
    const annualSavings = monthlySavings * 12;

    return { totalPrice, monthlySavings, annualSavings, deviceCount, roomsCovered, score };
  }, [selections]);

  const activeRoomSelections = selections[activeRoom] || {};

  const formatMoney = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
      
      {/* LEFT PANEL — Room + Feature Selection */}
      <div className="lg:col-span-3 bg-white border border-black/5 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-1">Step 1 · Room Selector</div>
            <h4 className="text-lg md:text-xl font-bold text-[#252A2A]">Build room by room</h4>
          </div>
          {summary.deviceCount > 0 && (
            <button onClick={reset} className="text-[10px] font-bold text-[#252A2A]/50 hover:text-[#B89416] transition inline-flex items-center gap-1 cursor-pointer">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Room Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {ROOMS.map((r) => {
            const on = activeRoom === r.id;
            const roomHasSel = Object.values(selections[r.id] || {}).some(Boolean);
            const selCount = Object.values(selections[r.id] || {}).filter(Boolean).length;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRoom(r.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer inline-flex items-center gap-2 ${
                  on ? "bg-[#252A2A] text-white border-[#252A2A]" : "bg-white text-[#252A2A]/70 border-black/10 hover:border-[#B89416]"
                }`}
              >
                {r.label}
                {roomHasSel && (
                  <span className={`text-[9px] font-black rounded-full w-4 h-4 grid place-items-center ${on ? "bg-[#B89416] text-white" : "bg-[#B89416]/15 text-[#B89416]"}`}>
                    {selCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/40 mb-3">
          Choose features for <span className="text-[#B89416]">{ROOMS.find((r) => r.id === activeRoom)?.label}</span>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const on = activeRoomSelections[f.id];
            return (
              <button
                key={f.id}
                onClick={() => toggleFeature(activeRoom, f.id)}
                className={`group relative border rounded-2xl p-3 md:p-4 text-left transition-all cursor-pointer ${
                  on 
                    ? "bg-[#252A2A] border-[#252A2A] text-white shadow-md -translate-y-0.5" 
                    : "bg-[#F9FAFB] border-black/5 hover:border-[#B89416]/40 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg grid place-items-center transition ${on ? "bg-[#B89416]/20" : "bg-white border border-black/5"}`}>
                    <Icon className={`w-4 h-4 ${on ? "text-[#B89416]" : "text-[#252A2A]"}`} />
                  </div>
                  {on && (
                    <div className="w-5 h-5 rounded-full bg-[#B89416] grid place-items-center">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className={`text-xs font-bold leading-tight mb-0.5 ${on ? "text-white" : "text-[#252A2A]"}`}>{f.label}</div>
                <div className={`text-[10px] leading-tight ${on ? "text-white/60" : "text-[#252A2A]/50"}`}>{f.desc}</div>
                <div className={`text-[10px] font-bold mt-2 ${on ? "text-[#B89416]" : "text-[#252A2A]/40"}`}>
                  from ₹{f.price.toLocaleString("en-IN")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL — Live Summary */}
      <div className="lg:col-span-2 bg-[#252A2A] rounded-3xl p-6 md:p-7 text-white relative overflow-hidden sticky top-24">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-[#B89416]/20 blur-[80px] rounded-full pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B89416]/15 text-[#B89416] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#B89416]/20">
            <Zap className="w-3.5 h-3.5" /> Live Estimate
          </div>
          <h3 className="text-2xl font-bold leading-tight mb-6">Your Smart Home</h3>

          <AnimatePresence mode="wait">
            {summary.deviceCount === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 grid place-items-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-sm text-white/50 text-center leading-relaxed">
                  Start selecting features for each room on the left. Your budget & savings will appear here live.
                </p>
              </motion.div>
            ) : (
              <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                
                {/* Total Price */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 flex items-center gap-1.5">
                    <IndianRupee className="w-3 h-3" /> Estimated Investment
                  </div>
                  <div className="text-3xl font-black text-white leading-none">{formatMoney(summary.totalPrice)}</div>
                  <div className="text-[10px] text-white/40 mt-1">one-time · installation included</div>
                </div>

                {/* Savings */}
                {summary.annualSavings > 0 && (
                  <div className="bg-[#B89416]/10 border border-[#B89416]/20 rounded-2xl p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-1 flex items-center gap-1.5">
                      <TrendingDown className="w-3 h-3" /> Annual Energy Savings
                    </div>
                    <div className="text-2xl font-black text-white leading-none">{formatMoney(summary.annualSavings)}</div>
                    <div className="text-[10px] text-white/60 mt-1">payback in ~{Math.ceil(summary.totalPrice / summary.annualSavings)} years</div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-white leading-none">{summary.deviceCount}</div>
                    <div className="text-[8px] font-bold uppercase tracking-wider text-white/50 mt-1">Devices</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-white leading-none">{summary.roomsCovered}</div>
                    <div className="text-[8px] font-bold uppercase tracking-wider text-white/50 mt-1">Rooms</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-[#B89416] leading-none">{summary.score}</div>
                    <div className="text-[8px] font-bold uppercase tracking-wider text-white/50 mt-1">Score</div>
                  </div>
                </div>

                {/* Smartness Bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                    <span>Smartness Level</span>
                    <span>{summary.score < 30 ? "Starter" : summary.score < 60 ? "Advanced" : "Fully Automated"}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#B89416] to-[#F2D66D]"
                      initial={{ width: 0 }}
                      animate={{ width: `${summary.score}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Hi, I built a smart home plan on [Your Brand]s™:\n\n• ${summary.deviceCount} devices across ${summary.roomsCovered} rooms\n• Est. Budget: ${formatMoney(summary.totalPrice)}\n• Est. Annual Savings: ${formatMoney(summary.annualSavings)}\n\nCan we schedule a consultation?`);
                    window.open(`https://wa.me/917892071052?text=${text}`, "_blank");
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#B89416] hover:bg-[#8F7210] text-white text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  Get Free Consultation <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}