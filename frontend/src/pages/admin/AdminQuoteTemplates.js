/**
 * AdminQuoteTemplates — Reusable quote template management.
 */
import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Trash2, RefreshCw, Save, X, Pencil, Copy as CopyIcon,
  Loader2, Tag, Power,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BrandLockup from "@/components/site/BrandLockup";

const rupees = (n) =>
  `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

export default function AdminQuoteTemplates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [usingId, setUsingId] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.quoteTemplates.list();
      setItems(list);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (row) => {
    if (!window.confirm(`Delete template "${row.name}"?`)) return;
    try {
      await adminApi.quoteTemplates.remove(row.id);
      toast.success("Template deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const createFromTemplate = async (row) => {
    setUsingId(row.id);
    try {
      const quote = await adminApi.customQuotes.fromTemplate({
        template_id: row.id,
        client_name: "New Client",
      });
      toast.success(`Draft quote ${quote.ref_number || ""} created from template!`);
      navigate("/admin/custom-quotes");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create quote from template");
    } finally {
      setUsingId(null);
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      await adminApi.quoteTemplates.update(editing.id, editing);
      toast.success("Template updated");
      setEditing(null);
      load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24 font-['Poppins']">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-['Poppins']" data-testid="admin-quote-templates">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrandLockup tone="light" size="xs" />
            <span className="ml-2 text-[10px] text-[#111111]/40 font-normal uppercase tracking-wider">· Sales Templates</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#000F1B] tracking-tight">Quote Templates</h1>
          <p className="text-sm text-[#111111]/60 mt-0.5">
            Save any Custom Quote as a template and spin up new client drafts in one click.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-[#000F1B] hover:bg-[#F2F2F2] transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Empty State vs Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF6600]/10 grid place-items-center mb-3">
            <BookOpen className="w-7 h-7 text-[#FF6600]" />
          </div>
          <div className="font-bold text-[#000F1B]">No templates saved yet</div>
          <p className="text-xs text-[#111111]/60 mt-1 max-w-md mx-auto">
            Open a Custom Quote, fill in specs, then click "Save as Template" to reuse it for future clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-white border border-black/5 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
              data-testid={`qt-card-${t.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-[#000F1B] text-base">{t.name}</div>
                    {t.description && (
                      <div className="text-xs text-[#111111]/60 mt-1 line-clamp-2">{t.description}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] uppercase font-bold text-[#111111]/40">Rate</div>
                    <div className="font-extrabold text-[#FF6600] text-sm">{rupees(t.price_per_sqft)}/sqft</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-[#111111]/50">
                  <span>{(t.spec_categories || []).length} categories</span>
                  <span>•</span>
                  <span>{(t.addons || []).length} addons</span>
                  <span>•</span>
                  <span>{(t.payment_schedule || []).length} milestones</span>
                </div>

                {(t.tags || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-[#F2F2F2] text-[#000F1B] text-[10px] font-semibold px-2 py-0.5">
                        <Tag className="w-2.5 h-2.5 text-[#FF6600]" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-black/5 flex items-center gap-2">
                <button
                  onClick={() => createFromTemplate(t)}
                  disabled={usingId === t.id}
                  data-testid={`qt-use-${t.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#000F1B] hover:bg-[#FF6600] text-white px-3.5 py-2 text-xs font-bold transition disabled:opacity-50"
                >
                  {usingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  <span>{usingId === t.id ? "Creating..." : "Use Template"}</span>
                </button>
                <button
                  onClick={() => setEditing({ ...t })}
                  data-testid={`qt-edit-${t.id}`}
                  className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[#F2F2F2] text-[#000F1B]"
                  title="Edit Template Info"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(t)}
                  data-testid={`qt-del-${t.id}`}
                  className="w-8 h-8 rounded-lg grid place-items-center hover:bg-red-50 text-red-500"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Meta Editor Drawer */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              className="fixed inset-0 bg-[#000F1B]/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#F5F6F8] z-50 overflow-y-auto font-['Poppins']"
              data-testid="qt-editor-drawer"
            >
              <div className="sticky top-0 bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] font-bold text-[#FF6600] uppercase tracking-wider">Edit Template Info</div>
                  <div className="font-bold text-[#000F1B] text-base">{editing.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    data-testid="qt-save-btn"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6600] hover:bg-[#FF0000] text-white px-4 py-2 text-xs font-bold transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-[#F2F2F2] text-[#000F1B]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-4">
                <label className="block">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#000F1B] mb-1">Template Name *</div>
                  <input
                    value={editing.name || ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#000F1B] outline-none focus:ring-2 focus:ring-[#FF6600]"
                    data-testid="qt-field-name"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#000F1B] mb-1">Description</div>
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-[#000F1B] outline-none focus:ring-2 focus:ring-[#FF6600] resize-y"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#000F1B] mb-1">Tags (comma separated)</div>
                  <input
                    value={(editing.tags || []).join(", ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#000F1B] outline-none focus:ring-2 focus:ring-[#FF6600]"
                    placeholder="e.g. villa, premium, 3bhk"
                  />
                </label>

                <div className="p-4 rounded-xl bg-white border border-black/5 text-xs text-[#111111]/60 leading-relaxed">
                  <strong>Note:</strong> This template contains <strong>{(editing.spec_categories || []).length}</strong> spec categories, <strong>{(editing.addons || []).length}</strong> addons, and <strong>{(editing.payment_schedule || []).length}</strong> milestones.
                  <br/><br/>
                  To update underlying material rates or specs, create a quote from this template, edit it, and click <strong>"Save as Template"</strong>.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}