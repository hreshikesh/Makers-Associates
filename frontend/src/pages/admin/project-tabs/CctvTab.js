import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, X, Save, Loader2, Video, Trash2 } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export default function CctvTab({ project, onSaved }) {
  const [cameras, setCameras] = useState(project.cctv_cameras || []);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", camera_type: "youtube", url: "", status: "online", location_label: "" });

  useEffect(() => { setCameras(project.cctv_cameras || []); }, [project]);

  const fetchProject = async () => {
    try { const { data } = await api.get(`/admin/projects/${project.id}`); setCameras(data.cctv_cameras || []); onSaved(); } 
    catch { toast.error("Failed to refresh"); }
  };

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", camera_type: "youtube", url: "", status: "online", location_label: "" });
    setShowForm(true);
  };

  const openEdit = (cam) => { setEditId(cam.id); setForm({ ...cam }); setShowForm(true); };

  const saveCamera = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, name: form.name.trim(), url: form.url.trim(), location_label: form.location_label.trim() };
      if (editId) await api.put(`/admin/projects/${project.id}/cameras/${editId}`, payload);
      else await api.post(`/admin/projects/${project.id}/cameras`, payload);
      toast.success("Camera saved"); setShowForm(false); await fetchProject();
    } catch { toast.error("Failed to save camera"); }
    finally { setLoading(false); }
  };

  const deleteCam = async (camId) => {
    if (!window.confirm("Remove this camera?")) return;
    try { await api.delete(`/admin/projects/${project.id}/cameras/${camId}`); toast.success("Camera removed"); await fetchProject(); }
    catch { toast.error("Failed to remove camera"); }
  };

  const toggleStatus = async (camId) => {
    try { await api.patch(`/admin/projects/${project.id}/cameras/${camId}/status`); await fetchProject(); }
    catch { toast.error("Failed to toggle status"); }
  };

  return (
    <div className="space-y-6">
      {!showForm && (
        <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-black/5 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-[#000F1B]">Site Security Feeds</h3>
            <p className="text-[10px] text-[#111111]/50 mt-1">{cameras.length} active cameras</p>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Camera
          </button>
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-[#000F1B]">{editId ? "Edit Camera Stream" : "Connect New Camera Feed"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-black/5 grid place-items-center hover:bg-black/10 transition"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={saveCamera} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Camera Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Front Gate Camera" className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Location / Zone</label><input type="text" value={form.location_label} onChange={e => setForm({ ...form, location_label: e.target.value })} placeholder="e.g. Material Yard" className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Stream Type *</label><select value={form.camera_type} onChange={e => setForm({ ...form, camera_type: e.target.value })} className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none cursor-pointer bg-white"><option value="youtube">YouTube Live Embed</option><option value="iframe">Web Iframe Embed</option><option value="hls">HLS Stream (.m3u8)</option></select></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none cursor-pointer bg-white"><option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option></select></div>
              <div className="sm:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Stream / Embed URL *</label><input type="url" required value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none" /></div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-2">
              <p className="text-[10px] font-semibold text-blue-800 leading-relaxed">
                <strong>Tip:</strong> If using YouTube, provide the embed URL (e.g. <code>https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1</code>). If your NVR outputs HLS, ensure the URL ends in <code>.m3u8</code>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-black/5">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-black/10 bg-white text-xs font-bold text-[#000F1B] hover:bg-[#F2F2F2] transition">Cancel</button>
              <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg bg-[#000F1B] hover:bg-red-600 text-white text-xs font-bold shadow-sm transition disabled:opacity-70 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Camera
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border ${c.status === 'online' ? 'border-red-200 shadow-sm' : 'border-black/10 opacity-80'} p-5 flex flex-col justify-between group transition hover:shadow-md`}>
              <div className="flex justify-between items-start mb-4 border-b border-black/5 pb-4">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`w-10 h-10 rounded-lg ${c.status === 'online' ? 'bg-red-50 border border-red-100 text-red-500' : 'bg-gray-100 border border-gray-200 text-gray-400'} grid place-items-center shrink-0`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#000F1B] text-sm truncate">{c.name}</h4>
                    <p className="text-[9px] font-semibold text-[#111111]/50 truncate uppercase tracking-wider">{c.location_label || "Unassigned"} • {c.camera_type}</p>
                  </div>
                </div>
                <button onClick={() => toggleStatus(c.id)} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider border transition shrink-0 ${c.status === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`} title="Click to toggle status">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  {c.status}
                </button>
              </div>

              <div className="bg-[#F5F6F8] p-2.5 rounded-lg text-[9px] font-mono text-[#111111]/50 truncate mb-4 border border-black/5">{c.url}</div>

              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openEdit(c)} className="px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs font-bold hover:bg-[#000F1B] hover:text-white transition shadow-sm">Edit</button>
                <button onClick={() => deleteCam(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 grid place-items-center hover:bg-red-500 hover:text-white transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}