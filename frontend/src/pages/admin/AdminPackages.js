/**
 * AdminPackages — deep structured editor for construction Packages.
 *
 * Replaces the raw-JSON editor with a rich UI that lets admins edit every
 * field a package exposes: pricing, timeline, warranty, highlights, deep
 * spec categories (with items & brand/warranty/notes), scope of work,
 * exclusions, add-ons, milestone-based payment schedule and package FAQs.
 *
 * Saves via PUT /api/packages/{id}. Because the PDF brochure endpoint
 * (/api/packages/{slug}/brochure(.pdf)) reads live from Mongo on every
 * request, any change here is reflected on the public site AND in every
 * newly-downloaded brochure instantly.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, publicApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, X, ChevronDown, ChevronRight, Pencil, RefreshCw,
  ImageOff, FileDown, ExternalLink, GripVertical, Eye, History,
} from "lucide-react";
import { ImageUploader, AIAssistButton, VersionsPanel, PreviewModal } from "@/pages/admin/PackageEditorHelpers";

const TIER_OPTIONS = ["basic", "essential", "standard", "premium"];

const SECTION_TABS = [
  { key: "basics", label: "Basics" },
  { key: "highlights", label: "Highlights" },
  { key: "specs", label: "Specifications" },
  { key: "scope", label: "Scope & Exclusions" },
  { key: "addons", label: "Add-ons" },
  { key: "schedule", label: "Payment Schedule" },
  { key: "faqs", label: "FAQs" },
  { key: "history", label: "Version History" },
];

/* ------------------------------------------------------------------ */
/* Small primitives                                                    */
/* ------------------------------------------------------------------ */

function Label({ children, required }) {
  return (
    <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-1">
      {children}{required ? " *" : ""}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, testId, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(type === "number" ? Number(e.target.value || 0) : e.target.value)}
      data-testid={testId}
      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
    />
  );
}

function TextArea({ value, onChange, rows = 3, placeholder, testId }) {
  return (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      data-testid={testId}
      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm resize-y"
    />
  );
}

function BoolSwitch({ value, onChange, label, testId }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none" data-testid={testId}>
      <span
        className={`w-10 h-6 rounded-full relative transition ${value ? "bg-brand-orange" : "bg-black/15"}`}
        onClick={() => onChange(!value)}
      >
        <span className={`absolute top-0.5 ${value ? "left-4" : "left-0.5"} w-5 h-5 rounded-full bg-white shadow transition-all`} />
      </span>
      <span className="text-sm text-brand-navy/80">{label}</span>
    </label>
  );
}

/**
 * HeadingsBlock — compact editor for the eyebrow / title / subtitle strings
 * a section shows on the public page. Every field is optional so admins can
 * leave a placeholder for the built-in default, and can hit "Reset" per field
 * to blank it out. AI Rewrite pill is available on title-ish fields.
 */
