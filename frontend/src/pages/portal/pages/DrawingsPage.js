import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Download, CheckCircle2, AlertTriangle, 
  X, ChevronLeft, FileBox, Home, Grid, Zap, Droplet, Wind, 
  Armchair, TreePine, FileText, Clock, Loader2, History, ListTodo, PenTool,
  Maximize2, Eye, Share2, ExternalLink, AlertCircle
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
};

const getCategoryIcon = (cat) => {
  const map = {
    "Architectural": Home, "Structural": Grid, "Electrical": Zap,
    "Plumbing": Droplet, "HVAC": Wind, "Interior": Armchair, "Landscape": TreePine,
  };
  return map[cat] || FileText;
};

const CATEGORIES = [
  "All Drawings", "Architectural", "Structural", "Electrical", 
  "Plumbing", "HVAC", "Interior", "Landscape", "Others"
];

export default function DrawingsPage() {
  const { project, refreshProject } = usePortal();
  
  const [currentView, setCurrentView] = useState("library");
  const [activeTab, setActiveTab] = useState("All Drawings");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [selectedId, setSelectedId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("Overview"); 
  
  // UX State: Track which version is currently being viewed
  const [activeVersionIdx, setActiveVersionIdx] = useState(null);
  
  const [modalType, setModalType] = useState(null);
  const [comment, setComment] = useState("");
  const [requestForm, setRequestForm] = useState({ category: "", title: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const drawings = useMemo(() => project?.drawings || [], [project?.drawings]);
  const requestsHistory = useMemo(() => project?.drawing_requests || [], [project?.drawing_requests]);

  const sortedDrawings = useMemo(() => {
    return [...drawings].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return new Date(b.uploaded_at) - new Date(a.uploaded_at);
    });
  }, [drawings]);

  const filteredDrawings = useMemo(() => {
    return sortedDrawings.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTab = activeTab === "All Drawings" || (d.category || "Others") === activeTab;
      const matchStatus = statusFilter === "All" || d.status === statusFilter.toLowerCase();
      return matchSearch && matchTab && matchStatus;
    });
  }, [sortedDrawings, searchQuery, activeTab, statusFilter]);

  useEffect(() => {
    if (currentView === "library" && window.innerWidth >= 768) {
      if (filteredDrawings.length > 0 && !selectedId) {
        setSelectedId(filteredDrawings[0].id);
      } else if (filteredDrawings.length === 0) {
        setSelectedId(null);
      }
    }
  }, [filteredDrawings, selectedId, currentView]);

  const selectedDrawing = drawings.find(d => d.id === selectedId);
  const pendingCount = drawings.filter(d => d.status === "pending").length;

  const versions = useMemo(() => {
    if (!selectedDrawing) return [];
    if (Array.isArray(selectedDrawing.versions) && selectedDrawing.versions.length > 0) {
      return selectedDrawing.versions;
    }
    return [{
      version: selectedDrawing.current_version || 1,
      url: selectedDrawing.url,
      uploaded_at: selectedDrawing.uploaded_at,
      client_comment: selectedDrawing.description || null,
      client_decision: selectedDrawing.status === "Approved" ? "approved" : null
    }];
  }, [selectedDrawing]);

  // Reset to latest version when selecting a new drawing
  useEffect(() => {
    if (selectedId) {
      const doc = drawings.find(d => d.id === selectedId);
      const vCount = (doc && Array.isArray(doc.versions) && doc.versions.length > 0) ? doc.versions.length : 1;
      setActiveVersionIdx(vCount - 1);
      setDrawerTab("Overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const activeVersion = activeVersionIdx !== null ? versions[activeVersionIdx] : null;
  const activeUrl = activeVersion?.url || selectedDrawing?.url;
  const isViewingOlder = activeVersionIdx !== null && activeVersionIdx < versions.length - 1;

  const handleDecision = async (decision) => {
    if (!selectedDrawing) return;
    setSubmitting(true);
    try {
      await api.post(`/portal/my-project/drawings/${selectedDrawing.id}/decision`, {
        decision: decision,
        comment: comment
      });
      toast.success(decision === "approved" ? "Drawing Approved" : "Changes Requested");
      await refreshProject?.();
      setModalType(null);
      setComment("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestNew = async () => {
    if (!requestForm.category || !requestForm.title) {
      toast.error("Please fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/portal/my-project/drawings/request`, requestForm);
      toast.success("Drawing request submitted to design team.");
      setModalType(null);
      setRequestForm({ category: "", title: "", reason: "" });
      await refreshProject?.();
      setCurrentView("requests");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async (url, title) => {
    if (!url) return;
    const fullUrl = resolveMediaUrl(url);
    if (navigator.share) {
      try {
        await navigator.share({ title: title, url: fullUrl });
      } catch (err) {
        console.log("Share cancelled or not supported.", err);
      }
    } else {
      navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const downloadWithWatermark = async (url, filename) => {
    if (!url) return;
    try {
      const isPdf = url.toLowerCase().includes('.pdf');
      if (isPdf) {
        toast.info("Downloading document...");
        const link = document.createElement('a');
        link.href = url; link.download = filename || 'document.pdf'; link.target = '_blank';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        return;
      }
      toast.loading("Applying watermark...", { id: "watermark" });
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const fontSize = Math.max(30, img.width / 15);
        ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
        ctx.fillStyle = "rgba(255, 90, 0, 0.4)"; 
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); 
        ctx.fillText("[Your Brand]s", 0, 0);
        ctx.fillText("[Your Brand]s", 0, -fontSize * 4);
        ctx.fillText("[Your Brand]s", 0, fontSize * 4);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        link.href = dataUrl; link.download = filename || '[Your Brand]s_Drawing.jpg'; link.click();
        toast.success("Download complete!", { id: "watermark" });
      };
      img.onerror = () => {
        toast.dismiss("watermark");
        window.open(url, "_blank");
      };
    } catch (e) {
      toast.error("Download failed.");
    }
  };

  const getStatusConfig = (status) => {
    const map = {
      approved: { label: "APPROVED", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
      pending: { label: "UNDER REVIEW", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
      rejected: { label: "CHANGES REQ.", color: "text-red-700 bg-red-50 border-red-200", icon: AlertTriangle },
    };
    return map[status] || { label: "UNKNOWN", color: "text-gray-600 bg-gray-100 border-gray-200", icon: FileText };
  };

  if (!project) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] font-['Poppins'] bg-[#F5F6F8]">
      
      {/* HEADER */}
      <div className={`shrink-0 bg-white border-b border-gray-200 px-3 md:px-5 pt-4 pb-2 z-10 ${selectedId && currentView === "library" ? 'hidden md:block' : 'block'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 md:mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#252A2A]">Drawings</h1>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Access approved drawings or request new designs from the team.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner w-full md:w-auto">
            <button 
              onClick={() => setCurrentView("library")}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[11px] md:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${currentView === "library" ? "bg-white text-[#252A2A] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Grid className="w-3.5 h-3.5" /> Library & Approvals
            </button>
            <button 
              onClick={() => setCurrentView("requests")}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[11px] md:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${currentView === "requests" ? "bg-white text-[#252A2A] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              <ListTodo className="w-3.5 h-3.5" /> My Requests
            </button>
          </div>
        </div>

        {currentView === "library" && (
          <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-5 border-b border-transparent">
            {CATEGORIES.map(cat => {
              const Icon = getCategoryIcon(cat);
              const count = cat === "All Drawings" ? drawings.length : drawings.filter(d => (d.category || "Others") === cat).length;
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat} onClick={() => setActiveTab(cat)}
                  className={`flex items-center gap-1.5 pb-2.5 border-b-[3px] transition-colors whitespace-nowrap ${isActive ? "border-[#B89416] text-[#252A2A]" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                >
                  <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? "text-[#B89416]" : ""}`} />
                  <span className="text-xs md:text-sm font-semibold">{cat}</span>
                  <span className="text-[9px] md:text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-3 gap-3 w-full max-w-[2400px] mx-auto">
        
        {currentView === "library" && (
          <>
            {/* LEFT PANE: LIST */}
            <div className={`w-full md:w-[300px] lg:w-[350px] xl:w-[400px] shrink-0 flex-col bg-white md:border border-gray-200 md:rounded-xl shadow-sm overflow-hidden ${selectedId ? 'hidden md:flex' : 'flex'}`}>
              
              <div className="p-3 border-b border-gray-100 flex flex-col xl:flex-row items-center justify-between gap-2 bg-gray-50/50 shrink-0">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text" placeholder="Search drawings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-[11px] md:text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#B89416] transition shadow-sm"
                  />
                </div>
                <select 
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="w-full xl:w-auto text-[11px] md:text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-2 outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Changes Req</option>
                </select>
              </div>

              <div className="flex-1 overflow-auto p-2.5 space-y-2 bg-[#F5F6F8] md:bg-white custom-scrollbar">
                {filteredDrawings.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">No drawings found.</div>
                ) : (
                  filteredDrawings.map((d) => {
                    const conf = getStatusConfig(d.status);
                    const isSelected = selectedId === d.id;
                    const dwgNo = `DWG-${d.id.substring(4, 7).toUpperCase()}`;
                    
                    // Safe logic to determine the thumbnail URL
                    const latestVersionUrl = d.versions?.[d.versions.length-1]?.url || d.url;
                    const isPdf = latestVersionUrl?.toLowerCase().includes('.pdf');
                    
                    return (
                      <div 
                        key={d.id} onClick={() => setSelectedId(d.id)}
                        className={`bg-white p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? "border-[#B89416] shadow-md ring-1 ring-[#B89416]/20" : "border-gray-200 shadow-sm hover:border-[#B89416]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[9px] md:text-[10px] font-black text-gray-400">{dwgNo}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${conf.color}`}>
                                {conf.label}
                              </span>
                            </div>
                            <h4 className="font-bold text-[#252A2A] text-xs md:text-sm truncate">{d.name}</h4>
                          </div>

                          {/* THUMBNAIL PREVIEW (Works for PDF and Images) */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {isPdf ? (
                              <div className="flex flex-col items-center justify-center text-[#B89416]">
                                <FileText className="w-5 h-5 opacity-70" />
                                <span className="text-[6px] font-bold mt-0.5 uppercase tracking-widest">PDF</span>
                              </div>
                            ) : (
                              <img src={resolveMediaUrl(latestVersionUrl)} alt="" className="w-full h-full object-cover opacity-80" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-semibold text-gray-500">
                          <span className="text-[#B89416] uppercase tracking-wider">{d.category || "General"}</span>
                          <span>•</span>
                          <span>Rev: V{d.current_version}</span>
                          <span>•</span>
                          <span>{fmtDate(d.uploaded_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="p-3 border-t border-gray-100 bg-white text-[10px] md:text-xs font-semibold text-gray-500 flex justify-between items-center shrink-0">
                <span>Showing {filteredDrawings.length} of {drawings.length}</span>
                {pendingCount > 0 && <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">{pendingCount} Pending</span>}
              </div>
            </div>

            {/* RIGHT PANE: UX IMPROVED DETAILS & PREVIEW */}
            <div className={`flex-1 min-w-0 flex flex-col bg-white md:border border-gray-200 md:rounded-xl shadow-sm overflow-hidden shrink-0 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
              {selectedDrawing ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Fixed Header */}
                  <div className="p-3 md:p-4 border-b border-gray-100 shrink-0 bg-white z-20 shadow-sm relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button onClick={() => setSelectedId(null)} className="md:hidden flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-[#B89416] bg-gray-50 px-2.5 py-1.5 rounded-md">
                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm md:text-base font-bold text-[#252A2A] max-w-[200px] lg:max-w-[350px] truncate">
                            {`DWG-${selectedDrawing.id.substring(4, 7).toUpperCase()}`} - {selectedDrawing.name}
                          </h2>
                          <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${getStatusConfig(selectedDrawing.status).color}`}>
                            {getStatusConfig(selectedDrawing.status).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Buttons - MOVED TO HEADER */}
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                      <button 
                        onClick={() => { if (activeUrl) setIsFullscreen(true); }}
                        disabled={!activeUrl}
                        className="flex-1 sm:flex-none px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Full Screen
                      </button>
                      <button 
                        onClick={() => downloadWithWatermark(resolveMediaUrl(activeUrl), `${selectedDrawing.name.replace(/\s+/g, '_')}_V${activeVersion?.version || selectedDrawing.current_version || 1}`)} 
                        disabled={!activeUrl}
                        className="flex-1 sm:flex-none px-2.5 py-1.5 bg-[#252A2A] hover:bg-[#B89416] text-white rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button 
                        onClick={() => handleShare(activeUrl, selectedDrawing.name)}
                        disabled={!activeUrl}
                        className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-[10px] md:text-xs font-bold hover:bg-gray-100 flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-50" 
                        title="Share"
                      >
                        <Share2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>

                  {/* Warning Banner if viewing older version */}
                  {isViewingOlder && (
                    <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-1.5 flex items-center gap-2 shrink-0 z-20">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[10px] md:text-xs font-bold text-amber-800">
                        You are viewing an older revision (Rev 0{activeVersion?.version}).
                      </span>
                      <button 
                        onClick={() => setActiveVersionIdx(versions.length - 1)}
                        className="ml-auto text-[9px] md:text-[10px] font-bold bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded shadow-sm hover:bg-amber-100 transition cursor-pointer"
                      >
                        View Latest
                      </button>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 shrink-0 px-3 md:px-5 bg-white z-10">
                    {["Overview", "Revisions"].map(t => (
                      <button key={t} onClick={() => setDrawerTab(t)} className={`px-4 py-2.5 text-[10px] md:text-xs font-bold relative transition cursor-pointer ${drawerTab === t ? "text-[#252A2A]" : "text-gray-400 hover:text-gray-700"}`}>
                        {t} {t === "Revisions" && `(${versions.length})`}
                        {drawerTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B89416]" />}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable Information Body */}
                  <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-2.5 sm:p-3.5 md:p-4 bg-gray-50 custom-scrollbar relative">
                    
                    {drawerTab === "Overview" && (
                      <div className="max-w-4xl mx-auto space-y-3 pb-4">
                        
                        {/* APPROVAL BLOCK MOVED HERE SO IT SCROLLS */}
                        {selectedDrawing.status === "pending" && !isViewingOlder && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-800">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <div>
                                <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Awaiting Approval</div>
                                <div className="text-[9px] opacity-80 mt-0.5">Please review this drawing and provide your decision.</div>
                              </div>
                            </div>
                            <div className="flex w-full sm:w-auto items-center gap-2">
                              <button onClick={() => setModalType("reject")} className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-[10px] md:text-[11px] font-bold rounded-md shadow-sm hover:bg-amber-100 transition text-center cursor-pointer">Request Changes</button>
                              <button onClick={() => setModalType("approve")} className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 text-white text-[10px] md:text-[11px] font-bold rounded-md shadow-sm hover:bg-emerald-700 transition text-center cursor-pointer">Approve</button>
                            </div>
                          </div>
                        )}

                        {/* DOCUMENT DATA */}
                        <div className="bg-white rounded-xl border border-black/5 p-3 md:p-4 shadow-sm">
                          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 border-b border-black/5 pb-1.5">Drawing Data</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-3 text-[11px] md:text-xs">
                            <div className="col-span-2">
                              <div className="text-gray-500 font-medium mb-0.5 text-[10px]">File Name</div>
                              <div className="font-bold text-[#252A2A] break-all leading-snug">{selectedDrawing.name}</div>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Discipline</div>
                              <div className="text-gray-900 font-semibold">{selectedDrawing.category || "—"}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Viewing Revision</div>
                              <div className="text-gray-900 font-bold text-[#B89416]">
                                {activeVersion?.version ? `R0${activeVersion.version}` : selectedDrawing.current_version ? `R0${selectedDrawing.current_version}` : "R01"}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Uploaded On</div>
                              <div className="text-gray-900 font-semibold">{fmtDate(activeVersion?.uploaded_at || selectedDrawing.uploaded_at)}</div>
                            </div>
                          </div>
                        </div>

                        {/* COMPACT PREVIEW CONTAINER */}
                        <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden flex flex-col h-[42vh] min-h-[280px] sm:h-[380px] md:h-[450px]">
                          <div className="py-2 px-3 border-b border-black/5 bg-gray-50 flex items-center justify-between shrink-0">
                            <div className="text-[11px] md:text-xs font-bold text-[#252A2A]">Drawing Preview</div>
                            <div className="flex items-center gap-3">
                              {activeUrl && (
                                <a 
                                  href={resolveMediaUrl(activeUrl)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] font-bold text-gray-500 hover:text-black flex items-center gap-1 sm:hidden"
                                >
                                  <ExternalLink className="w-3 h-3"/> Open PDF
                                </a>
                              )}
                              <button 
                                onClick={() => { if (activeUrl) setIsFullscreen(true); }}
                                className="text-[10px] font-bold text-[#B89416] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Maximize2 className="w-3 h-3" /> View Full Screen
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-gray-100 relative overflow-hidden">
                            {activeUrl ? (
                              <>
                                {activeUrl.toLowerCase().includes('.pdf') ? (
                                  <div className="w-full h-full overflow-auto touch-pan-y touch-pan-x overscroll-contain -webkit-overflow-scrolling-touch relative">
                                    <iframe 
                                      key={activeUrl}
                                      src={`${resolveMediaUrl(activeUrl)}#toolbar=0&navpanes=0`} 
                                      className="w-full h-full min-h-[100%] border-0" 
                                      title="preview" 
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-full overflow-auto touch-pan-y touch-pan-x flex items-center justify-center p-2">
                                    <img key={activeUrl} src={resolveMediaUrl(activeUrl)} alt="Preview" className="max-w-full max-h-full object-contain" />
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FileText className="w-8 h-8 mb-1.5 opacity-20"/>
                                <span className="text-xs font-bold">No preview available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {drawerTab === "Revisions" && (
                      <div className="max-w-3xl mx-auto space-y-2.5 pb-4">
                        {[...versions].reverse().map((v) => {
                          const originalIndex = versions.findIndex(item => item === v || (item.version === v.version && item.url === v.url));
                          const isCurrentDocVersion = v.version === (selectedDrawing.current_version || 1);
                          const isViewingThis = activeVersionIdx === originalIndex;
                          
                          return (
                            <div key={v.version || originalIndex} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                              isViewingThis ? "bg-[#B89416]/5 border-[#B89416]/30 shadow-sm" : "bg-white border-black/5 hover:border-black/15 shadow-sm"
                            }`}>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-xs md:text-sm font-bold ${isViewingThis ? "text-[#252A2A]" : "text-gray-700"}`}>
                                    Revision {String(v.version).startsWith("R") ? v.version : `R0${v.version}`}
                                  </span>
                                  {isCurrentDocVersion && (
                                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">{fmtDate(v.uploaded_at)}</div>
                                
                                {v.client_comment && (
                                  <p className="text-[10px] text-gray-600 italic border-l-2 border-[#B89416]/50 pl-2 mt-1.5">"{v.client_comment}"</p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                                {v.client_decision === "approved" && !isViewingThis && <span className="text-[8px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Approved</span>}
                                {v.client_decision === "rejected" && !isViewingThis && <span className="text-[8px] font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Rejected</span>}
                                
                                {isViewingThis ? (
                                  <div className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-100 text-gray-500 text-[10px] md:text-xs font-bold rounded-lg text-center flex items-center justify-center gap-1.5 cursor-default border border-black/5 ml-auto">
                                    <Eye className="w-3.5 h-3.5" /> Viewing
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      setActiveVersionIdx(originalIndex);
                                      setDrawerTab("Overview"); 
                                    }}
                                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-300 text-[#252A2A] hover:border-[#B89416] hover:text-[#B89416] text-[10px] md:text-xs font-bold rounded-lg transition shadow-sm cursor-pointer ml-auto"
                                  >
                                    Read
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => downloadWithWatermark(resolveMediaUrl(v.url), `${selectedDrawing.name.replace(/\s+/g, '_')}_V${v.version}`)}
                                  className="w-8 h-8 bg-white border border-gray-300 rounded-lg grid place-items-center text-gray-500 hover:bg-[#1A73E8] hover:text-white hover:border-[#1A73E8] transition shadow-sm cursor-pointer shrink-0"
                                  title="Download this version directly"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-[#F9FAFB]">
                  <FileBox className="w-12 h-12 opacity-20 mb-3 text-[#B89416]" />
                  <p className="text-sm font-bold text-[#252A2A] mb-1">No Drawing Selected</p>
                  <p className="text-[10px] md:text-xs max-w-xs text-gray-500 leading-relaxed">Select a drawing from the list on the left to view its details and provide approval.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* =======================================================
            VIEW B: MY REQUESTS HISTORY
        ======================================================= */}
        {currentView === "requests" && (
          <div className="flex-1 w-full bg-white md:border border-gray-200 md:rounded-xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
            <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#252A2A] flex items-center justify-center shadow-sm shrink-0">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-[#252A2A]">Drawing Requests History</h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">Track the status of drawings you have requested.</p>
                </div>
              </div>
              <button 
                onClick={() => setModalType("new_request")}
                className="w-full sm:w-auto px-4 py-2 bg-[#1A73E8] hover:bg-blue-700 text-white text-[11px] md:text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Request New Drawing
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {requestsHistory.length === 0 ? (
                <div className="text-center py-16 max-w-sm mx-auto">
                  <FileBox className="w-12 h-12 mx-auto mb-3 opacity-20 text-gray-500" />
                  <p className="text-sm font-bold text-gray-700 mb-1">No requests yet</p>
                  <p className="text-[10px] text-gray-500">If you need a specific drawing that isn't in your library, request it here.</p>
                </div>
              ) : (
                <div className="min-w-[600px] w-full">
                  <table className="w-full text-left border-collapse text-[10px] md:text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4 font-bold text-gray-500 uppercase tracking-wider">Date requested</th>
                        <th className="py-2.5 px-4 font-bold text-gray-500 uppercase tracking-wider">Request Details</th>
                        <th className="py-2.5 px-4 font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...requestsHistory].reverse().map(req => (
                        <tr key={req.id} className="hover:bg-gray-50/80 transition-colors bg-white">
                          <td className="py-3 px-4 align-top w-32">
                            <div className="font-bold text-gray-900">{new Date(req.requested_at).toLocaleDateString("en-GB", {day: '2-digit', month: 'short', year: 'numeric'})}</div>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{req.category}</span>
                              <h4 className="font-bold text-[#252A2A]">{req.title}</h4>
                            </div>
                            {req.reason && <p className="text-[10px] text-gray-600 mt-1 max-w-lg">"{req.reason}"</p>}
                          </td>
                          <td className="py-3 px-4 align-top text-center w-40">
                            {req.status === "pending" && <span className="inline-flex items-center justify-center gap-1 text-[9px] md:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded w-full"><Clock className="w-3 h-3"/> Pending</span>}
                            {req.status === "fulfilled" && <span className="inline-flex items-center justify-center gap-1 text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded w-full"><CheckCircle2 className="w-3 h-3"/> Fulfilled</span>}
                            {req.status === "dismissed" && <span className="inline-flex items-center justify-center gap-1 text-[9px] md:text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded w-full"><X className="w-3 h-3"/> Dismissed</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN VIEWER MODAL WITH WATERMARK OVERLAY */}
      <AnimatePresence>
        {isFullscreen && selectedDrawing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
          >
            <div className="absolute top-3 right-3 md:top-6 md:right-6 flex items-center gap-3 z-50">
              {activeUrl?.toLowerCase().includes('.pdf') && (
                <a 
                  href={resolveMediaUrl(activeUrl)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-2 md:p-3 bg-white/10 hover:bg-[#1A73E8] backdrop-blur-sm rounded-full text-white transition-all shadow-lg cursor-pointer" 
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
              <button 
                onClick={() => setIsFullscreen(false)} 
                className="p-2 md:p-3 bg-white/10 hover:bg-[#B89416] rounded-full text-white transition-all shadow-lg cursor-pointer"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="w-full h-full relative flex items-center justify-center bg-white rounded-lg md:rounded-2xl overflow-hidden shadow-2xl">
              {(() => {
                const url = resolveMediaUrl(activeUrl);
                if (url?.toLowerCase().includes('.pdf')) {
                  return (
                    <div className="w-full h-full overflow-auto touch-pan-y touch-pan-x -webkit-overflow-scrolling-touch">
                      <iframe src={`${url}#toolbar=0&navpanes=0`} className="w-full h-full border-0 relative z-10" title="fullscreen-viewer" />
                    </div>
                  );
                } else {
                  return <img src={url} alt="fullscreen preview" className="max-w-full max-h-full object-contain relative z-10" />
                }
              })()}

              {/* WATERMARK */}
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden mix-blend-overlay">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[200%] flex justify-between opacity-10 transform -rotate-12 space-x-12 my-10">
                    <span className="text-4xl md:text-6xl font-black text-black tracking-widest uppercase">[Your Brand]s</span>
                    <span className="text-4xl md:text-6xl font-black text-black tracking-widest uppercase hidden md:inline">[Your Brand]s</span>
                    <span className="text-4xl md:text-6xl font-black text-black tracking-widest uppercase hidden lg:inline">[Your Brand]s</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPROVE/REJECT MODALS */}
      {modalType === "approve" && selectedDrawing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden font-['Poppins']">
            <div className="p-4 bg-[#10B981] flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Approve Drawing</h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-black/10 rounded-full transition cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                <div className="font-bold text-[#252A2A] mb-1">{selectedDrawing.name}</div>
                <div className="text-[10px] text-gray-500">Revision: V{activeVersion?.version || selectedDrawing.current_version} &nbsp;|&nbsp; Date: {fmtDate(activeVersion?.uploaded_at || selectedDrawing.uploaded_at)}</div>
              </div>
              <p className="text-[10px] md:text-xs font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100 leading-relaxed">
                By approving this drawing, you confirm that you have reviewed the current revision and are agreeable to proceed with execution based on this design.
              </p>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Approval Comments (Optional)</label>
                <textarea 
                  rows="3" 
                  value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:border-[#10B981] outline-none transition resize-none bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setModalType(null)} className="px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">Cancel</button>
              <button onClick={() => handleDecision("approved")} disabled={submitting} className="px-5 py-2 text-[11px] font-bold bg-[#10B981] hover:bg-emerald-600 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "reject" && selectedDrawing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden font-['Poppins']">
            <div className="p-4 bg-red-600 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> Request Changes</h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-black/10 rounded-full transition cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                <div className="font-bold text-[#252A2A] mb-1">{selectedDrawing.name}</div>
                <div className="text-[10px] text-gray-500">Revision: V{activeVersion?.version || selectedDrawing.current_version} &nbsp;|&nbsp; Date: {fmtDate(activeVersion?.uploaded_at || selectedDrawing.uploaded_at)}</div>
              </div>
              <p className="text-[10px] md:text-xs font-medium text-red-800 bg-red-50 p-3 rounded-lg border border-red-100 leading-relaxed">
                Please specify what changes are required. This will be sent directly to the design team.
              </p>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Required Changes <span className="text-red-500">*</span></label>
                <textarea 
                  rows="4" 
                  value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="e.g. Increase bedroom 2 wardrobe width to 600mm..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:border-red-500 outline-none transition resize-none bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setModalType(null)} className="px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">Cancel</button>
              <button 
                onClick={() => handleDecision("rejected")} 
                disabled={submitting || !comment.trim()} 
                className="px-5 py-2 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "new_request" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden font-['Poppins']">
            <div className="p-4 bg-[#1A73E8] flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><Plus className="w-4 h-4"/> Request New</h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-black/10 rounded-full transition cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[10px] md:text-xs text-gray-500 mb-2">Request a new drawing from the design team.</p>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select 
                  value={requestForm.category} onChange={e => setRequestForm({...requestForm, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:border-blue-500 outline-none cursor-pointer bg-gray-50 focus:bg-white"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.filter(c => c !== "All Drawings").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Title / Description <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={requestForm.title} onChange={e => setRequestForm({...requestForm, title: e.target.value})}
                  placeholder="e.g. Wardrobe detail for Bedroom 2"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:border-blue-500 outline-none bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Reason (Optional)</label>
                <textarea 
                  rows="3" 
                  value={requestForm.reason} onChange={e => setRequestForm({...requestForm, reason: e.target.value})}
                  placeholder="Please describe what you need..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:border-blue-500 outline-none resize-none bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setModalType(null)} className="px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">Cancel</button>
              <button 
                onClick={handleRequestNew} 
                disabled={submitting || !requestForm.category || !requestForm.title} 
                className="px-5 py-2 text-[11px] font-bold bg-[#1A73E8] hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}