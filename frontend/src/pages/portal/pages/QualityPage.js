import React, { useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, ChevronRight,
  ChevronLeft, X, Image as ImageIcon, Loader2, Info, Camera, 
  Plus, ListTodo, ArrowRight, Clock, UserCheck, Calendar
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } 
  catch { return "—"; }
};

// Client-safe upload hitting your backend route
async function uploadPortalImage(file, folder = "issues") {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(
    `/portal/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  const url = data?.url || data?.absoluteUrl || data?.secure_url;
  if (!url) throw new Error("Upload failed");
  return url;
}

export default function QualityPage() {
  const { project, refreshProject } = usePortal();
  
  // Navigation View State
  const [activeTab, setActiveTab] = useState("reviews"); // 'reviews' | 'issues'
  const [activeStageId, setActiveStageId] = useState(null);
  
  // Modals & Selection
  const [modalType, setModalType] = useState(null); // 'approve' | 'raise_issue' | 'review_resolution'
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  const [remark, setRemark] = useState("");
  const [issuePhotos, setIssuePhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- DATA: STAGE REVIEWS ---
  const releasedStages = useMemo(
    () => (project?.quality_stage_reviews || []).filter((s) => s.status === "released"),
    [project]
  );

  const { awaitingReview, reviewedByYou } = useMemo(() => {
    const awaiting = [];
    const reviewed = [];
    releasedStages.forEach((stage) => {
      const checks = stage.checks || [];
      if (checks.some((c) => c.client_status === "pending_review")) awaiting.push(stage);
      else if (checks.length > 0) reviewed.push(stage);
    });
    return { awaitingReview: awaiting, reviewedByYou: reviewed };
  }, [releasedStages]);

  const activeStage = releasedStages.find((s) => s.id === activeStageId);

  // --- DATA: ISSUES ---
  const issues = project?.issues || [];

  // ==========================================
  // ACTIONS: REVIEWS
  // ==========================================
  const handleApproveCheck = async () => {
    if (!selectedCheck) return;
    setSubmitting(true);
    try {
      await api.post(`/portal/my-project/quality-checks/${selectedCheck.id}/approve`, { remark });
      toast.success("Quality check approved");
      await refreshProject?.();
      setModalType(null);
      setRemark("");
    } catch {
      toast.error("Failed to approve check");
    } finally { setSubmitting(false); }
  };

  const handleRaiseIssue = async () => {
    if (!selectedCheck || !remark.trim()) {
      toast.error("Issue description is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/portal/my-project/quality-checks/${selectedCheck.id}/raise-issue`, {
        description: remark.trim(),
        photo_urls: issuePhotos,
      });
      toast.success("Issue raised and sent to project team");
      await refreshProject?.();
      setModalType(null);
      setRemark("");
      setIssuePhotos([]);
      setActiveTab("issues"); // Auto-switch to issues tab to show it
    } catch {
      toast.error("Failed to raise issue");
    } finally { setSubmitting(false); }
  };

  // ==========================================
  // ACTIONS: ISSUES
  // ==========================================
  const handleReviewResolution = async (isApproved) => {
    if (!selectedIssue) return;
    setSubmitting(true);
    try {
      await api.post(`/portal/my-project/issues/${selectedIssue.id}/client-review`, {
        approved: isApproved,
        remark: remark
      });
      toast.success(isApproved ? "Resolution Accepted" : "Resolution Rejected");
      await refreshProject?.();
      setModalType(null);
      setSelectedIssue(null);
      setRemark("");
    } catch {
      toast.error("Failed to submit decision");
    } finally { setSubmitting(false); }
  };

  const onIssuePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPortalImage(file, "issues");
      setIssuePhotos((prev) => [...prev, url]);
      toast.success("Photo attached");
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const getIssueStatusUI = (status) => {
    switch (status) {
      case "open": return { label: "Raised", color: "bg-red-50 text-red-700 border-red-200" };
      case "in_progress": return { label: "Fix In Progress", color: "bg-[#B89416]/10 text-[#B89416] border-[#B89416]/30" };
      case "ready_for_client_review": return { label: "Ready for Your Review", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "client_approved": return { label: "Resolution Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "closed": return { label: "Closed", color: "bg-gray-100 text-gray-700 border-gray-300" };
      default: return { label: "Pending", color: "bg-gray-50 text-gray-600 border-gray-200" };
    }
  };

  if (!project) return null;

  // ==========================================
  // VIEW: STAGE CHECKLIST DETAILS (Drilldown)
  // ==========================================
  if (activeStage && activeTab === "reviews") {
    const checks = activeStage.checks || [];
    const pending = checks.filter((c) => c.client_status === "pending_review").length;
    const done = checks.length - pending;
    const pct = Math.round((done / (checks.length || 1)) * 100);

    return (
      <div className="flex flex-col h-[calc(100vh-80px)] font-['Poppins'] bg-[#F5F6F8]">
        <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 shadow-sm">
          <button
            onClick={() => setActiveStageId(null)}
            className="text-[10px] font-bold text-gray-500 hover:text-[#B89416] flex items-center gap-1 mb-2 bg-gray-50 px-2 py-1 rounded w-max transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Quality
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#252A2A] flex flex-wrap items-center gap-2">
                {activeStage.name} - Quality Review
                {pending > 0 && (
                  <span className="text-[8px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    Awaiting Your Review
                  </span>
                )}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Please review each item and confirm, or raise an issue if you are not satisfied.</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-56 shrink-0">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-gray-500">Stage Progress</span>
                <span className="text-[#252A2A]">{done} of {checks.length} reviewed</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[650px] text-[11px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                    <th className="py-2.5 px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Photo</th>
                    <th className="py-2.5 px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Quality Check</th>
                    <th className="py-2.5 px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider">PM Remark</th>
                    <th className="py-2.5 px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">Your Status</th>
                    <th className="py-2.5 px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checks.map((chk, i) => (
                    <tr key={chk.id} className="hover:bg-gray-50/80 transition align-top">
                      <td className="py-3 px-3 text-center text-gray-400 font-bold">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="w-12 h-10 rounded border bg-gray-100 overflow-hidden flex items-center justify-center">
                          {chk.photo_urls?.[0] ? (
                            <a href={resolveMediaUrl(chk.photo_urls[0])} target="_blank" rel="noreferrer">
                              <img src={resolveMediaUrl(chk.photo_urls[0])} alt="" className="w-full h-full object-cover" />
                            </a>
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#252A2A]">{chk.check_text}</div>
                        <div className="text-[10px] text-[#1A73E8] font-semibold">{chk.area}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-[180px]">
                        <span className="line-clamp-2">{chk.pm_remark || "Verified on site."}</span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {chk.client_status === "pending_review" && (
                          <span className="text-[9px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Pending Review</span>
                        )}
                        {chk.client_status === "approved" && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {chk.client_status === "issue_raised" && (
                          <span className="text-[9px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Issue Raised
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {chk.client_status === "pending_review" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setSelectedCheck(chk); setRemark(""); setModalType("approve"); }}
                              className="px-3 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-600 hover:text-white transition shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setSelectedCheck(chk); setRemark(""); setIssuePhotos([]); setModalType("raise_issue"); }}
                              className="px-3 py-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-600 hover:text-white transition shadow-sm"
                            >
                              Raise Issue
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="py-2 text-center text-[10px] text-gray-400 border-t">{checks.length} checks</div>
          </div>
        </div>

        {/* Approve modal */}
        {modalType === "approve" && selectedCheck && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 font-['Poppins']">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-sm font-bold text-[#252A2A]">Confirm Approval</h3>
                <button onClick={() => setModalType(null)} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-[#CC4800] bg-[#B89416]/10 border border-[#B89416]/20 rounded-lg p-2 font-medium">
                  Confirm that this quality check has been reviewed and is satisfactory.
                </p>
                <div className="flex gap-2.5 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden shrink-0 border border-gray-300">
                    {selectedCheck.photo_urls?.[0] ? <img src={resolveMediaUrl(selectedCheck.photo_urls[0])} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-400 m-3.5" />}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Quality Check</span>
                    <span className="text-xs font-bold text-[#252A2A] mb-0.5">{selectedCheck.check_text}</span>
                    <span className="text-[9px] text-[#B89416] font-bold">{selectedCheck.area}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Your Remark (Optional)</label>
                  <textarea
                    rows={2}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add a remark (e.g. Looks good)"
                    className="w-full text-[11px] border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500 resize-none bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setModalType(null)} className="px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                <button onClick={handleApproveCheck} disabled={submitting} className="px-4 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Raise issue modal */}
        {modalType === "raise_issue" && selectedCheck && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 font-['Poppins']">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="text-sm font-bold text-[#252A2A]">Raise an Issue</h3>
                <button onClick={() => setModalType(null)} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                <p className="text-[10px] text-red-800 bg-red-50 border border-red-100 rounded-lg p-2 font-medium">
                  Please describe the issue in detail for rectification.
                </p>
                <div className="flex gap-2.5 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden shrink-0 border border-gray-300">
                    {selectedCheck.photo_urls?.[0] ? <img src={resolveMediaUrl(selectedCheck.photo_urls[0])} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-400 m-3.5" />}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Quality Check</span>
                    <span className="text-xs font-bold text-[#252A2A] mb-0.5">{selectedCheck.check_text}</span>
                    <span className="text-[9px] text-[#B89416] font-bold">{selectedCheck.area}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">What is the issue? <span className="text-red-500">*</span></label>
                  <textarea 
                    rows="3" value={remark} onChange={e => setRemark(e.target.value.slice(0, 500))}
                    placeholder="e.g. Grouting is incomplete..."
                    className="w-full text-[11px] border border-gray-200 rounded-lg p-2 outline-none focus:border-red-500 resize-none bg-gray-50 focus:bg-white"
                  />
                  <div className="text-[8px] font-bold text-gray-400 text-right mt-1">{remark.length}/500</div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1.5">Add Photos (Optional)</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {issuePhotos.map((p, i) => (
                      <div key={i} className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 shrink-0">
                        <img src={resolveMediaUrl(p)} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setIssuePhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white w-3.5 h-3.5 grid place-items-center rounded-bl-md"><X className="w-2.5 h-2.5"/></button>
                      </div>
                    ))}
                    <label className="w-12 h-12 rounded-md border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition shrink-0">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B89416]" /> : <Camera className="w-3.5 h-3.5 text-[#B89416] mb-0.5" />}
                      <span className="text-[7px] font-bold text-gray-500 mt-0.5">Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={onIssuePhotoUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0">
                <button onClick={() => setModalType(null)} className="px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                <button 
                  onClick={handleRaiseIssue} 
                  disabled={submitting || !remark.trim()} 
                  className="px-4 py-1.5 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Raise Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 1: LANDING PAGE (REVIEWS + ISSUES TABS)
  // ==========================================
  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto font-['Poppins'] bg-[#F5F6F8] p-3 sm:p-4 lg:px-12">
      
      {/* Top Banner & Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#252A2A]">Quality & Issues</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Review quality checks or track issues you have raised.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner w-full md:w-auto">
            <button 
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "reviews" ? "bg-white text-[#252A2A] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Quality Reviews
            </button>
            <button 
              onClick={() => setActiveTab("issues")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "issues" ? "bg-white text-[#252A2A] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              <ListTodo className="w-3.5 h-3.5" /> My Issues
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB A: QUALITY REVIEWS --- */}
      {activeTab === "reviews" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[#B89416] text-white text-[10px] font-bold grid place-items-center">1</span>
              <div>
                <h2 className="text-sm font-bold text-[#252A2A]">Awaiting Your Review</h2>
                <p className="text-[9px] text-gray-500">Stages waiting for your confirmation</p>
              </div>
            </div>

            {awaitingReview.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl py-6 text-center">
                <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                <p className="text-[11px] font-bold text-gray-600">You're all caught up!</p>
                <p className="text-[9px] text-gray-400 mt-0.5">No quality stages currently require your review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {awaitingReview.map((stage) => {
                  const pending = (stage.checks || []).filter((c) => c.client_status === "pending_review").length;
                  const thumb = stage.checks?.find((c) => c.photo_urls?.[0])?.photo_urls?.[0];
                  return (
                    <div key={stage.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-[#B89416]/40 transition flex flex-col justify-between">
                      <div>
                        <div className="h-20 bg-gray-100 border-b border-gray-100 relative">
                          {thumb ? (
                            <img src={resolveMediaUrl(thumb)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-bold text-[#252A2A]">{stage.name}</h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{pending} pending · {stage.checks?.length || 0} checks</p>
                          <span className="inline-block mt-1.5 text-[8px] font-bold uppercase tracking-wider text-[#CC4800] bg-[#B89416]/10 border border-[#B89416]/20 px-1.5 py-0.5 rounded">
                            Awaiting Your Review
                          </span>
                        </div>
                      </div>
                      <div className="p-3 pt-0">
                        <button onClick={() => setActiveStageId(stage.id)} className="w-full py-1.5 text-[10px] font-bold text-[#B89416] bg-[#B89416]/5 border border-[#B89416]/20 rounded-lg hover:bg-[#B89416]/10 transition flex items-center justify-center gap-1">
                          Review <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[#B89416] text-white text-[10px] font-bold grid place-items-center">2</span>
              <div>
                <h2 className="text-sm font-bold text-[#252A2A]">Reviewed by You</h2>
                <p className="text-[9px] text-gray-500">Stages you have already reviewed and confirmed.</p>
              </div>
            </div>

            {reviewedByYou.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl py-4 text-center text-[10px] text-gray-400 italic">
                Reviewed stages will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {reviewedByYou.map((stage) => {
                  const checks = stage.checks || [];
                  const approved = checks.filter((c) => c.client_status === "approved").length;
                  const hasIssues = checks.some((c) => c.client_status === "issue_raised");
                  const thumb = checks.find((c) => c.photo_urls?.[0])?.photo_urls?.[0];
                  return (
                    <button key={stage.id} type="button" onClick={() => setActiveStageId(stage.id)} className="w-full bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-3 text-left hover:border-[#B89416]/40 transition shadow-sm group">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 hidden sm:block border border-gray-200">
                        {thumb ? <img src={resolveMediaUrl(thumb)} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-bold text-[#252A2A] mb-0.5">{stage.name}</div>
                        <div className="text-[9px] font-semibold text-gray-500">{approved}/{checks.length} checks approved</div>
                        <div className="mt-0.5">
                          {hasIssues ? (
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded"><AlertTriangle className="w-2.5 h-2.5"/> Issues Raised</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"><CheckCircle2 className="w-2.5 h-2.5"/> Approved</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Reviewed On</div>
                        <div className="text-[10px] font-bold text-gray-700">{fmtDate(stage.released_at)}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#B89416] transition shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* --- TAB B: ISSUES LEDGER (Updated with Resolution Images directly on Card) --- */}
      {activeTab === "issues" && (
        <div className="animate-in fade-in duration-300">
          {issues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-12 text-center">
              <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-[#252A2A]">No Issues Raised</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">You haven't raised any quality issues yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {issues.map((i) => {
                const ui = getIssueStatusUI(i.status);
                const needsAction = i.status === "ready_for_client_review";
                
                return (
                  <div key={i.id} className={`bg-white rounded-xl border shadow-sm p-3 sm:p-4 flex flex-col justify-between transition ${needsAction ? "border-amber-300 ring-1 ring-amber-500/20" : "border-gray-200"}`}>
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[9px] font-bold text-[#B89416] uppercase tracking-wider">{i.area}</div>
                          <div className="text-xs font-bold text-[#252A2A] leading-tight mt-0.5">{i.check_text_snapshot}</div>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border text-center ${ui.color}`}>
                          {ui.label}
                        </span>
                      </div>

                      <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg mb-2">
                        <div className="text-[8px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Your Complaint</div>
                        <div className="text-[11px] text-red-900 font-medium">"{i.description}"</div>
                      </div>

                      {/* Display assigned team member & target date to client */}
                      {(i.assigned_to || i.target_date) && (
                        <div className="flex flex-wrap items-center gap-3 text-[9px] font-medium text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2">
                          {i.assigned_to && (
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-[#B89416]" />
                              <span>Assigned: <strong className="text-gray-800">{i.assigned_to}</strong></span>
                            </div>
                          )}
                          {i.target_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#B89416]" />
                              <span>Fix Target: <strong className="text-gray-800">{fmtDate(i.target_date)}</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* NEW: Admin's Resolution Notes & Images directly on the card */}
                      {(i.resolution_remark || i.resolution_photos?.length > 0) && (
                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg mb-2">
                          <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Team's Resolution</div>
                          {i.resolution_remark && <div className="text-[11px] text-emerald-900 font-medium mb-1">"{i.resolution_remark}"</div>}
                          {i.resolution_photos?.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
                              {i.resolution_photos.map((p, idx) => (
                                <a key={idx} href={resolveMediaUrl(p)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded border border-emerald-200 shrink-0">
                                  <img src={resolveMediaUrl(p)} alt="resolution" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-[9px] text-gray-400 font-medium">
                        Raised: {fmtDate(i.raised_at)}
                      </div>
                      
                      {needsAction ? (
                        <button onClick={() => { setSelectedIssue(i); setRemark(""); setModalType("review_resolution"); }} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold rounded-md shadow-sm flex items-center gap-1 transition animate-pulse">
                          Review Resolution <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      ) : i.status === "client_approved" || i.status === "closed" ? (
                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Accepted</span>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 italic">Project team working on it</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: REVIEW RESOLUTION (ISSUES TAB) */}
      {modalType === "review_resolution" && selectedIssue && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 font-['Poppins']">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-sm font-bold text-[#252A2A]">Review Resolution</h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
                <div className="text-[9px] font-bold uppercase text-red-500 mb-0.5">Original Issue</div>
                <div className="text-[11px] font-bold text-red-900">"{selectedIssue.description}"</div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1.5">Team's Resolution Details</div>
                <p className="text-xs font-medium text-emerald-900 mb-2">{selectedIssue.resolution_remark || "Rectification complete."}</p>
                {selectedIssue.resolution_photos?.length > 0 && (
                  <div>
                    <div className="text-[8px] font-bold uppercase text-emerald-600 mb-1">Proof Photos</div>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {selectedIssue.resolution_photos.map((p, idx) => (
                        <a key={idx} href={resolveMediaUrl(p)} target="_blank" rel="noreferrer" className="w-12 h-12 rounded border border-emerald-200 shrink-0">
                          <img src={resolveMediaUrl(p)} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Your Feedback (Optional)</label>
                <textarea 
                  rows="2" value={remark} onChange={e => setRemark(e.target.value)}
                  placeholder="Leave a note for the team..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-[11px] focus:border-[#B89416] outline-none resize-none bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end shrink-0 gap-2">
              <button 
                onClick={() => handleReviewResolution(false)} disabled={submitting} 
                className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition shadow-sm w-full sm:w-auto text-center"
              >
                Reject Fix
              </button>
              <button 
                onClick={() => handleReviewResolution(true)} disabled={submitting} 
                className="px-4 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Accept Fix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getIssueStatusUI(status) {
  switch (status) {
    case "open": return { label: "Raised", color: "bg-red-50 text-red-700 border-red-200" };
    case "in_progress": return { label: "Fix In Progress", color: "bg-[#B89416]/10 text-[#B89416] border-[#B89416]/20" };
    case "ready_for_client_review": return { label: "Ready for Your Review", color: "bg-amber-100 text-amber-800 border-amber-300" };
    case "client_approved": return { label: "Resolution Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "closed": return { label: "Closed", color: "bg-gray-100 text-gray-700 border-gray-300" };
    default: return { label: "Pending", color: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}