import React, { useCallback, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import {
  Plus, Trash2, Save, X, Loader2, RefreshCw, Building2, Search,
  Eye, Link as LinkIcon, Pencil
} from "lucide-react";
import SEO from "@/components/site/SEO";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const PR = {
  list: () => api.get("/admin/projects").then(r => r.data),
  create: (body) => api.post("/admin/projects", body).then(r => r.data),
  update: (id, body) => api.put(`/admin/projects/${id}`, body).then(r => r.data),
  remove: (id) => api.delete(`/admin/projects/${id}`).then(r => r.data),
};

// Auto-corrects typed years like 0027 -> 2027 or 0002 -> 2026
const sanitizeDateYear = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-"); // YYYY-MM-DD
  if (parts.length === 3) {
    let year = parseInt(parts[0], 10);
    if (year > 0 && year < 100) {
      year += 2000; // e.g. 26 -> 2026, 27 -> 2027
      return `${year}-${parts[1]}-${parts[2]}`;
    } else if (year >= 100 && year < 1000) {
      const yearStr = String(parts[0]).padStart(4, "0");
      const lastTwo = yearStr.slice(-2);
      return `20${lastTwo}-${parts[1]}-${parts[2]}`;
    }
  }
  return dateStr;
};

export default function AdminProjects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, project: null });
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await PR.list()); }
    catch { toast.error("Failed to load projects"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (row, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${row.title}?`)) return;
    try { await PR.remove(row.id); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter(p =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.customer_name || "").toLowerCase().includes(q) ||
      (p.customer_email || "").toLowerCase().includes(q) ||
      (p.customer_phone || "").toLowerCase().includes(q) ||
      (p.project_code || "").toLowerCase().includes(q) ||
      (p.address || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  if (loading) return (
    <div className="grid place-items-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-[#B89416]" />
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto font-['Poppins'] pb-12">
      <SEO title="Admin Projects" description="Manage projects" canonical="/admin/projects" noindex={true} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs font-semibold text-[#B89416] uppercase tracking-wider">Operations · Project Tracker</div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#252A2A] mt-1">Customer Projects</h1>
          <p className="text-sm text-[#252A2A]/60 mt-1">Click any project to open its full detail workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-4 py-2 text-xs font-semibold text-[#252A2A] bg-white border border-black/10 rounded-xl hover:bg-[#F2F2F2] flex items-center gap-1.5 shadow-sm transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setModalState({ isOpen: true, project: null })} className="inline-flex items-center gap-1.5 rounded-xl bg-[#B89416] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#B89416] transition shadow-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#252A2A]/40" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, project code, or location..."
          className="w-full bg-white border border-black/10 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#B89416] shadow-sm"
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-black/5 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B89416]/10 grid place-items-center mb-4">
            <Building2 className="w-8 h-8 text-[#B89416]" />
          </div>
          <div className="text-lg font-bold text-[#252A2A]">No active projects yet</div>
          <p className="text-sm text-[#252A2A]/60 mt-1 max-w-sm mx-auto">Click "New Project" to convert an accepted proposal into a live project tracker.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[10px] uppercase tracking-wider text-[#252A2A]/50 font-bold border-b border-black/5">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Contract Value</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 w-[180px]">Progress</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(p => {
                  const stages = p.stages || [];
                  const done = stages.filter(s => s.status === "completed").length;
                  const overall = stages.length ? Math.round(stages.reduce((sum, s) => sum + (Number(s.progress_pct) || 0), 0) / stages.length) : 0;
                  const cv = p.contract_value || 0;
                  const paid = p.amount_spent || 0;
                  const pctPaid = cv > 0 ? Math.round((paid / cv) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#F9FAFB] transition cursor-pointer" onClick={() => navigate(`/admin/projects/${p.id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          {p.project_code && (
                            <span className="text-[9px] font-mono font-bold bg-[#F2F2F2] text-[#252A2A] px-1.5 py-0.5 rounded border border-black/5">
                              {p.project_code}
                            </span>
                          )}
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {p.status || "Active"}
                          </span>
                        </div>
                        <div className="font-bold text-[#252A2A] text-sm truncate max-w-[240px]">{p.title}</div>
                        <div className="text-[10px] text-[#252A2A]/50 truncate max-w-[240px] mt-0.5">{p.address || "No location"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#252A2A] truncate max-w-[180px]">{p.customer_name || "—"}</div>
                        <div className="text-[10px] text-[#B89416] font-semibold truncate max-w-[180px]">{p.customer_email}</div>
                        {p.customer_phone && <div className="text-[10px] text-gray-500 font-medium mt-0.5">{p.customer_phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-black text-emerald-600">₹{cv.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-[#252A2A]">₹{paid.toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1 bg-[#F2F2F2] rounded-full overflow-hidden max-w-[100px]">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pctPaid}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600">{pctPaid}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#F2F2F2] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#B89416] to-[#FFA500] rounded-full" style={{ width: `${overall}%` }} />
                          </div>
                          <span className="text-xs font-black text-[#252A2A] w-9 text-right">{overall}%</span>
                        </div>
                        <div className="text-[9px] text-[#252A2A]/50 font-semibold mt-1">{done}/{stages.length} stages done</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${p.id}`); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#252A2A] hover:bg-[#B89416] text-white text-[10px] font-bold rounded-lg transition shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, project: p }); }}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-[#B89416] text-gray-700 hover:text-white grid place-items-center transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => remove(p, e)}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-500 text-red-600 hover:text-white grid place-items-center transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => {
              const stages = p.stages || [];
              const done = stages.filter(s => s.status === "completed").length;
              const overall = stages.length ? Math.round(stages.reduce((sum, s) => sum + (Number(s.progress_pct) || 0), 0) / stages.length) : 0;
              const cv = p.contract_value || 0;
              const paid = p.amount_spent || 0;
              const pctPaid = cv > 0 ? Math.round((paid / cv) * 100) : 0;

              return (
                <div key={p.id} onClick={() => navigate(`/admin/projects/${p.id}`)}
                  className="bg-white rounded-xl border border-black/5 shadow-sm p-4 cursor-pointer hover:shadow-md transition">
                  
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {p.project_code && (
                          <span className="text-[9px] font-mono font-bold bg-[#F2F2F2] text-[#252A2A] px-1.5 py-0.5 rounded border border-gray-200">
                            {p.project_code}
                          </span>
                        )}
                        <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {p.status || "Active"}
                        </span>
                      </div>
                      <div className="font-bold text-[#252A2A] text-sm truncate">{p.title}</div>
                      <div className="text-[10px] text-[#B89416] font-semibold truncate mt-0.5">
                        {p.customer_name} • {p.customer_email} {p.customer_phone && `• ${p.customer_phone}`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, project: p }); }}
                        className="w-7 h-7 rounded-lg bg-gray-100 text-[#252A2A] grid place-items-center shadow-sm"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${p.id}`); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#252A2A] text-white text-[10px] font-bold rounded-lg shadow-sm"
                      >
                        <Eye className="w-3 h-3" /> Open
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] rounded-lg p-2.5 border border-black/5">
                    <div>
                      <div className="text-[8px] font-bold uppercase text-[#252A2A]/50 mb-0.5">Progress</div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#B89416] rounded-full" style={{ width: `${overall}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-[#252A2A]">{overall}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold uppercase text-[#252A2A]/50 mb-0.5">Paid ({pctPaid}%)</div>
                      <div className="text-[10px] font-black text-emerald-600 truncate">₹{paid.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {modalState.isOpen && (
        <ProjectFormModal 
          project={modalState.project} 
          onClose={() => setModalState({ isOpen: false, project: null })} 
          onSaved={() => { setModalState({ isOpen: false, project: null }); load(); }} 
        />
      )}
    </div>
  );
}

// ============================================================================
// DYNAMIC PROJECT FORM MODAL (CREATE & EDIT)
// ============================================================================
function ProjectFormModal({ project, onClose, onSaved }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    customer_email: "", customer_name: "", customer_phone: "", 
    title: "My Home Project", address: "", contract_value: "",
    start_date: "", expected_completion: "", site_lat: "", site_lng: ""
  });
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);

  // Initialize form with project details if in edit mode
  useEffect(() => {
    if (project) {
      setForm({
        customer_email: project.customer_email || "",
        customer_name: project.customer_name || "",
        customer_phone: project.customer_phone || "",
        title: project.title || "",
        address: project.address || "",
        contract_value: project.contract_value ? String(project.contract_value) : "",
        start_date: project.start_date ? String(project.start_date).slice(0, 10) : "",
        expected_completion: project.expected_completion ? String(project.expected_completion).slice(0, 10) : "",
        site_lat: project.site_lat ? String(project.site_lat) : "",
        site_lng: project.site_lng ? String(project.site_lng) : ""
      });
    }
  }, [project]);

  // Load active proposals (only needed for creation workflow)
  useEffect(() => {
    if (isEdit) {
      setLoadingProps(false);
      return;
    }
    adminApi.list("proposals")
      .then(res => {
        if (Array.isArray(res)) setProposals(res.filter(p => p.status === "accepted"));
      })
      .catch(() => console.error("Failed to load proposals"))
      .finally(() => setLoadingProps(false));
  }, [isEdit]);

  const handleProposalSelect = (e) => {
    const propId = e.target.value;
    if (!propId) return;
    const p = proposals.find(x => x.id === propId);
    if (!p) return;

    const baseCost = (Number(p.built_up_area) || 0) * (Number(p.package_price_per_sqft) || 0);
    const addonsCost = (p.addons_selected || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const discount = Number(p.discount_amount) || 0;
    const trueTotal = baseCost + addonsCost - discount;

    setForm(prev => ({
      ...prev,
      quote_id: p.id,
      customer_email: p.client_email?.trim() || prev.customer_email,
      customer_name: p.client_name?.trim() || prev.customer_name,
      customer_phone: p.client_phone ? p.client_phone.replace(/\D/g, "").slice(0, 10) : prev.customer_phone,
      address: p.site_address?.trim() || prev.address,
      contract_value: trueTotal > 0 ? String(trueTotal) : prev.contract_value,
      title: `${p.client_name?.split(" ")[0] || "Client"}'s ${p.package_name || "Home"} Build`,
      start_date: p.expected_start ? String(p.expected_start).slice(0, 10) : prev.start_date,
      expected_completion: p.expected_completion ? String(p.expected_completion).slice(0, 10) : prev.expected_completion
    }));
    toast.success("Client details auto-filled from proposal");
  };

  const handlePhoneChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setForm(prev => ({ ...prev, customer_phone: numericValue }));
  };

  const save = async () => {
    if (!form.customer_email.trim()) { 
      toast.error("Client Email is required"); 
      return; 
    }
    if (form.customer_phone && form.customer_phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return; 
    }
    
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        contract_value: Number(form.contract_value) || 0,
        site_lat: form.site_lat ? Number(form.site_lat) : null,
        site_lng: form.site_lng ? Number(form.site_lng) : null,
        start_date: sanitizeDateYear(form.start_date) || null,
        expected_completion: sanitizeDateYear(form.expected_completion) || null
      };

      if (isEdit) {
        await PR.update(project.id, payload);
        toast.success("Project updated successfully!");
      } else {
        await PR.create(payload);
        toast.success("Live Project Created!");
      }
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#252A2A]/60 backdrop-blur-sm z-[60] grid place-items-center p-4 font-['Poppins']">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#B89416]" />
        
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="font-bold text-[#252A2A] text-xl">
            {isEdit ? "Edit Project Details" : "New Project Tracker"}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[#252A2A]/60 mb-5 shrink-0">
          {isEdit ? "Make necessary alterations to the operational data metrics below." : "Convert an accepted proposal into a live project, or create one from scratch."}
        </p>

        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-4">
          
          {!isEdit && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 shadow-sm">
              <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Auto-Fill from Proposal
              </label>
              {loadingProps ? (
                <div className="text-xs text-blue-600 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              ) : (
                <select onChange={handleProposalSelect} className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-[#252A2A] cursor-pointer outline-none focus:border-blue-500 shadow-sm">
                  <option value="">-- Select Accepted Proposal --</option>
                  {proposals.map(p => {
                    const baseCost = (Number(p.built_up_area) || 0) * (Number(p.package_price_per_sqft) || 0);
                    const addonsCost = (p.addons_selected || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
                    const total = baseCost + addonsCost - (Number(p.discount_amount) || 0);
                    return <option key={p.id} value={p.id}>{p.ref_number} : {p.client_name} (₹{total.toLocaleString('en-IN')})</option>;
                  })}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Project Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm font-bold focus:border-[#B89416] outline-none shadow-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Client Name</label>
              <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#B89416] outline-none shadow-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Client Email *</label>
              <input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#B89416] outline-none shadow-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Client Phone Number (10 Digits)</label>
              <input 
                type="tel" 
                value={form.customer_phone} 
                onChange={handlePhoneChange} 
                maxLength={10}
                placeholder="e.g. 9876543210" 
                className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#B89416] outline-none shadow-sm" 
              />
              <div className="text-[10px] text-gray-400 mt-1">Must be exactly 10 digits without country code</div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Site Location / Address</label>
              <textarea 
                value={form.address} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
                className="w-full rounded-xl border border-black/10 px-3.5 py-2 text-sm focus:border-[#B89416] outline-none shadow-sm min-h-[60px]" 
                placeholder="Enter full physical address details..."
              />
            </div>

            {/* DATE INPUT 1: START DATE */}
            <div>
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Project Start</label>
              <input 
                type="date" 
                min="2020-01-01"
                max="2099-12-31"
                value={form.start_date || ""} 
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                onBlur={e => {
                  const corrected = sanitizeDateYear(e.target.value);
                  if (corrected !== e.target.value) {
                    setForm(prev => ({ ...prev, start_date: corrected }));
                  }
                }}
                onClick={(e) => { try { e.target.showPicker(); } catch {} }}
                className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[#B89416] shadow-sm cursor-pointer" 
              />
            </div>

            {/* DATE INPUT 2: FORECAST COMPLETION */}
            <div>
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Forecast Completion</label>
              <input 
                type="date" 
                min="2020-01-01"
                max="2099-12-31"
                value={form.expected_completion || ""} 
                onChange={e => setForm({ ...form, expected_completion: e.target.value })} 
                onBlur={e => {
                  const corrected = sanitizeDateYear(e.target.value);
                  if (corrected !== e.target.value) {
                    setForm(prev => ({ ...prev, expected_completion: corrected }));
                  }
                }}
                onClick={(e) => { try { e.target.showPicker(); } catch {} }}
                className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[#B89416] shadow-sm cursor-pointer" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#252A2A] uppercase mb-1">Total Contract Value (₹)</label>
              <input 
                type="text" 
                value={form.contract_value} 
                onChange={e => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, "");
                  setForm({ ...form, contract_value: numericValue });
                }} 
                placeholder="0"
                className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm font-bold text-emerald-600 focus:border-[#B89416] outline-none shadow-sm" 
              />
            </div>
            <div className="sm:col-span-2 pt-3 border-t border-black/5 mt-1">
              <div className="text-[11px] font-bold text-[#252A2A] uppercase mb-2">Live Weather Coordinates</div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" value={form.site_lat} onChange={e => setForm({ ...form, site_lat: e.target.value })} placeholder="Latitude (e.g. 12.9716)" className="w-full rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-[#B89416] shadow-sm" />
                <input type="number" step="any" value={form.site_lng} onChange={e => setForm({ ...form, site_lng: e.target.value })} placeholder="Longitude (e.g. 77.5946)" className="w-full rounded-xl border border-black/10 px-3.5 py-2 text-sm outline-none focus:border-[#B89416] shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/5 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#252A2A] hover:bg-[#B89416] text-white px-6 py-2.5 text-sm font-bold transition shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? "Update Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}