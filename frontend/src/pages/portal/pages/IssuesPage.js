import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";
import { 
  AlertTriangle, Clock, CheckCircle2, X, 
  ArrowRight, Loader2, UserCheck, Calendar
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
};

export default function IssuesPage() {
  const { project, refreshProject } = usePortal();
  
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const issues = project?.issues || [];

  const handleReview = async (isApproved) => {
    setSubmitting(true);
    try {
      await api.post(`/portal/my-project/issues/${selectedIssue.id}/client-review`, {
        approved: isApproved,
        remark: remark
      });
      toast.success(isApproved ? "Resolution Accepted" : "Resolution Rejected");
      await refreshProject?.();
      setSelectedIssue(null);
      setRemark("");
    } catch {
      toast.error("Failed to submit decision");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusUI = (status) => {
    switch (status) {
      case "open": return { label: "Raised", color: "bg-red-50 text-red-700 border-red-200" };
      case "in_progress": return { label: "Fix In Progress", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "ready_for_client_review": return { label: "Ready for Your Review", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "client_approved": return { label: "Resolution Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "closed": return { label: "Closed", color: "bg-gray-100 text-gray-700 border-gray-300" };
      default: return { label: "Pending", color: "bg-gray-50 text-gray-600 border-gray-200" };
    }
  };

  if (!project) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] font-['Poppins'] bg-[#F5F6F8] p-4 sm:p-6 lg:px-20 overflow-y-auto">
      
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#252A2A]">Quality Issues</h1>
        <p className="text-xs text-gray-500 mt-1">Track assigned owners, target fix dates, and verify resolutions for issues you raised.</p>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#252A2A]">No Issues Raised</h3>
          <p className="text-xs text-gray-500 mt-1">You haven't raised any quality issues yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.map((i) => {
            const ui = getStatusUI(i.status);
            const needsAction = i.status === "ready_for_client_review";
            
            return (
              <div key={i.id} className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col justify-between transition ${needsAction ? "border-amber-300 ring-2 ring-amber-500/20" : "border-gray-200"}`}>
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-wider">{i.area}</div>
                      <div className="text-sm font-bold text-[#252A2A] leading-tight mt-0.5">{i.check_text_snapshot}</div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-center ${ui.color}`}>
                      {ui.label}
                    </span>
                  </div>

                  {/* Complaint Box */}
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-3">
                    <div className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1">Your Complaint</div>
                    <div className="text-xs text-red-900 font-medium">"{i.description}"</div>
                  </div>

                  {/* PRD REQUIREMENT: Show Client Assigned Person & Target Date */}
                  {(i.assigned_to || i.target_date) && (
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-4">
                      {i.assigned_to && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#1A73E8]" />
                          <span>Assigned: <strong className="text-gray-900">{i.assigned_to}</strong></span>
                        </div>
                      )}
                      {i.target_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#B89416]" />
                          <span>Target Fix: <strong className="text-gray-900">{fmtDate(i.target_date)}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[10px] text-gray-400 font-medium">
                    Raised: {fmtDate(i.raised_at)}
                  </div>
                  
                  {needsAction ? (
                    <button 
                      onClick={() => setSelectedIssue(i)}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition animate-pulse"
                    >
                      Review Resolution <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : i.status === "client_approved" || i.status === "closed" ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Resolution Accepted</span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 italic">Project team is working on it</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RESOLUTION REVIEW MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-['Poppins']">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-base font-bold text-[#252A2A]">Review Resolution</h3>
              <button onClick={() => setSelectedIssue(null)} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-5">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="text-[9px] font-bold uppercase text-red-500 mb-1">Original Issue</div>
                <div className="text-sm font-bold text-red-900">"{selectedIssue.description}"</div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="text-[9px] font-bold uppercase text-emerald-600 mb-2">Team's Resolution Details</div>
                <p className="text-sm font-medium text-emerald-900 mb-3">{selectedIssue.resolution_remark || "Rectification complete."}</p>
                {selectedIssue.resolution_photos?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1.5">Proof Photos</div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {selectedIssue.resolution_photos.map((p, idx) => (
                        <a key={idx} href={resolveMediaUrl(p)} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-200 shrink-0">
                          <img src={resolveMediaUrl(p)} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your Feedback (Optional)</label>
                <textarea 
                  rows="2" value={remark} onChange={e => setRemark(e.target.value)}
                  placeholder="Leave a note for the team..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs sm:text-sm focus:border-[#B89416] outline-none resize-none bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0 gap-3">
              <button 
                onClick={() => handleReview(false)} disabled={submitting} 
                className="px-4 py-2.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition shadow-sm w-full sm:w-auto text-center"
              >
                Reject & Send Back
              </button>
              <button 
                onClick={() => handleReview(true)} disabled={submitting} 
                className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Accept Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}