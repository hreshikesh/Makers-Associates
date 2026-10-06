import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, Trash2, X, Wallet, Users, Home as HomeIcon, Cpu, Sparkles, User, Phone, Mail, MapPin, Link as LinkIcon, StickyNote, FileDown } from "lucide-react";
import { Link } from "react-router-dom";

const BUDGET_LABELS = { value: "Value", balanced: "Balanced", premium: "Premium", luxury: "Luxury" };
const FAMILY_LABELS = { "1-2": "1–2 members", "3-4": "3–4 members", "5+": "5+ members" };
const SMART_LABELS = { no: "Standard", basic: "Basic Smart", full: "Full Automation" };
const STATUS_LABELS = { new: "New", contact_captured: "Contact Captured", converted: "Converted", closed: "Closed" };
const STATUS_COLORS = {
  new: "bg-brand-orange/10 text-brand-orange",
  contact_captured: "bg-amber-500/10 text-amber-600",
  converted: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-slate-200 text-slate-600",
};

export default function AdminQuizSubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.listQuizSubmissions();
      setItems(list);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = filter ? items.filter((i) => i.status === filter) : items;

  const updateStatus = async (id, status) => {
    await adminApi.updateQuizSubmission(id, { status });
    toast.success("Updated");
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };
  const saveNotes = async (id, notes) => {
    await adminApi.updateQuizSubmission(id, { notes });
    toast.success("Notes saved");
    if (selected?.id === id) setSelected({ ...selected, notes });
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this quiz submission?")) return;
    await adminApi.removeQuizSubmission(id);
    toast.success("Deleted");
    if (selected?.id === id) setSelected(null);
    load();
  };

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="section-eyebrow">CRM</div>
          <h1 className="mt-2 text-brand-navy font-bold">Quiz Submissions</h1>
          <p className="text-sm text-brand-navy/60 mt-1">See what every visitor picked in the Find-My-Package quiz.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contact_captured">Contact Captured</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={load} className="btn-ghost text-sm py-2 px-4"><RefreshCcw className="w-4 h-4" /> Refresh</button>
          <a
            href={adminApi.exports.quizUrl()}
            target="_blank"
            rel="noreferrer"
            data-testid="quiz-export-csv"
            className="btn-ghost text-sm py-2 px-4"
          >
            <FileDown className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "", label: "Total", count: items.length },
          { key: "new", label: "New", count: items.filter(i => i.status === "new").length },
          { key: "contact_captured", label: "Contact Captured", count: items.filter(i => i.status === "contact_captured").length },
          { key: "converted", label: "Converted (Lead)", count: items.filter(i => i.status === "converted").length },
        ].map((s) => (
          <button key={s.label} onClick={() => setFilter(s.key)} className={`text-left rounded-2xl bg-white border p-4 transition ${filter === s.key ? "border-brand-orange shadow-glow" : "border-black/5 shadow-soft"}`}>
            <div className="text-2xl font-bold text-brand-navy">{s.count}</div>
            <div className="text-xs text-brand-navy/60">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-black/5 shadow-soft overflow-hidden overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_120px_80px] gap-3 px-4 py-3 text-xs uppercase tracking-widest text-brand-navy/50 border-b border-black/5">
            <div>Answers</div>
            <div>Recommended</div>
            <div>Contact</div>
            <div>Homes shortlisted</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-brand-navy/60">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-brand-navy/60">No quiz submissions yet.</div>
          ) : (
            filtered.map((it) => (
              <div key={it.id} className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_120px_80px] gap-3 px-4 py-3 items-center border-b border-black/5 last:border-0 text-sm hover:bg-brand-bg/40 cursor-pointer" onClick={() => setSelected(it)} data-testid={`quiz-row-${it.id}`}>
                <div className="text-xs text-brand-navy/80 space-y-0.5">
                  <div className="inline-flex items-center gap-1"><Wallet className="w-3 h-3 text-brand-orange" /> {BUDGET_LABELS[it.budget] || it.budget}</div>
                  <span className="mx-1 text-brand-navy/30">·</span>
                  <span><Users className="inline w-3 h-3 text-brand-orange" /> {FAMILY_LABELS[it.family_size] || it.family_size}</span>
                  <span className="mx-1 text-brand-navy/30">·</span>
                  <span><HomeIcon className="inline w-3 h-3 text-brand-orange" /> {it.style || "—"}</span>
                  <span className="mx-1 text-brand-navy/30">·</span>
                  <span><Cpu className="inline w-3 h-3 text-brand-orange" /> {SMART_LABELS[it.smart_home] || it.smart_home}</span>
                </div>
                <div>
                  <div className="font-semibold text-brand-navy">{it.recommended_package_name || "—"}</div>
                  <div className="text-[10px] text-brand-navy/50">score {it.score ?? "—"}</div>
                </div>
                <div className="text-xs text-brand-navy/80">
                  {it.contact_name ? (
                    <div>
                      <div className="font-semibold">{it.contact_name}</div>
                      <div className="text-[10px] text-brand-navy/50">{it.contact_phone}</div>
                    </div>
                  ) : <span className="text-brand-navy/40">anonymous</span>}
                </div>
                <div className="text-[11px] text-brand-navy/70 truncate">
                  {(it.shortlisted_home_names || []).join(", ") || "—"}
                </div>
                <div>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${STATUS_COLORS[it.status] || STATUS_COLORS.new}`}>
                    {STATUS_LABELS[it.status] || it.status}
                  </span>
                </div>
                <div className="text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => remove(it.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 grid place-items-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-end">
            <div className="absolute inset-0 bg-brand-navy/50" onClick={() => setSelected(null)} />
            <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} transition={{ type: "spring", damping: 24, stiffness: 260 }} className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-premium">
              <div className="p-5 border-b border-black/5 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <div className="section-eyebrow">Quiz Submission</div>
                  <div className="font-semibold text-brand-navy">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full grid place-items-center hover:bg-brand-navy/5"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-2">What they picked</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <PickRow icon={Wallet} label="Budget" value={BUDGET_LABELS[selected.budget] || selected.budget} />
                    <PickRow icon={Users} label="Family size" value={FAMILY_LABELS[selected.family_size] || selected.family_size} />
                    <PickRow icon={HomeIcon} label="Style" value={selected.style || "—"} />
                    <PickRow icon={Cpu} label="Smart home" value={SMART_LABELS[selected.smart_home] || selected.smart_home} />
                  </div>
                </div>

                <div className="rounded-2xl bg-brand-bg p-4">
                  <div className="text-[11px] uppercase tracking-widest text-brand-navy/50">Recommended package</div>
                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-brand-navy">{selected.recommended_package_name || "—"}</div>
                      <div className="text-xs text-brand-navy/60">Score: {selected.score ?? "—"}</div>
                    </div>
                    {selected.recommended_package_slug && (
                      <Link to={`/packages/${selected.recommended_package_slug}`} target="_blank" className="text-xs text-brand-orange font-semibold hover:underline inline-flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Open
                      </Link>
                    )}
                  </div>
                </div>

                {(selected.shortlisted_home_names || []).length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-2">Shortlisted homes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(selected.shortlisted_home_slugs || []).map((slug, i) => (
                        <Link key={slug} to={`/homes/${slug}`} target="_blank" className="text-xs px-2.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange font-semibold hover:bg-brand-orange/15">
                          {selected.shortlisted_home_names?.[i] || slug}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-2">Contact</div>
                  {selected.contact_name ? (
                    <div className="rounded-2xl border border-black/5 p-4 space-y-2 text-sm">
                      <InfoLine icon={User} value={selected.contact_name} />
                      <InfoLine icon={Phone} value={selected.contact_phone} />
                      <InfoLine icon={Mail} value={selected.contact_email} />
                      <InfoLine icon={MapPin} value={selected.contact_city} />
                      {selected.converted_to_lead_id && (
                        <div className="pt-2 border-t border-black/5">
                          <Link to="/admin/leads" className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> Linked to Lead ({selected.converted_to_lead_id.slice(0, 8)}…)
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-brand-navy/50 italic">Anonymous — visitor hasn't shared contact yet.</div>
                  )}
                </div>

                <div>
                  <label className="block">
                    <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-1 flex items-center gap-1"><StickyNote className="w-3 h-3" /> Sales notes</div>
                    <textarea
                      defaultValue={selected.notes || ""}
                      onBlur={(e) => saveNotes(selected.id, e.target.value)}
                      placeholder="Add follow-up notes for the team…"
                      rows={4}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm resize-y"
                    />
                  </label>
                  <div className="text-[10px] text-brand-navy/40 mt-1">Notes save when you click outside the box.</div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-2">Status</div>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
                  >
                    <option value="new">New</option>
                    <option value="contact_captured">Contact Captured</option>
                    <option value="converted">Converted (Lead created)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PickRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-black/5 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-navy/50"><Icon className="w-3 h-3" /> {label}</div>
      <div className="mt-1 font-semibold text-brand-navy capitalize">{value}</div>
    </div>
  );
}

function InfoLine({ icon: Icon, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-brand-navy/80">
      <Icon className="w-3.5 h-3.5 text-brand-navy/40" /> {value}
    </div>
  );
}
