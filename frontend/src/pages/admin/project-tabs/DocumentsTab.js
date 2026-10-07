import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";
import { 
  FileText, UploadCloud, Loader2, Trash2, Plus, X, 
  Pencil, Save, ExternalLink, CheckCircle2 
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const CATEGORIES = ["Drawings", "Contracts & Agreements", "BOQ & Estimates", "Invoices & Payments", "Approvals", "Reports", "Test Certificates", "Warranties", "Manuals", "Government / Statutory", "Handover Documents", "Site Photos", "Other"];
const STATUSES = ["Current", "Approved", "Under Review", "Signed", "Paid", "Passed", "Valid", "Superseded"];

export default function DocumentsTab({ project, onSaved }) {
  const [documents, setDocuments] = useState(project.documents || []);
  
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revisingId, setRevisingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ name: "", category: "Contracts & Agreements", stage: "General", status: "Current", description: "", url: "" });

  useEffect(() => { 
    setDocuments(project.documents || []); 
  }, [project]);

  // Dynamically load stages directly from project object
  const dynamicStages = useMemo(() => {
    if (!project?.stages) return [];
    return project.stages.map(s => s.name).filter(Boolean);
  }, [project]);

  const fetchProject = async () => {
    try { 
      const { data } = await api.get(`/admin/projects/${project.id}`); 
      setDocuments(data.documents || []); 
      onSaved(); 
    } catch { toast.error("Failed to refresh documents"); }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", category: "Contracts & Agreements", stage: "General", status: "Current", description: "", url: "" });
    setShowForm(true);
  };

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return false;
    }
    return true;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; 
    if (!validateFile(file)) {
      e.target.value = ""; 
      return;
    }
    
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, "documents");
      const fileUrl = typeof res === "string" ? res : (res?.url || res?.absoluteUrl || res?.secure_url);
      setForm(prev => ({ ...prev, url: fileUrl }));
      toast.success("File attached");
    } catch { toast.error("Upload failed"); } 
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleSave = async () => {
    if (!form.name.trim() || (!form.url && !editingId)) return toast.error("Name and File are required");
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/admin/projects/${project.id}/documents/${editingId}`, form);
        toast.success("Document updated");
      } else {
        await api.post(`/admin/projects/${project.id}/documents`, form);
        toast.success("Document added");
      }
      setShowForm(false);
      await fetchProject();
    } catch (err) { 
      toast.error(err?.response?.data?.detail || "Save failed"); 
    } 
    finally { setSaving(false); }
  };

  const handleUploadRevision = async (docId, e) => {
    const file = e.target.files?.[0]; 
    if (!validateFile(file)) {
      e.target.value = ""; 
      return;
    }
    
    setRevisingId(docId);
    try {
      const res = await adminApi.uploadImage(file, "documents");
      const fileUrl = typeof res === "string" ? res : (res?.url || res?.absoluteUrl || res?.secure_url);
      
      if (!fileUrl) throw new Error("Upload didn't return a valid URL");

      await api.post(`/admin/projects/${project.id}/documents/${docId}/revision`, { 
        url: fileUrl, 
        status: "Current" 
      });
      
      toast.success("Revision uploaded!");
      await fetchProject();
    } catch (err) { 
      console.error("Revision Error:", err);
      toast.error(err?.response?.data?.detail || err.message || "Revision upload failed"); 
    } 
    finally { setRevisingId(null); e.target.value = ""; }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Permanently delete this document and all revisions?")) return;
    try { await api.delete(`/admin/projects/${project.id}/documents/${docId}`); toast.success("Deleted"); await fetchProject(); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-4 font-['Poppins']">
      {!showForm && (
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-[#252A2A]">Document Vault</h3>
            <p className="text-[10px] text-gray-500">{documents.length} files stored</p>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#252A2A] hover:bg-[#B89416] text-white px-4 py-2 rounded-lg text-[10px] font-bold transition shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm animate-in fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-[#252A2A]">{editingId ? "Edit Document Metadata" : "Upload New Document"}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X className="w-4 h-4"/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2"><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Title *</label><input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none focus:border-[#B89416]" placeholder="e.g. Approved Floor Plan" /></div>
            <div><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Category</label><select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none focus:border-[#B89416] bg-white"><option value="">Select...</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            
            {/* Dynamic Stage Dropdown */}
            <div>
              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Stage</label>
              <select value={form.stage} onChange={e=>setForm({...form, stage: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none focus:border-[#B89416] bg-white">
                <option value="General">General</option>
                {dynamicStages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none focus:border-[#B89416] bg-white">{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="sm:col-span-3"><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Description</label><input value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none focus:border-[#B89416]" placeholder="Optional notes..." /></div>
            {!editingId && (
              <div className="sm:col-span-4 flex items-center gap-3 pt-2">
                <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 shadow-sm">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />} {form.url ? "Replace File" : "Choose File (Max 10MB)"}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                {form.url && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> File Attached</span>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-gray-200">
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={saving || uploading} className="px-5 py-1.5 text-[10px] font-bold bg-[#252A2A] hover:bg-[#B89416] text-white rounded-lg flex items-center gap-1 shadow-sm transition">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editingId ? "Update Metadata" : "Save Document"}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider text-center">Rev</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.length === 0 ? (
                  <tr><td colSpan="7" className="py-10 text-center text-xs text-gray-400">No documents found.</td></tr>
                ) : (
                  [...documents].sort((a,b)=>new Date(b.uploaded_at)-new Date(a.uploaded_at)).map((d) => {
                    const latest = d.versions?.[d.versions.length - 1] || { url: d.url };
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-gray-100 border border-gray-200 grid place-items-center shrink-0">
                              <FileText className="w-3.5 h-3.5 text-[#B89416]" />
                            </div>
                            <div>
                              <div className="font-bold text-[#252A2A] max-w-[180px] truncate" title={d.name}>{d.name}</div>
                              {d.description && <div className="text-[9px] text-gray-500 truncate max-w-[180px]">{d.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{d.category || "General"}</td>
                        <td className="py-2.5 px-3 text-gray-600">{d.stage || "—"}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-500">
                          {d.current_version ? `R0${d.current_version}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${d.status==="Under Review" ? "bg-amber-50 text-amber-700 border-amber-200" : d.status==="Superseded" ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                            {d.status || "Current"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {new Date(d.uploaded_at).toLocaleDateString("en-GB", {day:'2-digit', month:'short', year:'numeric'})}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <a href={resolveMediaUrl(latest.url)} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-blue-600 transition" title="View"><ExternalLink className="w-3.5 h-3.5"/></a>
                            <button onClick={() => { setEditingId(d.id); setForm({ ...d }); setShowForm(true); }} className="p-1.5 text-gray-500 hover:text-emerald-600 transition" title="Edit Meta"><Pencil className="w-3.5 h-3.5"/></button>
                            <label className="p-1.5 text-gray-500 hover:text-[#B89416] transition cursor-pointer" title="Upload Revision">
                              {revisingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5"/>}
                              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleUploadRevision(d.id, e)} disabled={revisingId === d.id} />
                            </label>
                            <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-500 hover:text-red-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}