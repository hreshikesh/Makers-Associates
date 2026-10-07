import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Database,
  User,
  UploadCloud,
  Copy,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";

const NAME_RE = /^[A-Za-z ]{1,30}$/;
const PHONE91_RE = /^\+91[6-9]\d{9}$/;

function normalizePhone91(raw) {
  if (raw == null || String(raw).trim() === "") return "";
  let s = String(raw).trim().replace(/[\s-]/g, "");
  if (s.startsWith("91") && s.length === 12) s = `+${s}`;
  if (/^[6-9]\d{9}$/.test(s)) s = `+91${s}`;
  return s;
}

function forcePhone91Input(raw) {
  let s = String(raw || "").replace(/[^\d+]/g, "");
  if (!s.startsWith("+91")) {
    const digits = s.replace(/\D/g, "").replace(/^91/, "");
    return `+91${digits.slice(0, 10)}`;
  }
  return `+91${s.slice(3).replace(/\D/g, "").slice(0, 10)}`;
}

function validateTeamItem(item, fields) {
  for (const f of fields) {
    const v = item[f.name];
    const label = f.label || f.name;

    if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
      return `${label} is required`;
    }

    if (f.name === "name" && v) {
      const name = String(v).trim();
      if (name.length > 30) return "Name cannot exceed 30 characters";
      if (!NAME_RE.test(name)) return "Name: letters and spaces only (max 30)";
    }

    if (f.name === "designation" && v) {
      const d = String(v).trim();
      if (d.length > 60) return "Designation cannot exceed 60 characters";
    }

    if (f.type === "phone91" || f.type === "whatsapp_sync") {
      const p = normalizePhone91(v);
      if (p && p !== "+91" && !PHONE91_RE.test(p)) {
        return `${label} must be +91 + 10 digits (e.g. +919876543210)`;
      }
    }
  }
  return null;
}

/**
 * Entity config — API path = entity key (or collection if set).
 * Team uses /api/team (make_crud("team", "team_members", ...)) — do NOT set collection to team_members.
 */
