import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";
import { 
  FileText, UploadCloud, Loader2, Trash2, History, 
  CheckCircle2, FileQuestion, ArrowRight, X, Clock
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

// Added complete category list to match client PRD
const CATEGORIES = [
  "Architectural", "Structural", "Electrical", "Plumbing", 
  "HVAC", "Interior", "Landscape", "Others"
];

export default function DrawingsTab({ project, onSaved }) {
  const [drawings, setDrawings] = useState(project.drawings || []);
  const [requests, setRequests] = useState(project.drawing_requests || []);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("library"); // "library" | "requests"
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Architectural");
  const [fulfillingReqId, setFulfillingReqId] = useState(null);
  
  // Revision & UI State
  const [revisingId, setRevisingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [requestFilter, setRequestFilter] = useState("all");

  useEffect(() => {
    setDrawings(project.drawings || []);
    setRequests(project.drawing_requests || []);
  }, [project]);

  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/admin/projects/${project.id}`);
      setDrawings(data.drawings || []);
      setRequests(data.drawing_requests || []);
      onSaved();
    } catch {
      toast.error("Failed to refresh drawings");
    }
  };

  const handleUploadNew = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !newTitle.trim()) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, "drawings");
      await api.post(`/admin/projects/${project.id}/drawings`, { name: newTitle.trim(), category: newCategory, url: res.url });
      
      if (fulfillingReqId) {
        await api.patch(`/admin/projects/${project.id}/drawings/requests/${fulfillingReqId}`, { status: "fulfilled" });
      }
      
      toast.success("Drawing uploaded successfully!");
      setNewTitle("");
      setFulfillingReqId(null);
      await fetchProject();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const startFulfillRequest = (req) => {
    setNewTitle(req.title);
    setNewCategory(req.category);
    setFulfillingReqId(req.id);
    setActiveTab("library");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Upload box pre-filled. Upload the file to fulfill this request.");
  };

  const updateRequestStatus = async (reqId, status) => {
    const action = status === "dismissed" ? "Dismiss" : "Fulfill";
    if (!window.confirm(`${action} this drawing request?`)) return;
    try {
      await api.patch(`/admin/projects/${project.id}/drawings/requests/${reqId}`, { status });
      toast.success(`Request marked as ${status}`);
      await fetchProject();
    } catch {
      toast.error(`Failed to update request`);
    }
  };

  const handleUploadRevision = async (drawingId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRevisingId(drawingId);
    try {
      const res = await adminApi.uploadImage(file, "drawings");
      await api.post(`/admin/projects/${project.id}/drawings/${drawingId}/revision`, { url: res.url });
      const currentVer = drawings.find(d => d.id === drawingId)?.current_version || 1;
      toast.success(`Revision V${currentVer + 1} uploaded!`);
      await fetchProject();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Revision failed");
    } finally {
      setRevisingId(null);
      e.target.value = "";
    }
  };

  const handleDelete = async (drawingId) => {
    if (!window.confirm("Delete this drawing?")) return;
    try {
      await api.delete(`/admin/projects/${project.id}/drawings/${drawingId}`);
      toast.success("Deleted");
      await fetchProject();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") return requests;
    return requests.filter(r => r.status === requestFilter);
  }, [requests, requestFilter]);

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* INNER NAVIGATION TABS */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("library")}
          className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "library" ? "text-[#000F1B]" : "text-gray-400 hover:text-gray-700"}`}
        >
          Drawing Library
          {activeTab === "library" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6600] rounded-t-full" />}
        </button>
        
        <button 
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 relative ${activeTab === "requests" ? "text-[#000F1B]" : "text-gray-400 hover:text-gray-700"}`}
        >
          Client Requests
          {pendingRequestsCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none">{pendingRequestsCount}</span>
          )}
          {activeTab === "requests" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6600] rounded-t-full" />}
        </button>
      </div>

      {/* ========================================================
          TAB 1: DRAWING LIBRARY & UPLOAD
      ======================================================== */}
      {activeTab === "library" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Upload Box */}
          <div className={`rounded-xl border p-5 sm:p-6 shadow-sm transition-all duration-300 ${fulfillingReqId ? "bg-amber-50 border-amber-300 ring-4 ring-amber-500/10" : "bg-white border-black/5"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#000F1B]">Upload New Drawing Plan</h3>
              {fulfillingReqId && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5">
                    <FileQuestion className="w-3 h-3"/> Fulfilling Client Request
                  </span>
                  <button onClick={() => { setFulfillingReqId(null); setNewTitle(""); }} className="text-gray-400 hover:text-gray-800"><X className="w-4 h-4"/></button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-[#111111]/60 uppercase tracking-wider mb-1">Drawing Title *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Ground Floor Electrical Layout" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#FF6600] outline-none transition" />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-[#111111]/60 uppercase tracking-wider mb-1">Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#FF6600] outline-none cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl text-white px-6 py-2.5 text-sm font-bold transition cursor-pointer shadow-sm ${fulfillingReqId ? "bg-amber-600 hover:bg-amber-700" : "bg-[#000F1B] hover:bg-[#FF6600]"}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{fulfillingReqId ? "Upload & Fulfill" : "Upload Plan"}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadNew} disabled={!newTitle.trim() || uploading} />
              </label>
            </div>
          </div>

          {/* Drawings List */}
          <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-[#000F1B]">Active Drawings ({drawings.length})</h3>
            </div>

            {drawings.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#111111]/50 italic">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                No drawings uploaded for this project yet.
              </div>
            ) : (
              <div className="p-5 space-y-4 bg-white">
                {drawings.map(d => {
                  const versions = d.versions || [];
                  const latest = versions[versions.length - 1] || {};
                  const isExpanded = expandedId === d.id;

                  const statusConfig = {
                    approved: { color: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Approved" },
                    changes_required: { color: "bg-blue-50 text-blue-600 border-blue-200", label: "Changes Required" },
                    rejected: { color: "bg-red-50 text-red-600 border-red-200", label: "Rejected" },
                    pending: { color: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending Approval" }
                  };
                  const stat = statusConfig[d.status] || statusConfig.pending;
                  
                  // PDF check logic identical to client portal
                  const isPdf = latest.url?.toLowerCase().includes('.pdf');

                  return (
                    <div key={d.id} className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden hover:border-[#FF6600]/40 transition">
                      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F9FAFB]/50">
                        <div className="flex items-center gap-4 min-w-0">
                          
                          {/* UPDATED PREVIEW BLOCK FOR PDF FIX */}
                          <a href={resolveMediaUrl(latest.url)} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl bg-white border border-black/10 overflow-hidden shrink-0 group relative block shadow-sm flex items-center justify-center">
                            {isPdf ? (
                              <div className="flex flex-col items-center justify-center text-[#1A73E8]">
                                <FileText className="w-6 h-6 opacity-70" />
                                <span className="text-[7px] font-bold mt-1 uppercase tracking-widest">PDF</span>
                              </div>
                            ) : (
                              <img src={resolveMediaUrl(latest.url)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            )}
                          </a>
                          {/* END PREVIEW BLOCK */}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[9px] font-bold text-[#FF6600] uppercase tracking-wider">{d.category}</span>
                              <span className="text-[9px] font-mono font-bold bg-[#000F1B] text-white px-2 py-0.5 rounded shadow-sm">V{d.current_version}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${stat.color}`}>
                                {stat.label}
                              </span>
                            </div>
                            <h4 className="font-bold text-[#000F1B] text-sm md:text-base truncate">{d.name}</h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button onClick={() => setExpandedId(isExpanded ? null : d.id)} className="px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs font-bold text-[#000F1B] hover:bg-[#F2F2F2] transition flex items-center gap-1.5 shadow-sm">
                            <History className="w-3.5 h-3.5" /> {isExpanded ? "Hide History" : `History (${versions.length})`}
                          </button>

                          <label className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF6600]/10 text-[#FF6600] hover:bg-[#FF6600] hover:text-white px-4 py-1.5 text-xs font-bold cursor-pointer transition shadow-sm">
                            {revisingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `Upload V${d.current_version + 1}`}
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleUploadRevision(d.id, e)} />
                          </label>

                          <button onClick={() => handleDelete(d.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 grid place-items-center hover:bg-red-500 hover:text-white transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-white border-t border-black/5 p-5 space-y-3">
                          <div className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider mb-3">Revision & Feedback History</div>
                          <div className="space-y-2.5">
                            {[...versions].reverse().map((v) => {
                              const isRevPdf = v.url?.toLowerCase().includes('.pdf');
                              return (
                                <div key={v.version} className="bg-[#F9FAFB] border border-black/5 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <a href={resolveMediaUrl(v.url)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-black/10 shrink-0 flex items-center justify-center">
                                      {isRevPdf ? (
                                        <div className="flex flex-col items-center justify-center text-[#1A73E8]">
                                          <FileText className="w-4 h-4 opacity-70" />
                                          <span className="text-[5px] font-bold uppercase tracking-widest mt-0.5">PDF</span>
                                        </div>
                                      ) : (
                                        <img src={resolveMediaUrl(v.url)} alt="" className="w-full h-full object-cover" />
                                      )}
                                    </a>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#000F1B]">Version {v.version}</span>
                                        <span className="text-[10px] text-[#111111]/40 font-medium">• {v.uploaded_at ? new Date(v.uploaded_at).toLocaleDateString() : ""}</span>
                                      </div>
                                      {v.client_comment ? (
                                        <p className="text-xs text-[#111111]/70 italic truncate mt-0.5">"{v.client_comment}"</p>
                                      ) : (
                                        <span className="text-[10px] text-[#111111]/30 italic">No comments left</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {v.client_decision ? (
                                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                                        v.client_decision === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                        v.client_decision === "changes_required" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-red-50 text-red-600 border-red-200"
                                      }`}>
                                        {v.client_decision.replace("_", " ")}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">Pending Approval</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: CLIENT REQUESTS LEDGER
      ======================================================== */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden animate-in fade-in duration-300">
          
          <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[#000F1B] grid place-items-center shadow-sm">
                <FileQuestion className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#000F1B]">Request Ledger</h3>
                <p className="text-[10px] text-gray-500 font-medium">Manage and fulfill client drawing requests.</p>
              </div>
            </div>
            
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              {['all', 'pending', 'fulfilled'].map(f => (
                <button 
                  key={f} onClick={() => setRequestFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition ${requestFilter === f ? "bg-white text-[#000F1B] shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-16 text-center text-sm text-gray-400 italic">
              No {requestFilter !== 'all' ? requestFilter : ''} requests found in the ledger.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date & Client</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Request Details</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 align-top w-48">
                      <div className="text-xs font-bold text-gray-900">{new Date(req.requested_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{req.requested_by}</div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{req.category}</span>
                        <h4 className="text-xs font-bold text-[#000F1B]">{req.title}</h4>
                      </div>
                      {req.reason && <p className="text-[11px] text-gray-600 mt-1 max-w-lg">"{req.reason}"</p>}
                    </td>
                    <td className="py-3 px-4 align-top text-center w-32">
                      {req.status === "pending" && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded"><Clock className="w-3 h-3"/> Pending</span>}
                      {req.status === "fulfilled" && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> Fulfilled</span>}
                      {req.status === "dismissed" && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded"><X className="w-3 h-3"/> Dismissed</span>}
                    </td>
                    <td className="py-3 px-4 align-top text-right w-48">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => updateRequestStatus(req.id, "dismissed")} className="text-[10px] font-bold text-gray-500 hover:text-gray-800 transition">Dismiss</button>
                          <button onClick={() => startFulfillRequest(req)} className="px-3 py-1.5 bg-[#000F1B] hover:bg-[#FF6600] text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-sm transition">
                            Fulfill <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium italic">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}