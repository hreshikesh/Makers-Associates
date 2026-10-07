import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Sun, Cloud, CloudRain, Home, Loader2, ExternalLink, RotateCcw, Droplets } from "lucide-react";
import axios from "axios";

const SPACE_OPTIONS = [
  { id: "balcony", label: "Balcony", icon: Home },
  { id: "terrace", label: "Terrace", icon: Home },
  { id: "indoor", label: "Indoor", icon: Home },
  { id: "garden", label: "Garden", icon: Home }
];

const SUNLIGHT_OPTIONS = [
  { id: "full", label: "Full Sun", icon: Sun, desc: "6+ hrs direct" },
  { id: "partial", label: "Partial Sun", icon: Cloud, desc: "3–6 hrs" },
  { id: "shade", label: "Shade", icon: CloudRain, desc: "<3 hrs" }
];

const CARE_OPTIONS = [
  { id: "easy", label: "Easy", desc: "Low maintenance" },
  { id: "moderate", label: "Moderate", desc: "Weekly attention" },
  { id: "expert", label: "Expert", desc: "Regular care" }
];

// Curated fallback database — beautiful Indian-friendly plants
const CURATED_PLANTS = {
  "balcony-full-easy": [
    { name: "Bougainvillea", scientific: "Bougainvillea glabra", image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400", desc: "Vibrant flowering vine that loves the sun and needs minimal care." },
    { name: "Marigold", scientific: "Tagetes erecta", image: "https://images.unsplash.com/photo-1592859600972-1b0834d83747?w=400", desc: "Cheerful orange blooms, perfect for warm balconies." },
    { name: "Portulaca", scientific: "Portulaca grandiflora", image: "https://images.unsplash.com/photo-1508502726440-477c94bff103?w=400", desc: "Drought-tolerant carpet of colorful blooms." }
  ],
  "balcony-partial-easy": [
    { name: "Snake Plant", scientific: "Sansevieria trifasciata", image: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?w=400", desc: "Nearly indestructible, air-purifying and elegant." },
    { name: "Tulsi", scientific: "Ocimum sanctum", image: "https://images.unsplash.com/photo-1618377385526-83bd1a2c8f96?w=400", desc: "Sacred herb — fragrant, medicinal, easy to grow." },
    { name: "Money Plant", scientific: "Epipremnum aureum", image: "https://images.unsplash.com/photo-1587653263995-422546a7a569?w=400", desc: "Trailing vine that thrives in filtered light." }
  ],
  "indoor-shade-easy": [
    { name: "ZZ Plant", scientific: "Zamioculcas zamiifolia", image: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=400", desc: "Thrives in low light and near-zero care." },
    { name: "Peace Lily", scientific: "Spathiphyllum wallisii", image: "https://images.unsplash.com/photo-1616500163050-5d7feb7c1e1e?w=400", desc: "Elegant white blooms that thrive in shade." },
    { name: "Pothos", scientific: "Epipremnum aureum", image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400", desc: "Cascading vine, forgiving of neglect." }
  ],
  "indoor-partial-easy": [
    { name: "Rubber Plant", scientific: "Ficus elastica", image: "https://images.unsplash.com/photo-1615213612138-4d1195b1c0e9?w=400", desc: "Bold glossy leaves, statement piece for any room." },
    { name: "Areca Palm", scientific: "Dypsis lutescens", image: "https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400", desc: "Tropical feel indoors, humidifies the air." },
    { name: "Spider Plant", scientific: "Chlorophytum comosum", image: "https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400", desc: "Fast-growing, produces adorable baby plantlets." }
  ],
  "terrace-full-moderate": [
    { name: "Frangipani (Champa)", scientific: "Plumeria alba", image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400", desc: "Fragrant tropical tree, blooms all summer." },
    { name: "Hibiscus", scientific: "Hibiscus rosa-sinensis", image: "https://images.unsplash.com/photo-1502780402662-acc01917cf46?w=400", desc: "Iconic red blooms that attract hummingbirds." },
    { name: "Curry Leaves", scientific: "Murraya koenigii", image: "https://images.unsplash.com/photo-1618377385526-83bd1a2c8f96?w=400", desc: "Kitchen essential, aromatic and hardy." }
  ],
  "garden-full-moderate": [
    { name: "Mango Tree", scientific: "Mangifera indica", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400", desc: "Iconic Indian tree providing shade & sweet fruit." },
    { name: "Neem", scientific: "Azadirachta indica", image: "https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400", desc: "Sacred medicinal tree, natural pest deterrent." },
    { name: "Jasmine", scientific: "Jasminum sambac", image: "https://images.unsplash.com/photo-1516727003284-a96541e51e9c?w=400", desc: "Fragrant white blooms, iconic Indian garden plant." }
  ]
};

// Get best fallback match
const getFallbackPlants = (space, sunlight, care) => {
  const key = `${space}-${sunlight}-${care}`;
  // Try exact match, then partial matches
  if (CURATED_PLANTS[key]) return CURATED_PLANTS[key];
  
  // Fallback logic
  const fallbackKeys = Object.keys(CURATED_PLANTS);
  const partialMatch = fallbackKeys.find(k => k.startsWith(`${space}-${sunlight}`)) ||
                       fallbackKeys.find(k => k.startsWith(`${space}-`)) ||
                       fallbackKeys.find(k => k.startsWith(`indoor-`));
  return CURATED_PLANTS[partialMatch] || CURATED_PLANTS["indoor-partial-easy"];
};

export default function PlantRecommender() {
  const [space, setSpace] = useState("balcony");
  const [sunlight, setSunlight] = useState("partial");
  const [care, setCare] = useState("easy");
  const [loading, setLoading] = useState(false);
  const [plants, setPlants] = useState([]);
  const [source, setSource] = useState(""); // "trefle" or "curated"
  const [shown, setShown] = useState(false);

  const fetchPlants = async () => {
    setLoading(true);
    setShown(true);
    
    // Try Trefle API first (requires token — will fail silently if no token)
    const TREFLE_TOKEN = import.meta.env.VITE_TREFLE_TOKEN || "";
    
    if (TREFLE_TOKEN) {
      try {
        const filter = sunlight === "full" ? "filter[light]=8" : sunlight === "partial" ? "filter[light]=5" : "filter[light]=3";
        const { data } = await axios.get(`https://trefle.io/api/v1/plants?token=${TREFLE_TOKEN}&${filter}&page_size=6`);
        if (data?.data?.length) {
          const trefleP = data.data.filter(p => p.image_url).slice(0, 6).map(p => ({
            name: p.common_name || p.scientific_name,
            scientific: p.scientific_name,
            image: p.image_url,
            desc: `${p.family_common_name || p.family || "Plant"} family, native to ${p.observations || "diverse regions"}.`
          }));
          if (trefleP.length >= 3) {
            setPlants(trefleP);
            setSource("trefle");
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log("Trefle unavailable, using curated data");
      }
    }
    
    // Fallback: use curated Indian plant database
    setTimeout(() => {
      setPlants(getFallbackPlants(space, sunlight, care));
      setSource("curated");
      setLoading(false);
    }, 700);
  };

  const reset = () => {
    setShown(false);
    setPlants([]);
    setSource("");
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
      
      {/* LEFT — Input Panel */}
      <div className="lg:col-span-2 bg-[#252A2A] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-[#B89416]/20 blur-[80px] rounded-full pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B89416]/15 text-[#B89416] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#B89416]/20">
            <Leaf className="w-3.5 h-3.5" /> Plant Recommender
          </div>
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3">Find the right <span className="text-[#B89416]">plants for you</span></h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Tell us your space, sunlight, and how much care you'd like to give. We'll recommend plants that will actually thrive.
          </p>

          {/* Space */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Your Space</label>
            <div className="grid grid-cols-2 gap-2">
              {SPACE_OPTIONS.map((s) => {
                const on = space === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSpace(s.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      on ? "bg-[#B89416] border-[#B89416] text-white" : "bg-white/5 border-white/10 text-white/70 hover:border-[#B89416]/50"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sunlight */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Sunlight</label>
            <div className="grid grid-cols-3 gap-2">
              {SUNLIGHT_OPTIONS.map((s) => {
                const Icon = s.icon;
                const on = sunlight === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSunlight(s.id)}
                    className={`py-3 px-2 rounded-xl transition border cursor-pointer flex flex-col items-center gap-1 ${
                      on ? "bg-[#B89416] border-[#B89416] text-white" : "bg-white/5 border-white/10 text-white/70 hover:border-[#B89416]/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Care */}
          <div className="mb-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Care Level</label>
            <div className="grid grid-cols-3 gap-2">
              {CARE_OPTIONS.map((c) => {
                const on = care === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCare(c.id)}
                    className={`py-2.5 px-2 rounded-xl transition border cursor-pointer text-center ${
                      on ? "bg-[#B89416] border-[#B89416] text-white" : "bg-white/5 border-white/10 text-white/70 hover:border-[#B89416]/50"
                    }`}
                  >
                    <div className="text-xs font-bold">{c.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={fetchPlants}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#B89416] hover:bg-[#8F7210] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest transition inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding plants...</> : <><Leaf className="w-4 h-4" /> Find My Plants</>}
          </button>

          <div className="mt-4 text-[9px] text-white/40 flex items-center gap-1.5">
            <Droplets className="w-3 h-3" /> Data powered by Trefle Plant API & curated Indian plant database
          </div>
        </div>
      </div>

      {/* RIGHT — Results */}
      <div className="lg:col-span-3 bg-white border border-black/5 rounded-3xl p-6 md:p-8 min-h-[500px] shadow-sm">
        <AnimatePresence mode="wait">
          {!shown ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center py-8 min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-emerald-50 grid place-items-center mb-4">
                <Leaf className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-lg font-bold text-[#252A2A] mb-2">Ready when you are</h4>
              <p className="text-sm text-[#252A2A]/60 max-w-sm">Set your preferences on the left, then tap "Find My Plants" for personalized recommendations.</p>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-8 min-h-[400px]">
              <Loader2 className="w-12 h-12 text-[#B89416] animate-spin mb-4" />
              <div className="text-sm font-bold text-[#252A2A]">Curating plants for you...</div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-1 flex items-center gap-1.5">
                    Your Recommendations
                  </div>
                  <h4 className="text-lg font-bold text-[#252A2A]">{plants.length} plants perfect for you</h4>
                </div>
                <button onClick={reset} className="text-xs font-bold text-[#252A2A]/50 hover:text-[#B89416] transition inline-flex items-center gap-1 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plants.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-[#F9FAFB] border border-black/5 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#B89416]/30 transition group"
                  >
                    <div className="h-32 overflow-hidden bg-emerald-50">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"; }} />
                    </div>
                    <div className="p-3">
                      <h5 className="text-sm font-bold text-[#252A2A] leading-tight">{p.name}</h5>
                      <div className="text-[10px] italic text-[#252A2A]/50 mb-1.5">{p.scientific}</div>
                      <p className="text-[11px] text-[#252A2A]/70 leading-snug line-clamp-2">{p.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {source === "curated" && (
                <div className="mt-4 text-[10px] text-[#252A2A]/40 text-center italic">
                  ✿ Curated from our expert Indian plant database
                </div>
              )}
              {source === "trefle" && (
                <div className="mt-4 text-[10px] text-[#252A2A]/40 text-center italic flex items-center justify-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Powered by Trefle Plant API
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}