const ENTITY_CONFIG = {
  team: {
    title: "Team Members",
    listCols: ["name", "designation", "phone", "sort_order"],
    fields: [
      { name: "name", label: "Full Name", type: "string", required: true, maxLength: 30 },
      { name: "designation", label: "Designation", type: "string", required: true, maxLength: 60 },
      { name: "photo", label: "Profile Photo", type: "image", category: "team", required: false, maxBytes: 1024 * 1024 },
      { name: "phone", label: "Phone Number", type: "phone91", required: false },
      { name: "whatsapp", label: "WhatsApp Number", type: "whatsapp_sync", syncWith: "phone", required: false },
      { name: "bio", label: "Short Bio", type: "text", required: false },
      { name: "linkedin", label: "LinkedIn URL", type: "string", required: false },
      { name: "sort_order", label: "Display Order", type: "number", required: false },
      { name: "is_published", label: "Published on site", type: "bool", required: false },
    ],
  },
  homes: {
    title: "Homes",
    listCols: ["name", "style", "area_sqft", "estimated_cost", "sort_order", "is_published"],
    fields: [
      { name: "name", type: "string", required: true },
      { name: "slug", type: "string", required: true },
      { name: "style", type: "string" },
      { name: "tagline", type: "text" },
      { name: "description", type: "text" },
      { name: "area_sqft", type: "string" },
      { name: "dimensions", type: "string" },
      { name: "bedrooms", type: "number" },
      { name: "bathrooms", type: "number" },
      { name: "floors", type: "number" },
      { name: "parking", type: "number" },
      { name: "estimated_cost", type: "string" },
      { name: "package_compatibility", type: "tags" },
      { name: "cover_image", type: "image", category: "homes" },
      { name: "gallery", type: "tags", placeholder: "Comma-separated image URLs" },
      { name: "floorplan_image", type: "image", category: "homes" },
      { name: "floor_areas", type: "json", placeholder: '[{"label":"Living","area":"320 Sq.ft"}]' },
      { name: "features", type: "tags" },
      { name: "vastu_compliant", type: "bool" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  packages: {
    title: "Packages",
    listCols: ["name", "tier", "price_display", "is_most_popular", "sort_order"],
    fields: [
      { name: "name", type: "string", required: true },
      { name: "slug", type: "string", required: true },
      { name: "tier", type: "select", options: ["basic", "essential", "standard", "premium"] },
      { name: "price_display", type: "string" },
      { name: "price_unit", type: "string" },
      { name: "price_per_sqft", type: "number" },
      { name: "tagline", type: "string" },
      { name: "description", type: "text" },
      { name: "hero_image", type: "image", category: "packages" },
      { name: "timeline_months", type: "string" },
      { name: "warranty_years", type: "number" },
      { name: "min_area_sqft", type: "number" },
      { name: "highlights", type: "tags" },
      { name: "sections", type: "json" },
      { name: "spec_categories", type: "json" },
      { name: "scope_of_work", type: "tags" },
      { name: "exclusions", type: "tags" },
      { name: "addons", type: "json" },
      { name: "payment_schedule", type: "json" },
      { name: "package_faqs", type: "json" },
      { name: "is_most_popular", type: "bool" },
      { name: "accent_color", type: "string" },
      { name: "cta_label", type: "string" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  "ai-modules": {
    collection: "ai-modules",
    title: "AI Platform Modules",
    listCols: ["name", "slug", "sort_order"],
    fields: [
      { name: "name", type: "string", required: true },
      { name: "slug", type: "string", required: true },
      { name: "tagline", type: "string" },
      { name: "icon", type: "string" },
      { name: "description", type: "text" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  "marketplace-categories": {
    collection: "marketplace-categories",
    title: "Marketplace Categories",
    listCols: ["name", "slug", "coming_soon", "sort_order"],
    fields: [
      { name: "name", type: "string", required: true },
      { name: "slug", type: "string", required: true },
      { name: "description", type: "text" },
      { name: "image", type: "image", category: "marketplace" },
      { name: "icon", type: "string" },
      { name: "coming_soon", type: "bool" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  "financial-services": {
    collection: "financial-services",
    title: "Financial Services",
    listCols: ["name", "slug", "coming_soon", "sort_order"],
    fields: [
      { name: "name", type: "string", required: true },
      { name: "slug", type: "string", required: true },
      { name: "tagline", type: "string" },
      { name: "description", type: "text" },
      { name: "icon", type: "string" },
      { name: "features", type: "tags" },
      { name: "coming_soon", type: "bool" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  testimonials: {
    title: "Testimonials",
    listCols: ["customer_name", "location", "rating", "home_purchased"],
    fields: [
      { name: "customer_name", type: "string", required: true },
      { name: "location", type: "string" },
      { name: "quote", type: "text", required: true },
      { name: "rating", type: "number" },
      { name: "avatar", type: "image", category: "testimonials" },
      { name: "video_url", type: "string" },
      { name: "home_purchased", type: "string" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  faqs: {
    title: "FAQs",
    listCols: ["question", "category", "sort_order"],
    fields: [
      { name: "question", type: "string", required: true },
      { name: "answer", type: "text", required: true },
      { name: "category", type: "string" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  blogs: {
    title: "Blogs",
    listCols: ["title", "author", "read_minutes", "sort_order"],
    fields: [
      { name: "title", type: "string", required: true },
      { name: "slug", type: "string", required: true },
      { name: "excerpt", type: "text" },
      { name: "cover_image", type: "image", category: "blogs" },
      { name: "author", type: "string" },
      { name: "author_avatar", type: "image", category: "team" },
      { name: "read_minutes", type: "number" },
      { name: "tags", type: "tags" },
      { name: "content_html", type: "richtext" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  "journey-steps": {
    collection: "journey-steps",
    title: "Journey Steps",
    listCols: ["step_no", "name", "sort_order"],
    fields: [
      { name: "step_no", type: "number", required: true },
      { name: "name", type: "string", required: true },
      { name: "description", type: "text" },
      { name: "icon", type: "string" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  "hero-sections": {
    collection: "hero-sections",
    title: "Hero Sections",
    listCols: ["key", "headline", "sort_order"],
    fields: [
      { name: "key", type: "string", required: true },
      { name: "eyebrow", type: "string" },
      { name: "headline", type: "string", required: true },
      { name: "headline_highlight", type: "string" },
      { name: "subheading", type: "text" },
      { name: "background_image", type: "image", category: "hero" },
      { name: "primary_cta_label", type: "string" },
      { name: "primary_cta_link", type: "string" },
      { name: "secondary_cta_label", type: "string" },
      { name: "secondary_cta_link", type: "string" },
      { name: "stats", type: "json" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  comparison: {
    title: "Comparison Rows",
    listCols: ["feature", "traditional", "[Your Brand]s", "sort_order"],
    fields: [
      { name: "feature", type: "string", required: true },
      { name: "traditional", type: "string" },
      { name: "[Your Brand]s", type: "string" },
      { name: "traditional_positive", type: "bool" },
      { name: "[Your Brand]s_positive", type: "bool" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  stats: {
    title: "Stats",
    listCols: ["label", "value", "sort_order"],
    fields: [
      { name: "label", type: "string", required: true },
      { name: "value", type: "string", required: true },
      { name: "icon", type: "string" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
  media: {
    title: "Media Gallery",
    listCols: ["title", "category", "sort_order"],
    fields: [
      { name: "title", type: "string" },
      { name: "url", type: "image", category: "gallery", required: true },
      { name: "category", type: "string" },
      { name: "alt", type: "string" },
      { name: "sort_order", type: "number" },
      { name: "is_published", type: "bool" },
    ],
  },
};

function emptyItem(fields) {
  const obj = {};
  fields.forEach((f) => {
    if (f.type === "bool") obj[f.name] = f.name === "is_published";
    else if (f.type === "number") obj[f.name] = 0;
    else if (f.type === "tags") obj[f.name] = [];
    else if (f.type === "json") obj[f.name] = [];
    else if (f.type === "phone91" || f.type === "whatsapp_sync") obj[f.name] = "+91";
    else obj[f.name] = "";
  });
  return obj;
}

export default function AdminEntity() {
  const { entity } = useParams();
  const cfg = ENTITY_CONFIG[entity];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  // API path: entity key unless collection is an intentional route path (hyphenated)
  const collection = cfg?.collection || entity;
  const isTeam = entity === "team";

  const load = useCallback(async () => {
    if (!collection) return;
    setLoading(true);
    try {
      const list = await adminApi.list(collection);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    setEditing(null);
    load();
  }, [load]);

  if (!cfg) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-black/5 font-['Poppins']">
        <Database className="w-10 h-10 text-[#B89416] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#252A2A]">Unknown Entity Schema</h2>
        <p className="text-sm text-[#252A2A]/60 mt-1">
          Entity <code className="text-[#B89416] bg-black/5 px-2 py-0.5 rounded">{entity}</code> is not declared.
        </p>
      </div>
    );
  }

  const startCreate = () => setEditing({ __isNew: true, ...emptyItem(cfg.fields) });
  const startEdit = (item) => {
    const next = { ...item };
    if (isTeam) {
      if (!next.phone) next.phone = "+91";
      if (!next.whatsapp) next.whatsapp = "+91";
    }
    setEditing(next);
  };
  const close = () => setEditing(null);

  const save = async () => {
    const item = { ...editing };

    // ——— Validation (INSIDE save — do not put this outside the function) ———
    if (isTeam) {
      const err = validateTeamItem(item, cfg.fields);
      if (err) {
        toast.error(err);
        return;
      }
      item.name = String(item.name || "").trim();
      item.designation = String(item.designation || "").trim();
      const phone = normalizePhone91(item.phone);
      const wa = normalizePhone91(item.whatsapp);
      item.phone = phone && phone !== "+91" ? phone : null;
      item.whatsapp = wa && wa !== "+91" ? wa : null;
    } else {
      for (const f of cfg.fields) {
        if (f.required && (!item[f.name] || String(item[f.name]).trim() === "")) {
          toast.error(`Please fill out: ${f.label || f.name.replaceAll("_", " ")}`);
          return;
        }
      }
    }

    const isNew = item.__isNew;
    delete item.__isNew;

    for (const f of cfg.fields) {
      if (f.type === "tags" && typeof item[f.name] === "string") {
        item[f.name] = item[f.name]
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
      if (f.type === "json" && typeof item[f.name] === "string") {
        try {
          item[f.name] = JSON.parse(item[f.name]);
        } catch {
          toast.error(`Invalid JSON in field: ${f.name}`);
          return;
        }
      }
      if (f.type === "number") item[f.name] = Number(item[f.name] || 0);
      if (f.type === "bool") item[f.name] = Boolean(item[f.name]);
    }

    setSaving(true);
    try {
      if (isNew) {
        await adminApi.create(collection, item);
        toast.success("Record created successfully");
      } else {
        await adminApi.update(collection, item.id, item);
        toast.success("Changes saved successfully");
      }
      close();
      load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      let msg = "Failed to save record";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    try {
      await adminApi.remove(collection, id);
      toast.success("Record deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete record");
    }
  };

  return (
    <div className="font-['Poppins'] text-[#252A2A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#B89416] tracking-wider uppercase">[Your Brand]s™ CMS</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#252A2A] tracking-tight">{cfg.title}</h1>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B89416] hover:bg-[#B89416] text-white px-5 py-3 text-xs sm:text-sm font-semibold shadow-sm transition min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> <span>Add New {cfg.title}</span>
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#252A2A]/60">
            <Loader2 className="w-7 h-7 animate-spin text-[#B89416]" /> Fetching records...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#252A2A]/50">No records found. Click &quot;Add New&quot; to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#252A2A] text-white">
                <tr>
                  {isTeam && <th className="px-5 py-3.5 w-16" />}
                  {cfg.listCols.map((col) => (
                    <th key={col} className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest font-semibold">
                      {col.replaceAll("_", " ")}
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-right text-[10px] uppercase tracking-widest font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-[#F2F2F2]/50 transition">
                    {isTeam && (
                      <td className="px-5 py-3.5">
                        {it.photo ? (
                          <img src={it.photo} alt={it.name} className="w-8 h-8 rounded-full object-cover bg-black/5 border border-black/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#252A2A] text-white flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    )}
                    {cfg.listCols.map((col) => (
                      <td key={col} className="px-5 py-3.5 text-[#252A2A]">
                        {typeof it[col] === "boolean" ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              it[col] ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-[#252A2A]/50"
                            }`}
                          >
                            {it[col] ? "Yes" : "No"}
                          </span>
                        ) : (
                          <span className="font-medium">{String(it[col] ?? "—").slice(0, 70)}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => startEdit(it)} className="w-9 h-9 rounded-xl hover:bg-[#F2F2F2] grid place-items-center text-[#252A2A] transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => remove(it.id)} className="w-9 h-9 rounded-xl hover:bg-red-50 text-[#B89416] grid place-items-center transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#252A2A]/60 backdrop-blur-sm" onClick={close} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col z-10"
            >
              <div className="p-5 sm:p-6 border-b border-black/5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div>
                  <span className="text-[10px] font-bold text-[#B89416] uppercase tracking-wider">{editing.__isNew ? "Create New" : "Edit Record"}</span>
                  <div className="text-lg font-bold text-[#252A2A] mt-0.5">{cfg.title}</div>
                </div>
                <button type="button" onClick={close} className="w-9 h-9 rounded-xl grid place-items-center hover:bg-[#F2F2F2] text-[#252A2A] transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 flex-1">
                {cfg.fields.map((f) => (
                  <FieldEditor
                    key={f.name}
                    field={f}
                    value={editing[f.name]}
                    editingItem={editing}
                    onChange={(v) => setEditing((prev) => ({ ...prev, [f.name]: v }))}
                  />
                ))}
              </div>

              <div className="p-5 sm:p-6 border-t border-black/5 sticky bottom-0 bg-[#F2F2F2] flex items-center justify-end gap-3 z-10">
                <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-black/15 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#252A2A] hover:bg-black/5 transition">
                  Cancel
                </button>
                <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#B89416] hover:bg-[#B89416] text-white px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldEditor({ field, value, onChange, editingItem }) {
  const [uploading, setUploading] = useState(false);
  const isRequired = !!field.required;

  const label = (
    <div className="text-[11px] uppercase tracking-wider text-[#252A2A] font-bold mb-1.5 flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 min-w-0">
        <span className="truncate">{field.label || field.name.replaceAll("_", " ")}</span>
        {isRequired ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#B89416]/10 text-[#B89416]">Required</span>
        ) : (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 text-[#252A2A]/45">Optional</span>
        )}
      </span>
    </div>
  );

  // Image upload
  if (field.type === "image") {
    const handleUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxBytes = field.maxBytes || (field.category === "team" ? 1024 * 1024 : 15 * 1024 * 1024);
      if (file.size > maxBytes) {
        toast.error(`Image must be under ${Math.round(maxBytes / (1024 * 1024))} MB`);
        e.target.value = "";
        return;
      }

      setUploading(true);
      try {
        const res = await adminApi.uploadImage(file, field.category || "general");
        onChange(res.url);
        toast.success("Image uploaded successfully!");
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Image upload failed. Try again.");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    };

    return (
      <div className="block">
        {label}
        <div className="flex items-center gap-4 p-3 rounded-xl border border-black/10 bg-[#F2F2F2]/50">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#252A2A] grid place-items-center border-2 border-white shadow-sm shrink-0">
            {value ? <img src={value} alt="Preview" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-white/50" />}
          </div>
          <div className="flex-1 space-y-2">
            <label className="inline-flex items-center gap-2 rounded-xl bg-white border border-black/10 px-4 py-2 text-xs font-semibold text-[#252A2A] cursor-pointer hover:bg-black/5 transition shadow-sm w-max">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#B89416]" /> : <UploadCloud className="w-4 h-4 text-[#B89416]" />}
              <span>{uploading ? "Uploading..." : "Upload New Image"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <p className="text-[10px] text-[#252A2A]/45">
              {field.category === "team" || field.maxBytes === 1024 * 1024 ? "Max 1 MB · JPG/PNG/WebP" : "Image file"}
            </p>
            {value && (
              <div className="flex items-center gap-2">
                <input value={value} readOnly className="flex-1 text-[10px] text-[#252A2A]/50 bg-transparent outline-none truncate" />
                <button type="button" onClick={() => onChange("")} className="text-[10px] font-semibold text-[#B89416] hover:underline">
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Phone +91
  if (field.type === "phone91") {
    const display = value === undefined || value === null || value === "" ? "+91" : String(value);
    return (
      <label className="block">
        {label}
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={display}
          onChange={(e) => onChange(forcePhone91Input(e.target.value))}
          onFocus={() => {
            if (!value || value === "") onChange("+91");
          }}
          placeholder="+919876543210"
          maxLength={13}
          className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm text-[#252A2A] font-mono"
        />
        <p className="mt-1 text-[10px] text-[#252A2A]/45">+91 then exactly 10 digits. No spaces or letters.</p>
      </label>
    );
  }

  // WhatsApp + sync
  if (field.type === "whatsapp_sync") {
    const handleSync = () => {
      const parentPhone = normalizePhone91(editingItem?.[field.syncWith]);
      if (parentPhone && PHONE91_RE.test(parentPhone)) {
        onChange(parentPhone);
        toast.success("WhatsApp set same as phone");
      } else {
        toast.error("Enter a valid phone (+91 + 10 digits) first");
      }
    };
    const display = value === undefined || value === null || value === "" ? "+91" : String(value);
    return (
      <div className="block">
        <div className="text-[11px] uppercase tracking-wider text-[#252A2A] font-bold mb-1.5 flex justify-between items-center gap-2">
          <span className="flex items-center gap-2">
            {field.label || "WhatsApp"}
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 text-[#252A2A]/45">Optional</span>
          </span>
          <button type="button" onClick={handleSync} className="inline-flex items-center gap-1 text-[9px] text-[#B89416] font-bold hover:underline">
            <Copy className="w-3 h-3" /> Same as Phone
          </button>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          value={display}
          onChange={(e) => onChange(forcePhone91Input(e.target.value))}
          maxLength={13}
          placeholder="+919876543210"
          className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm font-mono"
        />
      </div>
    );
  }

  if (field.type === "bool") {
    return (
      <label className="flex items-center gap-3 p-3 rounded-xl border border-black/5 bg-[#F2F2F2]/40 hover:bg-[#F2F2F2] cursor-pointer transition">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded accent-[#B89416]" />
        <span className="text-xs sm:text-sm font-semibold text-[#252A2A]">{field.label || field.name.replaceAll("_", " ")}</span>
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 text-[#252A2A]/45">Optional</span>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <label className="block">
        {label}
        <input type="number" value={value ?? 0} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm text-[#252A2A]" />
      </label>
    );
  }

  if (field.type === "text") {
    return (
      <label className="block">
        {label}
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm text-[#252A2A] resize-y" placeholder={field.placeholder || "Enter details..."} />
      </label>
    );
  }

  if (field.type === "richtext") {
    return (
      <div className="block">
        {label}
        <RichTextEditor value={value || ""} onChange={onChange} placeholder={field.placeholder} minHeight={280} />
      </div>
    );
  }

  if (field.type === "tags") {
    const val = Array.isArray(value) ? value.join(", ") : value || "";
    return (
      <label className="block">
        {label}
        <input value={val} placeholder={field.placeholder || "Comma-separated"} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm text-[#252A2A]" />
      </label>
    );
  }

  if (field.type === "json") {
    const val = typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2);
    return (
      <label className="block">
        {label}
        <textarea value={val} onChange={(e) => onChange(e.target.value)} rows={5} placeholder={field.placeholder} className="w-full rounded-xl border border-black/10 bg-[#F2F2F2]/60 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-xs font-mono text-[#252A2A] resize-y" />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block">
        {label}
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm text-[#252A2A]">
          <option value="">— Select an option —</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  // default string (name, designation, etc.)
  const maxLen = field.maxLength;
  return (
    <label className="block">
      {label}
      <input
        value={value || ""}
        maxLength={maxLen || undefined}
        onChange={(e) => {
          let v = e.target.value;
          if (field.name === "name") {
            // live: letters + spaces only, max 30
            v = v.replace(/[^A-Za-z ]/g, "").slice(0, 30);
          }
          if (field.name === "designation" && maxLen) {
            v = v.slice(0, maxLen);
          }
          onChange(v);
        }}
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#B89416] text-sm text-[#252A2A]"
      />
      {field.name === "name" && (
        <p className="mt-1 text-[10px] text-[#252A2A]/45">Letters and spaces only · max 30 characters</p>
      )}
    </label>
  );
}