import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Star, ShieldCheck, MapPin, Search, 
  Briefcase, Award, ChevronDown, Check, UserPlus, Image as ImageIcon, 
  X, Zap, Loader2, MessageCircle, Filter, SlidersHorizontal, 
  Bookmark, Phone, CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { PROFESSIONALS } from "./data/ContractorData";
import SEO from "@/components/site/SEO";

const CATEGORIES = ["All", "Architecture", "Structural", "Civil Works", "Interior Design", "Electrical & Plumbing"];
const LOCATIONS = ["All Locations", "Bangalore South", "Bangalore East", "Bangalore Central", "Bangalore North", "Bangalore West"];

export default function ContractorsPage() {
  const navigate = useNavigate();
  
  // Filtering & Search State
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  // Saved / Bookmarked Pros
  const [savedProIds, setSavedProIds] = useState([]);

  // AI Matcher State
  const [aiProjectType, setAiProjectType] = useState("");
  const [aiService, setAiService] = useState("");
  const [aiLocation, setAiLocation] = useState("");
  
  const [isMatching, setIsMatching] = useState(false);
  const [matchedResults, setMatchedResults] = useState(null);

  // Modal States
  const [portfolioView, setPortfolioView] = useState(null);

  // Bookmark Toggle
  const toggleSavePro = (id, name) => {
    setSavedProIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        toast.info(`Removed ${name} from saved shortlist.`);
        return prev.filter(item => item !== id);
      } else {
        toast.success(`Saved ${name} to your shortlist!`);
        return [...prev, id];
      }
    });
  };

  // Dynamic Filtering Logic
  const displayedPros = useMemo(() => {
    let list = [...PROFESSIONALS];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q)
      );
    }

    if (!matchedResults && activeCategory !== "All") {
      list = list.filter(p => p.category === activeCategory);
    }

    if (!matchedResults && selectedLocation !== "All Locations") {
      list = list.filter(p => p.location === selectedLocation);
    }

    if (matchedResults) {
      const scoreMap = Object.fromEntries(matchedResults.map(m => [m.id, m.score]));
      list = list
        .filter(p => scoreMap[p.id] !== undefined)
        .sort((a, b) => scoreMap[b.id] - scoreMap[a.id])
        .map(p => ({ ...p, matchScore: scoreMap[p.id] }));
    } else {
      if (sortBy === "rating") {
        list.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === "experience") {
        list.sort((a, b) => b.experienceYears - a.experienceYears);
      } else if (sortBy === "projects") {
        list.sort((a, b) => b.projects_completed - a.projects_completed);
      }
    }

    return list;
  }, [activeCategory, selectedLocation, searchQuery, sortBy, matchedResults]);

  // REVISED AI MATCHER LOGIC
  const handleAiMatch = () => {
    if (!aiProjectType || !aiService || !aiLocation) {
      toast.error("Please select Project Type, Required Service, and Location.");
      return;
    }
    
    setIsMatching(true);
    
    setTimeout(() => {
      const results = [];

      PROFESSIONALS.forEach(pro => {
        let score = 0;
        
        // 1. Primary Category Alignment (Required / Heavily Weighted)
        const isExactCategory = pro.category === aiService;
        const isRelatedCategory = 
          (aiService === "Architecture" && pro.category === "Structural") ||
          (aiService === "Civil Works" && pro.category === "Structural") ||
          (aiService === "Interior Design" && pro.category === "Architecture");

        if (isExactCategory) {
          score += 60;
        } else if (isRelatedCategory) {
          score += 30;
        } else {
          // Strictly exclude unrelated categories when a specific service is requested
          return;
        }

        // 2. Location Alignment (Max 25 points)
        if (aiLocation === "All Locations" || pro.location === aiLocation) {
          score += 25;
        } else if (pro.location.toLowerCase().includes(aiLocation.toLowerCase())) {
          score += 25;
        } else {
          score += 10;
        }

        // 3. Project Scope / Bio Keyword Alignment (Max 15 points)
        const bioLower = pro.bio.toLowerCase();
        if (aiProjectType === "villa" && bioLower.includes("villa")) score += 15;
        else if (aiProjectType === "commercial" && bioLower.includes("commercial")) score += 15;
        else if (aiProjectType === "apartment" && (bioLower.includes("apartment") || bioLower.includes("modular"))) score += 15;
        else if (aiProjectType === "renovation" && (bioLower.includes("interior") || bioLower.includes("masonry") || bioLower.includes("plastering"))) score += 15;
        else score += 5;

        // Cap score deterministically
        const finalScore = Math.min(score, 98);

        if (finalScore >= 50) {
          results.push({ id: pro.id, score: finalScore });
        }
      });

      results.sort((a, b) => b.score - a.score);

      setMatchedResults(results);
      setActiveCategory("All");
      setSelectedLocation("All Locations");
      setIsMatching(false);

      if (results.length === 0) {
        toast.error("No direct matches found. Try selecting 'All Locations'.");
      } else {
        toast.success(`Found ${results.length} matched expert${results.length > 1 ? 's' : ''}!`);
      }
    }, 600);
  };

  const resetMatch = () => {
    setMatchedResults(null);
    setAiProjectType("");
    setAiService("");
    setAiLocation("");
    toast.info("AI filters cleared.");
  };

  // WhatsApp Redirect
  const handleWhatsAppClick = (pro) => {
    const text = encodeURIComponent(
      `Hi ${pro.name.split(" ")[0]}, I found your verified profile on [Your Brand]s™. I am looking for ${pro.role} services in ${pro.location}. Can we discuss my project?`
    );
    window.open(`https://wa.me/${pro.phone}?text=${text}`, "_blank");
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://[Your Brand]s.com/marketplace/contractors#webpage",
        "url": "https://[Your Brand]s.com/marketplace/contractors",
        "name": "Verified Contractors, Civil Masons & Turnkey Builders",
        "description": "Browse profiles of verified, background-checked civil contractors, structural engineers, and modular builders."
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
            "item": "https://[Your Brand]s.com/marketplace/contractors"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Contractors",
            "item": "https://[Your Brand]s.com/marketplace/contractors"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-['Poppins',sans-serif] selection:bg-[#B89416] selection:text-white flex flex-col">
      <SEO
        title="Verified Civil Contractors & Structural Builders"
        description="Find elite, background-checked construction professionals near you. Match with civil contractors, master masons, and turnkey builders using our AI Talent Matcher."
        canonical="/marketplace/contractors"
        keywords="civil contractors India, house construction company, certified masonry builders, licensed structural engineers, turnkey builders, renovation contractor"
        structuredData={structuredData}
      />

      <Header />
      
      <main className="flex-1">
        
        {/* =========================================
            1. HERO SECTION
        ========================================= */}
        <section className="relative bg-[#252A2A] pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          <motion.div 
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#B89416]/15 blur-[120px] rounded-full pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <ShieldCheck className="w-4 h-4 text-[#B89416]" />
              <span className="text-[10px] font-bold tracking-[0.15em] text-white uppercase">[Your Brand]s Verified Partners</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
              The architects of your <br className="hidden md:block" />
              <span className="text-[#B89416]">imagination.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Connect with India's most elite, background-checked construction professionals. From visionary architects to master masons, build your dream team today.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' })} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#B89416] px-8 py-4 text-sm font-bold text-white hover:bg-[#8F7210] transition shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:-translate-y-0.5"
              >
                <Search className="w-5 h-5 shrink-0" />
                Find a Professional
              </button>
              
              <button 
                onClick={() => navigate("/contact")} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 text-sm font-bold text-white transition backdrop-blur-sm"
              >
                <UserPlus className="w-5 h-5 shrink-0" />
                Join as a Partner
              </button>
            </div>
          </div>
        </section>

        {/* =========================================
            2. TRUST METRICS STRIP
        ========================================= */}
        <div className="bg-white border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-6 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#252A2A]">
            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#B89416]" /> <span>250+ Verified Pros</span></div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-[#B89416] fill-[#B89416]" /> <span>4.8★ Average Rating</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#B89416]" /> <span>12 Cities Covered</span></div>
            {savedProIds.length > 0 && (
              <div className="flex items-center gap-2 bg-[#B89416]/10 text-[#B89416] px-3 py-1.5 rounded-full">
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{savedProIds.length} Saved Professional{savedProIds.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            3. AI MATCHER & DIRECTORY
        ========================================= */}
        <section id="directory" className="py-16 md:py-24 px-4 sm:px-6 relative">
          <div className="max-w-7xl mx-auto">
            
            {/* AI Matcher Dashboard */}
            <div className="bg-[#252A2A] rounded-[2rem] p-6 md:p-8 shadow-2xl mb-12 relative overflow-hidden border border-black/10">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "30px 30px" }} />
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B89416] mb-2">
                    <Zap className="w-3.5 h-3.5 fill-current" /> AI Talent Matcher
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Find your perfect fit by location &amp; scope.</h3>
                  <p className="text-xs text-white/50 mt-1">Select your project type, service, and local neighborhood.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <select 
                    value={aiProjectType} onChange={(e) => setAiProjectType(e.target.value)}
                    className="w-full sm:w-40 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#B89416] appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#252A2A]">Project Type</option>
                    <option value="villa" className="bg-[#252A2A]">Luxury Villa</option>
                    <option value="apartment" className="bg-[#252A2A]">Apartment Interior</option>
                    <option value="commercial" className="bg-[#252A2A]">Commercial Space</option>
                    <option value="renovation" className="bg-[#252A2A]">Home Renovation</option>
                  </select>

                  <select 
                    value={aiService} onChange={(e) => setAiService(e.target.value)}
                    className="w-full sm:w-40 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#B89416] appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#252A2A]">Required Service</option>
                    <option value="Architecture" className="bg-[#252A2A]">Architecture</option>
                    <option value="Structural" className="bg-[#252A2A]">Structural Design</option>
                    <option value="Interior Design" className="bg-[#252A2A]">Interior Design</option>
                    <option value="Civil Works" className="bg-[#252A2A]">Civil Works</option>
                    <option value="Electrical & Plumbing" className="bg-[#252A2A]">Electrical &amp; Plumbing</option>
                  </select>

                  <select 
                    value={aiLocation} onChange={(e) => setAiLocation(e.target.value)}
                    className="w-full sm:w-44 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#B89416] appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#252A2A]">Select Location</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc} className="bg-[#252A2A]">{loc}</option>
                    ))}
                  </select>

                  <button 
                    onClick={handleAiMatch}
                    disabled={isMatching}
                    className="w-full sm:w-32 bg-[#B89416] hover:bg-[#B89416] text-white px-4 py-3 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : matchedResults ? "Re-Match" : "Match Me"}
                  </button>

                  {matchedResults && (
                    <button onClick={resetMatch} className="w-12 h-12 shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition cursor-pointer" title="Reset Filters">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* DIRECTORY SEARCH & FILTER CONTROLS */}
            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#252A2A]/40" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, skill, location..."
                  className="w-full bg-[#F5F6F8] border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252A2A] focus:outline-none focus:ring-2 focus:ring-[#B89416]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/40 hover:text-black">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {!matchedResults && (
                  <div className="flex items-center gap-1.5 bg-[#F5F6F8] px-3 py-1.5 rounded-xl border border-black/5 text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#B89416]" />
                    <select 
                      value={selectedLocation} 
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="bg-transparent border-none focus:outline-none text-xs text-[#252A2A] cursor-pointer"
                    >
                      {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!matchedResults && (
                  <div className="flex items-center gap-1.5 bg-[#F5F6F8] px-3 py-1.5 rounded-xl border border-black/5 text-xs font-semibold">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#252A2A]/60" />
                    <span className="text-black/40 text-[10px] uppercase">Sort:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none focus:outline-none text-xs text-[#252A2A] cursor-pointer"
                    >
                      <option value="rating">Highest Rating</option>
                      <option value="experience">Most Experienced</option>
                      <option value="projects">Most Projects</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Category Pills & Count Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-xl font-bold text-[#252A2A]">
                {matchedResults ? "Your AI Matches" : "Professionals Directory"}
                <span className="text-xs text-[#252A2A]/40 ml-2 font-normal">({displayedPros.length} results)</span>
              </h3>
              
              {!matchedResults && (
                <>
                  <div className="hidden md:flex items-center gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
                          activeCategory === cat ? "bg-[#252A2A] text-white border-[#252A2A]" : "bg-white text-[#252A2A]/70 border-black/10 hover:border-[#B89416] hover:text-[#B89416]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="md:hidden relative">
                    <select 
                      value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-full px-4 py-2.5 text-xs font-bold text-[#252A2A] appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#B89416]"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#252A2A]/50 pointer-events-none" />
                  </div>
                </>
              )}
            </div>

            {/* Talent Grid - Clean Flow without popLayout overlap */}
            {displayedPros.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-black/5">
                <Search className="w-10 h-10 text-black/20 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-[#252A2A]">No professionals found</h4>
                <p className="text-xs text-black/50 mt-1 max-w-md mx-auto">Try clearing your search query or selecting a different category or location filter.</p>
                <button 
                  onClick={() => { setActiveCategory("All"); setSelectedLocation("All Locations"); setSearchQuery(""); resetMatch(); }} 
                  className="mt-4 px-5 py-2 bg-[#252A2A] text-white rounded-xl text-xs font-bold hover:bg-[#B89416] transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {displayedPros.map((pro, i) => {
                  const isAiMatched = matchedResults !== null;
                  const isSaved = savedProIds.includes(pro.id);

                  return (
                    <motion.div
                      key={pro.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`bg-white rounded-3xl border p-6 flex flex-col transition duration-300 relative ${
                        isAiMatched 
                          ? "border-[#B89416] shadow-[0_8px_25px_rgba(255,90,0,0.12)]" 
                          : "border-black/5 shadow-sm hover:shadow-md hover:border-black/15"
                      }`}
                    >
                      {/* Integrated AI Match Pill Header */}
                      {isAiMatched && (
                        <div className="mb-4 inline-flex items-center gap-1.5 bg-[#B89416] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit shadow-xs">
                          <Zap className="w-3 h-3 fill-current" /> {pro.matchScore}% Match
                        </div>
                      )}

                      {/* Bookmark Button */}
                      <button 
                        onClick={() => toggleSavePro(pro.id, pro.name)}
                        className="absolute top-6 right-6 text-black/30 hover:text-[#B89416] transition cursor-pointer"
                        title={isSaved ? "Remove from saved" : "Save professional"}
                      >
                        <Bookmark className={`w-5 h-5 ${isSaved ? "fill-[#B89416] text-[#B89416]" : ""}`} />
                      </button>

                      {/* Pro Header */}
                      <div className="flex items-start gap-4 mb-4 pr-6">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-black/10 shrink-0 relative bg-black/5">
                          <img src={pro.avatar} alt={pro.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89416] truncate">{pro.category}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Background Checked & Verified" />
                          </div>
                          <h3 className="text-base font-bold text-[#252A2A] leading-tight truncate">{pro.name}</h3>
                          <div className="text-xs text-[#252A2A]/60 truncate mt-0.5">{pro.role}</div>
                          
                          {/* Location Badge */}
                          <div className="flex items-center gap-1 text-[11px] text-[#252A2A]/50 mt-1">
                            <MapPin className="w-3 h-3 text-[#B89416]" />
                            <span className="truncate">{pro.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Bar */}
                      <div className="flex items-center justify-between mb-4 bg-[#F9FAFB] border border-black/5 p-3 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-[#252A2A]/40 font-bold mb-0.5">Rating</span>
                          <div className="flex items-center gap-1 text-xs font-bold text-[#252A2A]">
                            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" /> {pro.rating}
                          </div>
                        </div>
                        <div className="w-px h-6 bg-black/10" />
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-[#252A2A]/40 font-bold mb-0.5">Experience</span>
                          <div className="text-xs font-bold text-[#252A2A]">{pro.experience}</div>
                        </div>
                        <div className="w-px h-6 bg-black/10" />
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-[#252A2A]/40 font-bold mb-0.5">Projects</span>
                          <div className="text-xs font-bold text-[#252A2A]">{pro.projects_completed}</div>
                        </div>
                      </div>

                      <p className="text-xs text-[#252A2A]/70 leading-relaxed line-clamp-3 mb-6 flex-1">
                        {pro.bio}
                      </p>

                      {/* Action Buttons */}
                      <div className="mt-auto flex flex-col gap-2">
                        <button 
                          onClick={() => setPortfolioView(pro)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-[#F5F6F8] hover:bg-[#252A2A] hover:text-white text-[#252A2A] border border-black/5 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4" /> View Portfolio
                        </button>
                        
                        <button 
                          onClick={() => handleWhatsAppClick(pro)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" /> Direct WhatsApp
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =========================================
            4. JOIN NETWORK BANNER (CTA)
        ========================================= */}
        <section className="py-12 px-4 sm:px-6 mb-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-[#252A2A] rounded-[2.5rem] p-8 md:p-14 text-center relative overflow-hidden border border-white/10 shadow-2xl">
              <div 
                className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: "30px 30px" }} 
              />
              
              <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-[#B89416]/15 border border-[#B89416]/30 flex items-center justify-center mb-6 text-[#B89416]">
                  <Award className="w-6 h-6" />
                </div>

                <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                  Are you a skilled professional?
                </h2>
                
                <p className="mt-4 text-xs md:text-sm text-white/70 leading-relaxed max-w-xl">
                  Join the [Your Brand]s™ network. Get verified, receive high-value project leads in your location, and showcase your portfolio to thousands of project owners.
                </p>

                <button 
                  onClick={() => navigate("/contact")}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#B89416] px-8 py-4 text-sm font-bold text-white hover:bg-[#8F7210] transition shadow-[0_0_25px_rgba(255,90,0,0.4)] hover:-translate-y-0.5 cursor-pointer"
                >
                  Apply to Join Network <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* =========================================
          5. PORTFOLIO MODAL
      ========================================= */}
      <AnimatePresence>
        {portfolioView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setPortfolioView(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setPortfolioView(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F5F6F8] hover:bg-black hover:text-[#252A2A] hover:text-white transition flex items-center justify-center text-black/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <img src={portfolioView.avatar} alt={portfolioView.name} className="w-14 h-14 rounded-2xl object-cover border border-black/10" />
                <div>
                  <h3 className="text-lg font-bold text-[#252A2A]">{portfolioView.name}</h3>
                  <p className="text-xs text-[#252A2A]/60">{portfolioView.role} • {portfolioView.location}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#252A2A]/40 mb-2">About &amp; Expertise</h4>
                <p className="text-sm text-[#252A2A]/80 leading-relaxed">{portfolioView.bio}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#252A2A]/40 mb-3">Featured Projects Portfolio</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolioView.portfolio?.map((imgUrl, idx) => (
                    <div key={idx} className="aspect-4/3 rounded-2xl overflow-hidden border border-black/10 group relative bg-black/5">
                      <img src={imgUrl} alt={`Project ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-black/5">
                <button 
                  onClick={() => handleWhatsAppClick(portfolioView)}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" /> Contact via WhatsApp
                </button>
                <button 
                  onClick={() => setPortfolioView(null)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-black/10 text-xs font-bold text-[#252A2A] hover:bg-[#F5F6F8] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}