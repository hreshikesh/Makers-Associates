import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, RefreshCw, FileDown } from "lucide-react";

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const l = await adminApi.listLeads();
      setLeads(l);
    } catch (e) {
      toast.error("Failed to load");
      // eslint-disable-next-line no-console
      console.warn("[AdminLeads] load failed", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await adminApi.updateLead(id, { status });
    toast.success("Updated");
    load();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    await adminApi.removeLead(id);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="section-eyebrow">CRM</div>
          <h1 className="mt-2 text-brand-navy font-bold">Leads Inbox</h1>
        </div>
        <button onClick={load} className="btn-ghost text-sm py-2 px-4"><RefreshCw className="w-4 h-4" /> Refresh</button>
        <a
          href={adminApi.exports.leadsUrl()}
          target="_blank"
          rel="noreferrer"
          data-testid="leads-export-csv"
          className="btn-ghost text-sm py-2 px-4"
        >
          <FileDown className="w-4 h-4" /> Export CSV
        </a>
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-black/5 shadow-soft overflow-hidden overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_2fr_120px_100px] gap-3 px-4 py-3 text-xs uppercase tracking-widest text-brand-navy/50 border-b border-black/5">
            <div>Name</div><div>Phone</div><div>Interest</div><div>Message</div><div>Status</div><div></div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-brand-navy/60">Loading…</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-sm text-brand-navy/60">No leads yet.</div>
          ) : (
            leads.map((l) => (
              <div key={l.id} className="grid grid-cols-[1.2fr_1fr_1fr_2fr_120px_100px] gap-3 px-4 py-3 items-center border-b border-black/5 last:border-0 text-sm" data-testid={`lead-row-${l.id}`}>
                <div>
                  <div className="font-semibold text-brand-navy">{l.name}</div>
                  <div className="text-xs text-brand-navy/60">{l.city || "–"}</div>
                </div>
                <div className="text-brand-navy/80">{l.phone}</div>
                <div className="text-xs text-brand-navy/70">
                  {l.interested_home && <div>Home: {l.interested_home}</div>}
                  {l.interested_package && <div>Package: {l.interested_package}</div>}
                  {!l.interested_home && !l.interested_package && <span>–</span>}
                </div>
                <div className="text-xs text-brand-navy/60 truncate">{l.message || "–"}</div>
                <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className="text-xs rounded-lg border border-black/10 px-2 py-1.5 bg-white">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
                <button onClick={() => remove(l.id)} className="text-red-500 hover:bg-red-50 w-8 h-8 rounded-full grid place-items-center"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
