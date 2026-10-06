import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Save, Wrench, FileText } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export default function MaintenanceTab({ project, onSaved }) {
  const [saving, setSaving] = useState(false);
  const tickets = project.maintenance_tickets || [];

  const [wForm, setWForm] = useState({
    warranty_start_date: project.warranty_start_date ? new Date(project.warranty_start_date).toISOString().split("T")[0] : "",
    warranty_years: project.warranty_years || 1,
  });

  const saveWarranty = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/projects/${project.id}/warranty`, {
        warranty_start_date: wForm.warranty_start_date || null,
        warranty_years: Number(wForm.warranty_years)
      });
      toast.success("Warranty settings saved!");
      onSaved();
    } catch { toast.error("Update failed"); } finally { setSaving(false); }
  };

  const updateTicket = async (ticketId, status, notes) => {
    try {
      await api.put(`/admin/projects/${project.id}/maintenance/${ticketId}`, { status, admin_notes: notes });
      toast.success("Ticket updated & client notified");
      onSaved();
    } catch { toast.error("Failed to update ticket"); }
  };

  return (
    <div className="space-y-6">
      
      {/* Warranty Card */}
      <div className="bg-white rounded-xl border border-black/5 p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-black/5 pb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-[#000F1B]">Post-Handover Warranty</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Handover Date (Start)</label>
            <input type="date" value={wForm.warranty_start_date} onChange={e => setWForm({ ...wForm, warranty_start_date: e.target.value })} className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#FF6600] outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#111111]/60">Duration (Years)</label>
            <select value={wForm.warranty_years} onChange={e => setWForm({ ...wForm, warranty_years: e.target.value })} className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#FF6600] outline-none bg-white">
              <option value={1}>1 Year</option><option value={2}>2 Years</option><option value={5}>5 Years</option><option value={10}>10 Years</option>
            </select>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-black/5">
          <button onClick={saveWarranty} disabled={saving} className="bg-[#000F1B] hover:bg-emerald-600 transition text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow-sm">
            {saving ? "Saving..." : "Activate / Update Warranty"}
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-black/5 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#000F1B] mb-4 border-b border-black/5 pb-2 flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-600" /> Support Tickets ({tickets.length})</h3>
        
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#111111]/50 italic border border-dashed border-black/10 rounded-xl bg-[#F9FAFB]">No tickets raised by client.</div>
        ) : (
          <div className="space-y-4">
            {tickets.map(t => (
              <div key={t.id} className="bg-[#F9FAFB] border border-black/10 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold bg-white border border-black/10 px-2 py-0.5 rounded text-gray-600 mr-2 shadow-sm">{t.id}</span>
                    <span className="text-sm font-bold text-[#000F1B]">{t.title}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${t.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : t.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{t.status.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-[#111111]/70 mb-4">{t.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-black/5">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider mb-1 text-[#111111]/50">Update Status</label>
                    <select className="w-full border border-black/10 px-3 py-2 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-[#FF6600]" defaultValue={t.status} id={`status-${t.id}`}>
                      <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider mb-1 text-[#111111]/50">Resolution Notes (Visible to Client)</label>
                    <input type="text" defaultValue={t.admin_notes || ""} id={`note-${t.id}`} placeholder="e.g. Technician dispatched..." className="w-full border border-black/10 px-3 py-2 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#FF6600]" />
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <button onClick={() => updateTicket(t.id, document.getElementById(`status-${t.id}`).value, document.getElementById(`note-${t.id}`).value)} className="bg-[#000F1B] hover:bg-emerald-600 transition text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm">Save & Notify Client</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Ensure ShieldCheck is imported if used
import { ShieldCheck } from "lucide-react";