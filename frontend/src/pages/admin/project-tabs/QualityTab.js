import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";
import {
  Plus, Loader2, ShieldCheck, CheckCircle2, AlertTriangle,
  UploadCloud, Trash2, Send, List, History, Pencil, Save, Image as ImageIcon,
  Clock, MessageSquare, X
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const fmtDateTime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return "—"; }
};

export default function QualityTab({ project, onSaved }) {
  const [stageReviews, setStageReviews] = useState(project.quality_stage_reviews || []);
  const [issues, setIssues] = useState(project.issues || []);
  const [legacyInspections, setLegacyInspections] = useState(project.quality_inspections || []);
  const [activeTab, setActiveTab] = useState("prd");

  // Stage State
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [editingStageId, setEditingStageId] = useState(null);
  const [editStageName, setEditStageName] = useState("");

  // Check State
  const [addingCheckTo, setAddingCheckTo] = useState(null);
  const [editingCheck, setEditingCheck] = useState(null);
  const [checkForm, setCheckForm] = useState({ area: "", check_text: "", pm_remark: "", photo_url: "" });

  // Issue Admin State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({ assigned_to: "", target_date: "", status: "in_progress", resolution_remark: "", resolution_photos: [] });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStageReviews(project.quality_stage_reviews || []);
    setIssues(project.issues || []);
    setLegacyInspections(project.quality_inspections || []);
  }, [project]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/admin/projects/${project.id}`);
      setStageReviews(data.quality_stage_reviews || []);
      setIssues(data.issues || []);
      setLegacyInspections(data.quality_inspections || []);
      onSaved?.();
    } catch { toast.error("Failed to refresh data"); }
  };

  // --- STAGE LOGIC (Unchanged from Phase 1) ---
  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    try { await api.post(`/admin/projects/${project.id}/quality-reviews`, { name: newStageName.trim() }); toast.success("Stage created"); setNewStageName(""); setShowAddStage(false); await fetchProject(); } 
    catch { toast.error("Failed to create stage"); }
  };
  const handleRenameStage = async (stageId) => {
    if (!editStageName.trim()) return; setSaving(true);
    try { await api.patch(`/admin/projects/${project.id}/quality-reviews/${stageId}`, { name: editStageName.trim() }); toast.success("Stage renamed"); setEditingStageId(null); await fetchProject(); } 
    catch { toast.error("Rename failed"); } finally { setSaving(false); }
  };
  const handleDeleteStage = async (stageId, isReleased) => {
    if (isReleased) return toast.error("Cannot delete released stage");
    if (!window.confirm("Delete draft stage?")) return;
    try { await api.delete(`/admin/projects/${project.id}/quality-reviews/${stageId}`); toast.success("Deleted"); await fetchProject(); } 
    catch { toast.error("Delete failed"); }
  };
  const handleRelease = async (reviewId, checkCount) => {
    if (checkCount === 0) return toast.error("Add at least one check");
    if (!window.confirm("Release stage to client?")) return;
    try { await api.patch(`/admin/projects/${project.id}/quality-reviews/${reviewId}/release`); toast.success("Released"); await fetchProject(); } 
    catch { toast.error("Release failed"); }
  };

  // --- CHECK LOGIC (Unchanged from Phase 1) ---
  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try { const res = await adminApi.uploadImage(file, "quality"); setCheckForm(prev => ({ ...prev, photo_url: res.url || res.absoluteUrl })); toast.success("Image uploaded"); } 
    catch { toast.error("Upload failed"); } finally { setUploading(false); e.target.value = ""; }
  };
  const openAddCheck = (stageId) => { setAddingCheckTo(stageId); setEditingCheck(null); setCheckForm({ area: "", check_text: "", pm_remark: "", photo_url: "" }); };
  const openEditCheck = (stageId, check) => { setEditingCheck({ stageId, checkId: check.id }); setAddingCheckTo(null); setCheckForm({ area: check.area || "", check_text: check.check_text || "", pm_remark: check.pm_remark || "", photo_url: check.photo_urls?.[0] || "" }); };
  const handleSaveCheck = async () => {
    if (!checkForm.check_text.trim() || !checkForm.area.trim()) return toast.error("Area and Check text required");
    setSaving(true);
    const payload = { area: checkForm.area.trim(), check_text: checkForm.check_text.trim(), pm_remark: checkForm.pm_remark.trim() || "Verified on site.", photo_urls: checkForm.photo_url ? [checkForm.photo_url] : [] };
    try {
      if (editingCheck) await api.patch(`/admin/projects/${project.id}/quality-reviews/${editingCheck.stageId}/checks/${editingCheck.checkId}`, payload);
      else await api.post(`/admin/projects/${project.id}/quality-reviews/${addingCheckTo}/checks`, payload);
      toast.success("Saved"); setEditingCheck(null); setAddingCheckTo(null); await fetchProject();
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };
  const handleDeleteCheck = async (stageId, checkId, isReleased) => {
    if (isReleased) return toast.error("Cannot delete checks on released stage");
    if (!window.confirm("Delete this check?")) return;
    try { await api.delete(`/admin/projects/${project.id}/quality-reviews/${stageId}/checks/${checkId}`); toast.success("Deleted"); await fetchProject(); } 
    catch { toast.error("Delete failed"); }
  };

  // --- ISSUES LOGIC (PHASE 2) ---
  const openIssueModal = (issue) => {
    setSelectedIssue(issue);
    setIssueForm({
      assigned_to: issue.assigned_to || "",
      target_date: issue.target_date || "",
      status: issue.status || "in_progress",
      resolution_remark: issue.resolution_remark || "",
      resolution_photos: issue.resolution_photos || []
    });
  };

  const handleIssuePhotoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, "issues");
      setIssueForm(prev => ({ ...prev, resolution_photos: [...prev.resolution_photos, res.url || res.absoluteUrl] }));
      toast.success("Photo attached");
    } catch { toast.error("Upload failed"); } finally { setUploading(false); e.target.value = ""; }
  };

  const handleSaveIssue = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/projects/${project.id}/issues/${selectedIssue.id}`, issueForm);
      toast.success("Issue updated");
      setSelectedIssue(null);
      await fetchProject();
    } catch { toast.error("Update failed"); } finally { setSaving(false); }
  };

  const handleCloseIssue = async (issueId) => {
    if (!window.confirm("Close this issue completely?")) return;
    try {
      await api.patch(`/admin/projects/${project.id}/issues/${issueId}/close`);
      toast.success("Issue closed");
      await fetchProject();
    } catch(err) { toast.error(err?.response?.data?.detail || "Close failed"); }
  };

  const clientBadge = (status) => {
    switch (status) {
      case "approved": return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case "issue_raised": return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded"><AlertTriangle className="w-3 h-3" /> Issue Raised</span>;
      case "rereview_required": return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"><Clock className="w-3 h-3" /> Re-review</span>;
      default: return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-4 font-['Poppins']">
      
      {/* TABS */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => setActiveTab("prd")} className={`pb-2.5 text-xs font-bold relative ${activeTab === "prd" ? "text-[#252A2A]" : "text-gray-400 hover:text-gray-700"}`}>
          <span className="flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> Stage Reviews</span>
          {activeTab === "prd" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B89416]" />}
        </button>
        <button onClick={() => setActiveTab("issues")} className={`pb-2.5 text-xs font-bold relative flex items-center gap-1.5 ${activeTab === "issues" ? "text-[#252A2A]" : "text-gray-400 hover:text-gray-700"}`}>
          <AlertTriangle className="w-3.5 h-3.5" /> Issues Dashboard
          {issues.filter(i => i.status !== "closed").length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none">{issues.filter(i => i.status !== "closed").length}</span>}
          {activeTab === "issues" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B89416]" />}
        </button>
        <button onClick={() => setActiveTab("legacy")} className={`pb-2.5 text-xs font-bold relative ${activeTab === "legacy" ? "text-[#252A2A]" : "text-gray-400 hover:text-gray-700"}`}>
          <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Legacy</span>
          {activeTab === "legacy" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B89416]" />}
        </button>
      </div>

      {/* --- TAB 1: STAGE REVIEWS (UNCHANGED) --- */}
      {activeTab === "prd" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-[#252A2A]">Stage-wise Quality Reviews</h3>
              <p className="text-[10px] text-gray-500 font-medium">Build stages → Add verification checks → Release to Client</p>
            </div>
            <button onClick={() => setShowAddStage(true)} className="inline-flex items-center gap-1 px-3 py-2 bg-[#1A73E8] hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Create Stage
            </button>
          </div>

          {showAddStage && (
            <div className="flex flex-col sm:flex-row gap-2 bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <input autoFocus value={newStageName} onChange={(e) => setNewStageName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateStage()} placeholder="Stage Name e.g. Flooring" className="flex-1 px-3 py-2 text-xs border border-blue-200 rounded-lg font-semibold bg-white outline-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowAddStage(false)} className="px-3 py-2 text-[11px] font-bold bg-white border rounded-lg">Cancel</button>
                <button onClick={handleCreateStage} className="px-4 py-2 text-[11px] font-bold bg-[#1A73E8] text-white rounded-lg shadow-sm">Create</button>
              </div>
            </div>
          )}

          {stageReviews.length === 0 && !showAddStage ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-xs text-gray-400"><ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" /> No stages created yet.</div>
          ) : (
            [...stageReviews].reverse().map((stage) => {
              const checks = stage.checks || [];
              const isReleased = stage.status === "released";
              
              return (
                <div key={stage.id} className={`bg-white rounded-xl border overflow-hidden shadow-sm ${isReleased ? "border-gray-200" : "border-amber-200"}`}>
                  <div className={`p-3 flex flex-wrap items-center justify-between gap-2 border-b ${isReleased ? "bg-gray-50/80 border-gray-200" : "bg-amber-50/80 border-amber-200"}`}>
                    <div className="min-w-0 flex-1">
                      {editingStageId === stage.id ? (
                        <div className="flex gap-2 items-center">
                          <input value={editStageName} onChange={(e) => setEditStageName(e.target.value)} className="px-2 py-1 text-xs border rounded-lg font-bold bg-white outline-none" />
                          <button onClick={() => handleRenameStage(stage.id)} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">Save</button>
                          <button onClick={() => setEditingStageId(null)} className="text-[10px] font-bold text-gray-500">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#252A2A]">{stage.name}</h3>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${isReleased ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>{isReleased ? "Released" : "Draft"}</span>
                          <span className="text-[10px] text-gray-500 font-medium">• {checks.length} checks</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isReleased && (
                        <>
                          <button onClick={() => { setEditingStageId(stage.id); setEditStageName(stage.name); }} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm" title="Rename Stage"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteStage(stage.id, isReleased)} className="p-1.5 rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 shadow-sm" title="Delete Draft Stage"><Trash2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleRelease(stage.id, checks.length)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm"><Send className="w-3 h-3" /> Release Stage</button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    {checks.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-x-auto mb-2">
                        <table className="w-full text-left text-[11px] min-w-[720px]">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="p-2 font-bold text-gray-500 w-16">Photo</th>
                              <th className="p-2 font-bold text-gray-500">Quality Check</th>
                              <th className="p-2 font-bold text-gray-500">Area</th>
                              <th className="p-2 font-bold text-gray-500">PM Remark</th>
                              {isReleased && <th className="p-2 font-bold text-gray-500">Client Response</th>}
                              {!isReleased && <th className="p-2 font-bold text-gray-500 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {checks.map((c) => {
                              const isLocked = isReleased && c.client_status !== "pending_review";
                              return (
                                <tr key={c.id} className="hover:bg-gray-50 align-top">
                                  <td className="p-2">{c.photo_urls?.[0] ? <a href={resolveMediaUrl(c.photo_urls[0])} target="_blank" rel="noreferrer"><img src={resolveMediaUrl(c.photo_urls[0])} alt="" className="w-10 h-10 object-cover rounded border border-gray-200" /></a> : <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300" /></div>}</td>
                                  <td className="p-2 font-bold text-[#252A2A]">{c.check_text}</td>
                                  <td className="p-2 text-[#1A73E8] font-semibold">{c.area}</td>
                                  <td className="p-2 text-gray-600 max-w-[200px] truncate">{c.pm_remark}</td>
                                  {isReleased && (
                                    <td className="p-2">
                                      {clientBadge(c.client_status)}
                                      {c.client_remark && <div className="text-[10px] text-gray-600 italic mt-1 line-clamp-2"><MessageSquare className="w-2.5 h-2.5 inline mr-1 text-gray-400" />“{c.client_remark}”</div>}
                                      {c.open_issue_id && <div className="text-[9px] font-bold text-red-600 mt-1 cursor-pointer hover:underline" onClick={() => setActiveTab("issues")}>Issue: {c.open_issue_id}</div>}
                                    </td>
                                  )}
                                  {!isReleased && (
                                    <td className="p-2 text-right whitespace-nowrap">
                                      {isLocked ? <span className="text-[9px] font-bold text-gray-400 italic bg-gray-100 px-2 py-1 rounded">Locked</span> : (
                                        <>
                                          <button onClick={() => openEditCheck(stage.id, c)} className="p-1 text-gray-500 hover:text-blue-600 mr-1" title="Edit Check"><Pencil className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => handleDeleteCheck(stage.id, c.id, isReleased)} className="p-1 text-gray-500 hover:text-red-600" title="Delete Check"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Add/Edit Check Form */}
                    {!isReleased && (addingCheckTo === stage.id || editingCheck?.stageId === stage.id) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3 mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Area / Room *</label><input value={checkForm.area} onChange={(e) => setCheckForm({ ...checkForm, area: e.target.value })} placeholder="e.g. Living Room" className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white" /></div>
                          <div><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Check Description *</label><input value={checkForm.check_text} onChange={(e) => setCheckForm({ ...checkForm, check_text: e.target.value })} placeholder="e.g. Tile alignment" className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white" /></div>
                          <div className="sm:col-span-2"><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">PM Remark</label><input value={checkForm.pm_remark} onChange={(e) => setCheckForm({ ...checkForm, pm_remark: e.target.value })} placeholder="Checked on site." className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white" /></div>
                          <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 shadow-sm">
                              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B89416]" /> : <UploadCloud className="w-3.5 h-3.5 text-gray-500" />}
                              {checkForm.photo_url ? "Replace Photo" : "Upload Evidence Photo"}
                              <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} disabled={uploading} />
                            </label>
                            {checkForm.photo_url && (
                              <div className="flex items-center gap-2">
                                <img src={resolveMediaUrl(checkForm.photo_url)} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
                                <button type="button" onClick={() => setCheckForm({ ...checkForm, photo_url: "" })} className="text-[10px] font-bold text-red-600 hover:underline">Remove</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                          <button type="button" onClick={() => { setAddingCheckTo(null); setEditingCheck(null); }} className="px-3 py-1.5 text-[10px] font-bold text-gray-600">Cancel</button>
                          <button type="button" onClick={handleSaveCheck} disabled={saving} className="px-4 py-1.5 text-[10px] font-bold bg-[#252A2A] hover:bg-[#B89416] text-white rounded-lg flex items-center gap-1 transition shadow-sm">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}{editingCheck ? "Update Check" : "Save Check"}
                          </button>
                        </div>
                      </div>
                    )}
                    {!isReleased && addingCheckTo !== stage.id && editingCheck?.stageId !== stage.id && (
                      <button onClick={() => openAddCheck(stage.id)} className="text-[11px] font-bold text-[#1A73E8] hover:text-blue-800 flex items-center gap-1 mt-1"><Plus className="w-3.5 h-3.5" /> Add Quality Check Item</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- TAB 2: ISSUES BOARD (PHASE 2) --- */}
      {activeTab === "issues" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-[#252A2A]">Issues Lifecycle Board</h3>
            </div>
            
            {issues.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 italic">No issues raised by client yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-bold text-gray-500">Issue ID / Date</th>
                      <th className="p-3 font-bold text-gray-500">Check / Area</th>
                      <th className="p-3 font-bold text-gray-500">Client Description</th>
                      <th className="p-3 font-bold text-gray-500 text-center">Lifecycle Status</th>
                      <th className="p-3 font-bold text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {issues.map((i) => (
                      <tr key={i.id} className="align-top hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-mono font-bold text-gray-500">{i.id}</div>
                          <div className="text-[9px] text-gray-400 mt-1">{fmtDateTime(i.raised_at)}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#252A2A]">{i.check_text_snapshot}</div>
                          <div className="text-[#1A73E8] font-semibold text-[10px] mt-0.5">{i.area}</div>
                        </td>
                        <td className="p-3 text-gray-700 max-w-[240px]">
                          <div className="italic line-clamp-2 bg-red-50 border border-red-100 p-1.5 rounded text-[10px]">“{i.description}”</div>
                          {i.photos?.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {i.photos.slice(0,3).map((p, idx) => <a key={idx} href={resolveMediaUrl(p)} target="_blank" rel="noreferrer"><img src={resolveMediaUrl(p)} alt="" className="w-8 h-8 rounded border border-gray-300 object-cover" /></a>)}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {i.status === "open" && <span className="inline-flex px-2 py-1 rounded bg-red-100 text-red-800 font-bold text-[9px] uppercase border border-red-200">Open (New)</span>}
                          {i.status === "in_progress" && <span className="inline-flex px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold text-[9px] uppercase border border-blue-200">In Progress</span>}
                          {i.status === "ready_for_client_review" && <span className="inline-flex px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold text-[9px] uppercase border border-amber-200">Awaiting Client</span>}
                          {i.status === "client_approved" && <span className="inline-flex px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase border border-emerald-200">Client Approved</span>}
                          {i.status === "closed" && <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-800 font-bold text-[9px] uppercase border border-gray-300">Closed</span>}
                          
                          {/* Client Re-review remark */}
                          {i.client_review_status === "not_approved" && (
                            <div className="mt-1 text-[9px] text-red-600 font-bold">Client Rejected Fix!</div>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button onClick={() => openIssueModal(i)} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-[#252A2A] rounded text-[10px] font-bold transition shadow-sm">
                            Manage Issue
                          </button>
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

      {/* --- TAB 3: LEGACY AUDITS --- */}
      {activeTab === "legacy" && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 animate-in fade-in">
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Legacy isolated audits.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {legacyInspections.map((insp) => (
              <div key={insp.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
                <div className="font-bold text-[#252A2A]">{insp.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{insp.category} • {insp.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUES MANAGEMENT MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-sm font-bold text-[#252A2A]">Manage Issue: {selectedIssue.id}</h3>
              <button onClick={() => setSelectedIssue(null)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                <div className="text-[9px] font-bold uppercase text-red-400 mb-1">Client Original Complaint</div>
                <div className="text-xs font-bold text-red-900">"{selectedIssue.description}"</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assigned To</label>
                  <input value={issueForm.assigned_to} onChange={e=>setIssueForm({...issueForm, assigned_to: e.target.value})} placeholder="e.g. John (Contractor)" className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Date</label>
                  <input type="date" value={issueForm.target_date} onChange={e=>setIssueForm({...issueForm, target_date: e.target.value})} className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select value={issueForm.status} onChange={e=>setIssueForm({...issueForm, status: e.target.value})} className="w-full px-3 py-2 text-xs font-bold border rounded-lg outline-none cursor-pointer">
                    <option value="open">Open (New)</option>
                    <option value="in_progress">In Progress (Rectifying)</option>
                    <option value="ready_for_client_review">Ready for Client Review (Fixed)</option>
                    {selectedIssue.status === "client_approved" && <option value="client_approved" disabled>Client Approved (Awaiting Close)</option>}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Resolution Remark (For Client)</label>
                  <textarea rows="2" value={issueForm.resolution_remark} onChange={e=>setIssueForm({...issueForm, resolution_remark: e.target.value})} placeholder="Describe how it was fixed..." className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-blue-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Resolution Photos</label>
                  <div className="flex gap-2 flex-wrap">
                    {issueForm.resolution_photos.map((p, i) => (
                      <div key={i} className="relative w-12 h-12 rounded border overflow-hidden">
                        <img src={resolveMediaUrl(p)} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setIssueForm(prev => ({...prev, resolution_photos: prev.resolution_photos.filter((_, idx)=>idx!==i)}))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                    <label className="w-12 h-12 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Plus className="w-4 h-4 text-gray-400" />}
                      <input type="file" className="hidden" onChange={handleIssuePhotoUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Client Re-Review Feedback */}
              {selectedIssue.client_reviewed_at && (
                <div className={`p-3 rounded-lg border ${selectedIssue.client_review_status === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <div className="text-[10px] font-bold uppercase mb-1 text-gray-500">Client Response on Resolution</div>
                  <div className="text-xs font-bold text-[#252A2A]">Decision: {selectedIssue.client_review_status === "approved" ? "Approved" : "Not Approved"}</div>
                  {selectedIssue.client_review_remark && <div className="text-[10px] italic mt-1 text-gray-600">"{selectedIssue.client_review_remark}"</div>}
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between shrink-0">
              {selectedIssue.status === "client_approved" ? (
                <button onClick={() => { handleCloseIssue(selectedIssue.id); setSelectedIssue(null); }} className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black transition shadow-sm">
                  Close Issue
                </button>
              ) : <div/>}
              <div className="flex gap-2">
                <button onClick={() => setSelectedIssue(null)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                <button onClick={handleSaveIssue} disabled={saving} className="px-6 py-2 text-xs font-bold bg-[#1A73E8] hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition shadow-sm">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Updates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}