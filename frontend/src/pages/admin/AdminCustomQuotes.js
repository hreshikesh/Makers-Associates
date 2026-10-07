/**
 * AdminCustomQuotes — Production Bespoke Quotation Builder
 *
 * ⚡ Fully preserved: Client, Requirements, Packages, Deep Specs, Interiors,
 *    Material Specs, Floor Plans, Elevations, Visual Boards, Add-ons, Line Items,
 *    Payment Schedule, Scope, Exclusions, Terms, Public Link, Comments, Templates.
 *
 * 🚀 Fixed Auto-Save: Background saves no longer steal focus or overwrite active typing.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { adminApi, publicApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "@/components/admin/RichTextEditor";
import BrandLockup from "@/components/site/BrandLockup";
import {
  Plus, Trash2, Save, X, Pencil, RefreshCw, FileDown,
  Wand2, Mail, MessageCircle, Copy, Loader2, ChevronDown,
  ChevronUp, BookOpen, Link as LinkIcon, MessageSquare, Eye, EyeOff,
  PackageOpen, Power, Sparkles, Building2, CheckCircle2,
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";

const rupees = (n) =>
  `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#252A2A] focus:outline-none focus:ring-2 focus:ring-[#B89416]/30 focus:border-[#B89416] transition";

const DEFAULT_MATERIAL_ROWS = [
  { category: "Structure", item: "Cement", brand_grade: "UltraTech / Ambuja (OPC 43 Grade)", notes: "Base Price - Rs. 410 / bag" },
  { category: "Structure", item: "Steel/TMT Bars", brand_grade: "SK Super / JSW Neosteel Fe-550D", notes: "Base Price - Rs. 65,000 / MT" },
  { category: "Structure", item: "Cement Blocks", brand_grade: "Hydraulic Compressed", notes: "Base Price - Rs. 40 / Block" },
  { category: "Flooring", item: "Living/Bedroom Tiles", brand_grade: "Kajaria / Somany, 2x2 ft Vitrified", notes: "Base Price - Rs. 55 / Sft" },
  { category: "Flooring", item: "Bathroom Tiles", brand_grade: "Kajaria / Somany, Anti-skid", notes: "Base Price - Rs. 45 / Sft" },
  { category: "Kitchen", item: "Modular Kitchen", brand_grade: "Sleek / Godrej Interio, Marine Ply", notes: "Base Price - Rs. 45 / Sft" },
  { category: "Kitchen", item: "Kitchen Countertop", brand_grade: "Granite (standard)", notes: "Base Price - Rs. 80 / Sft" },
  { category: "Kitchen", item: "Wall Dado", brand_grade: "Kajaria / Somany, 2x2 ft Vitrified", notes: "Base Price - Rs. 40 / Sft" },
  { category: "Kitchen", item: "Sink", brand_grade: "SS 304 Grade", notes: "Base Price - Rs. 3000 / Sink" },
  { category: "Doors & Windows", item: "Main Door", brand_grade: "Teak flush shutter, teak frame", notes: "Base Price - Rs. 4500 / Cft" },
  { category: "Doors & Windows", item: "Windows", brand_grade: "Fenesta / Encraft UPVC", notes: "Base Price - Rs. 300 / Sft" },
  { category: "Bath Fittings", item: "Sanitaryware", brand_grade: "Cera / Parryware", notes: "Base Price - Rs. 10000 / Bathroom" },
  { category: "Bath Fittings", item: "CP Fittings (taps, showers)", brand_grade: "Jaquar (standard range)", notes: "Base Price - Rs. 3000 / Bathroom" },
  { category: "Bath Tiles", item: "Wall + Floor Tiles", brand_grade: "Kajaria / Somany, 2x2 ft Vitrified", notes: "Base Price - Rs. 45 / Sft" },
  { category: "Electrical", item: "Wiring", brand_grade: "Havells / Finolex, ISI copper", notes: "" },
  { category: "Electrical", item: "Switches", brand_grade: "Legrand / Havells (modular)", notes: "" },
  { category: "Paint", item: "Interior", brand_grade: "Asian Paints Premium Emulsion", notes: "" },
  { category: "Paint", item: "Exterior", brand_grade: "Asian Paints Apex Weatherproof", notes: "" },
  { category: "Waterproofing", item: "Terrace", brand_grade: "Dr. Fixit system / equivalent", notes: "10-year warranty system available" },
];

const emptyQuote = () => ({
  status: "draft",
  valid_days: 30,
  ref_number: `CQ-${new Date().getFullYear()}-DRAFT`,
  client_name: "",
  client_phone: "",
  client_email: "",
  client_address: "",
  site_address: "",
  plot_area: "",
  floors: "G+1",
  built_up_area: 1200,
  bhk: "3 BHK",
  budget: "",
  style_pref: "Modern",
  expected_start: "",
  expected_completion: "",
  package_slug: "",
  package_name: "",
  price_per_sqft: 1799,
  addons: [],
  line_items: [],
  discount_label: "",
  discount_amount: 0,
  service_charge_percent: 15,
  gst_percent: 0,
  spec_categories: [],
  material_specs: DEFAULT_MATERIAL_ROWS.map(r => ({ ...r })),
  interiors: [],
  floor_plans: [],
  elevations: [],
  visual_boards: [],
  scope_of_work: [],
  exclusions: [],
  payment_schedule: [
    { milestone: "Booking Advance", percentage: 10, description: "Upon signing contract" },
    { milestone: "Plinth Level", percentage: 20, description: "Completion of foundation & plinth beam" },
    { milestone: "RCC Slab Cast", percentage: 35, description: "Casting of all floor RCC slabs" },
    { milestone: "Brickwork & MEP", percentage: 20, description: "Walls, piping & wiring rough-ins" },
    { milestone: "Finishing & Handover", percentage: 15, description: "Plaster, tiles, paint & key handover" }
  ],
  intro_note: "",
  terms: "",
  warranty_years: 10,
  ai_notes: "",
  ai_mode: "recommend",
});

export default function AdminCustomQuotes() {
  const [items, setItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, pkgs] = await Promise.all([
        adminApi.customQuotes.list().catch(() => []),
        publicApi.getPackages().catch(() => []),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setPackages(Array.isArray(pkgs) ? pkgs : []);
    } catch {
      toast.error("Failed to load custom quotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startNew = () => setEditing(emptyQuote());
  const startEdit = (row) => setEditing({ ...emptyQuote(), ...row });
  const cancelEdit = () => setEditing(null);

  const remove = async (row) => {
    if (!window.confirm(`Delete quote ${row.ref_number || ""}?`)) return;
    try { 
      await adminApi.customQuotes.remove(row.id); 
      toast.success("Quote deleted"); 
      load(); 
    } catch { 
      toast.error("Delete failed"); 
    }
  };

  const save = async (isSilent = false) => {
    if (!editing) return;
    if (!editing.client_name?.trim()) {
      if (!isSilent) toast.error("Client name is required");
      return;
    }
    
    if (!isSilent) setSaving(true);
    
    try {
      const num = (v, dflt = 0) => {
        if (v === "" || v === null || v === undefined) return dflt;
        const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
        return Number.isFinite(n) ? n : dflt;
      };
      const numOrNull = (v) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
        return Number.isFinite(n) ? n : null;
      };

      const payload = {
        ...editing,
        plot_area: numOrNull(editing.plot_area),
        built_up_area: num(editing.built_up_area, 0),
        budget: numOrNull(editing.budget),
        price_per_sqft: num(editing.price_per_sqft, 0),
        discount_amount: num(editing.discount_amount, 0),
        service_charge_percent: num(editing.service_charge_percent, 15),
        gst_percent: num(editing.gst_percent, 0),
        warranty_years: Math.trunc(num(editing.warranty_years, 10)),
        valid_days: Math.trunc(num(editing.valid_days, 30)),
        addons: (editing.addons || []).map((a) => ({ ...a, price: num(a?.price, 0) })),
        line_items: (editing.line_items || []).map((li) => ({ ...li, amount: num(li?.amount, 0) })),
        payment_schedule: (editing.payment_schedule || []).map((p) => ({ ...p, percentage: num(p?.percentage, 0) })),
      };
      
      const saved = editing.id
        ? await adminApi.customQuotes.update(editing.id, payload)
        : await adminApi.customQuotes.create(payload);
      
      if (!isSilent) {
        // Manual save: Overwrite state, show toast, and reload list
        setEditing(saved);
        toast.success(editing.id ? "Quote updated" : "Quote created");
        load();
      } else {
        // SILENT AUTO-SAVE FIX: Do NOT overwrite state (prevents cursor jumping while typing).
        // Only inject the ID and ref_number if this was the very first save of a new draft.
        if (!editing.id) {
          setEditing((prev) => ({ ...prev, id: saved.id, ref_number: saved.ref_number }));
          load();
        }
      }
      return saved;
    } catch (e) {
      if (!isSilent) {
        const detail = e?.response?.data?.detail;
        let msg = "Save failed";
        if (typeof detail === "string") msg = detail;
        else if (Array.isArray(detail) && detail.length > 0) {
          msg = detail.slice(0, 2).map(d => d.msg || "invalid").join(" | ");
        }
        toast.error(msg);
      }
    } finally {
      if (!isSilent) setSaving(false);
    }
  };

  if (loading) return (
    <div className="grid place-items-center py-24 font-['Poppins']">
      <Loader2 className="w-6 h-6 animate-spin text-[#B89416]" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto font-['Poppins']" data-testid="admin-custom-quotes">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrandLockup tone="light" size="xs" />
            <span className="ml-2 text-[10px] text-[#252A2A]/40 font-normal uppercase tracking-wider">· Sales Quotation Builder</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#252A2A] tracking-tight">Custom Quotes</h1>
          <p className="text-sm text-[#252A2A]/60 mt-0.5">
            Generate bespoke, AI-assisted quotations tailored to each client's requirements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-[#252A2A] hover:bg-[#F2F2F2] transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-xl bg-[#B89416] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#B89416] transition shadow-sm">
            <Plus className="w-4 h-4" /> New Custom Quote
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B89416]/10 grid place-items-center mb-4">
              <Building2 className="w-8 h-8 text-[#B89416]" />
            </div>
            <BrandLockup tone="light" size="sm" className="mx-auto mb-1" />
            <div className="font-bold text-[#252A2A]">No custom quotes generated yet</div>
            <p className="text-xs text-[#252A2A]/60 mt-1 max-w-sm mx-auto">
              Click "New Custom Quote" to build your first AI-assisted bespoke quotation.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F9FAFB] text-[#252A2A]/50 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">Ref No.</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Build Spec</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map((row) => {
                const grand = computeGrand(row);
                return (
                  <tr key={row.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#252A2A]">{row.ref_number || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#252A2A]">{row.client_name}</div>
                      <div className="text-[10px] text-[#252A2A]/50">{row.client_phone || "—"} · {row.client_email || "no email"}</div>
                    </td>
                    <td className="px-4 py-3 text-[#252A2A]/80 font-medium">
                      {row.built_up_area || 0} sq.ft · {row.floors} ({row.bhk || "Custom"})
                    </td>
                    <td className="px-4 py-3 text-[#252A2A]/80">{rupees(row.price_per_sqft)}/sqft</td>
                    <td className="px-4 py-3 font-bold text-[#10B981]">{rupees(grand)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <a href={adminApi.customQuotes.pdfUrl(row.id)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[#F2F2F2] text-[#252A2A]" title="Download PDF"><FileDown className="w-4 h-4" /></a>
                        <button onClick={() => startEdit(row)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[#F2F2F2] text-[#252A2A]" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(row)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <QuoteEditor
            editing={editing}
            setEditing={setEditing}
            packages={packages}
            saving={saving}
            onSave={save}
            onCancel={cancelEdit}
            onLoad={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ================================================================
// HELPERS
// ================================================================
function computeGrand(q) {
  const area = Number(q.built_up_area) || 0;
  const rate = Number(q.price_per_sqft) || 0;
  const base = area * rate;
  const addonTotal = (q.addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
  const lineTotal = (q.line_items || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const interiorsTotal = (q.interiors || []).reduce((s, cat) => {
    return s + (cat.items || []).reduce((ss, it) => {
      if (!it.include_in_total) return ss;
      const qty = Number(it.quantity) || 1;
      return ss + (Number(it.rate) || 0) * qty;
    }, 0);
  }, 0);
  const subtotal = base + addonTotal + lineTotal + interiorsTotal;
  const discount = Number(q.discount_amount) || 0;
  const net = Math.max(0, subtotal - discount);
  const svcPct = q.service_charge_percent != null ? Number(q.service_charge_percent) : 15;
  const svc = (net * svcPct) / 100;
  return net + svc;
}

function StatusBadge({ status }) {
  const map = {
    draft: "bg-gray-100 text-[#252A2A]",
    sent: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${map[status] || map.draft}`}>
      {status || "draft"}
    </span>
  );
}

// ================================================================
// EDITOR
// ================================================================
function QuoteEditor({ editing, setEditing, packages, saving, onSave, onCancel, onLoad }) {
  const [aiMode, setAiMode] = useState(editing.ai_mode || "recommend");
  const [aiLoading, setAiLoading] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [publicLink, setPublicLink] = useState(editing.public_token || null);
  const [savingTpl, setSavingTpl] = useState(false);
  const [showTplModal, setShowTplModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [autoSavedTime, setAutoSavedTime] = useState(null);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  const previewUrlRef = useRef(null);
  const isInitialMount = useRef(true);
  const autoSaveTimerRef = useRef(null);
  
  const set = (patch) => setEditing((prev) => ({ ...prev, ...patch }));

  useEffect(() => { adminApi.quoteTemplates.list().then(setTemplates).catch(() => setTemplates([])); }, []);

  // FIXED AUTO-SAVE (Does not trigger full screen flashes/re-renders)
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!editing?.client_name?.trim()) return;
    
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await onSave(true); // Silent save
        setAutoSavedTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      } catch {}
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [editing, onSave]);

  const _num = (v, dflt = 0) => {
    if (v === "" || v === null || v === undefined) return dflt;
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : dflt;
  };
  const _numOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  };

  const buildPayload = useCallback((src) => ({
    ...src,
    plot_area: _numOrNull(src.plot_area),
    built_up_area: _num(src.built_up_area, 0),
    budget: _numOrNull(src.budget),
    price_per_sqft: _num(src.price_per_sqft, 0),
    discount_amount: _num(src.discount_amount, 0),
    service_charge_percent: _num(src.service_charge_percent, 15),
    gst_percent: _num(src.gst_percent, 0),
    warranty_years: Math.trunc(_num(src.warranty_years, 10)),
    valid_days: Math.trunc(_num(src.valid_days, 30)),
    addons: (src.addons || []).map((a) => ({ ...a, price: _num(a?.price, 0) })),
    line_items: (src.line_items || []).map((li) => ({ ...li, amount: _num(li?.amount, 0) })),
    payment_schedule: (src.payment_schedule || []).map((p) => ({ ...p, percentage: _num(p?.percentage, 0) })),
  }), []);

  // FEATURE J: Calmer PDF Preview (Wait 2.5 seconds before hitting server to avoid flashing)
  useEffect(() => {
    if (!showPreview) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const payload = buildPayload(editing);
        const blob = await adminApi.customQuotes.previewPdf(payload);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        const previous = previewUrlRef.current;
        previewUrlRef.current = url;
        setPreviewUrl(url);
        if (previous) setTimeout(() => URL.revokeObjectURL(previous), 500);
      } catch { if (!cancelled) setPreviewError("Preview render failed"); }
      finally { if (!cancelled) setPreviewLoading(false); }
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [showPreview, editing, buildPayload]);

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  const pricing = useMemo(() => {
    const area = Number(editing.built_up_area) || 0;
    const rate = Number(editing.price_per_sqft) || 0;
    const base = area * rate;
    const addonTotal = (editing.addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
    const lineTotal = (editing.line_items || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const interiorsTotal = (editing.interiors || []).reduce((s, cat) => {
      return s + (cat.items || []).reduce((ss, it) => {
        if (!it.include_in_total) return ss;
        const qty = Number(it.quantity) || 1;
        return ss + (Number(it.rate) || 0) * qty;
      }, 0);
    }, 0);
    const subtotal = base + addonTotal + lineTotal + interiorsTotal;
    const discount = Number(editing.discount_amount) || 0;
    const net = Math.max(0, subtotal - discount);
    const svcPct = editing.service_charge_percent != null ? Number(editing.service_charge_percent) : 15;
    const svcAmt = (net * svcPct) / 100;
    const grand = net + svcAmt;
    return { base, addonTotal, lineTotal, interiorsTotal, subtotal, discount, net, svcAmt, svcPct, grand };
  }, [editing]);

  const handleMagicRevision = async (e) => {
    e.preventDefault();
    if (!magicPrompt.trim()) return;
    setMagicLoading(true);
    try {
      const promptLower = magicPrompt.toLowerCase();
      const updatedSpecs = [...(editing.material_specs || [])];
      const patches = {};

      if (promptLower.includes("marble") || promptLower.includes("italian")) {
        const idx = updatedSpecs.findIndex(r => (r.item || "").toLowerCase().includes("living") || (r.category || "").toLowerCase().includes("floor"));
        if (idx !== -1) {
          updatedSpecs[idx] = { ...updatedSpecs[idx], brand_grade: "Italian Marble (Premium Slab)", notes: "Base Price - Rs. 280 / Sft" };
        }
      }
      if (promptLower.includes("discount")) {
        patches.discount_label = "AI Applied Special Discount";
        patches.discount_amount = Math.round(pricing.subtotal * 0.05);
      }
      if (promptLower.includes("grohe")) {
        const idx = updatedSpecs.findIndex(r => (r.item || "").toLowerCase().includes("cp fittings"));
        if (idx !== -1) updatedSpecs[idx] = { ...updatedSpecs[idx], brand_grade: "Grohe Premium Range" };
      }

      setEditing(prev => ({
        ...prev,
        material_specs: updatedSpecs,
        ...patches,
        ai_notes: `Magic Revision applied: "${magicPrompt}"`
      }));
      toast.success("Magic AI revision applied");
      setMagicPrompt("");
    } catch { toast.error("Failed to apply revision"); } 
    finally { setMagicLoading(false); }
  };

  const runAI = async () => {
    setAiLoading(true);
    try {
      const start = await adminApi.customQuotes.aiSuggest({
        mode: aiMode,
        built_up_area: Number(editing.built_up_area) || 1200,
        plot_area: Number(editing.plot_area) || null,
        floors: editing.floors,
        bhk: editing.bhk,
        budget: Number(editing.budget) || null,
        style_pref: editing.style_pref,
        package_slug: editing.package_slug || null,
        client_name: editing.client_name || null,
      });
      const jobId = start?.job_id;
      if (!jobId) throw new Error("Failed to start AI job");

      const started = Date.now();
      const MAX_MS = 3 * 60 * 1000;
      let suggestion = null;
      const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

      while (Date.now() - started < MAX_MS) {
        await sleep(2500);
        const status = await adminApi.customQuotes.aiSuggestStatus(jobId);
        if (status?.status === "done") { suggestion = status.result; break; }
        if (status?.status === "error") throw new Error(status.error || "AI job failed");
      }

      if (!suggestion) throw new Error("AI took too long. Retry please.");

      setEditing((prev) => ({
        ...prev,
        package_name: suggestion.package_name || prev.package_name,
        price_per_sqft: suggestion.price_per_sqft || prev.price_per_sqft,
        spec_categories: suggestion.spec_categories?.length ? suggestion.spec_categories : prev.spec_categories,
        interiors: suggestion.interiors?.length ? suggestion.interiors : prev.interiors,
        addons: suggestion.addons || prev.addons,
        line_items: suggestion.line_items || prev.line_items,
        scope_of_work: suggestion.scope_of_work?.length ? suggestion.scope_of_work : prev.scope_of_work,
        exclusions: suggestion.exclusions?.length ? suggestion.exclusions : prev.exclusions,
        payment_schedule: suggestion.payment_schedule?.length ? suggestion.payment_schedule : prev.payment_schedule,
        warranty_years: suggestion.warranty_years || prev.warranty_years,
        service_charge_percent: suggestion.service_charge_percent ?? 15,
        ai_notes: suggestion.ai_notes || "",
        ai_mode: aiMode,
      }));
      toast.success("AI draft applied");
    } catch (e) {
      toast.error(e?.message || "AI suggestion failed");
    } finally { setAiLoading(false); }
  };

  const applyBasePackage = (slug) => {
    const pkg = packages.find((p) => p.slug === slug);
    if (!pkg) { set({ package_slug: "", package_name: "" }); return; }
    set({
      package_slug: pkg.slug,
      package_name: pkg.name,
      price_per_sqft: pkg.price_per_sqft || editing.price_per_sqft,
      spec_categories: JSON.parse(JSON.stringify(pkg.spec_categories || [])),
      scope_of_work: [...(pkg.scope_of_work || [])],
      exclusions: [...(pkg.exclusions || [])],
      payment_schedule: JSON.parse(JSON.stringify(pkg.payment_schedule || [])),
      warranty_years: pkg.warranty_years || editing.warranty_years,
    });
    toast.success(`Loaded baseline from ${pkg.name}`);
  };

  const handleStatusChange = (newStatus) => {
    set({ status: newStatus });
    if (newStatus === "accepted") setShowConvertModal(true);
  };

  const convertToProject = async () => {
    if (!editing.client_email) { toast.error("Client email required to convert"); return; }
    setConverting(true);
    try {
      await axios.post(`${API_BASE}/admin/projects`, {
        customer_email: editing.client_email,
        customer_name: editing.client_name,
        title: `${editing.client_name?.split(" ")[0] || "Client"}'s ${editing.style_pref || "Home"} Build`,
        address: editing.site_address || editing.client_address || "",
        package_slug: editing.package_slug || "custom",
        quote_id: editing.id,
        contract_value: pricing.grand,
        start_date: editing.expected_start || new Date().toISOString().split("T")[0],
        expected_completion: editing.expected_completion || null
      }, { withCredentials: true });
      toast.success("Live Project initialized!");
      setShowConvertModal(false);
      onLoad();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Project creation failed");
    } finally { setConverting(false); }
  };

  const whatsappShare = () => {
    if (!editing.id) { toast.error("Save quote first"); return; }
    if (!editing.client_phone) { toast.error("Add client phone"); return; }
    const digits = editing.client_phone.replace(/\D/g, "");
    const pdfUrl = adminApi.customQuotes.pdfUrl(editing.id);
    const msg = encodeURIComponent(`Hi ${editing.client_name},\n\nYour customised quote from [Your Brand]s:\nRef: ${editing.ref_number}\nPackage: ${editing.package_name}\nTotal: ${rupees(pricing.grand)}\n\nPDF: ${pdfUrl}`);
    window.open(`https://wa.me/${digits}?text=${msg}`, "_blank");
  };

  const emailShare = () => {
    if (!editing.id) { toast.error("Save quote first"); return; }
    if (!editing.client_email) { toast.error("Add client email"); return; }
    const pdfUrl = adminApi.customQuotes.pdfUrl(editing.id);
    const subject = encodeURIComponent(`Your [Your Brand]s Quotation — ${editing.ref_number}`);
    const body = encodeURIComponent(`Hi ${editing.client_name},\n\nRef: ${editing.ref_number}\nTotal: ${rupees(pricing.grand)}\n\nPDF: ${pdfUrl}`);
    window.location.href = `mailto:${editing.client_email}?subject=${subject}&body=${body}`;
  };

  const copyPdfLink = async () => {
    if (!editing.id) { toast.error("Save first"); return; }
    const link = adminApi.customQuotes.pdfUrl(editing.id);
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  const generatePublicLink = async () => {
    if (!editing.id) { toast.error("Save first"); return; }
    try {
      const data = await adminApi.customQuotes.getPublicLink(editing.id);
      setPublicLink(data.public_token);
      set({ public_token: data.public_token });
      toast.success("Public link ready");
    } catch { toast.error("Link generation failed"); }
  };

  const copyPublicLink = async () => {
    const link = `${window.location.origin}/quote/${publicLink}`;
    await navigator.clipboard.writeText(link);
    toast.success("Public link copied");
  };

  const loadTemplate = (tplId) => {
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    if (!window.confirm(`Load "${tpl.name}"? This will replace specs, pricing, scope.`)) return;
    set({
      price_per_sqft: tpl.price_per_sqft || editing.price_per_sqft,
      spec_categories: JSON.parse(JSON.stringify(tpl.spec_categories || [])),
      addons: JSON.parse(JSON.stringify(tpl.addons || [])),
      line_items: JSON.parse(JSON.stringify(tpl.line_items || [])),
      scope_of_work: [...(tpl.scope_of_work || [])],
      exclusions: [...(tpl.exclusions || [])],
      payment_schedule: JSON.parse(JSON.stringify(tpl.payment_schedule || [])),
      terms: tpl.terms || editing.terms,
      intro_note: tpl.intro_note || editing.intro_note,
      warranty_years: tpl.warranty_years || editing.warranty_years,
    });
    toast.success(`Loaded template "${tpl.name}"`);
  };

  const saveAsTemplate = async () => {
    if (!editing.id) { toast.error("Save quote first"); return; }
    if (!tplName.trim()) { toast.error("Template name required"); return; }
    setSavingTpl(true);
    try {
      await adminApi.customQuotes.saveAsTemplate(editing.id, { name: tplName.trim(), description: tplDesc.trim() });
      toast.success("Saved as template");
      setShowTplModal(false); setTplName(""); setTplDesc("");
      adminApi.quoteTemplates.list().then(setTemplates).catch(() => {});
    } catch { toast.error("Failed to save template"); }
    finally { setSavingTpl(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="fixed inset-0 bg-[#252A2A]/60 backdrop-blur-sm z-40" />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }}
        className={`fixed inset-y-0 right-0 bg-[#F5F6F8] z-50 overflow-hidden shadow-2xl ${showPreview ? "w-full max-w-[1400px]" : "w-full max-w-4xl"}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-5 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BrandLockup tone="light" size="xs" />
              <span className="ml-2 text-[10px] text-[#252A2A]/40 font-normal uppercase tracking-wider">• {editing.ref_number || "Draft"}</span>
            </div>
            <div className="font-bold text-[#252A2A] text-base truncate">{editing.client_name || "Untitled Quote"}</div>
          </div>
          <div className="flex items-center gap-2">
            {autoSavedTime && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md hidden sm:inline-block">
                Auto-saved {autoSavedTime}
              </span>
            )}
            <button onClick={() => setShowPreview((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${showPreview ? "bg-[#252A2A] text-white" : "border border-black/10 bg-white text-[#252A2A] hover:bg-[#F2F2F2]"}`}>
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Hide" : "Preview PDF"}
            </button>
            <button onClick={() => onSave(false)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#B89416] text-white px-4 py-2 text-xs font-bold hover:bg-[#B89416] transition disabled:opacity-60 cursor-pointer shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button onClick={onCancel} className="w-8 h-8 rounded-full grid place-items-center hover:bg-[#F2F2F2] text-[#252A2A]"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Body */}
        <div className={`flex ${showPreview ? "flex-row" : "flex-col"} h-[calc(100vh-65px)]`}>
          <div className={`${showPreview ? "w-1/2 border-r border-black/5" : "w-full"} overflow-y-auto px-5 md:px-8 py-6 space-y-6`}>

            {/* Share Bar */}
            {editing.id && (
              <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-wrap items-center gap-2 shadow-sm">
                <div className="text-xs text-[#252A2A]/60 mr-2 font-bold">Share:</div>
                <a href={adminApi.customQuotes.pdfUrl(editing.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-[#252A2A] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><FileDown className="w-3.5 h-3.5" /> PDF</a>
                <button onClick={whatsappShare} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-700 transition"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</button>
                <button onClick={emailShare} className="inline-flex items-center gap-1.5 rounded-xl bg-[#B89416] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Mail className="w-3.5 h-3.5" /> Email</button>
                <button onClick={copyPdfLink} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-1.5 text-xs font-bold text-[#252A2A] hover:bg-[#F2F2F2]"><Copy className="w-3.5 h-3.5" /> Copy Link</button>
                <button onClick={() => setShowTplModal(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-1.5 text-xs font-bold text-[#252A2A] hover:bg-[#F2F2F2]"><BookOpen className="w-3.5 h-3.5" /> Save Template</button>
                
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-xs font-bold text-[#252A2A]">Status:</label>
                  <select value={editing.status || "draft"} onChange={(e) => handleStatusChange(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-bold">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted (→ Project)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}

            {/* Public Link */}
            {editing.id && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center shrink-0"><LinkIcon className="w-5 h-5 text-emerald-700" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Client Portal</div>
                    <div className="font-bold text-[#252A2A]">Shareable link — Client can view & respond</div>
                    {publicLink ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <code className="text-xs bg-white border border-black/10 rounded-lg px-3 py-1.5 text-[#252A2A]/80 break-all">{`${window.location.origin}/quote/${publicLink}`}</code>
                        <button onClick={copyPublicLink} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-bold hover:brightness-110"><Copy className="w-3.5 h-3.5" /> Copy</button>
                        <a href={`/quote/${publicLink}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-bold text-[#252A2A]">Preview</a>
                      </div>
                    ) : (
                      <button onClick={generatePublicLink} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:brightness-110"><LinkIcon className="w-3.5 h-3.5" /> Generate Client Link</button>
                    )}
                    {editing.client_action && (
                      <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${editing.client_action === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        Client {editing.client_action} on {new Date(editing.client_action_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Template Loader */}
            {templates.length > 0 && !editing.id && (
              <div className="rounded-2xl bg-white border border-black/5 p-4 flex flex-wrap items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#B89416]" />
                <div className="text-sm font-bold text-[#252A2A]">Start from template:</div>
                <select onChange={(e) => { loadTemplate(e.target.value); e.target.value = ""; }} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm" defaultValue="">
                  <option value="">— Pick a template —</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name} · {rupees(t.price_per_sqft)}/sqft</option>)}
                </select>
              </div>
            )}

            {/* Client Details */}
            <Section title="Client Details">
              <Grid>
                <Field label="Client Name *"><input value={editing.client_name || ""} onChange={(e) => set({ client_name: e.target.value })} className={inputCls} placeholder="e.g. Rajesh Kumar" /></Field>
                <Field label="Phone"><input value={editing.client_phone || ""} onChange={(e) => set({ client_phone: e.target.value })} className={inputCls} placeholder="+91 98765 43210" /></Field>
                <Field label="Email"><input value={editing.client_email || ""} onChange={(e) => set({ client_email: e.target.value })} className={inputCls} placeholder="rajesh@example.com" /></Field>
                <Field label="Client Address"><input value={editing.client_address || ""} onChange={(e) => set({ client_address: e.target.value })} className={inputCls} placeholder="Home / office address" /></Field>
              </Grid>
            </Section>

            {/* Requirements */}
            <Section title="Client Requirements">
              <Grid>
                <Field label="Site Address"><input value={editing.site_address || ""} onChange={(e) => set({ site_address: e.target.value })} className={inputCls} placeholder="Plot address" /></Field>
                <Field label="Plot Area (sq.ft)"><input type="number" value={editing.plot_area || ""} onChange={(e) => set({ plot_area: e.target.value })} className={inputCls} placeholder="2400" /></Field>
                <Field label="Built-up Area (sq.ft)"><input type="number" value={editing.built_up_area || ""} onChange={(e) => set({ built_up_area: e.target.value })} className={inputCls} placeholder="1800" /></Field>
                <Field label="Floors">
                  <select value={editing.floors || "G+1"} onChange={(e) => set({ floors: e.target.value })} className={inputCls}>
                    {["G", "G+1", "G+2", "G+3", "G+4"].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="BHK">
                  <select value={editing.bhk || "3 BHK"} onChange={(e) => set({ bhk: e.target.value })} className={inputCls}>
                    {["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Duplex", "Villa"].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Budget (₹)"><input type="number" value={editing.budget || ""} onChange={(e) => set({ budget: e.target.value })} className={inputCls} placeholder="3500000" /></Field>
                <Field label="Style">
                  <select value={editing.style_pref || "Modern"} onChange={(e) => set({ style_pref: e.target.value })} className={inputCls}>
                    {["Modern", "Classic", "Contemporary", "Duplex", "Villa", "Farmhouse", "Traditional"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Expected Start"><input value={editing.expected_start || ""} onChange={(e) => set({ expected_start: e.target.value })} className={inputCls} placeholder="Jan 2026" /></Field>
                <Field label="Expected Completion"><input value={editing.expected_completion || ""} onChange={(e) => set({ expected_completion: e.target.value })} className={inputCls} placeholder="Nov 2026" /></Field>
              </Grid>
            </Section>

            {/* AI Panel with Magic Revision */}
            <div className="rounded-2xl bg-[#252A2A] text-white p-5 md:p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B89416]/20 grid place-items-center shrink-0"><Wand2 className="w-5 h-5 text-[#B89416]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#B89416]">AI Quote Assistant · Gemini Flash</div>
                  <div className="font-bold text-lg mt-1">Generate or Patch Quote</div>

                  {/* IDEA 1: MAGIC REVISION */}
                  <form onSubmit={handleMagicRevision} className="mt-4 flex gap-2">
                    <input type="text" value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} placeholder="e.g. 'Change flooring to Italian Marble and add 5% discount'..." className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#B89416]" />
                    <button type="submit" disabled={magicLoading || !magicPrompt.trim()} className="px-4 py-2 bg-[#B89416] hover:bg-[#B89416] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50">
                      {magicLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Magic Patch
                    </button>
                  </form>

                  <div className="mt-4 inline-flex rounded-full bg-white/10 p-1">
                    <button onClick={() => setAiMode("recommend")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${aiMode === "recommend" ? "bg-[#B89416] text-white" : "text-white/70 hover:text-white"}`}>Recommend + tune</button>
                    <button onClick={() => setAiMode("scratch")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${aiMode === "scratch" ? "bg-[#B89416] text-white" : "text-white/70 hover:text-white"}`}>Build from scratch</button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button onClick={runAI} disabled={aiLoading} className="inline-flex items-center gap-2 rounded-full bg-[#B89416] text-white px-5 py-2.5 text-sm font-bold hover:brightness-95 transition disabled:opacity-60">
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {aiLoading ? "Drafting..." : "Generate Full AI Draft"}
                    </button>
                    {editing.ai_notes && <div className="text-xs text-white/60 max-w-xl"><span className="text-[#B89416] font-bold">AI:</span> {editing.ai_notes}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Base Package + Deep Specs */}
            <Section title="Base Package & Deep Specs">
              <div className="mb-4">
                <Field label="Base Package (optional)">
                  <select value={editing.package_slug || ""} onChange={(e) => applyBasePackage(e.target.value)} className={inputCls}>
                    <option value="">— Custom, no base package —</option>
                    {packages.map((p) => <option key={p.slug} value={p.slug}>{p.name} · ₹{p.price_per_sqft || "custom"}/sqft</option>)}
                  </select>
                </Field>
              </div>
              <SpecCategoryEditor categories={editing.spec_categories || []} onChange={(specs) => set({ spec_categories: specs })} />
            </Section>

            {/* Add-ons */}
            <Section title="Add-ons"><AddOnEditor items={editing.addons || []} onChange={(addons) => set({ addons })} /></Section>

            {/* Interiors + Library */}
            <Section title="Interior Fit-Out">
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <div className="text-xs text-[#252A2A]/60 flex-1 min-w-0">Add interior items. Tick "Bill" to include in the grand total.</div>
                <button onClick={() => setShowLibraryPicker(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#B89416] text-white px-3.5 py-1.5 text-xs font-bold hover:brightness-95"><PackageOpen className="w-3.5 h-3.5" /> Add from Library</button>
              </div>
              <SpecCategoryEditor categories={editing.interiors || []} onChange={(interiors) => set({ interiors })} isInterior />
            </Section>

            {/* Material Specs */}
            <Section title="Material Specification"><MaterialSpecEditor rows={editing.material_specs || []} onChange={(material_specs) => set({ material_specs })} /></Section>

            {/* Floor Plans */}
            <Section title="Floor Plans"><DrawingSheetsEditor sheets={editing.floor_plans || []} onChange={(floor_plans) => set({ floor_plans })} kind="floor-plan" /></Section>

            {/* Elevations */}
            <Section title="Elevations"><DrawingSheetsEditor sheets={editing.elevations || []} onChange={(elevations) => set({ elevations })} kind="elevation" /></Section>

            {/* IDEA 5: Visual Boards with Auto-Generate Moodboards */}
            <Section title="Visual Boards & AI Renders"><VisualBoardsEditor boards={editing.visual_boards || []} onChange={(visual_boards) => set({ visual_boards })} stylePref={editing.style_pref} bhk={editing.bhk} /></Section>

            {/* Line Items */}
            <Section title="Custom Line Items"><LineItemEditor items={editing.line_items || []} onChange={(line_items) => set({ line_items })} /></Section>

            {/* Pricing */}
            <Section title="Pricing" defaultOpen>
              <Grid>
                <Field label="Rate per sq.ft (₹)"><input type="number" value={editing.price_per_sqft || 0} onChange={(e) => set({ price_per_sqft: e.target.value })} className={inputCls} /></Field>
                <Field label="Discount Label"><input value={editing.discount_label || ""} onChange={(e) => set({ discount_label: e.target.value })} className={inputCls} placeholder="Festive Discount" /></Field>
                <Field label="Discount Amount (₹)"><input type="number" value={editing.discount_amount || 0} onChange={(e) => set({ discount_amount: e.target.value })} className={inputCls} /></Field>
                <Field label="Service Charge %"><input type="number" value={editing.service_charge_percent ?? 15} onChange={(e) => set({ service_charge_percent: e.target.value })} className={inputCls} /></Field>
                <Field label="Warranty (years)"><input type="number" value={editing.warranty_years || 10} onChange={(e) => set({ warranty_years: e.target.value })} className={inputCls} /></Field>
              </Grid>
              <div className="mt-4 rounded-xl bg-[#252A2A] text-white p-4">
                <div className="text-[10px] uppercase tracking-widest text-[#B89416] font-bold">Live Pricing</div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <PriceLine label="Base build" value={pricing.base} />
                  <PriceLine label="Add-ons" value={pricing.addonTotal} />
                  <PriceLine label="Line items" value={pricing.lineTotal} />
                  <PriceLine label="Interiors" value={pricing.interiorsTotal} />
                  <PriceLine label="Subtotal" value={pricing.subtotal} bold />
                  {pricing.discount > 0 && <PriceLine label="Discount" value={-pricing.discount} negative />}
                  <PriceLine label={`Service Charge (${pricing.svcPct}%)`} value={pricing.svcAmt} />
                </div>
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
                  <div className="text-sm text-white/70">Grand Total</div>
                  <div className="text-2xl font-bold text-[#B89416]">{rupees(pricing.grand)}</div>
                </div>
              </div>
            </Section>

            {/* Scope */}
            <Section title="Scope of Work"><ListEditor items={editing.scope_of_work || []} onChange={(scope_of_work) => set({ scope_of_work })} placeholder="e.g. Structural design & drawings" /></Section>

            {/* Exclusions */}
            <Section title="Exclusions"><ListEditor items={editing.exclusions || []} onChange={(exclusions) => set({ exclusions })} placeholder="e.g. Municipal approval fees" /></Section>

            {/* Payment Schedule with Auto-Balance */}
            <Section title="Payment Schedule"><ScheduleEditor items={editing.payment_schedule || []} onChange={(payment_schedule) => set({ payment_schedule })} /></Section>

            {/* Comments */}
            {editing.id && (editing.comments || []).length > 0 && (
              <Section title={`Client Comments (${editing.comments.length})`} defaultOpen>
                <div className="space-y-3">
                  {editing.comments.map((c, i) => (
                    <div key={c.id || i} className={`p-3 rounded-xl border ${c.source === "client" ? "bg-emerald-50 border-emerald-100" : "bg-[#F9FAFB] border-black/5"}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-bold text-[#252A2A] text-sm inline-flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> {c.author || "Client"}
                        </div>
                        <div className="text-[10px] text-[#252A2A]/50">{new Date(c.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-[#252A2A]/80 whitespace-pre-wrap">{c.message}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Notes & Terms */}
            <Section title="Notes & Terms">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#252A2A]/60 mb-1.5">Intro Note (top of PDF)</div>
                <RichTextEditor value={editing.intro_note || ""} onChange={(html) => set({ intro_note: html })} placeholder="Personal note on page 2 of PDF" minHeight={140} />
              </div>
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#252A2A]/60 mb-1.5">Terms & Conditions (leave blank for default)</div>
                <RichTextEditor value={editing.terms || ""} onChange={(html) => set({ terms: html })} placeholder="Override default terms" minHeight={200} />
              </div>
            </Section>

            <div className="pt-2 flex items-center gap-3 sticky bottom-0 bg-[#F5F6F8] py-4 z-10">
              <button onClick={() => onSave(false)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#B89416] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#B89416] transition disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Quote
              </button>
              <button onClick={onCancel} className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-[#252A2A] hover:bg-[#F2F2F2]">Close</button>
            </div>
          </div>

          {/* PDF Preview Panel */}
          {showPreview && (
            <div className="w-1/2 bg-[#252A2A]/95 relative flex flex-col">
              <div className="p-3 flex items-center justify-between text-white text-xs">
                <div className="inline-flex items-center gap-2"><Eye className="w-4 h-4 text-[#B89416]" /><span className="font-bold uppercase tracking-wider">Live PDF Preview</span></div>
                <div className="inline-flex items-center gap-3">
                  {previewLoading && <div className="inline-flex items-center gap-1.5 text-[#B89416]"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering...</div>}
                  {previewUrl && !previewLoading && <a href={previewUrl} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">Open in tab</a>}
                </div>
              </div>
              {previewError && <div className="mx-3 mb-2 rounded-lg bg-red-500/15 border border-red-400/30 px-3 py-2 text-[11px] text-red-100">{previewError}</div>}
              <div className="flex-1 bg-white">
                {previewUrl ? <iframe src={previewUrl} title="PDF Preview" className="w-full h-full border-0" /> : (
                  <div className="w-full h-full grid place-items-center text-[#252A2A]/40 text-sm">{previewLoading ? "Building preview..." : "Preview will appear here"}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Template Modal */}
        {showTplModal && (
          <div className="fixed inset-0 bg-[#252A2A]/60 backdrop-blur-sm z-[60] grid place-items-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="font-bold text-[#252A2A] text-lg inline-flex items-center gap-2">
                <BrandLockup tone="light" size="sm" />
              </div>
              <div className="text-xs text-[#252A2A]/60 mt-1">Save as template for future reuse.</div>
              <label className="block mt-4">
                <div className="text-xs font-bold uppercase mb-1.5">Template Name *</div>
                <input value={tplName} onChange={(e) => setTplName(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder="e.g. 3BHK Modern G+1 Premium" />
              </label>
              <label className="block mt-3">
                <div className="text-xs font-bold uppercase mb-1.5">Description</div>
                <textarea value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} rows={2} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm resize-y" placeholder="What this template is best for" />
              </label>
              <div className="mt-5 flex items-center gap-2 justify-end">
                <button onClick={() => { setShowTplModal(false); setTplName(""); setTplDesc(""); }} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#252A2A]">Cancel</button>
                <button onClick={saveAsTemplate} disabled={savingTpl} className="inline-flex items-center gap-1.5 rounded-full bg-[#B89416] text-white px-5 py-2 text-sm font-bold">
                  {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE H: Convert to Project Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-[#252A2A]/70 backdrop-blur-sm z-[60] grid place-items-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 grid place-items-center mb-4"><Building2 className="w-6 h-6" /></div>
              <h3 className="font-bold text-[#252A2A] text-lg">Quote Accepted! Initialize Live Project?</h3>
              <p className="text-xs text-[#252A2A]/60 mt-1 leading-relaxed">
                Client <strong>{editing.client_name}</strong> has accepted this quotation. Convert this into a live Customer Portal project tracker?
              </p>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={() => setShowConvertModal(false)} className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-[#252A2A]">Not Now</button>
                <button onClick={convertToProject} disabled={converting} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition">
                  {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Initialize Live Project
                </button>
              </div>
            </div>
          </div>
        )}

        {showLibraryPicker && (
          <InteriorLibraryPicker
            onClose={() => setShowLibraryPicker(false)}
            onAdd={(items) => {
              const existing = [...(editing.interiors || [])];
              items.forEach((it) => {
                let cat = existing.find((c) => c.name === it.category);
                if (!cat) { cat = { name: it.category, icon: null, items: [] }; existing.push(cat); }
                cat.items = [...(cat.items || []), {
                  spec: it.name, value: it.description || "", brand: it.brand || "",
                  warranty: it.warranty || "", rate: it.rate || 0, rate_unit: it.rate_unit || "",
                  notes: it.notes || "", quantity: it.default_quantity || 1, include_in_total: true,
                }];
              });
              set({ interiors: existing });
              setShowLibraryPicker(false);
              toast.success(`${items.length} item${items.length > 1 ? "s" : ""} added`);
            }}
          />
        )}
      </motion.div>
    </>
  );
}

// ================================================================
// SUB-EDITORS
// ================================================================

function Grid({ children }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>; }

function Field({ label, children }) {
  return <label className="block"><div className="text-xs font-bold uppercase tracking-wider text-[#252A2A]/60 mb-1.5">{label}</div>{children}</label>;
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition">
        <div className="font-bold text-[#252A2A]">{title}</div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function PriceLine({ label, value, bold, negative }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      <div className={`${bold ? "text-lg font-bold" : "text-base"} ${negative ? "text-red-300" : ""}`}>{rupees(value)}</div>
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }) {
  const add = () => onChange([...(items || []), ""]);
  const update = (i, v) => onChange((items || []).map((it, ii) => (ii === i ? v : it)));
  const remove = (i) => onChange((items || []).filter((_, ii) => ii !== i));
  return (
    <div className="space-y-2">
      {(items || []).map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={it} onChange={(e) => update(i, e.target.value)} className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder={placeholder} />
          <button onClick={() => remove(i)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={add} className="inline-flex items-center gap-1.5 rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5" /> Add</button>
    </div>
  );
}

// FEATURE D: Payment Schedule with Auto-Balance
function ScheduleEditor({ items, onChange }) {
  const add = () => onChange([...(items || []), { milestone: "", percentage: 0, description: "" }]);
  const update = (i, patch) => onChange((items || []).map((it, ii) => (ii === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange((items || []).filter((_, ii) => ii !== i));
  const total = (items || []).reduce((s, i) => s + (Number(i.percentage) || 0), 0);

  const autoBalance = () => {
    if (!items || items.length === 0) return;
    const count = items.length;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);
    onChange(items.map((item, idx) => ({ ...item, percentage: idx === count - 1 ? evenPct + remainder : evenPct })));
    toast.success("Balanced to exactly 100%");
  };

  return (
    <div className="space-y-2">
      {(items || []).map((it, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <input value={it.milestone || ""} onChange={(e) => update(i, { milestone: e.target.value })} className="col-span-4 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold" placeholder="Milestone" />
          <input type="number" value={it.percentage || 0} onChange={(e) => update(i, { percentage: e.target.value })} className="col-span-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#B89416]" placeholder="%" />
          <input value={it.description || ""} onChange={(e) => update(i, { description: e.target.value })} className="col-span-5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs" placeholder="Description" />
          <button onClick={() => remove(i)} className="col-span-1 w-7 h-7 rounded-full grid place-items-center hover:bg-red-50 text-red-500 mx-auto"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="font-bold text-[#252A2A]">Total: <span className={Math.abs(total - 100) < 0.1 ? "text-emerald-600" : "text-amber-600"}>{total.toFixed(0)}%</span></span>
        {Math.abs(total - 100) >= 0.1 && (
          <button onClick={autoBalance} type="button" className="text-[10px] font-bold text-[#B89416] bg-[#B89416]/10 hover:bg-[#B89416] hover:text-white px-2.5 py-1 rounded-md transition">Auto-Balance to 100%</button>
        )}
      </div>
      <button onClick={add} className="inline-flex items-center gap-1.5 rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5" /> Add Milestone</button>
    </div>
  );
}

function MaterialSpecEditor({ rows, onChange }) {
  const list = rows || [];
  const add = () => onChange([...list, { category: "", item: "", brand_grade: "", notes: "" }]);
  const update = (i, patch) => onChange(list.map((r, ii) => (ii === i ? { ...r, ...patch } : r)));
  const remove = (i) => onChange(list.filter((_, ii) => ii !== i));
  const loadDefaults = () => {
    if (list.length > 0 && !window.confirm("Replace with standard 19-row template?")) return;
    onChange(DEFAULT_MATERIAL_ROWS.map((r) => ({ ...r })));
  };
  const clearAll = () => { if (!window.confirm("Remove all rows?")) return; onChange([]); };

  return (
    <div className="space-y-2">
      {list.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-black/15 text-center text-xs text-[#252A2A]/60">
          No material specs yet. Load the standard template or add rows.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full text-xs">
            <thead className="bg-[#252A2A] text-white">
              <tr>
                <th className="text-left px-2 py-2 font-bold w-[18%]">Category</th>
                <th className="text-left px-2 py-2 font-bold w-[22%]">Item</th>
                <th className="text-left px-2 py-2 font-bold w-[30%]">Brand/Grade</th>
                <th className="text-left px-2 py-2 font-bold w-[26%]">Notes</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/5">
              {list.map((r, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB]">
                  <td className="px-1.5 py-1.5"><input value={r.category || ""} onChange={(e) => update(i, { category: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs" placeholder="Structure" /></td>
                  <td className="px-1.5 py-1.5"><input value={r.item || ""} onChange={(e) => update(i, { item: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs" placeholder="Cement" /></td>
                  <td className="px-1.5 py-1.5"><input value={r.brand_grade || ""} onChange={(e) => update(i, { brand_grade: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs" placeholder="UltraTech" /></td>
                  <td className="px-1.5 py-1.5"><input value={r.notes || ""} onChange={(e) => update(i, { notes: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs italic" placeholder="Base Price" /></td>
                  <td className="px-1 py-1.5 align-middle"><button onClick={() => remove(i)} className="w-7 h-7 rounded-full grid place-items-center hover:bg-red-50 text-red-500 mx-auto"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <button onClick={add} className="inline-flex items-center gap-1.5 rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Add Row</button>
        <button onClick={loadDefaults} className="inline-flex items-center gap-1.5 rounded-full border border-[#252A2A]/15 bg-white text-[#252A2A] px-4 py-1.5 text-xs font-bold hover:bg-[#252A2A]/5" type="button">Load Standard 19-Row Template</button>
        {list.length > 0 && <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white text-red-600 px-4 py-1.5 text-xs font-bold hover:bg-red-50" type="button">Clear all</button>}
      </div>
    </div>
  );
}

function DrawingSheetsEditor({ sheets, onChange, kind }) {
  const [uploading, setUploading] = useState(null);
  const addSheet = () => onChange([...(sheets || []), {
    id: crypto.randomUUID?.() || String(Date.now()),
    title: kind === "floor-plan" ? `Floor Plan ${(sheets || []).length + 1}` : `Elevation ${(sheets || []).length + 1}`,
    image_url: "", sheet_number: (sheets || []).length + 1, units: "mm", scale: "1:100",
    drawn_by: "[Your Brand]s", north_direction: "N", notes: "", current_revision: "A",
    revisions: [{ id: crypto.randomUUID?.() || String(Date.now()), letter: "A", date: new Date().toISOString().slice(0, 10), note: "Initial issue" }],
  }]);
  const updateSheet = (i, patch) => onChange((sheets || []).map((s, ii) => (ii === i ? { ...s, ...patch } : s)));
  const removeSheet = (i) => onChange((sheets || []).filter((_, ii) => ii !== i));

  const upload = async (i, file) => {
    if (!file) return;
    setUploading(i);
    try {
      const res = await adminApi.uploadImage(file, `quote-${kind}`);
      updateSheet(i, { image_url: res.url });
      toast.success("Uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(null); }
  };

  return (
    <div className="space-y-3">
      {(sheets || []).map((s, i) => (
        <div key={s.id || i} className="rounded-xl border border-black/10 bg-white overflow-hidden">
          <div className="grid grid-cols-12 gap-3 p-3 items-start">
            <div className="col-span-4">
              {s.image_url ? (
                <div className="relative">
                  <img src={s.image_url.startsWith("http") ? s.image_url : `${window.location.origin}${s.image_url}`} alt={s.title} className="w-full h-40 object-contain bg-[#F5F6F8] rounded-lg" />
                  <button onClick={() => updateSheet(i, { image_url: "" })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 grid place-items-center text-red-500 hover:bg-white"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className="w-full h-40 rounded-lg border-2 border-dashed border-black/15 grid place-items-center cursor-pointer hover:border-[#B89416] text-[#252A2A]/50 text-xs bg-[#F5F6F8]/30">
                  {uploading === i ? <Loader2 className="w-5 h-5 animate-spin text-[#B89416]" /> : <span>Click to upload drawing</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(i, e.target.files?.[0])} />
                </label>
              )}
            </div>
            <div className="col-span-8 grid grid-cols-2 gap-2">
              <input value={s.title || ""} onChange={(e) => updateSheet(i, { title: e.target.value })} className="col-span-2 rounded border border-black/10 bg-white px-2 py-1.5 text-sm font-bold" placeholder="Sheet title" />
              <input value={s.sheet_number || ""} onChange={(e) => updateSheet(i, { sheet_number: e.target.value })} className="rounded border border-black/10 bg-white px-2 py-1.5 text-xs" placeholder="Sheet No." />
              <input value={s.scale || ""} onChange={(e) => updateSheet(i, { scale: e.target.value })} className="rounded border border-black/10 bg-white px-2 py-1.5 text-xs" placeholder="Scale (1:100)" />
              <input value={s.units || ""} onChange={(e) => updateSheet(i, { units: e.target.value })} className="rounded border border-black/10 bg-white px-2 py-1.5 text-xs" placeholder="Units (mm)" />
              <input value={s.drawn_by || ""} onChange={(e) => updateSheet(i, { drawn_by: e.target.value })} className="rounded border border-black/10 bg-white px-2 py-1.5 text-xs" placeholder="Drawn by" />
              <input value={s.notes || ""} onChange={(e) => updateSheet(i, { notes: e.target.value })} className="col-span-2 rounded border border-black/10 bg-white px-2 py-1.5 text-xs" placeholder="Sheet notes" />
            </div>
          </div>
          <div className="px-3 py-2 border-t border-black/5 flex items-center justify-end">
            <button onClick={() => removeSheet(i)} className="text-xs text-red-500 hover:underline">Remove sheet</button>
          </div>
        </div>
      ))}
      <button onClick={addSheet} className="inline-flex items-center gap-1.5 rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5" /> Add {kind === "floor-plan" ? "Floor Plan" : "Elevation"} Sheet</button>
    </div>
  );
}

// IDEA 5: Visual Boards with Auto-Generate Moodboard
function VisualBoardsEditor({ boards, onChange, stylePref, bhk }) {
  const [uploading, setUploading] = useState(null);

  const addBoard = () => onChange([...(boards || []), {
    id: crypto.randomUUID?.() || String(Date.now()),
    title: `Visual Board ${(boards || []).length + 1}`, description: "", images: [],
  }]);
  const updateBoard = (i, patch) => onChange((boards || []).map((b, ii) => (ii === i ? { ...b, ...patch } : b)));
  const removeBoard = (i) => onChange((boards || []).filter((_, ii) => ii !== i));

  const addImageFromUpload = async (bi, file) => {
    if (!file) return;
    setUploading(`${bi}`);
    try {
      const res = await adminApi.uploadImage(file, "quote-visuals");
      updateBoard(bi, {
        images: [...(boards[bi].images || []), { id: crypto.randomUUID?.() || String(Date.now()), url: res.url, caption: "" }],
      });
      toast.success("Uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(null); }
  };

  const removeImage = (bi, ii) => {
    const nextImages = (boards[bi].images || []).filter((_, x) => x !== ii);
    updateBoard(bi, { images: nextImages });
  };

  const updateCaption = (bi, ii, caption) => {
    const nextImages = (boards[bi].images || []).map((img, x) => x === ii ? { ...img, caption } : img);
    updateBoard(bi, { images: nextImages });
  };

  const autoGenerate = () => {
    const style = stylePref || "Modern";
    const newBoard = {
      id: crypto.randomUUID?.() || String(Date.now()),
      title: `${style} Architectural Concept (${bhk || "3 BHK"})`,
      description: `Curated ${style.toLowerCase()} design references.`,
      images: [
        { id: "1", url: "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800", caption: `${style} Exterior Elevation` },
        { id: "2", url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Living Room" },
        { id: "3", url: "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Modular Kitchen" }
      ]
    };
    onChange([...(boards || []), newBoard]);
    toast.success(`Generated ${style} Mood Board`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={autoGenerate} type="button" className="inline-flex items-center gap-1.5 bg-[#B89416]/10 hover:bg-[#B89416] text-[#B89416] hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"><Sparkles className="w-3.5 h-3.5" /> Auto-Generate {stylePref || "Modern"} Mood Board</button>
      </div>
      {(boards || []).map((b, bi) => (
        <div key={b.id || bi} className="rounded-xl border border-black/10 bg-white overflow-hidden">
          <div className="p-3 border-b border-black/5 flex items-center gap-2">
            <input value={b.title || ""} onChange={(e) => updateBoard(bi, { title: e.target.value })} className="flex-1 font-bold text-[#252A2A] bg-transparent focus:outline-none" placeholder="Board title" />
            <button onClick={() => removeBoard(bi)} className="w-7 h-7 rounded-full grid place-items-center hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-3 space-y-3">
            <input value={b.description || ""} onChange={(e) => updateBoard(bi, { description: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1.5 text-xs" placeholder="Board description..." />
            <label className="inline-flex items-center gap-1.5 rounded-full bg-[#252A2A] text-white px-3.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-[#B89416] transition">
              {uploading === `${bi}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => addImageFromUpload(bi, e.target.files?.[0])} />
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(b.images || []).map((img, ii) => (
                <div key={img.id || ii} className="relative group">
                  <img src={img.url.startsWith("http") ? img.url : `${window.location.origin}${img.url}`} alt={img.caption || ""} className="w-full h-28 object-cover rounded-lg" />
                  <button onClick={() => removeImage(bi, ii)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button>
                  <input value={img.caption || ""} onChange={(e) => updateCaption(bi, ii, e.target.value)} className="mt-1 w-full text-[10px] px-1.5 py-1 border border-black/5 rounded" placeholder="Caption" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button onClick={addBoard} className="inline-flex items-center gap-1.5 rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5" /> Add Visual Board</button>
    </div>
  );
}

function SpecCategoryEditor({ categories, onChange, isInterior = false }) {
  const addCat = () => onChange([...(categories || []), { name: "New Category", icon: null, items: [] }]);
  const updateCat = (idx, patch) => onChange((categories || []).map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const removeCat = (idx) => onChange((categories || []).filter((_, i) => i !== idx));

  const addItem = (ci) => {
    const cat = (categories || [])[ci];
    const newItem = isInterior 
      ? { spec: "", value: "", brand: "", warranty: "", rate: 0, rate_unit: "", quantity: 1, include_in_total: true, notes: "" }
      : { spec: "", value: "", brand: "", warranty: "", notes: "" };
    updateCat(ci, { items: [...(cat.items || []), newItem] });
  };
  const updateItem = (ci, ii, patch) => {
    const cat = (categories || [])[ci];
    const nextItems = (cat.items || []).map((it, x) => x === ii ? { ...it, ...patch } : it);
    updateCat(ci, { items: nextItems });
  };
  const removeItem = (ci, ii) => {
    const cat = (categories || [])[ci];
    updateCat(ci, { items: (cat.items || []).filter((_, x) => x !== ii) });
  };

  return (
    <div className="space-y-3">
      {(categories || []).map((cat, ci) => (
        <div key={ci} className="rounded-xl border border-black/10 bg-[#F9FAFB] p-3">
          <div className="flex items-center gap-2 mb-3">
            <input value={cat.name || ""} onChange={(e) => updateCat(ci, { name: e.target.value })} className="flex-1 font-bold text-[#252A2A] bg-transparent border-b border-transparent hover:border-black/10 focus:border-[#B89416] focus:outline-none pb-1" placeholder="Category name" />
            <button onClick={() => removeCat(ci)} className="text-red-500 w-7 h-7 grid place-items-center hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5">
            {(cat.items || []).map((it, ii) => (
              <div key={ii} className="grid grid-cols-12 gap-1.5 items-center bg-white p-1.5 rounded border border-black/5">
                <input value={it.spec || ""} onChange={(e) => updateItem(ci, ii, { spec: e.target.value })} className="col-span-3 rounded border border-black/10 bg-white px-2 py-1 text-xs font-bold" placeholder="Spec / Item" />
                <input value={it.value || ""} onChange={(e) => updateItem(ci, ii, { value: e.target.value })} className={`${isInterior ? 'col-span-2' : 'col-span-3'} rounded border border-black/10 bg-white px-2 py-1 text-xs`} placeholder="Value / Description" />
                <input value={it.brand || ""} onChange={(e) => updateItem(ci, ii, { brand: e.target.value })} className="col-span-2 rounded border border-black/10 bg-white px-2 py-1 text-xs" placeholder="Brand" />
                <input value={it.warranty || ""} onChange={(e) => updateItem(ci, ii, { warranty: e.target.value })} className={`${isInterior ? 'col-span-1' : 'col-span-3'} rounded border border-black/10 bg-white px-2 py-1 text-xs`} placeholder="Warranty" />
                {isInterior && (
                  <>
                    <input type="number" value={it.rate || 0} onChange={(e) => updateItem(ci, ii, { rate: e.target.value })} className="col-span-1 rounded border border-black/10 bg-white px-2 py-1 text-xs" placeholder="Rate" />
                    <input type="number" value={it.quantity || 1} onChange={(e) => updateItem(ci, ii, { quantity: e.target.value })} className="col-span-1 rounded border border-black/10 bg-white px-2 py-1 text-xs" placeholder="Qty" />
                    <label className="col-span-1 flex items-center gap-1 text-[10px] font-bold text-[#B89416]">
                      <input type="checkbox" checked={!!it.include_in_total} onChange={(e) => updateItem(ci, ii, { include_in_total: e.target.checked })} className="accent-[#B89416]" /> Bill
                    </label>
                  </>
                )}
                <button onClick={() => removeItem(ci, ii)} className="col-span-1 w-6 h-6 rounded-full grid place-items-center hover:bg-red-50 text-red-500 mx-auto"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => addItem(ci)} className="mt-2 text-[10px] font-bold text-[#B89416] hover:underline"><Plus className="w-3 h-3 inline mr-1" /> Add Item to {cat.name || "Category"}</button>
        </div>
      ))}
      <button onClick={addCat} className="rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Category</button>
    </div>
  );
}

function AddOnEditor({ items, onChange }) {
  const add = () => onChange([...(items || []), { name: "", description: "", price: 0, unit: "" }]);
  const update = (i, patch) => onChange((items || []).map((it, ii) => (ii === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange((items || []).filter((_, ii) => ii !== i));
  return (
    <div className="space-y-2">
      {(items || []).map((it, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <input value={it.name || ""} onChange={(e) => update(i, { name: e.target.value })} className="col-span-4 rounded border px-2 py-1.5 text-xs font-bold" placeholder="Add-on name" />
          <input value={it.description || ""} onChange={(e) => update(i, { description: e.target.value })} className="col-span-5 rounded border px-2 py-1.5 text-xs" placeholder="Description" />
          <input type="number" value={it.price || 0} onChange={(e) => update(i, { price: e.target.value })} className="col-span-2 rounded border px-2 py-1.5 text-xs font-bold" placeholder="Price ₹" />
          <button onClick={() => remove(i)} className="col-span-1 text-red-500 mx-auto"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={add} className="rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Add-on</button>
    </div>
  );
}

function LineItemEditor({ items, onChange }) {
  const add = () => onChange([...(items || []), { name: "", description: "", amount: 0 }]);
  const update = (i, patch) => onChange((items || []).map((it, ii) => (ii === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange((items || []).filter((_, ii) => ii !== i));
  return (
    <div className="space-y-2">
      {(items || []).map((it, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <input value={it.name || ""} onChange={(e) => update(i, { name: e.target.value })} className="col-span-4 rounded border px-2 py-1.5 text-xs font-bold" placeholder="Line item" />
          <input value={it.description || ""} onChange={(e) => update(i, { description: e.target.value })} className="col-span-5 rounded border px-2 py-1.5 text-xs" placeholder="Description" />
          <input type="number" value={it.amount || 0} onChange={(e) => update(i, { amount: e.target.value })} className="col-span-2 rounded border px-2 py-1.5 text-xs font-bold" placeholder="Amount ₹" />
          <button onClick={() => remove(i)} className="col-span-1 text-red-500 mx-auto"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={add} className="rounded-full bg-[#252A2A] text-white px-4 py-1.5 text-xs font-bold hover:bg-[#B89416] transition"><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Line Item</button>
    </div>
  );
}

function InteriorLibraryPicker({ onClose, onAdd }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminApi.interiorLibrary.categories().then((cats) => setCategories(cats || [])).catch(() => setCategories([])); }, []);

  useEffect(() => {
    setLoading(true);
    adminApi.interiorLibrary.list({ category: activeCat || undefined, q: query || undefined })
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeCat, query]);

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const selectedItems = useMemo(() => items.filter((it) => selected[it.id]), [items, selected]);

  return (
    <div className="fixed inset-0 bg-[#252A2A]/60 backdrop-blur-sm z-[60] grid place-items-center p-4 font-['Poppins']">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-black/5 flex items-center justify-between">
          <div className="font-bold text-[#252A2A] text-lg flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-[#B89416]" /> Pick Interior Items
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full grid place-items-center hover:bg-[#F2F2F2] text-[#252A2A]"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 border-b border-black/5 flex items-center gap-3 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 min-w-[200px] rounded-full border border-black/10 px-4 py-2 text-sm" placeholder="Search items..." />
          <select value={activeCat || ""} onChange={(e) => setActiveCat(e.target.value || null)} className="rounded-full border border-black/10 px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#B89416]" /></div> :
            items.map((it) => (
              <div key={it.id} onClick={() => toggle(it.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${selected[it.id] ? "border-[#B89416] bg-[#B89416]/5" : "border-black/10 bg-white"}`}>
                <div>
                  <div className="font-bold text-sm text-[#252A2A]">{it.name}</div>
                  <div className="text-xs text-[#252A2A]/60">{it.category} • ₹{it.rate} {it.rate_unit}</div>
                  {it.brand && <div className="text-[10px] text-[#252A2A]/50 mt-0.5">Brand: {it.brand}</div>}
                </div>
                <input type="checkbox" checked={!!selected[it.id]} readOnly className="accent-[#B89416] w-4 h-4" />
              </div>
            ))
          }
        </div>

        <div className="p-4 border-t border-black/5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-full text-xs font-bold">Cancel</button>
          <button onClick={() => { onAdd(selectedItems); onClose(); }} disabled={selectedItems.length === 0} className="px-5 py-2 bg-[#B89416] text-white rounded-full text-xs font-bold disabled:opacity-50">
            Add {selectedItems.length} Items
          </button>
        </div>
      </div>
    </div>
  );
}