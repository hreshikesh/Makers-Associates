import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {  ArrowRight, ArrowLeft, RotateCcw, Palette, Check } from "lucide-react";

const QUESTIONS = [
  {
    id: 1,
    question: "Pick a weekend morning:",
    options: [
      { id: "a", label: "Coffee & a novel by a sunny window", visual: "☕📖", tag: "calm" },
      { id: "b", label: "Farmers market with friends", visual: "🌿🧺", tag: "warm" },
      { id: "c", label: "Gallery hopping in the city", visual: "🎨🏙️", tag: "luxe" },
      { id: "d", label: "Yoga on the balcony", visual: "🧘☀️", tag: "minimal" }
    ]
  },
  {
    id: 2,
    question: "Your dream living room feels:",
    options: [
      { id: "a", label: "Clean, quiet, uncluttered", visual: "◻️", tag: "minimal" },
      { id: "b", label: "Layered, textured, story-filled", visual: "🌾", tag: "warm" },
      { id: "c", label: "Grand, polished, gallery-like", visual: "✨", tag: "luxe" },
      { id: "d", label: "Rooted, warm, wooden", visual: "🪵", tag: "indian" }
    ]
  },
  {
    id: 3,
    question: "Choose a color mood:",
    options: [
      { id: "a", label: "Whites & warm neutrals", visual: "🤍", tag: "minimal" },
      { id: "b", label: "Terracotta & jewel tones", visual: "🧡", tag: "warm" },
      { id: "c", label: "Deep blacks & metallics", visual: "🖤", tag: "luxe" },
      { id: "d", label: "Saffron, teal & indigo", visual: "🌺", tag: "indian" }
    ]
  },
  {
    id: 4,
    question: "One material you'd fill your home with:",
    options: [
      { id: "a", label: "Light oak wood", visual: "🪵", tag: "minimal" },
      { id: "b", label: "Rattan & jute", visual: "🌾", tag: "warm" },
      { id: "c", label: "Italian marble", visual: "💎", tag: "luxe" },
      { id: "d", label: "Handloom textiles", visual: "🧵", tag: "indian" }
    ]
  }
];

const RESULTS = {
  minimal: {
    name: "The Minimalist",
    style: "Scandinavian / Minimalist",
    tagline: "Calm, uncluttered, intentional.",
    description: "You value breathing room. Every object in your home should earn its place through function or genuine joy. Light woods, whites, and clean lines are your love language.",
    palette: ["#FFFFFF", "#F0EDE5", "#D6D3C7", "#333333"],
    keywords: ["Oak Wood", "White Walls", "Clean Lines", "Natural Light"],
    matchStyles: ["Minimalist", "Scandinavian"],
    color: "#8B7355"
  },
  warm: {
    name: "The Storyteller",
    style: "Bohemian / Rustic",
    tagline: "Layered, textured, soulful.",
    description: "Your home is a story that unfolds in every corner. You mix eras, celebrate imperfection, and love textures that feel human. Every piece has a memory.",
    palette: ["#C67B5C", "#D4B896", "#8B4A2B", "#5C4A2E"],
    keywords: ["Rattan", "Jute", "Reclaimed Wood", "Warm Textiles"],
    matchStyles: ["Bohemian", "Rustic"],
    color: "#C67B5C"
  },
  luxe: {
    name: "The Curator",
    style: "Luxe Contemporary",
    tagline: "Refined, polished, gallery-worthy.",
    description: "You believe luxury is quiet confidence — every finish deliberate, every material considered. Marble, velvet, and brushed metals speak your language.",
    palette: ["#1C1C1C", "#B8A382", "#FFFFFF", "#8B0000"],
    keywords: ["Marble", "Velvet", "Rose Gold", "Statement Art"],
    matchStyles: ["Luxe Contemporary"],
    color: "#B8A382"
  },
  indian: {
    name: "The Rooted Modernist",
    style: "Modern Indian",
    tagline: "Timeless roots, contemporary silhouettes.",
    description: "You want a home that honors where you come from while feeling utterly current. Saffron, teak, brass, and handloom sit beautifully alongside modern lines in your world.",
    palette: ["#D4A574", "#8B4513", "#2C3E50", "#F5E6D3"],
    keywords: ["Teak", "Terrazzo", "Handloom", "Brass"],
    matchStyles: ["Modern Indian"],
    color: "#D4A574"
  }
};

