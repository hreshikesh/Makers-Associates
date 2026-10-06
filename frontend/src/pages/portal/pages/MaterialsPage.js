import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Package, Truck, Box, ChevronLeft, 
  X, Image as ImageIcon, Info, Calendar, CheckCircle2
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";

// Format date safely
const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
};

// Normalize backend statuses to Client Portal statuses (Received vs Ordered)
const getNormalizedStatus = (backendStatus) => {
  const s = (backendStatus || "").toLowerCase();
  if (["delivered", "inspected", "installed"].includes(s)) return "received";
  return "ordered"; // Default all pre-delivery items to "ordered"
};

// Visual config for normalized statuses
const getStatusConfig = (status) => {
  const map = {
    received: { label: "Received", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: Truck },
    ordered: { label: "Ordered", color: "text-[#FF6600] bg-[#FF6600]/10 border-[#FF6600]/20", icon: Box },
  };
  return map[status] || map.ordered;
};

export default function MaterialsPage() {
  const { project } = usePortal();
  
  // View State
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Fixed Vercel ESLint Error by wrapping the materials fallback in useMemo
  const materials = useMemo(() => project?.materials || [], [project?.materials]);

  // ==========================================
  // DATA PREPARATION & LOGIC
  // ==========================================
  
  // Extract dynamic categories
  const categories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category || "Others"));
    return ["All", ...Array.from(cats)].sort();
  }, [materials]);

  // KPI Calculations (Total, Received, Ordered)
  const kpis = useMemo(() => {
    const total = materials.length;
    let received = 0, ordered = 0;
    
    materials.forEach(m => {
      const s = getNormalizedStatus(m.status);
      if (s === "received") received++;
      else ordered++;
    });

    const pct = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

    return {
      total,
      received: { count: received, pct: pct(received) },
      ordered: { count: ordered, pct: pct(ordered) }
    };
  }, [materials]);

  // Filter & Search
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = !searchQuery || 
        (m.item_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.grade_spec || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchTab = activeTab === "All" || (m.category || "Others") === activeTab;
      
      return matchSearch && matchTab;
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [materials, searchQuery, activeTab]);

  // Keep selected material in sync (Auto-select first on Desktop)
  useEffect(() => {
    if (window.innerWidth >= 768) {
      if (filteredMaterials.length > 0 && !selectedId) {
        setSelectedId(filteredMaterials[0].id);
      } else if (filteredMaterials.length === 0) {
        setSelectedId(null);
      }
    }
  }, [filteredMaterials, selectedId]);

  const selectedMaterial = materials.find(m => m.id === selectedId);

  // Helper to determine the most relevant date for a row
  const getRelevantDate = (mat, normStatus) => {
    if (normStatus === "received") return mat.delivered_on || mat.updated_at;
    return mat.ordered_on || mat.created_at || mat.updated_at;
  };

  if (!project) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] font-['Poppins'] bg-[#F5F6F8]">
      
      {/* 1. HEADER & SEARCH (Hidden on mobile if detail view is open) */}
      <div className={`shrink-0 bg-white border-b border-gray-200 px-3 md:px-4 pt-3 pb-2 shadow-sm z-10 ${selectedId ? 'hidden md:block' : 'block'}`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#000F1B]">Materials</h1>
            <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5">View the key materials used in your project and their current status.</p>
          </div>
          
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" placeholder="Search materials (e.g. tiles, cement)..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[10px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#FF6600] focus:bg-white transition shadow-sm"
            />
          </div>
        </div>

        {/* SUMMARY CARDS (Cleaned up to 3 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div className="bg-[#FF6600]/5 border border-[#FF6600]/20 rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#FF6600]/10 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-[#FF6600]" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Materials</div>
              <div className="text-lg font-black text-[#000F1B] leading-tight">{kpis.total}</div>
            </div>
          </div>
          
          <div className="bg-[#FF6600]/5 border border-[#FF6600]/20 rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#FF6600]/10 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4 text-[#FF6600]" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Ordered</div>
              <div className="text-lg font-black text-[#000F1B] leading-tight flex items-baseline gap-1.5">
                {kpis.ordered.count} <span className="text-[9px] font-semibold text-[#FF6600]">{kpis.ordered.pct}%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#F0FDF4] border border-emerald-100 rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Received</div>
              <div className="text-lg font-black text-[#000F1B] leading-tight flex items-baseline gap-1.5">
                {kpis.received.count} <span className="text-[9px] font-semibold text-emerald-600">{kpis.received.pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
          {categories.map(cat => {
            const count = cat === "All" ? kpis.total : materials.filter(m => (m.category || "Others") === cat).length;
            const isActive = activeTab === cat;
            
            return (
              <button
                key={cat} onClick={() => setActiveTab(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap border shadow-sm ${
                  isActive 
                    ? "bg-[#FF6600] border-[#FF6600] text-white" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[8px] px-1 py-0.5 rounded-sm ${isActive ? "bg-white/20" : "bg-gray-100"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (Split Pane) */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-3 gap-3">
        
        {/* LEFT PANE: TABLE */}
        <div className={`flex-1 flex-col bg-white md:border border-gray-200 md:rounded-lg shadow-sm overflow-hidden ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-auto bg-[#F5F6F8] md:bg-white p-2 md:p-0">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="py-2 px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="py-2 px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-2 px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Brand / Spec</th>
                  <th className="py-2 px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-2 px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map((m) => {
                  const normStatus = getNormalizedStatus(m.status);
                  const conf = getStatusConfig(normStatus);
                  const isSelected = selectedId === m.id;
                  const relDate = getRelevantDate(m, normStatus);
                  
                  return (
                    <tr 
                      key={m.id} onClick={() => setSelectedId(m.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-[#FF6600]/5 hover:bg-[#FF6600]/10" : "hover:bg-gray-50"}`}
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {isSelected && <div className="absolute left-0 w-1 h-8 bg-[#FF6600] rounded-r" />}
                          <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {m.photo_url ? <img src={resolveMediaUrl(m.photo_url)} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-3.5 h-3.5 text-gray-400" />}
                          </div>
                          <span className="text-[10px] font-bold text-[#000F1B]">{m.item_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[10px] font-medium text-[#FF6600]">{m.category || "—"}</td>
                      <td className="py-2 px-3">
                        <div className="text-[10px] font-bold text-gray-800">{m.brand || "—"}</div>
                        <div className="text-[9px] text-gray-500 truncate max-w-[120px]">{m.grade_spec || "—"}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${conf.color}`}>
                          <conf.icon className="w-3 h-3" /> {conf.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[10px] font-medium text-gray-500">
                        {fmtDate(relDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
              {filteredMaterials.map(m => {
                const normStatus = getNormalizedStatus(m.status);
                const conf = getStatusConfig(normStatus);
                
                return (
                  <div key={m.id} onClick={() => setSelectedId(m.id)} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {m.photo_url ? <img src={resolveMediaUrl(m.photo_url)} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-[#000F1B] text-[10px] truncate">{m.item_name}</h4>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border ${conf.color}`}>
                            <conf.icon className="w-2.5 h-2.5" /> {conf.label}
                          </span>
                        </div>
                        <div className="text-[9px] font-medium text-[#FF6600] mb-0.5">{m.category || "General"}</div>
                        <div className="text-[9px] text-gray-500 truncate">{m.brand ? `${m.brand} • ` : ''}{m.grade_spec || "Standard"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredMaterials.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No materials found matching your filters.
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-white text-[9px] font-semibold text-gray-500 flex justify-between items-center shrink-0">
            <span>Showing {filteredMaterials.length} of {materials.length} materials</span>
          </div>
        </div>

        {/* RIGHT PANE: DETAILS */}
        <div className={`w-full md:w-[320px] lg:w-[380px] xl:w-[420px] flex-col bg-white md:border border-gray-200 md:rounded-lg shadow-sm overflow-hidden shrink-0 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
          {selectedMaterial ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Detail Header */}
              <div className="p-3 border-b border-gray-100 bg-white shrink-0 relative">
                <button 
                  onClick={() => setSelectedId(null)} 
                  className="md:hidden flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-[#FF6600] mb-2 bg-gray-50 px-2 py-1 rounded w-max"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to List
                </button>

                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-[#000F1B] leading-tight flex items-center gap-2">
                      {selectedMaterial.item_name}
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${getStatusConfig(getNormalizedStatus(selectedMaterial.status)).color}`}>
                        {getStatusConfig(getNormalizedStatus(selectedMaterial.status)).label}
                      </span>
                    </h2>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">
                      {selectedMaterial.brand || "Standard"} &nbsp;|&nbsp; {selectedMaterial.grade_spec || "Standard Spec"}
                    </p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="hidden md:flex p-1 hover:bg-gray-100 text-gray-400 rounded-md transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                
                {/* Main Image Banner */}
                <div className="h-[180px] sm:h-[220px] bg-gray-100 border-b border-gray-200 relative flex items-center justify-center p-3">
                  {selectedMaterial.photo_url ? (
                    <img src={resolveMediaUrl(selectedMaterial.photo_url)} alt="Material" className="max-w-full max-h-full object-contain rounded-md shadow-sm" />
                  ) : (
                    <div className="text-gray-400 text-xs font-semibold flex flex-col items-center gap-1.5">
                      <ImageIcon className="w-8 h-8 opacity-20" /> No image available
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="p-4 space-y-4">
                  
                  <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-[10px]">
                    <div className="col-span-1 text-gray-500 font-medium">Material Name</div>
                    <div className="col-span-2 font-bold text-[#000F1B]">{selectedMaterial.item_name}</div>

                    <div className="col-span-1 text-gray-500 font-medium">Category</div>
                    <div className="col-span-2 font-medium text-gray-900">{selectedMaterial.category || "—"}</div>

                    <div className="col-span-1 text-gray-500 font-medium">Brand</div>
                    <div className="col-span-2 font-bold text-gray-900">{selectedMaterial.brand || "—"}</div>

                    <div className="col-span-1 text-gray-500 font-medium">Specification</div>
                    <div className="col-span-2 font-medium text-gray-900">{selectedMaterial.grade_spec || "—"}</div>

                    <div className="col-span-1 text-gray-500 font-medium mt-1.5">Status</div>
                    <div className="col-span-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusConfig(getNormalizedStatus(selectedMaterial.status)).color}`}>
                        <CheckCircle2 className="w-3 h-3" /> {getStatusConfig(getNormalizedStatus(selectedMaterial.status)).label}
                      </span>
                    </div>

                    {selectedMaterial.quantity > 0 && (
                      <>
                        <div className="col-span-1 text-gray-500 font-medium">Quantity</div>
                        <div className="col-span-2 font-medium text-gray-900">{selectedMaterial.quantity.toLocaleString()} {selectedMaterial.unit}</div>
                      </>
                    )}

                    <div className="col-span-1 text-gray-500 font-medium">Status Date</div>
                    <div className="col-span-2 font-medium text-gray-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" /> {fmtDate(getRelevantDate(selectedMaterial, getNormalizedStatus(selectedMaterial.status)))}
                    </div>
                  </div>

                  {selectedMaterial.notes && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        <Info className="w-3 h-3" /> Description / Notes
                      </div>
                      <p className="text-[10px] text-gray-700 leading-relaxed bg-gray-50 p-2 rounded-md border border-gray-100">
                        {selectedMaterial.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center bg-[#F9FAFB]">
              <Package className="w-12 h-12 opacity-20 mb-2 text-[#FF6600]" />
              <p className="text-sm font-bold text-gray-600 mb-1">No Material Selected</p>
              <p className="text-[10px] max-w-[200px]">Select a material from the list to view its full specifications and status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}