import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";
import { 
  Plus, X, Save, Loader2, Package, UploadCloud, 
  ImageIcon, Trash2, Edit2, Info, Clock, Box, Truck 
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const CATEGORIES = [
  "Civil", "Electrical", "Plumbing", "Flooring", 
  "Sanitary", "Doors & Windows", "Furniture", "Paint", "Others"
];

const getNormalizedStatus = (backendStatus) => {
  const s = (backendStatus || "").toLowerCase();
  if (["delivered", "inspected", "installed"].includes(s)) return "received";
  if (s === "ordered") return "ordered";
  return "planned"; // maps "pending" to "planned"
};

const getStatusConfig = (status) => {
  const norm = getNormalizedStatus(status);
  const map = {
    received: { label: "Received", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: Truck },
    ordered: { label: "Ordered", color: "text-[#B89416] bg-[#B89416]/10 border-[#B89416]/20", icon: Box },
    planned: { label: "Planned", color: "text-gray-600 bg-gray-100 border-gray-200", icon: Clock },
  };
  return map[norm] || map.planned;
};

export default function MaterialsTab({ project, onSaved }) {
  const [materials, setMaterials] = useState(project.materials || []);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [form, setForm] = useState({ 
    category: "Civil", item_name: "", brand: "", grade_spec: "", 
    quantity: "", unit: "Nos", unit_price: "", status: "pending", 
    payment_status: "pending", photo_url: "", notes: "" 
  });

  useEffect(() => { setMaterials(project.materials || []); }, [project]);

  const fetchProject = async () => {
    try { 
      const { data } = await api.get(`/admin/projects/${project.id}`); 
      setMaterials(data.materials || []); 
      onSaved(); 
    } catch { toast.error("Failed to refresh"); }
  };

  const openNew = () => {
    setEditId(null);
    setForm({ 
      category: "Civil", item_name: "", brand: "", grade_spec: "", 
      quantity: "", unit: "Nos", unit_price: "", status: "pending", 
      payment_status: "pending", photo_url: "", notes: "" 
    });
    setShowForm(true);
  };

  const openEdit = (mat) => { 
    setEditId(mat.id); 
    setForm({ ...mat }); 
    setShowForm(true); 
  };

  const saveMaterial = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        quantity: Number(form.quantity) || 0, 
        unit_price: Number(form.unit_price) || 0 
      };
      if (editId) {
        await api.put(`/admin/projects/${project.id}/materials/${editId}`, payload);
        toast.success("Material updated");
      } else {
        await api.post(`/admin/projects/${project.id}/materials`, payload);
        toast.success("Material logged");
      }
      setShowForm(false); 
      await fetchProject();
    } catch { 
      toast.error("Failed to save material"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; 
    if (!file) return; 
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, "materials");
      setForm(prev => ({ ...prev, photo_url: res.url }));
      toast.success("Photo attached!");
    } catch { 
      toast.error("Upload failed"); 
    } finally { 
      setUploading(false); 
      e.target.value = ""; 
    }
  };

  const deleteMat = async (id) => {
    if (!window.confirm("Delete this material log?")) return;
    try { 
      await api.delete(`/admin/projects/${project.id}/materials/${id}`); 
      toast.success("Deleted"); 
      await fetchProject(); 
    } catch { 
      toast.error("Delete failed"); 
    }
  };

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {!showForm && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-5 rounded-xl border border-gray-200 shadow-sm gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#252A2A]">Procurement & Materials Log</h3>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">Manage materials, costs, and track deliveries for this project.</p>
          </div>
          <button onClick={openNew} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#1A73E8] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-sm">
            <Plus className="w-4 h-4" /> Log New Material
          </button>
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-[#252A2A] flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              {editId ? "Edit Material Record" : "Log New Material"}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-white border border-gray-200 grid place-items-center hover:bg-gray-100 transition shadow-sm"><X className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>

          <form onSubmit={saveMaterial} className="p-5 sm:p-6 space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">Material / Item Name *</label>
                    <input type="text" required value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Floor Tiles, TMT Steel" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-bold shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer shadow-sm focus:border-[#1A73E8] outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">Status (Client Visible)</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 bg-white shadow-sm focus:border-[#1A73E8] outline-none">
                      <option value="pending">Planned (Not Ordered)</option>
                      <option value="ordered">Ordered</option>
                      <option value="delivered">Delivered (Received)</option>
                      <option value="inspected">Inspected (Received)</option>
                      <option value="installed">Installed (Received)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">Brand</label>
                    <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:border-[#1A73E8] outline-none" placeholder="e.g. Kajaria, Tata" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">Specification / Size</label>
                    <input type="text" value={form.grade_spec} onChange={e => setForm({ ...form, grade_spec: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:border-[#1A73E8] outline-none" placeholder="e.g. 800x800mm, Fe 500D" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Internal Costing (Hidden from Client)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-700/70">Quantity</label>
                      <div className="flex gap-2">
                        <input type="number" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm font-bold shadow-sm outline-none" placeholder="0" />
                        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-20 px-2 py-1.5 border border-blue-200 rounded-lg text-xs bg-white shadow-sm outline-none">
                          <option>Nos</option><option>sq.ft</option><option>kg</option><option>ton</option><option>bags</option><option>litres</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-700/70">Unit Price (₹)</label>
                      <input type="number" required value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm font-bold text-emerald-600 shadow-sm outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-700/70">Payment</label>
                      <select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })} className="w-full px-2 py-1.5 border border-blue-200 rounded-lg text-xs bg-white shadow-sm outline-none">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-[10px] text-blue-700/70 font-bold uppercase">Total Estimated Cost: </span>
                    <span className="text-sm font-black text-[#252A2A]">₹{((Number(form.quantity)||0) * (Number(form.unit_price)||0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">Client Description / Notes</label>
                  <textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add a description visible to the client..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:border-[#1A73E8] outline-none resize-none" />
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="md:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-3 text-gray-500 w-full text-left">Material Photo</label>
                
                {form.photo_url ? (
                  <div className="relative w-full aspect-square max-h-48 rounded-lg overflow-hidden border border-gray-300 shadow-sm group">
                    <img src={resolveMediaUrl(form.photo_url)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setForm({ ...form, photo_url: "" })} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square max-h-48 rounded-lg bg-white border border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 mb-4">No image uploaded</span>
                    <label className="cursor-pointer bg-white border border-gray-200 hover:border-[#1A73E8] hover:text-[#1A73E8] text-gray-700 rounded-lg px-4 py-2 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm w-full">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Browse File"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-4 leading-relaxed">
                  Upload a photo of the material or delivery receipt. This image will be visible on the client portal.
                </p>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
              <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg bg-[#1A73E8] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Material Record
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Material / Item</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Internal Costing</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status (Client View)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-sm text-gray-400 italic">
                      No materials logged yet. Click "Log New Material" to begin tracking.
                    </td>
                  </tr>
                ) : (
                  materials.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(m => {
                    const conf = getStatusConfig(m.status);
                    
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 grid place-items-center">
                              {m.photo_url ? <img src={resolveMediaUrl(m.photo_url)} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-[#252A2A] text-sm">{m.item_name}</h4>
                              <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{m.brand ? `${m.brand} • ` : ''}{m.grade_spec || "Standard"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{m.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-bold text-emerald-600">₹{(m.unit_price * m.quantity).toLocaleString('en-IN')}</div>
                          <div className="text-[10px] font-medium text-gray-500">{m.quantity} {m.unit} @ ₹{m.unit_price}/{m.unit}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${conf.color}`}>
                              <conf.icon className="w-3 h-3" /> {conf.label}
                            </span>
                            {m.payment_status === "paid" && <span className="text-[9px] font-bold text-blue-600 uppercase">Payment: Paid</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition tooltip" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteMat(m.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition tooltip" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
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