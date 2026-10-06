/**
 * Reusable helpers for the Package editor:
 *   - ImageUploader   → drag-drop or click-to-upload → cloud storage
 *   - AIAssistButton  → 3-suggestion popover powered by GPT-5
 *   - VersionsPanel   → list previous snapshots + restore
 *   - PreviewModal    → renders /packages/{slug} in iframe with current
 *                       unsaved edits injected via sessionStorage.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Wand2, Loader2, History, RotateCcw, X, Eye,
  ImageOff, Check, ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Image uploader                                                     */
/* ------------------------------------------------------------------ */

export function ImageUploader({ value, onChange, category = "packages", testId = "image-uploader" }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please pick an image file");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image is larger than 8 MB");
        return;
      }
      setUploading(true);
      setProgress(0);
      try {
        const result = await adminApi.uploadImage(file, category, setProgress);
        onChange(result.absoluteUrl);
        toast.success("Image uploaded");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[ImageUploader] upload failed", e);
        toast.error(e?.response?.data?.detail || "Upload failed");
      }
      setUploading(false);
      setProgress(0);
    },
    [category, onChange]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex items-stretch gap-3" data-testid={testId}>
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-brand-bg grid place-items-center border border-black/5 shrink-0">
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="w-5 h-5 text-brand-navy/40" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed px-3 py-2.5 cursor-pointer text-xs flex items-center gap-2 transition ${
            dragOver ? "border-brand-orange bg-brand-orange/5" : "border-black/15 hover:border-brand-orange/60"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading… {progress}%</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5 text-brand-orange" />
              <span className="font-medium text-brand-navy">Upload image</span>
              <span className="text-brand-navy/50">— drag &amp; drop or click (max 8 MB)</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
            data-testid={`${testId}-input`}
          />
        </div>
        <input
          value={value || ""}
          placeholder="…or paste an image URL"
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-orange text-sm"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI rewrite pill button + suggestions popover                        */
/* ------------------------------------------------------------------ */

export function AIAssistButton({ text, purpose = "copy", onPick, testId = "ai-assist" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Close on ESC for keyboard-first admins
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const generate = async () => {
    if (!text || !text.trim()) {
      toast.error("Nothing to rewrite yet");
      return;
    }
    setLoading(true);
    setSuggestions([]);
    setOpen(true);
    try {
      const res = await adminApi.rewriteCopy(text, purpose);
      setSuggestions(res.suggestions || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[AIAssistButton] rewrite failed", e);
      toast.error(e?.response?.data?.detail || "AI is taking a break");
    }
    setLoading(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={generate}
        data-testid={testId}
        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-orange to-brand-orangeLight text-white text-[11px] font-semibold px-2.5 py-1 hover:brightness-110 transition"
        title="Rewrite with AI"
      >
        <Wand2 className="w-3 h-3" /> Rewrite
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute z-50 mt-2 right-0 w-[360px] rounded-2xl bg-white border border-black/10 shadow-premium p-3"
              data-testid={`${testId}-popover`}
            >
              <div className="text-[11px] uppercase tracking-widest text-brand-navy/50 mb-2 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-brand-orange" /> AI suggestions
              </div>
              {loading ? (
                <div className="text-xs text-brand-navy/60 flex items-center gap-2 py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rewriting on-brand…
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-xs text-brand-navy/60 py-2">No suggestions.</div>
              ) : (
                <div className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.slice(0, 32)}-${i}`}
                      type="button"
                      onClick={() => {
                        onPick(s);
                        setOpen(false);
                      }}
                      data-testid={`${testId}-choice-${i}`}
                      className="block w-full text-left rounded-xl border border-black/5 hover:border-brand-orange hover:bg-brand-orange/5 px-3 py-2 text-sm text-brand-navy transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-black/5 text-[10px] text-brand-navy/40 flex items-center justify-between">
                <span>Powered by GPT-5</span>
                <button className="hover:text-brand-orange" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Versions panel                                                     */
/* ------------------------------------------------------------------ */

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function VersionsPanel({ packageId, onRestored, testId = "versions-panel" }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);

  const load = useCallback(async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const list = await adminApi.listPackageVersions(packageId);
      setVersions(list);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[VersionsPanel] list failed", e);
      toast.error("Couldn't load versions");
    }
    setLoading(false);
  }, [packageId]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (v) => {
    if (!window.confirm(`Restore version from ${timeAgo(v.snapshot_at)}? Current state will be snapshotted first.`)) return;
    setRestoring(v.id);
    try {
      await adminApi.restorePackageVersion(packageId, v.id);
      toast.success("Restored. Reloading editor…");
      onRestored?.();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[VersionsPanel] restore failed", e);
      toast.error("Restore failed");
    }
    setRestoring(null);
  };

  return (
    <div data-testid={testId} className="space-y-3">
      <div className="flex items-center gap-2 text-brand-navy/60 text-xs">
        <History className="w-4 h-4" />
        <span>Last {versions.length} snapshot{versions.length === 1 ? "" : "s"} — a snapshot is captured every time you save.</span>
      </div>
      {loading ? (
        <div className="text-xs text-brand-navy/50">Loading…</div>
      ) : versions.length === 0 ? (
        <div className="text-xs text-brand-navy/50 italic">No previous versions yet. Save an edit to start the history.</div>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              data-testid={`version-${v.id}`}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2"
            >
              <div className="flex-1">
                <div className="font-semibold text-brand-navy text-sm">{timeAgo(v.snapshot_at)}</div>
                <div className="text-[11px] text-brand-navy/50">{new Date(v.snapshot_at).toLocaleString()} · {v.note}</div>
              </div>
              <button
                onClick={() => restore(v)}
                disabled={restoring === v.id}
                className="btn-ghost text-xs py-1.5 px-3"
                data-testid={`restore-${v.id}`}
              >
                {restoring === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview modal — renders package page with unsaved edits             */
/* ------------------------------------------------------------------ */

/**
 * We stash the in-progress edit into sessionStorage under a temp slug and
 * render the live PackageDetailPage in an iframe. The public page checks
 * sessionStorage for a preview payload matching the URL slug and uses it
 * instead of hitting the API. See PackageDetailPage.js for the read side.
 */
export function PreviewModal({ open, onClose, pkg, testId = "preview-modal" }) {
  useEffect(() => {
    if (!open || !pkg) return;
    try {
      const payload = { ...pkg, __previewAt: Date.now() };
      sessionStorage.setItem(`cons_pkg_preview_${pkg.slug}`, JSON.stringify(payload));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[preview] failed to stash payload", e);
    }
    return () => {
      try {
        if (pkg?.slug) sessionStorage.removeItem(`cons_pkg_preview_${pkg.slug}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[preview] failed to clear payload", err);
      }
    };
  }, [open, pkg]);

  if (!open || !pkg) return null;
  const previewUrl = `/packages/${pkg.slug}?preview=1&_r=${Date.now()}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-brand-navy/70 backdrop-blur-sm p-4 md:p-8"
        data-testid={testId}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="relative h-full w-full max-w-6xl mx-auto rounded-3xl bg-white overflow-hidden shadow-premium flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-orange" />
              <div>
                <div className="font-semibold text-brand-navy text-sm">Preview: {pkg.name}</div>
                <div className="text-[10px] text-brand-navy/50">Showing your unsaved edits — customers still see the live version until you click Save changes.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs py-1.5 px-3"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
              </a>
              <button onClick={onClose} className="w-9 h-9 rounded-full grid place-items-center hover:bg-brand-navy/5" data-testid="preview-close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <iframe
            title="Package preview"
            src={previewUrl}
            className="flex-1 w-full bg-white"
            data-testid="preview-iframe"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* Utility — used by PackageDetailPage to detect preview mode */
export function readPreviewPayload(slug) {
  try {
    const raw = sessionStorage.getItem(`cons_pkg_preview_${slug}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/* Small check-mark badge helper */
export function ReadyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold px-2 py-0.5">
      <Check className="w-3 h-3" /> ready
    </span>
  );
}