export default function StylePersonalityQuiz({ onMatchFound }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const selectAnswer = (qId, opt) => {
    const newAnswers = { ...answers, [qId]: opt.tag };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      // Compute result
      const counts = {};
      Object.values(newAnswers).forEach((tag) => { counts[tag] = (counts[tag] || 0) + 1; });
      const topTag = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setTimeout(() => setResult(RESULTS[topTag]), 400);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  const currentQ = QUESTIONS[step];
  const progress = ((step + (result ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
      
      {/* LEFT PANEL — Intro / Instructions */}
      <div className="lg:col-span-2 bg-[#252A2A] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-[#B89416]/20 blur-[80px] rounded-full pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B89416]/15 text-[#B89416] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#B89416]/20">
         4-Question Quiz
          </div>
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3">Find your <span className="text-[#B89416]">design personality</span></h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Answer 4 quick visual questions. We'll tell you which interior style truly fits how you live — plus match you with designers who specialize in it.
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
              <span>{result ? "Complete" : `Question ${step + 1} of ${QUESTIONS.length}`}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#B89416] to-[#F2D66D]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[10px] font-semibold text-white/40 leading-relaxed">
            💡 There are no wrong answers. Go with your gut — that's where your real taste lives.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Quiz or Result */}
      <div className="lg:col-span-3 bg-white border border-black/5 rounded-3xl p-6 md:p-8 min-h-[440px] shadow-sm flex flex-col">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key={`q-${currentQ.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-3">Q{currentQ.id} / {QUESTIONS.length}</div>
              <h4 className="text-xl md:text-2xl font-bold text-[#252A2A] mb-6 leading-tight">{currentQ.question}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => selectAnswer(currentQ.id, opt)}
                    className="group relative bg-[#F9FAFB] hover:bg-[#252A2A] border border-black/5 hover:border-[#252A2A] rounded-2xl p-4 md:p-5 text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="text-3xl md:text-4xl mb-3">{opt.visual}</div>
                    <div className="text-sm font-bold text-[#252A2A] group-hover:text-white transition leading-snug">{opt.label}</div>
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-black/10 group-hover:border-[#B89416] group-hover:bg-[#B89416] grid place-items-center transition">
                      <ArrowRight className="w-3 h-3 text-transparent group-hover:text-white transition" />
                    </div>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#252A2A]/50 hover:text-[#B89416] transition self-start cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous question
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-1 flex items-center gap-1.5">
                    Your Style Personality
                  </div>
                  <h4 className="text-2xl md:text-3xl font-bold text-[#252A2A] leading-tight">{result.name}</h4>
                  <div className="text-sm font-semibold text-[#252A2A]/60 mt-1">{result.style}</div>
                </div>
                <button onClick={reset} className="text-xs font-bold text-[#252A2A]/50 hover:text-[#B89416] transition inline-flex items-center gap-1 cursor-pointer shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>

              <div className="italic text-sm text-[#252A2A]/80 border-l-2 border-[#B89416] pl-4 py-2 mb-5 bg-[#F9FAFB] rounded-r-xl">
                "{result.tagline}"
              </div>

              <p className="text-sm text-[#252A2A]/70 leading-relaxed mb-5">{result.description}</p>

              {/* Palette */}
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/40 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Your Signature Palette
                </div>
                <div className="flex gap-2">
                  {result.palette.map((c, i) => (
                    <motion.div
                      key={c}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex-1 h-14 rounded-xl border border-black/5 shadow-sm relative group"
                      style={{ background: c }}
                    >
                      <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                        <div className="text-[8px] font-bold bg-black/70 text-white px-2 py-0.5 rounded">{c}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="mb-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/40 mb-2">Materials You'll Love</div>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((k) => (
                    <span key={k} className="px-3 py-1 rounded-md text-xs font-bold bg-[#F5F6F8] border border-black/5 text-[#252A2A] inline-flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-500" /> {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => {
                    onMatchFound?.(result.matchStyles);
                    document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full py-4 rounded-xl bg-[#B89416] hover:bg-[#8F7210] text-white text-sm font-bold transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  Show Designers Who Match You <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}