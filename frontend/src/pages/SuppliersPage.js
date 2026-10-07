import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Search, Star, ShieldCheck, Phone, 
  Map as MapIcon, List, ChevronDown, Package, 
  Filter, Sparkles, Check, ArrowUpDown, Building2
} from "lucide-react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { useLeadModal } from "@/components/site/LeadModalProvider";
import SEO from "@/components/site/SEO";

import { SAMPLE_VENDORS } from "./data/SupplierData";

const CATEGORIES = ["All Categories", "Structure & Cement", "Steel & TMT", "Flooring & Finishes", "Electricals", "Plumbing & Bath"];
const SORT_OPTIONS = [
  { label: "Highest Rated", value: "rating" },
  { label: "Most Reviewed", value: "reviews" },
  { label: "Fastest Delivery", value: "delivery" },
];

const CLEAN_MAP_STYLE = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d7e4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f3f0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffe0b2" }] },
];

function BrandName({ constructClass = "text-white", onsClass = "text-[#B89416]" }) {
  return (
    <span className="inline-flex items-center font-black tracking-tight">
      <span className={constructClass}>Your</span>
      <span className={onsClass}>Brand</span>
    </span>
  );
}

export default function SuppliersPage() {
  const { open: openLead } = useLeadModal();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("rating");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hoveredVendorId, setHoveredVendorId] = useState(null);
  const [mobileView, setMobileView] = useState("list");
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVendors = useMemo(() => {
    return SAMPLE_VENDORS.filter(v => {
      const matchSearch = 
        searchQuery.trim() === "" || 
        v.pincode.includes(searchQuery) ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = activeCategory === "All Categories" || v.category === activeCategory;
      const matchVerified = !verifiedOnly || v.verified;

      return matchSearch && matchCategory && matchVerified;
    }).sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "delivery") return a.delivery_time.localeCompare(b.delivery_time);
      return 0;
    });
  }, [searchQuery, activeCategory, sortBy, verifiedOnly]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://[Your Brand]s.com/marketplace/materials#webpage",
        "url": "https://[Your Brand]s.com/marketplace/materials",
        "name": "Wholesale Building Materials & Certified Supplier Network",
        "description": "Source directly from verified suppliers for TMT steel, cement, vitrified tiles, electricals, and plumbing fittings across India."
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
            "item": "https://[Your Brand]s.com/marketplace/materials"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Materials & Suppliers",
            "item": "https://[Your Brand]s.com/marketplace/materials"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-['Poppins',sans-serif] text-[#252A2A] flex flex-col selection:bg-[#B89416] selection:text-white overflow-x-hidden">
      <SEO
        title="Wholesale Building Materials, Cement & TMT Steel Suppliers"
        description="Source construction materials directly at guaranteed wholesale rates. Locate verified distributors for cement, TMT steel, tiles, sanitaryware, and electricals on our live vendor map."
        canonical="/marketplace/materials"
        keywords="construction material wholesale, TMT steel distributors India, cement suppliers Bangalore, vitrified flooring tiles vendor, electrical wiring distributors, plumbing wholesale depot"
        structuredData={structuredData}
      />

      <Header />

      {/* Hero Banner */}
      <section className="bg-[#252A2A] pt-28 pb-10 md:pt-36 md:pb-12 px-4 sm:px-6 relative shrink-0 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B89416_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold mb-3 backdrop-blur-sm">
                <Building2 className="w-3.5 h-3.5 text-[#B89416]" />
                <BrandName constructClass="text-white" />
                <span className="text-white/80 font-normal">Verified Supplier Network</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Source Direct with <BrandName constructClass="text-white" iconSize="w-[0.7em] h-[0.7em]" />
              </h1>
              <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-xl">
                Compare verified cement, steel, tiles, and electrical distributors across Bangalore directly through <BrandName constructClass="text-white" /> with guaranteed wholesale rates.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-white/80 text-xs font-semibold">
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <BrandName constructClass="text-white" /> Verified
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <Package className="w-4 h-4 text-[#B89416]" /> Direct Wholesale Pricing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR / DROPDOWNS */}
      <section className="sticky top-[64px] z-30 bg-white border-b border-black/10 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Network by Pincode or Area..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F6F8] border border-black/10 focus:border-[#B89416] focus:bg-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Compact Category Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-2 bg-[#F5F6F8] hover:bg-gray-200 border border-black/10 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-[#252A2A]"
              >
                <Filter className="w-3.5 h-3.5 text-[#B89416]" />
                <span>{activeCategory}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isCategoryOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-2 w-56 bg-white border border-black/10 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5"
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                          activeCategory === cat 
                            ? "bg-[#252A2A] text-white" 
                            : "text-[#252A2A]/80 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                        {activeCategory === cat && <Check className="w-3.5 h-3.5 text-[#B89416]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Selector */}
            <div className="relative flex items-center bg-[#F5F6F8] border border-black/10 rounded-xl px-3 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-[#252A2A] outline-none py-1.5 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Verified Toggle */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition ${
                verifiedOnly 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                  : "bg-[#F5F6F8] border-black/10 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${verifiedOnly ? "text-emerald-600" : "text-gray-400"}`} />
              <BrandName constructClass={verifiedOnly ? "text-emerald-900" : "text-[#252A2A]"} /> Verified
            </button>
          </div>
        </div>
      </section>

      {/* MAIN SPLIT SCREEN */}
      <div className="flex-1 max-w-[1800px] w-full mx-auto flex flex-col md:flex-row relative overflow-hidden">
        
        {/* LEFT LIST CONTAINER */}
        <div className={`w-full md:w-[50%] lg:w-[45%] xl:w-[40%] min-w-0 p-4 sm:p-6 overflow-y-auto ${mobileView === "map" ? "hidden md:block" : "block"}`}>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              Showing {filteredVendors.length} <BrandName constructClass="text-gray-500" /> Partners
            </span>
            {(searchQuery || activeCategory !== "All Categories" || verifiedOnly) && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All Categories");
                  setVerifiedOnly(false);
                }}
                className="text-xs font-bold text-[#B89416] hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="space-y-4 pb-24 md:pb-12">
            <AnimatePresence mode="popLayout">
              {filteredVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onMouseEnter={() => setHoveredVendorId(vendor.id)}
                  onMouseLeave={() => setHoveredVendorId(null)}
                  className={`group bg-white rounded-2xl border p-4 flex flex-col sm:flex-row gap-4 transition-all duration-300 shadow-sm ${
                    hoveredVendorId === vendor.id 
                      ? "border-[#B89416] shadow-xl ring-2 ring-[#B89416]/10 -translate-y-0.5" 
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <div className="w-full sm:w-32 h-36 sm:h-auto shrink-0 rounded-xl overflow-hidden relative bg-gray-100">
                    <img 
                      src={vendor.image} 
                      alt={vendor.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-white">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {vendor.rating}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B89416] truncate">
                        {vendor.category}
                      </span>
                      {vendor.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <BrandName constructClass="text-emerald-900" iconSize="w-[0.65em] h-[0.65em]" /> Verified
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#252A2A] group-hover:text-[#B89416] transition-colors leading-tight mb-2 truncate">
                      {vendor.name}
                    </h3>

                    <div className="text-xs text-gray-600 flex items-start gap-1.5 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="truncate">{vendor.address} • <strong>{vendor.pincode}</strong></span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span>Min: <strong>{vendor.min_order}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span><strong>{vendor.delivery_time}</strong></span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                      <a 
                        href={`tel:${vendor.phone}`} 
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#252A2A] transition"
                      >
                        <Phone className="w-3.5 h-3.5" /> {vendor.phone}
                      </a>

                      <button
                        onClick={() => openLead({ package: vendor.name, source: "[Your Brand]s_materials_directory" })}
                        className="bg-[#252A2A] hover:bg-[#B89416] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition duration-200 shadow-sm flex items-center gap-1"
                      >
                        Request Quote <ChevronDown className="-rotate-90 w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#252A2A] flex items-center justify-center gap-1">
                  No <BrandName constructClass="text-[#252A2A]" /> suppliers found
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Try broadening your search query or selecting a different category.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT STICKY MAP CONTAINER */}
        <div className={`w-full md:w-[50%] lg:w-[55%] xl:w-[60%] h-[calc(100vh-140px)] sticky top-[140px] border-l border-black/10 bg-[#E5E3DF] overflow-hidden ${mobileView === "list" ? "hidden md:block" : "block h-[calc(100vh-180px)]"}`}>
          <GoogleMapsWrapper 
            vendors={filteredVendors} 
            activeId={hoveredVendorId} 
            onHoverVendor={setHoveredVendorId} 
            onSelectVendor={(v) => openLead({ package: v.name, source: "[Your Brand]s_map_marker" })}
          />
        </div>

      </div>

      {/* MOBILE FLOATING MAP/LIST TOGGLE */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          className="bg-[#252A2A] text-white px-5 py-3 rounded-full text-xs font-extrabold shadow-2xl flex items-center gap-2 border border-white/20 active:scale-95 transition"
        >
          {mobileView === "list" ? (
            <>
              <MapIcon className="w-4 h-4 text-[#B89416]" /> <BrandName constructClass="text-white" /> Map
            </>
          ) : (
            <>
              <List className="w-4 h-4 text-[#B89416]" /> Supplier List
            </>
          )}
        </button>
      </div>

      <Footer />
    </div>
  );
}

// GOOGLE MAPS COMPONENT
function GoogleMapsWrapper({ vendors, activeId, onHoverVendor, onSelectVendor }) {
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (mapRef.current && vendors.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      vendors.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
      mapRef.current.fitBounds(bounds, 80);
      
      if (vendors.length === 1) {
        mapRef.current.setZoom(14);
      }
    }
  }, [vendors]);

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
        <p className="text-xs font-bold text-red-500">Google Maps failed to load.</p>
        <p className="text-[11px] text-gray-500 mt-1">Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#E5E3DF] text-[#252A2A] text-xs font-bold gap-1">
        Loading <BrandName constructClass="text-[#252A2A]" /> Map View...
      </div>
    );
  }

  const activeVendor = vendors.find(v => v.id === activeId);

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={{ lat: 12.9716, lng: 77.5946 }}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: CLEAN_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {vendors.map((v) => {
          const isActive = activeId === v.id;

          return (
            <MarkerF
              key={v.id}
              position={{ lat: v.lat, lng: v.lng }}
              onMouseOver={() => onHoverVendor(v.id)}
              onMouseOut={() => onHoverVendor(null)}
              onClick={() => onSelectVendor(v)}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: isActive ? "#B89416" : "#252A2A",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
                scale: isActive ? 2.2 : 1.6,
                anchor: new window.google.maps.Point(12, 24),
              }}
            />
          );
        })}

        {activeVendor && (
          <InfoWindowF
            position={{ lat: activeVendor.lat, lng: activeVendor.lng }}
            options={{ pixelOffset: new window.google.maps.Size(0, -35) }}
            onCloseClick={() => onHoverVendor(null)}
          >
            <div className="p-1 max-w-[200px] font-['Poppins',sans-serif]">
              <span className="text-[9px] font-black text-[#B89416] uppercase tracking-wider block mb-0.5">
                {activeVendor.category}
              </span>
              <h4 className="text-xs font-bold text-[#252A2A] leading-tight">
                {activeVendor.name}
              </h4>
              <p className="text-[11px] text-gray-600 mt-1 font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /> {activeVendor.rating} ({activeVendor.reviews} reviews)
              </p>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-[#252A2A] shadow-md border border-black/10 pointer-events-none flex items-center gap-1">
        📍 {vendors.length} <BrandName constructClass="text-[#252A2A]" /> Suppliers Pinpointed
      </div>
    </div>
  );
}