function HeadingsBlock({ title, fields, editing, setField }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-2xl border border-brand-orange/25 bg-brand-orange/5 p-3" data-testid="headings-block">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Headings</span>
          <span className="text-sm text-brand-navy font-semibold">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-brand-navy/50 transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] uppercase tracking-widest text-brand-navy/50">{f.label}</div>
                <div className="flex items-center gap-1.5">
                  {editing[f.key] && (
                    <button
                      type="button"
                      onClick={() => setField({ [f.key]: null })}
                      className="text-[10px] text-brand-navy/50 hover:text-red-500"
                      title="Reset to default"
                    >
                      reset
                    </button>
                  )}
                  {f.ai && (
                    <AIAssistButton
                      text={editing[f.key] || f.placeholder}
                      purpose={f.purpose || "copy"}
                      onPick={(v) => setField({ [f.key]: v })}
                      testId={`ai-${f.key}`}
                    />
                  )}
                </div>
              </div>
              {f.multiline ? (
                <textarea
                  value={editing[f.key] ?? ""}
                  onChange={(e) => setField({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={2}
                  data-testid={`headings-${f.key}`}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm resize-y"
                />
              ) : (
                <input
                  value={editing[f.key] ?? ""}
                  onChange={(e) => setField({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  data-testid={`headings-${f.key}`}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-[10px] text-brand-navy/40 italic">
        Leave blank to use the built-in default text.
      </div>
    </div>
  );
}

function ImageInput({ value, onChange, testId }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-brand-bg grid place-items-center border border-black/5">
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageOff className="w-4 h-4 text-brand-navy/40" />}
      </div>
      <input
        value={value ?? ""}
        placeholder="Paste image URL (Unsplash, CDN, etc.)"
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
      />
    </div>
  );
}

/* Reusable row list — used for highlights, scope, exclusions          */
function StringListEditor({ items, onChange, placeholder, testId }) {
  const list = Array.isArray(items) ? items : [];
  const setAt = (i, v) => onChange(list.map((x, idx) => (idx === i ? v : x)));
  const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, ""]);
  return (
    <div className="space-y-2" data-testid={testId}>
      {list.length === 0 && (
        <div className="text-xs text-brand-navy/50 italic">No items yet. Click "Add row" to start.</div>
      )}
      {list.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-brand-navy/30 shrink-0" />
          <input
            value={val}
            onChange={(e) => setAt(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
          />
          <button
            onClick={() => removeAt(i)}
            className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 grid place-items-center"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="btn-ghost text-xs py-1.5 px-3">
        <Plus className="w-3.5 h-3.5" /> Add row
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Spec Categories editor                                              */
/* ------------------------------------------------------------------ */

function SpecCategoryEditor({ categories, onChange }) {
  const list = Array.isArray(categories) ? categories : [];
  const [openIdx, setOpenIdx] = useState(0);

  const setCat = (i, patch) => onChange(list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeCat = (i) => onChange(list.filter((_, idx) => idx !== i));
  const addCat = () => onChange([...list, { name: "New Category", icon: "", items: [] }]);

  const setItemAt = (ci, ii, patch) => {
    const cat = list[ci];
    const newItems = (cat.items || []).map((it, idx) => (idx === ii ? { ...it, ...patch } : it));
    setCat(ci, { items: newItems });
  };
  const removeItem = (ci, ii) => setCat(ci, { items: (list[ci].items || []).filter((_, idx) => idx !== ii) });
  const addItem = (ci) =>
    setCat(ci, { items: [...(list[ci].items || []), { spec: "", value: "", brand: "", warranty: "", notes: "" }] });

  return (
    <div className="space-y-3" data-testid="spec-categories-editor">
      {list.length === 0 && (
        <div className="text-xs text-brand-navy/50 italic">No spec categories yet.</div>
      )}
      {list.map((cat, ci) => (
        <div key={ci} className="rounded-2xl border border-black/10 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-bg/60">
            <button
              onClick={() => setOpenIdx(openIdx === ci ? -1 : ci)}
              className="w-7 h-7 rounded-full grid place-items-center hover:bg-white transition"
              aria-label="Expand"
            >
              {openIdx === ci ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <input
              value={cat.name || ""}
              onChange={(e) => setCat(ci, { name: e.target.value })}
              placeholder="Category name (e.g. Structure & Foundation)"
              className="flex-1 bg-transparent outline-none font-semibold text-brand-navy text-sm"
              data-testid={`spec-cat-name-${ci}`}
            />
            <input
              value={cat.icon || ""}
              onChange={(e) => setCat(ci, { icon: e.target.value })}
              placeholder="lucide icon"
              className="w-32 bg-transparent outline-none text-xs text-brand-navy/60 border-l border-black/10 pl-2"
            />
            <button
              onClick={() => removeCat(ci)}
              className="w-7 h-7 rounded-full text-red-500 hover:bg-red-50 grid place-items-center"
              aria-label="Remove category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {openIdx === ci && (
            <div className="p-3 space-y-2">
              {(cat.items || []).length === 0 && (
                <div className="text-xs text-brand-navy/50 italic">No spec rows yet.</div>
              )}
              {(cat.items || []).map((it, ii) => (
                <div key={ii} className="grid grid-cols-1 md:grid-cols-[minmax(120px,1fr)_minmax(160px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_36px] gap-2 items-start">
                  <input
                    value={it.spec || ""}
                    onChange={(e) => setItemAt(ci, ii, { spec: e.target.value })}
                    placeholder="Spec (e.g. Cement)"
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs"
                  />
                  <input
                    value={it.value || ""}
                    onChange={(e) => setItemAt(ci, ii, { value: e.target.value })}
                    placeholder="Value (e.g. UltraTech PPC 53 Grade)"
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs"
                  />
                  <input
                    value={it.brand || ""}
                    onChange={(e) => setItemAt(ci, ii, { brand: e.target.value })}
                    placeholder="Brand"
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs"
                  />
                  <input
                    value={it.warranty || ""}
                    onChange={(e) => setItemAt(ci, ii, { warranty: e.target.value })}
                    placeholder="Warranty"
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs"
                  />
                  <input
                    value={it.notes || ""}
                    onChange={(e) => setItemAt(ci, ii, { notes: e.target.value })}
                    placeholder="Notes"
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs"
                  />
                  <button
                    onClick={() => removeItem(ci, ii)}
                    className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 grid place-items-center"
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => addItem(ci)} className="btn-ghost text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" /> Add spec row
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={addCat} className="btn-primary text-xs py-2 px-4" data-testid="add-spec-cat">
        <Plus className="w-3.5 h-3.5" /> Add category
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add-ons editor                                                      */
/* ------------------------------------------------------------------ */

function AddonsEditor({ addons, onChange }) {
  const list = Array.isArray(addons) ? addons : [];
  const setAt = (i, patch) => onChange(list.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, { name: "", description: "", price: "", unit: "", image: "" }]);
  return (
    <div className="space-y-3" data-testid="addons-editor">
      {list.length === 0 && <div className="text-xs text-brand-navy/50 italic">No add-ons yet.</div>}
      {list.map((a, i) => (
        <div key={i} className="rounded-2xl border border-black/10 bg-white p-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_100px_36px] gap-2">
            <input
              value={a.name || ""}
              onChange={(e) => setAt(i, { name: e.target.value })}
              placeholder="Add-on name (e.g. Modular Kitchen)"
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm"
            />
            <input
              value={a.price || ""}
              onChange={(e) => setAt(i, { price: e.target.value })}
              placeholder="Price (e.g. ₹1,25,000)"
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm"
            />
            <input
              value={a.unit || ""}
              onChange={(e) => setAt(i, { unit: e.target.value })}
              placeholder="Unit"
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs"
            />
            <button
              onClick={() => removeAt(i)}
              className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 grid place-items-center"
              aria-label="Remove add-on"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={a.description || ""}
            onChange={(e) => setAt(i, { description: e.target.value })}
            rows={2}
            placeholder="Short description"
            className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-xs resize-y"
          />
          <ImageUploader
            value={a.image}
            onChange={(v) => setAt(i, { image: v })}
            category="addons"
            testId={`addon-image-${i}`}
          />
        </div>
      ))}
      <button onClick={add} className="btn-primary text-xs py-2 px-4" data-testid="add-addon">
        <Plus className="w-3.5 h-3.5" /> Add add-on
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Payment schedule editor                                             */
/* ------------------------------------------------------------------ */

function ScheduleEditor({ schedule, onChange }) {
  const list = Array.isArray(schedule) ? schedule : [];
  const setAt = (i, patch) => onChange(list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, { milestone: "", percentage: 0, description: "" }]);
  const total = list.reduce((acc, s) => acc + Number(s.percentage || 0), 0);
  return (
    <div className="space-y-2" data-testid="schedule-editor">
      {list.map((s, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-[minmax(160px,1fr)_100px_2fr_36px] gap-2 items-start">
          <input
            value={s.milestone || ""}
            onChange={(e) => setAt(i, { milestone: e.target.value })}
            placeholder="Milestone (e.g. Booking Advance)"
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm"
          />
          <input
            type="number"
            value={s.percentage ?? 0}
            onChange={(e) => setAt(i, { percentage: Number(e.target.value || 0) })}
            placeholder="%"
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm"
          />
          <input
            value={s.description || ""}
            onChange={(e) => setAt(i, { description: e.target.value })}
            placeholder="Description"
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm"
          />
          <button
            onClick={() => removeAt(i)}
            className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 grid place-items-center"
            aria-label="Remove milestone"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2">
        <button onClick={add} className="btn-primary text-xs py-2 px-4" data-testid="add-milestone">
          <Plus className="w-3.5 h-3.5" /> Add milestone
        </button>
        <div className={`text-xs font-semibold ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}>
          Total: {total}% {total !== 100 && <span className="opacity-70">(should equal 100)</span>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ editor                                                          */
/* ------------------------------------------------------------------ */

function FaqEditor({ faqs, onChange }) {
  const list = Array.isArray(faqs) ? faqs : [];
  const setAt = (i, patch) => onChange(list.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, { question: "", answer: "" }]);
  return (
    <div className="space-y-2" data-testid="faq-editor">
      {list.map((f, i) => (
        <div key={i} className="rounded-2xl border border-black/10 bg-white p-3 space-y-2">
          <div className="flex items-start gap-2">
            <input
              value={f.question || ""}
              onChange={(e) => setAt(i, { question: e.target.value })}
              placeholder="Question"
              className="flex-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm font-semibold"
            />
            <button
              onClick={() => removeAt(i)}
              className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 grid place-items-center shrink-0"
              aria-label="Remove FAQ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={f.answer || ""}
            onChange={(e) => setAt(i, { answer: e.target.value })}
            rows={3}
            placeholder="Answer"
            className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 outline-none focus:border-brand-orange text-sm resize-y"
          />
        </div>
      ))}
      <button onClick={add} className="btn-primary text-xs py-2 px-4" data-testid="add-faq">
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
}

/* ================================================================== */
/* Main component                                                      */
/* ================================================================== */

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("basics");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.list("packages");
      setPackages(list);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[AdminPackages] list failed", e);
      toast.error("Failed to load packages");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (pkg) => {
    // Ensure every array field is initialised to avoid undefined errors in the editor
    setEditing({
      highlights: [],
      spec_categories: [],
      scope_of_work: [],
      exclusions: [],
      addons: [],
      payment_schedule: [],
      package_faqs: [],
      sections: [],
      ...pkg,
    });
    setTab("basics");
  };

  const startCreate = () => {
    setEditing({
      __isNew: true,
      name: "",
      slug: "",
      tier: "essential",
      price_display: "",
      price_unit: "/Sq.ft",
      price_per_sqft: 0,
      tagline: "",
      description: "",
      hero_image: "",
      timeline_months: "",
      warranty_years: 10,
      min_area_sqft: 800,
      highlights: [],
      sections: [],
      spec_categories: [],
      scope_of_work: [],
      exclusions: [],
      addons: [],
      payment_schedule: [],
      package_faqs: [],
      is_most_popular: false,
      accent_color: "#B89416",
      cta_label: "View Details",
      sort_order: (packages?.length || 0) + 1,
      is_published: true,
    });
    setTab("basics");
  };

  const close = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = { ...editing };
    const isNew = payload.__isNew;
    delete payload.__isNew;
    try {
      if (isNew) {
        await adminApi.create("packages", payload);
        toast.success("Package created");
      } else {
        await adminApi.update("packages", payload.id, payload);
        toast.success("Package updated — site + PDF are live");
      }
      // Bust caches for the frontend so users see the new content immediately.
      // (Public bootstrap and detail queries always go straight to Mongo, so
      // this is mostly a nudge for any user with a stale bundle.)
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch (cacheErr) {
        // eslint-disable-next-line no-console
        console.warn("[AdminPackages] cache bust failed (non-fatal)", cacheErr);
      }
      close();
      await load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[AdminPackages] save failed", e);
      toast.error(e?.response?.data?.detail || "Failed to save package");
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await adminApi.remove("packages", id);
      toast.success("Deleted");
      await load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[AdminPackages] delete failed", e);
      toast.error("Failed to delete");
    }
  };

  const openPdf = async (pkg) => {
    // Route-through the auth token so admins get the latest generated file.
    const url = publicApi.brochureUrl(pkg.slug);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const setField = (patch) => setEditing((e) => ({ ...e, ...patch }));

  return (
    <div data-testid="admin-packages-root">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="section-eyebrow">CMS</div>
          <h1 className="mt-2 text-brand-navy font-bold">Packages</h1>
          <p className="text-sm text-brand-navy/60 mt-1">
            Edit every detail of your construction packages — specs, add-ons, payment schedule and FAQs. Changes go live on the site AND in every newly-downloaded PDF brochure the moment you save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost text-sm py-2 px-4" data-testid="admin-packages-refresh">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={startCreate} className="btn-primary text-sm py-2 px-5" data-testid="admin-packages-create">
            <Plus className="w-4 h-4" /> New package
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full text-sm text-brand-navy/60">Loading packages…</div>
        ) : packages.length === 0 ? (
          <div className="col-span-full text-sm text-brand-navy/60">No packages yet.</div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              data-testid={`pkg-card-${pkg.slug}`}
              className={`rounded-3xl bg-white border shadow-soft p-5 transition ${pkg.is_most_popular ? "border-brand-orange" : "border-black/5"}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-brand-navy/50">{pkg.tier}</div>
                {pkg.is_most_popular && <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange">Most Popular</span>}
              </div>
              <div className="mt-1 font-bold text-brand-navy text-lg">{pkg.name}</div>
              <div className="text-brand-orange font-bold text-xl mt-1">
                {pkg.price_display}
                {pkg.price_unit && <span className="text-brand-navy/50 text-xs font-normal ml-1">{pkg.price_unit}</span>}
              </div>
              <div className="mt-1 text-xs text-brand-navy/60 line-clamp-2">{pkg.tagline}</div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-brand-navy/60">
                <Chip>Timeline: {pkg.timeline_months || "—"}</Chip>
                <Chip>{pkg.warranty_years || 0} yr warranty</Chip>
                <Chip>{(pkg.spec_categories || []).length} spec categories</Chip>
                <Chip>{(pkg.addons || []).length} add-ons</Chip>
                <Chip>{(pkg.package_faqs || []).length} FAQs</Chip>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-2">
                <button
                  onClick={() => startEdit(pkg)}
                  data-testid={`pkg-edit-${pkg.slug}`}
                  className="btn-primary text-xs py-2 px-3 flex-1"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => openPdf(pkg)}
                  className="btn-ghost text-xs py-2 px-3"
                  title="Preview PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`/packages/${pkg.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs py-2 px-3"
                  title="View live"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => remove(pkg.id)}
                  className="btn-ghost text-xs py-2 px-3 text-red-500 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DRAWER EDITOR */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            data-testid="pkg-editor-drawer"
          >
            <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" onClick={close} />
            <motion.div
              initial={{ x: 700 }}
              animate={{ x: 0 }}
              exit={{ x: 700 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="absolute top-0 right-0 h-full w-full max-w-3xl bg-white shadow-premium flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-black/5 flex items-center justify-between shrink-0">
                <div>
                  <div className="section-eyebrow">{editing.__isNew ? "Create Package" : "Edit Package"}</div>
                  <div className="font-semibold text-brand-navy">{editing.name || "New package"}</div>
                </div>
                <button onClick={close} className="w-9 h-9 rounded-full grid place-items-center hover:bg-brand-navy/5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-5 pt-3 border-b border-black/5 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                {SECTION_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    data-testid={`pkg-tab-${t.key}`}
                    className={`text-xs px-3 py-2 rounded-t-lg whitespace-nowrap transition ${
                      tab === t.key ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-bg"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {tab === "basics" && <BasicsTab editing={editing} setField={setField} />}
                {tab === "highlights" && (
                  <div className="space-y-4">
                    <HeadingsBlock
                      title="Overview section headings"
                      fields={[
                        { key: "overview_eyebrow", label: "Eyebrow label", placeholder: "Overview", ai: false },
                        { key: "overview_title", label: "Section title", placeholder: `Why choose ${editing.name || "…"}?`, ai: true, purpose: "tagline" },
                        { key: "highlights_eyebrow", label: "Highlights card eyebrow", placeholder: "Key Highlights" },
                        { key: "covered_eyebrow", label: "\"What's covered\" eyebrow", placeholder: "What's covered" },
                      ]}
                      editing={editing}
                      setField={setField}
                    />
                    <Label>Highlights (bullet list on the package card, Overview tab & PDF)</Label>
                    <StringListEditor
                      items={editing.highlights}
                      onChange={(v) => setField({ highlights: v })}
                      placeholder="e.g. 10 Year Warranty"
                      testId="highlights-editor"
                    />
                  </div>
                )}
                {tab === "specs" && (
                  <div className="space-y-4">
                    <HeadingsBlock
                      title="Specifications section headings"
                      fields={[
                        { key: "specs_eyebrow", label: "Eyebrow label", placeholder: "Deep Specifications" },
                        { key: "specs_title", label: "Section title", placeholder: "Every material, brand & spec", ai: true, purpose: "tagline" },
                        { key: "specs_subtitle", label: "Section subtitle", placeholder: "Full transparency — exact brands and grades of every material used in your home.", multiline: true, ai: true, purpose: "description" },
                      ]}
                      editing={editing}
                      setField={setField}
                    />
                    <Label>Deep Specifications</Label>
                    <p className="text-xs text-brand-navy/50 mb-3">
                      Each category (e.g. "Structure & Foundation") holds rows for individual specs — cement brand, warranty, etc. These populate the "Specifications" tab of the package page AND the PDF brochure.
                    </p>
                    <SpecCategoryEditor
                      categories={editing.spec_categories}
                      onChange={(v) => setField({ spec_categories: v })}
                    />
                  </div>
                )}
                {tab === "scope" && (
                  <div className="space-y-4">
                    <HeadingsBlock
                      title="Scope & Exclusions headings"
                      fields={[
                        { key: "scope_eyebrow", label: "Scope eyebrow", placeholder: "Scope of Work" },
                        { key: "scope_title", label: "Scope title", placeholder: "What's included", ai: true, purpose: "tagline" },
                        { key: "exclusions_eyebrow", label: "Exclusions eyebrow", placeholder: "Exclusions" },
                        { key: "exclusions_title", label: "Exclusions title", placeholder: "Not included", ai: true, purpose: "tagline" },
                      ]}
                      editing={editing}
                      setField={setField}
                    />
                    <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label>Scope of Work (what's included)</Label>
                      <StringListEditor
                        items={editing.scope_of_work}
                        onChange={(v) => setField({ scope_of_work: v })}
                        placeholder="e.g. Structural drawings"
                        testId="scope-editor"
                      />
                    </div>
                    <div>
                      <Label>Exclusions (what's NOT included)</Label>
                      <StringListEditor
                        items={editing.exclusions}
                        onChange={(v) => setField({ exclusions: v })}
                        placeholder="e.g. Municipal approvals"
                        testId="exclusions-editor"
                      />
                    </div>
                  </div>
                  </div>
                )}
                {tab === "addons" && (
                  <div className="space-y-4">
                    <HeadingsBlock
                      title="Add-ons section headings"
                      fields={[
                        { key: "addons_eyebrow", label: "Eyebrow label", placeholder: "Add-ons & Upgrades" },
                        { key: "addons_title", label: "Section title", placeholder: "Personalise your home", ai: true, purpose: "tagline" },
                      ]}
                      editing={editing}
                      setField={setField}
                    />
                    <Label>Add-ons & Upgrades</Label>
                    <AddonsEditor addons={editing.addons} onChange={(v) => setField({ addons: v })} />
                  </div>
                )}
                {tab === "schedule" && (
                  <div className="space-y-4">
                    <HeadingsBlock
                      title="Payment Schedule headings"
                      fields={[
                        { key: "schedule_eyebrow", label: "Eyebrow label", placeholder: "Payment Schedule" },
                        { key: "schedule_title", label: "Section title", placeholder: "Pay as your home is built", ai: true, purpose: "tagline" },
                      ]}
                      editing={editing}
                      setField={setField}
                    />
                    <Label>Milestone-based Payment Schedule</Label>
                    <ScheduleEditor schedule={editing.payment_schedule} onChange={(v) => setField({ payment_schedule: v })} />
                  </div>
                )}
                {tab === "faqs" && (
                  <div className="space-y-4">
                    <HeadingsBlock
                      title="FAQs section headings"
                      fields={[
                        { key: "faqs_eyebrow", label: "Eyebrow label", placeholder: "Package FAQs" },
                        { key: "faqs_title", label: "Section title", placeholder: "Frequently asked questions", ai: true, purpose: "tagline" },
                      ]}
                      editing={editing}
                      setField={setField}
                    />
                    <Label>Package FAQs</Label>
                    <FaqEditor faqs={editing.package_faqs} onChange={(v) => setField({ package_faqs: v })} />
                  </div>
                )}
                {tab === "history" && (
                  editing.__isNew || !editing.id ? (
                    <div className="text-sm text-brand-navy/60 italic">Save the package first — version history starts from your very first save.</div>
                  ) : (
                    <VersionsPanel
                      packageId={editing.id}
                      onRestored={async () => {
                        await load();
                        const fresh = await adminApi.get("packages", editing.id).catch(() => null);
                        if (fresh) setEditing({ ...editing, ...fresh });
                      }}
                    />
                  )
                )}
              </div>

              {/* Preview modal */}
              <PreviewModal
                open={previewing}
                onClose={() => setPreviewing(false)}
                pkg={editing}
              />

              {/* Footer */}
              <div className="p-4 border-t border-black/5 flex items-center justify-between shrink-0 bg-white">
                <div className="text-[11px] text-brand-navy/50">
                  {editing.__isNew
                    ? "Package will appear on the site once saved."
                    : "Site and PDF brochure update the instant you save."}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={close} className="btn-ghost text-sm py-2 px-4">Cancel</button>
                  <button
                    onClick={() => setPreviewing(true)}
                    disabled={!editing?.slug}
                    className="btn-ghost text-sm py-2 px-4 disabled:opacity-50"
                    data-testid="pkg-preview-btn"
                    title="Preview unsaved edits"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    data-testid="pkg-save-btn"
                    className="btn-primary text-sm py-2 px-5 disabled:opacity-60"
                  >
                    <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Basics tab (top-level fields)                                       */
/* ------------------------------------------------------------------ */

function BasicsTab({ editing, setField }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label required>Name</Label>
        <TextInput value={editing.name} onChange={(v) => setField({ name: v })} testId="pkg-field-name" />
      </div>
      <div>
        <Label required>Slug (URL)</Label>
        <TextInput value={editing.slug} onChange={(v) => setField({ slug: v })} testId="pkg-field-slug" placeholder="basic / essential / standard" />
      </div>
      <div>
        <Label>Tier</Label>
        <select
          value={editing.tier || ""}
          onChange={(e) => setField({ tier: e.target.value })}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
          data-testid="pkg-field-tier"
        >
          <option value="">— select tier —</option>
          {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] uppercase tracking-widest text-brand-navy/50">Tagline</div>
          <AIAssistButton
            text={editing.tagline}
            purpose="tagline"
            onPick={(v) => setField({ tagline: v })}
            testId="ai-tagline"
          />
        </div>
        <TextInput value={editing.tagline} onChange={(v) => setField({ tagline: v })} testId="pkg-field-tagline" placeholder="e.g. Perfect Balance" />
      </div>
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] uppercase tracking-widest text-brand-navy/50">Description</div>
          <AIAssistButton
            text={editing.description}
            purpose="description"
            onPick={(v) => setField({ description: v })}
            testId="ai-description"
          />
        </div>
        <TextArea value={editing.description} onChange={(v) => setField({ description: v })} testId="pkg-field-description" placeholder="Short pitch shown on the card & hero." />
      </div>

      <div>
        <Label>Price display</Label>
        <TextInput value={editing.price_display} onChange={(v) => setField({ price_display: v })} placeholder="₹1,799" />
      </div>
      <div>
        <Label>Price unit</Label>
        <TextInput value={editing.price_unit} onChange={(v) => setField({ price_unit: v })} placeholder="/Sq.ft" />
      </div>
      <div>
        <Label>Price per sq.ft (numeric)</Label>
        <TextInput type="number" value={editing.price_per_sqft} onChange={(v) => setField({ price_per_sqft: v })} />
      </div>
      <div>
        <Label>Timeline (display)</Label>
        <TextInput value={editing.timeline_months} onChange={(v) => setField({ timeline_months: v })} placeholder="9–11 months" />
      </div>
      <div>
        <Label>Warranty (years)</Label>
        <TextInput type="number" value={editing.warranty_years} onChange={(v) => setField({ warranty_years: v })} />
      </div>
      <div>
        <Label>Min. Area (Sq.ft)</Label>
        <TextInput type="number" value={editing.min_area_sqft} onChange={(v) => setField({ min_area_sqft: v })} />
      </div>

      <div className="md:col-span-2">
        <Label>Hero image</Label>
        <ImageUploader
          value={editing.hero_image}
          onChange={(v) => setField({ hero_image: v })}
          category="packages"
          testId="pkg-hero-uploader"
        />
      </div>

      <div>
        <Label>CTA label</Label>
        <TextInput value={editing.cta_label} onChange={(v) => setField({ cta_label: v })} placeholder="View Details" />
      </div>
      <div>
        <Label>Accent color (hex)</Label>
        <TextInput value={editing.accent_color} onChange={(v) => setField({ accent_color: v })} placeholder="#B89416" />
      </div>
      <div>
        <Label>Sort order</Label>
        <TextInput type="number" value={editing.sort_order} onChange={(v) => setField({ sort_order: v })} />
      </div>
      <div className="flex items-end gap-4">
        <BoolSwitch
          value={editing.is_most_popular}
          onChange={(v) => setField({ is_most_popular: v })}
          label="Mark as Most Popular"
          testId="pkg-field-most-popular"
        />
        <BoolSwitch
          value={editing.is_published}
          onChange={(v) => setField({ is_published: v })}
          label="Published"
          testId="pkg-field-published"
        />
      </div>
    </div>
  );
}

function Chip({ children }) {
  return <span className="inline-flex items-center rounded-full bg-brand-bg px-2 py-0.5 text-[10px] text-brand-navy/70">{children}</span>;
}
