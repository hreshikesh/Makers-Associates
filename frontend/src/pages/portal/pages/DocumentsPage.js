import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, FileText, Download, FolderArchive, ChevronLeft, 
  X, Maximize2, Share2, History, AlertCircle, Eye, ExternalLink
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";

const CATEGORIES = [
  "All Categories", "Drawings", "Contracts & Agreements", "BOQ & Estimates", 
  "Invoices & Payments", "Approvals", "Reports", "Test Certificates", 
  "Warranties", "Manuals", "Government / Statutory", "Handover Documents", 
  "Site Photos", "Other"
];

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } 
  catch { return "—"; }
};

export default function DocumentsPage() {
  const { project } = usePortal();
  
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [statusFilter, setStatusFilter] = useState("All Status");
  
  const [selectedId, setSelectedId] = useState(null);
  const [drawerTab, setDrawerTab] = useState("Overview"); 
  const [isFullscreen, setIsFullscreen] = useState(false); 
  
  // UX State: Track which version is currently being viewed
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);

  const documents = useMemo(() => project?.documents || [], [project?.documents]);
  
  const projectStages = useMemo(() => {
    const names = (project?.stages || []).map(s => s.name);
    return ["All Stages", "General", ...names];
  }, [project]);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || (d.name||"").toLowerCase().includes(q) || (d.description||"").toLowerCase().includes(q);
      const matchCat = catFilter === "All Categories" || (d.category || "Other") === catFilter;
      const matchStage = stageFilter === "All Stages" || (d.stage || "General") === stageFilter;
      const matchStatus = statusFilter === "All Status" || (d.status || "Current") === statusFilter;
      return matchSearch && matchCat && matchStage && matchStatus;
    }).sort((a,b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
  }, [documents, search, catFilter, stageFilter, statusFilter]);

  // Auto-select first document on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      if (filteredDocs.length > 0 && !selectedId) setSelectedId(filteredDocs[0].id);
      else if (filteredDocs.length === 0) setSelectedId(null);
    }
  }, [filteredDocs, selectedId]);

  const selectedDoc = documents.find(d => d.id === selectedId);

  // Normalizing versions array
  const versions = useMemo(() => {
    if (!selectedDoc) return [];
    if (Array.isArray(selectedDoc.versions) && selectedDoc.versions.length > 0) {
      return selectedDoc.versions;
    }
    return [{
      version: selectedDoc.current_version || 1,
      url: selectedDoc.url,
      uploaded_at: selectedDoc.uploaded_at,
      client_comment: selectedDoc.description || null,
      client_decision: selectedDoc.status === "Approved" ? "approved" : null
    }];
  }, [selectedDoc]);

  // Reset selected version index ONLY when user selects a different document entirely.
  // This fixes the bug where viewing a revision was getting overwritten by re-renders.
  useEffect(() => {
    if (selectedId) {
      const doc = documents.find(d => d.id === selectedId);
      const vCount = (doc && Array.isArray(doc.versions) && doc.versions.length > 0) ? doc.versions.length : 1;
      setActiveVersionIdx(vCount - 1); // Set to latest version
      setDrawerTab("Overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]); 

  const activeVersion = versions[activeVersionIdx] || versions[versions.length - 1];
  const activeUrl = activeVersion?.url || selectedDoc?.url;
  const isViewingOlder = activeVersionIdx < versions.length - 1;

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (["approved", "current", "signed", "paid", "passed", "valid"].includes(s)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (["under review"].includes(s)) return "text-amber-700 bg-amber-50 border-amber-200";
    if (["superseded"].includes(s)) return "text-gray-600 bg-gray-100 border-gray-200";
    return "text-[#B89416] bg-[#B89416]/10 border-[#B89416]/20";
  };

  const resetFilters = () => {
    setSearch(""); setCatFilter("All Categories"); setStageFilter("All Stages"); setStatusFilter("All Status");
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
      toast.success("Document link copied to clipboard!");
    }
  };

  const downloadWithWatermark = async (url, filename) => {
    if (!url) return;
    try {
      const isPdf = url.toLowerCase().includes('.pdf');
      
      if (isPdf) {
        toast.info("Downloading document...");
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      toast.loading("Applying watermark...", { id: "watermark" });
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      img.src = url;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(30, img.width / 15);
        ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
        ctx.fillStyle = "rgba(255, 90, 0, 0.4)"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); 
        
        ctx.fillText("[Your Brand]s", 0, 0);
        ctx.fillText("[Your Brand]s", 0, -fontSize * 4);
        ctx.fillText("[Your Brand]s", 0, fontSize * 4);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename || '[Your Brand]s_Document.jpg';
        link.click();
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

  if (!project) return null;

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] min-h-0 font-['Poppins'] bg-[#F5F6F8] overflow-hidden">
      
      {/* HEADER */}
      <div className={`shrink-0 bg-white border-b border-gray-200 px-3 md:px-5 2xl:px-8 pt-4 2xl:pt-6 pb-2 z-10 ${selectedId ? 'hidden md:block' : 'block'}`}>
        <div className="mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl 2xl:text-4xl font-bold text-[#252A2A]">Documents</h1>
          <p className="text-[10px] md:text-xs 2xl:text-sm text-gray-500 mt-0.5">Your complete project document vault. Access all project-related documents in one place.</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:flex sm:overflow-x-auto no-scrollbar gap-2 md:gap-2.5 pb-2 mb-2">
          {[
            { label: "All Documents", count: documents.length, color: "text-[#1A73E8]", icon: FolderArchive },
            { label: "Drawings", count: documents.filter(d=>d.category==="Drawings").length, color: "text-[#B89416]", icon: FileText },
            { label: "Contracts", count: documents.filter(d=>d.category==="Contracts & Agreements").length, color: "text-emerald-600", icon: FileText },
            { label: "Estimates", count: documents.filter(d=>d.category==="BOQ & Estimates").length, color: "text-blue-600", icon: FileText },
            { label: "Invoices", count: documents.filter(d=>d.category==="Invoices & Payments").length, color: "text-purple-600", icon: FileText },
          ].map((k, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5 sm:min-w-[130px] md:min-w-[140px] flex items-center gap-2.5 shadow-sm shrink-0">
              <k.icon className={`w-4 h-4 md:w-5 md:h-5 ${k.color} shrink-0`} />
              <div className="min-w-0">
                <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">{k.label}</div>
                <div className="text-base md:text-lg font-black text-[#252A2A] leading-none mt-1">{k.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 min-h-0 flex overflow-hidden p-0 md:p-3 2xl:p-5 gap-3 2xl:gap-5 w-full max-w-[2400px] mx-auto">
        
        {/* LEFT PANE: TABLE/LIST */}
        <div className={`flex-1 lg:flex-none lg:w-1/3 xl:w-[45%] 2xl:w-[40%] flex flex-col min-h-0 bg-white md:border border-gray-200 md:rounded-xl shadow-sm overflow-hidden ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          
          <div className="p-2.5 md:p-3 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-gray-50 shrink-0">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search documents..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-[11px] md:text-xs bg-white border border-gray-200 rounded-md outline-none focus:border-[#B89416] shadow-sm" />
            </div>
            <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="text-[10px] md:text-xs border border-gray-200 rounded-md px-2.5 py-2 outline-none focus:border-[#B89416] bg-white cursor-pointer w-[110px]">
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)} className="text-[10px] md:text-xs border border-gray-200 rounded-md px-2.5 py-2 outline-none focus:border-[#B89416] bg-white cursor-pointer w-[100px] hidden sm:block">
              {projectStages.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={resetFilters} className="text-[10px] md:text-xs font-bold text-gray-500 hover:text-black px-2 py-2 cursor-pointer">Reset</button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y bg-[#F5F6F8] md:bg-white custom-scrollbar">
            <table className="hidden sm:table w-full text-left text-[10px] md:text-xs min-w-[500px] border-collapse">
              <thead className="bg-[#F9FAFB] border-b border-gray-200 sticky top-0 z-10 text-gray-500 uppercase tracking-wider text-[9px] md:text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Name</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold text-center">Rev</th>
                  <th className="py-2.5 px-3 font-bold">Date</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map(d => {
                  const isSelected = selectedId === d.id;
                  return (
                    <tr key={d.id} onClick={() => setSelectedId(d.id)} className={`cursor-pointer transition-colors ${isSelected ? "bg-[#B89416]/5 hover:bg-[#B89416]/10" : "hover:bg-gray-50"}`}>
                      <td className="py-3 px-3 relative">
                        <div className="flex items-center gap-2">
                          {isSelected && <div className="absolute left-0 w-1.5 h-8 bg-[#B89416] rounded-r-md" />}
                          <FileText className={`w-4 h-4 shrink-0 ${d.category?.includes("Drawing") ? "text-red-500" : d.category?.includes("Contract") ? "text-emerald-500" : "text-[#1A73E8]"}`} />
                          <span className="font-bold text-[#252A2A] truncate max-w-[150px] lg:max-w-[200px]">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">{d.category || "Other"}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-gray-500">{d.current_version ? `R0${d.current_version}` : "—"}</td>
                      <td className="py-3 px-3 text-gray-600 font-medium">{fmtDate(d.uploaded_at)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(d.status)}`}>
                          {d.status || "Current"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile View */}
            <div className="sm:hidden space-y-2 p-3">
              {filteredDocs.map(d => (
                <div key={d.id} onClick={() => setSelectedId(d.id)} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-[#B89416]/50 transition-colors">
                  <div className="flex items-start justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#B89416] shrink-0" />
                      <h4 className="font-bold text-[11px] text-[#252A2A] truncate">{d.name}</h4>
                    </div>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border shrink-0 ${getStatusColor(d.status)}`}>{d.status || "Current"}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1.5 font-medium flex-wrap mt-1.5">
                    <span>{d.category || "Other"}</span> <span className="text-gray-300">•</span> 
                    <span>Rev {d.current_version ? `R0${d.current_version}` : "-"}</span> <span className="text-gray-300">•</span> 
                    <span>{fmtDate(d.uploaded_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredDocs.length === 0 && (
              <div className="text-center py-16 text-xs text-gray-400">
                <FolderArchive className="w-10 h-10 mx-auto mb-2 opacity-20" /> No documents found.
              </div>
            )}
          </div>
          <div className="p-2 md:p-3 border-t border-gray-100 bg-white text-[10px] md:text-xs font-semibold text-gray-500 flex justify-between shrink-0">
            <span>Showing {filteredDocs.length} of {documents.length}</span>
          </div>
        </div>

        {/* RIGHT PANE: UNIFIED DETAILS & PREVIEW */}
        <div className={`flex-1 min-w-0 flex flex-col min-h-0 bg-white md:border border-gray-200 md:rounded-xl shadow-sm overflow-hidden shrink-0 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
          {selectedDoc ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
              
              {/* Header */}
              <div className="p-2.5 md:p-3.5 border-b border-gray-100 bg-white shrink-0 relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm z-20">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={() => setSelectedId(null)} className="md:hidden flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-[#B89416] bg-gray-50 px-2.5 py-1.5 rounded-md">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm md:text-base font-bold text-[#252A2A] max-w-[200px] lg:max-w-[350px] truncate">{selectedDoc.name}</h2>
                      <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${getStatusColor(selectedDoc.status)}`}>
                        {selectedDoc.status || "Current"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => { if (activeUrl) setIsFullscreen(true); }}
                    disabled={!activeUrl}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Full Screen
                  </button>
                  <button 
                    onClick={() => downloadWithWatermark(resolveMediaUrl(activeUrl), `${selectedDoc.name.replace(/\s+/g, '_')}_V${activeVersion?.version || selectedDoc.current_version || 1}`)} 
                    disabled={!activeUrl}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 bg-[#252A2A] hover:bg-[#B89416] text-white rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button 
                    onClick={() => handleShare(activeUrl, selectedDoc.name)}
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

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-2.5 sm:p-3.5 md:p-4 bg-gray-50 custom-scrollbar relative">
                
                {drawerTab === "Overview" && (
                  <div className="max-w-4xl mx-auto space-y-3 pb-4">
                    
                    {/* DOCUMENT DATA */}
                    <div className="bg-white rounded-xl border border-black/5 p-3 md:p-4 shadow-sm">
                      <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 border-b border-black/5 pb-1.5">Document Data</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-3 text-[11px] md:text-xs">
                        <div className="col-span-2">
                          <div className="text-gray-500 font-medium mb-0.5 text-[10px]">File Name</div>
                          <div className="font-bold text-[#252A2A] break-all leading-snug">{selectedDoc.name}</div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Category</div>
                          <div className="text-gray-900 font-semibold">{selectedDoc.category || "—"}</div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Stage Focus</div>
                          <div className="text-gray-900 font-semibold">{selectedDoc.stage || "—"}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Viewing Revision</div>
                          <div className="text-gray-900 font-bold text-[#B89416]">
                            {activeVersion?.version ? `R0${activeVersion.version}` : selectedDoc.current_version ? `R0${selectedDoc.current_version}` : "R01"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium mb-0.5 text-[10px]">Uploaded On</div>
                          <div className="text-gray-900 font-semibold">{fmtDate(activeVersion?.uploaded_at || selectedDoc.uploaded_at)}</div>
                        </div>
                      </div>
                    </div>

                    {selectedDoc.description && (
                      <div className="bg-white rounded-xl border border-black/5 p-3 shadow-sm">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FileText className="w-3 h-3"/> Document Notes</div>
                        <p className="text-[10px] md:text-xs text-gray-700 leading-relaxed italic border-l-2 border-[#B89416] pl-2.5">
                          "{selectedDoc.description}"
                        </p>
                      </div>
                    )}

                    {/* COMPACT PREVIEW CONTAINER */}
                    <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden flex flex-col h-[42vh] min-h-[280px] sm:h-[380px] md:h-[450px]">
                      <div className="py-2 px-3 border-b border-black/5 bg-gray-50 flex items-center justify-between shrink-0">
                        <div className="text-[11px] md:text-xs font-bold text-[#252A2A]">Document Preview</div>
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
                                  key={activeUrl} // Forces iframe to remount correctly on version switch
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

                {/* REVISIONS / HISTORY TAB */}
                {drawerTab === "Revisions" && (
                  <div className="max-w-3xl mx-auto space-y-2.5 pb-4">
                    {[...versions].reverse().map((v, reversedIndex) => {
                      const originalIndex = versions.length - 1 - reversedIndex;
                      const isCurrentDocVersion = v.version === (selectedDoc.current_version || 1);
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
                              onClick={() => downloadWithWatermark(resolveMediaUrl(v.url), `${selectedDoc.name.replace(/\s+/g, '_')}_V${v.version}`)}
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
              <FolderArchive className="w-14 h-14 opacity-20 mb-3 text-[#B89416]" />
              <p className="text-base font-bold text-[#252A2A] mb-1">No Document Selected</p>
              <p className="text-xs max-w-[250px] text-gray-500 leading-relaxed">Select a file from the vault to read, review history, and securely download.</p>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN MODAL */}
      <AnimatePresence>
        {isFullscreen && selectedDoc && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setIsFullscreen(false)} 
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-white/10 hover:bg-[#B89416] rounded-full text-white transition-all shadow-lg z-50 cursor-pointer"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="w-full h-full relative flex items-center justify-center bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
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
                  <div key={i} className="w-[200%] flex justify-between opacity-[0.08] transform -rotate-12 space-x-12 my-10 md:my-16 2xl:my-24">
                    <span className="text-4xl md:text-6xl 2xl:text-8xl 4xl:text-[10rem] font-black text-black tracking-widest uppercase">[Your Brand]s</span>
                    <span className="text-4xl md:text-6xl 2xl:text-8xl 4xl:text-[10rem] font-black text-black tracking-widest uppercase hidden md:inline">[Your Brand]s</span>
                    <span className="text-4xl md:text-6xl 2xl:text-8xl 4xl:text-[10rem] font-black text-black tracking-widest uppercase hidden lg:inline">[Your Brand]s</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}