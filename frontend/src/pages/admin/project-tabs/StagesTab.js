import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus, X, Save, Loader2, Camera, Trash2,
  CheckCircle2, List, LayoutGrid, Minimize2, Maximize2, RefreshCw, Search,
  ChevronRight, ChevronDown, GripVertical
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "2-digit",
    });
  } catch {
    return "—";
  }
};

const COL = { name: 260, weight: 50, planned: 180, actual: 160, progress: 120, status: 90 };
const TABLE_W = Object.values(COL).reduce((a, b) => a + b, 0);

const parseProgressInput = (raw) => {
  if (raw === "" || raw === null || raw === undefined) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits === "") return "";
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return "";
  return Math.min(100, Math.max(0, n));
};
const progressValue = (v) => (v === "" || v === null || v === undefined ? "" : v);

function buildLockedStarts(stagesList) {
  const next = new Set();
  (stagesList || []).forEach((st) => {
    (st.substages || []).forEach((sub) => {
      if (sub?.id && sub.start_date) next.add(sub.id);
    });
  });
  return next;
}

function normalizeStages(list) {
  return (list || []).map((s) => ({
    ...s,
    photos: (s.photos || []).map((p) =>
      typeof p === "string" ? { url: p, uploaded_at: null } : p
    ),
  }));
}

export default function StagesTab({ project, onSaved }) {
  const [stages, setStages] = useState([]);
  const [lockedSubStarts, setLockedSubStarts] = useState(() => new Set()); // server-persisted start dates only
  const [saving, setSaving] = useState(null);
  const [savingSub, setSavingSub] = useState(null); // `${stageIdx}:${subId}`
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");

  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAll, setExpandedAll] = useState(() => new Set()); // start collapsed = less lag
  const [zoom, setZoom] = useState("week");

  const containerRef = useRef(null);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(() => {
    const s = localStorage.getItem("stages_left_w");
    return s ? parseInt(s, 10) : 620;
  });
  const [dragging, setDragging] = useState(false);

  // Load from project prop
  useEffect(() => {
    const normalized = normalizeStages(project.stages);
    setStages(normalized);
    setLockedSubStarts(buildLockedStarts(normalized));
    // do NOT expand all — that made the tab laggy
  }, [project]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(380, Math.min(e.clientX - rect.left, rect.width - 280));
      setLeftWidth(w);
    };
    const onUp = () => {
      setDragging(false);
      localStorage.setItem("stages_left_w", String(leftWidth));
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, leftWidth]);

  const onLeftScroll = (e) => {
    if (rightScrollRef.current) rightScrollRef.current.scrollTop = e.target.scrollTop;
  };
  const onRightScroll = (e) => {
    if (leftScrollRef.current) leftScrollRef.current.scrollTop = e.target.scrollTop;
  };

  const toUrl = (p) => (typeof p === "string" ? p : p?.url || "");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get(`/admin/projects/${project.id}`);
      const normalized = normalizeStages(data.stages);
      setStages(normalized);
      setLockedSubStarts(buildLockedStarts(normalized)); // lock only what server has
      onSaved?.();
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [project.id, onSaved]);

  const patchStageLocal = (idx, patch) => {
    setStages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const patchSubLocal = (stageIdx, subIdx, patch) => {
    setStages((prev) => {
      const next = [...prev];
      const subs = [...(next[stageIdx].substages || [])];
      subs[subIdx] = { ...subs[subIdx], ...patch };
      next[stageIdx] = { ...next[stageIdx], substages: subs };
      return next;
    });
  };

  const saveStage = async (idx) => {
    setSaving(idx);
    try {
      const s = stages[idx];
      const hasChildren = (s.substages || []).filter((x) => !x.archived).length > 0;
      const payload = {
        name: s.name,
        description: s.description,
        notes: s.notes,
        photos: (s.photos || []).map(toUrl),
      };
      if (!hasChildren) {
        payload.status = s.status;
        payload.start_date = s.start_date || null;
        payload.planned_end_date = s.planned_end_date || s.expected_date || null;
        payload.actual_end_date = s.actual_end_date || null;
        payload.progress_pct = Number(s.progress_pct) || 0;
      }
      await api.patch(`/admin/projects/${project.id}/stages/${idx}`, payload);
      toast.success("Stage saved & Live");
      await refresh();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(null);
    }
  };

  const saveSubstage = async (stageIdx, sub) => {
    if (!sub?.id) return;
    setSavingSub(`${stageIdx}:${sub.id}`);
    try {
      const payload = {
        name: (sub.name || "Untitled").trim(),
        start_date: sub.start_date || null,
        planned_end_date: sub.planned_end_date || null,
        actual_start_date: sub.actual_start_date || null,
        actual_end_date: sub.actual_end_date || null,
        status: sub.status || "pending",
        progress_pct: Number(sub.progress_pct) || 0,
      };
      await api.patch(
        `/admin/projects/${project.id}/stages/${stageIdx}/substages/${sub.id}`,
        payload
      );
      toast.success("Substage saved & Live");
      await refresh(); // after refresh, start_date locks if it was saved
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save substage");
    } finally {
      setSavingSub(null);
    }
  };

  const markSubComplete = async (stageIdx, subId, subName) => {
    if (!window.confirm(`Mark "${subName || "substage"}" as 100% Complete?`)) return;
    try {
      await api.post(
        `/admin/projects/${project.id}/stages/${stageIdx}/substages/${subId}/mark-complete`
      );
      toast.success("Marked complete");
      await refresh();
    } catch {
      toast.error("Failed");
    }
  };

  const markAllChildrenComplete = async (stageIdx, stageName) => {
    if (!window.confirm(`Mark ALL substages of "${stageName}" as 100% Complete?`)) return;
    try {
      await api.post(`/admin/projects/${project.id}/stages/${stageIdx}/mark-all-complete`);
      toast.success("All marked complete");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;
    try {
      await api.post(`/admin/projects/${project.id}/stages`, {
        name: newStageName.trim(),
        status: "pending",
        progress_pct: 0,
      });
      toast.success("Stage added");
      setNewStageName("");
      setShowAddStage(false);
      await refresh();
    } catch {
      toast.error("Failed");
    }
  };

  const moveStage = async (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= stages.length) return;
    if (
      stages[idx].name.toLowerCase().includes("handover") ||
      stages[newIdx].name.toLowerCase().includes("handover")
    ) {
      toast.error("Handover must stay at the end");
      return;
    }
    const reordered = [...stages];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, moved);
    try {
      await api.put(`/admin/projects/${project.id}/stages/reorder`, {
        stage_ids: reordered.map((s) => s.id || String(s.index)),
      });
      await refresh();
    } catch {
      toast.error("Reorder failed");
    }
  };

  const deleteStage = async (idx) => {
    if (stages[idx].name.toLowerCase().includes("handover")) {
      toast.error("Handover cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete "${stages[idx].name}"?`)) return;
    try {
      await api.delete(`/admin/projects/${project.id}/stages/${idx}`);
      toast.success("Deleted");
      setExpandedStage(null);
      await refresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  const addSubstage = async (stageIdx) => {
    const name = window.prompt("Substage name:");
    if (!name?.trim()) return;
    try {
      await api.post(`/admin/projects/${project.id}/stages/${stageIdx}/substages`, {
        name: name.trim(),
        status: "pending",
        progress_pct: 0,
      });
      await refresh();
      setExpandedAll((prev) => new Set([...prev, stageIdx]));
      setExpandedStage(stageIdx);
    } catch {
      toast.error("Failed");
    }
  };

  const deleteSubstage = async (stageIdx, subId) => {
    if (!window.confirm("Delete this substage?")) return;
    try {
      await api.delete(
        `/admin/projects/${project.id}/stages/${stageIdx}/substages/${subId}`
      );
      await refresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  const uploadPhoto = async (idx, file) => {
    if (!file) return;
    setUploading(idx);
    try {
      const res = await adminApi.uploadImage(file, "project-photos");
      const photoObj = {
        url: res.url || res.absoluteUrl,
        uploaded_at: new Date().toISOString(),
      };
      setStages((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          photos: [...(next[idx].photos || []), photoObj],
        };
        return next;
      });
      toast.success("Photo uploaded — click Save Stage to commit");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (stageIdx, photoIdx) => {
    setStages((prev) => {
      const next = [...prev];
      next[stageIdx] = {
        ...next[stageIdx],
        photos: (next[stageIdx].photos || []).filter((_, j) => j !== photoIdx),
      };
      return next;
    });
  };

  // Gantt calcs ONLY in split mode (fixes editor lag)
  const visibleRows = useMemo(() => {
    if (viewMode !== "split") return [];
    const rows = [];
    const q = searchQuery.toLowerCase().trim();
    stages.forEach((stage, sIdx) => {
      if (q && !stage.name?.toLowerCase().includes(q)) {
        const childHit = (stage.substages || []).some((sub) =>
          sub.name?.toLowerCase().includes(q)
        );
        if (!childHit) return;
      }
      rows.push({ type: "parent", data: stage, sIdx, id: stage.id || `s-${sIdx}` });
      if (expandedAll.has(sIdx)) {
        (stage.substages || []).forEach((sub, subIdx) => {
          if (sub.archived) return;
          if (q && !stage.name?.toLowerCase().includes(q) && !sub.name?.toLowerCase().includes(q))
            return;
          rows.push({ type: "child", data: sub, sIdx, subIdx, id: sub.id || `c-${sIdx}-${subIdx}` });
        });
      }
    });
    return rows;
  }, [stages, expandedAll, searchQuery, viewMode]);

  const { minDate, dayWidth, ganttWidth, dateMarkers, monthHeaders, todayPx } = useMemo(() => {
    if (viewMode !== "split") {
      return { minDate: new Date(), dayWidth: 12, ganttWidth: 400, dateMarkers: [], monthHeaders: [], todayPx: 0 };
    }
    let min = new Date();
    let max = new Date();
    let has = false;
    const take = (d) => {
      if (!d) return;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return;
      if (!has || dt < min) min = new Date(dt);
      if (!has || dt > max) max = new Date(dt);
      has = true;
    };
    stages.forEach((s) => {
      [s.start_date, s.started_at, s.planned_end_date, s.expected_date, s.actual_end_date, s.completed_at].forEach(take);
      (s.substages || []).forEach((sub) => {
        [sub.start_date, sub.planned_end_date, sub.actual_end_date, sub.actual_start_date].forEach(take);
      });
    });
    if (!has) {
      min = new Date();
      max = new Date();
      max.setDate(max.getDate() + 60);
    }
    min.setDate(min.getDate() - 5);
    max.setDate(max.getDate() + 20);

    const MS = 86400000;
    const days = Math.max(30, Math.ceil((max - min) / MS));
    const dW = zoom === "day" ? 28 : zoom === "week" ? 12 : 4;
    const width = days * dW;
    const markers = [];
    const months = [];
    const cur = new Date(min);
    while (cur <= max) {
      const leftPx = ((cur - min) / MS) * dW;
      if (zoom === "month" && cur.getDate() === 1) {
        markers.push({ leftPx, label: cur.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) });
      } else if (zoom === "week" && cur.getDay() === 1) {
        markers.push({ leftPx, label: `W${Math.ceil(cur.getDate() / 7)}` });
      } else if (zoom === "day") {
        markers.push({ leftPx, label: String(cur.getDate()) });
      }
      if (zoom !== "month" && (cur.getDate() === 1 || cur.getTime() === min.getTime())) {
        months.push({
          leftPx,
          label: cur.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    const tPx = Math.max(0, ((new Date() - min) / MS) * dW);
    return { minDate: min, dayWidth: dW, ganttWidth: width, dateMarkers: markers, monthHeaders: months, todayPx: tPx };
  }, [stages, zoom, viewMode]);

  const barPx = (startStr, endStr) => {
    if (viewMode !== "split" || !startStr || !endStr) return { valid: false };
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (Number.isNaN(s) || Number.isNaN(e) || e < s) return { valid: false };
    const MS = 86400000;
    const left = Math.max(0, ((s - minDate) / MS) * dayWidth);
    const w = Math.max(dayWidth * 0.8, ((e - s) / MS) * dayWidth);
    return { valid: true, left: `${left}px`, width: `${w}px` };
  };

  const toggleExpandAll = (idx) => {
    setExpandedAll((prev) => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  };

  return (
    <div className="font-['Poppins'] flex flex-col h-[calc(100vh-160px)] min-h-[560px] bg-[#F9FAFB] rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <style>{`
        .gantt-slider{-webkit-appearance:none;width:100%;background:transparent}
        .gantt-slider::-webkit-slider-thumb{-webkit-appearance:none;height:12px;width:12px;border-radius:50%;background:#B89416;margin-top:-4px;box-shadow:0 1px 3px rgba(0,0,0,.25)}
        .gantt-slider::-webkit-slider-runnable-track{height:4px;background:#E8EAED;border-radius:2px}
        .csb::-webkit-scrollbar{width:6px;height:6px}
        .csb::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        .row-h:hover{background:#F8F9FA!important}
      `}</style>

      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 p-2.5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${
              viewMode === "list" ? "bg-white shadow text-[#B89416]" : "text-gray-500"
            }`}
          >
            <List className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${
              viewMode === "split" ? "bg-white shadow text-[#B89416]" : "text-gray-500"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Gantt
          </button>
        </div>

        {viewMode === "split" && (
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#B89416]"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {refreshing && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B89416]" />}
          {viewMode === "split" && (
            <>
              <button
                onClick={() => setExpandedAll(new Set())}
                className="px-2 py-1.5 text-[10px] font-bold border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <Minimize2 className="w-3 h-3" /> Collapse
              </button>
              <button
                onClick={() => setExpandedAll(new Set(stages.map((_, i) => i)))}
                className="px-2 py-1.5 text-[10px] font-bold border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" /> Expand
              </button>
            </>
          )}
          <button
            onClick={refresh}
            className="px-2 py-1.5 text-[10px] font-bold border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
          {viewMode === "list" && (
            <button
              onClick={() => setShowAddStage(true)}
              className="px-3 py-1.5 bg-[#B89416] hover:bg-[#B89416] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Stage
            </button>
          )}
        </div>
      </div>

      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto csb p-4 space-y-4 bg-[#F9FAFB]">
          <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm">
            <h2 className="font-bold text-[#252A2A] text-base">Stage Pipeline</h2>
            <p className="text-[10px] text-[#252A2A]/50 mt-1">
              Edit freely, then click Save. Substage start date locks only after it is saved.
            </p>
          </div>

          {showAddStage && (
            <div className="bg-white border-2 border-[#B89416]/40 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shadow-sm">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#252A2A]/50 mb-1">
                  New Stage Name
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Waterproofing"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStage()}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#B89416] outline-none"
                />
              </div>
              <div className="flex gap-2 sm:self-end">
                <button
                  onClick={() => { setShowAddStage(false); setNewStageName(""); }}
                  className="px-4 py-2 text-xs font-bold border border-black/10 rounded-lg hover:bg-[#F2F2F2]"
                >
                  Cancel
                </button>
                <button
                  onClick={addStage}
                  className="px-5 py-2 text-xs font-bold bg-[#252A2A] text-white rounded-lg hover:bg-[#B89416]"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {stages.map((s, idx) => {
              const isExpanded = expandedStage === idx;
              const isHandover = s.name.toLowerCase().includes("handover");
              const substages = s.substages || [];
              const activeSubs = substages.filter((x) => !x.archived);
              const hasChildren = activeSubs.length > 0;
              const photos = s.photos || [];

              const statMap = {
                completed: { text: "text-emerald-700", bg: "bg-emerald-50", label: "Completed" },
                in_progress: { text: "text-[#B89416]", bg: "bg-[#B89416]/10", label: "In Progress" },
                pending: { text: "text-[#252A2A]/50", bg: "bg-slate-100", label: "Pending" },
              };
              const stat = statMap[s.status] || statMap.pending;

              return (
                <div
                  key={s.id || idx}
                  className={`bg-white rounded-xl border shadow-sm transition-all ${
                    isExpanded
                      ? "border-[#B89416] ring-1 ring-[#B89416]/20"
                      : "border-black/5 hover:border-black/15"
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveStage(idx, -1)}
                        disabled={idx === 0}
                        className="text-[#252A2A]/30 hover:text-[#252A2A] disabled:opacity-20 w-5 h-4 grid place-items-center"
                      >
                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent border-b-current" />
                      </button>
                      <button
                        onClick={() => moveStage(idx, 1)}
                        disabled={idx === stages.length - 1 || isHandover}
                        className="text-[#252A2A]/30 hover:text-[#252A2A] disabled:opacity-20 w-5 h-4 grid place-items-center"
                      >
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-current" />
                      </button>
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedStage(isExpanded ? null : idx)}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-black text-[#252A2A]/30">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                        <span className="font-bold text-sm sm:text-base text-[#252A2A] truncate">
                          {s.name}
                        </span>
                        {isHandover && (
                          <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                            Locked
                          </span>
                        )}
                        {hasChildren && (
                          <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            Auto-Calc
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className={`font-bold px-2 py-0.5 rounded ${stat.bg} ${stat.text}`}>
                          {stat.label}
                        </span>
                        <span className="font-bold text-[#252A2A]">{Number(s.progress_pct) || 0}% Done</span>
                        {activeSubs.length > 0 && (
                          <span className="hidden sm:inline font-medium text-[#252A2A]/50">
                            • {activeSubs.length} Substage{activeSubs.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : idx)}
                      className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                        isExpanded
                          ? "bg-[#B89416] border-[#B89416] text-white"
                          : "bg-white border-black/10 text-[#252A2A] hover:bg-black/5"
                      }`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Only mount heavy body when expanded — big lag win */}
                  {isExpanded && (
                    <div className="border-t border-black/5 bg-[#F9FAFB] rounded-b-xl p-5 space-y-5">
                      <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm">
                        {hasChildren && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                            <strong>Note:</strong> Progress, dates, and status are calculated from substages.
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-black/5 pb-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#252A2A]/50 mb-1">
                                Stage Name
                              </label>
                              <input
                                type="text"
                                value={s.name}
                                disabled={isHandover}
                                onChange={(e) => patchStageLocal(idx, { name: e.target.value })}
                                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#B89416] outline-none disabled:bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#252A2A]/50 mb-1">
                                Status {hasChildren && <span className="text-blue-600">(auto)</span>}
                              </label>
                              <select
                                value={s.status}
                                disabled={hasChildren}
                                onChange={(e) => patchStageLocal(idx, { status: e.target.value })}
                                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#B89416] outline-none bg-white disabled:bg-gray-100"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#252A2A]/50 mb-1">Start Date</label>
                            <input
                              type="date"
                              disabled={hasChildren}
                              value={s.start_date || ""}
                              onChange={(e) => patchStageLocal(idx, { start_date: e.target.value || null })}
                              className="w-full px-3 py-2 border border-black/10 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#B89416] outline-none disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#252A2A]/50 mb-1">Planned End</label>
                            <input
                              type="date"
                              disabled={hasChildren}
                              value={s.planned_end_date || s.expected_date || ""}
                              onChange={(e) => patchStageLocal(idx, { planned_end_date: e.target.value || null })}
                              className="w-full px-3 py-2 border border-black/10 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#B89416] outline-none disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#252A2A]/50 mb-1">Actual End</label>
                            <input
                              type="date"
                              disabled={hasChildren}
                              value={s.actual_end_date || ""}
                              onChange={(e) => patchStageLocal(idx, { actual_end_date: e.target.value || null })}
                              className="w-full px-3 py-2 border border-black/10 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#B89416] outline-none disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#252A2A]/50 mb-1">Progress %</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                inputMode="numeric"
                                disabled={hasChildren}
                                value={progressValue(s.progress_pct)}
                                onChange={(e) =>
                                  patchStageLocal(idx, { progress_pct: parseProgressInput(e.target.value) })
                                }
                                onFocus={(e) => e.target.select()}
                                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm font-black text-[#B89416] focus:ring-2 focus:ring-[#B89416] outline-none pr-8 disabled:bg-gray-100"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#252A2A]/30">%</span>
                            </div>
                          </div>
                        </div>

                        {!hasChildren && !isHandover && (
                          <div className="mt-4 pt-4 border-t border-black/5">
                            <label className="block text-[10px] font-bold uppercase text-[#252A2A]/50 mb-2">Progress Slider</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={Number(s.progress_pct) || 0}
                                onChange={(e) =>
                                  patchStageLocal(idx, { progress_pct: parseProgressInput(e.target.value) })
                                }
                                className="flex-1 gantt-slider"
                              />
                              <span className="text-sm font-black text-[#B89416] w-12 text-right">
                                {Number(s.progress_pct) || 0}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                          <h4 className="text-xs font-bold text-[#252A2A] uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-[#B89416]" /> Photos ({photos.length})
                          </h4>
                          <label className="cursor-pointer text-xs font-bold text-[#B89416] hover:text-[#B89416] flex items-center gap-1.5">
                            {uploading === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading === idx}
                              onChange={(e) => uploadPhoto(idx, e.target.files?.[0])}
                            />
                          </label>
                        </div>
                        {photos.length === 0 ? (
                          <div className="text-center py-4 text-xs text-[#252A2A]/40 italic border border-dashed border-black/10 rounded-lg">
                            No photos yet
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {photos.map((p, i) => (
                              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-black/10">
                                <img src={resolveMediaUrl(toUrl(p))} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removePhoto(idx, i)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Substages */}
                      <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
                          <h4 className="text-xs font-bold text-[#252A2A] uppercase tracking-wider">Substages Map</h4>
                          <div className="flex gap-2">
                            {hasChildren && (
                              <button
                                onClick={() => markAllChildrenComplete(idx, s.name)}
                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-100"
                              >
                                Mark All Done
                              </button>
                            )}
                            <button
                              onClick={() => addSubstage(idx)}
                              className="text-[10px] font-bold text-[#B89416] hover:text-[#B89416] flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Substage
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {substages.map((sub, sIdx) => {
                            const isComplete = Number(sub.progress_pct) === 100;
                            // LOCK ONLY if this start_date already exists on server
                            const startLocked = lockedSubStarts.has(sub.id);
                            const isSavingThis = savingSub === `${idx}:${sub.id}`;

                            return (
                              <div
                                key={sub.id || sIdx}
                                className={`border rounded-xl p-4 space-y-3 ${
                                  isComplete ? "bg-emerald-50/50 border-emerald-200" : "bg-[#F9FAFB] border-black/10"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[#252A2A]/30 font-mono text-[10px] shrink-0">
                                    {(sIdx + 1).toString().padStart(2, "0")}
                                  </span>
                                  <input
                                    type="text"
                                    value={sub.name}
                                    onChange={(e) => patchSubLocal(idx, sIdx, { name: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-black/10 bg-white rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#B89416] outline-none"
                                    placeholder="Name"
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[8px] font-bold uppercase text-[#252A2A]/50 mb-1">
                                      Start {startLocked ? "(locked)" : "(editable until save)"}
                                    </label>
                                    <input
                                      type="date"
                                      disabled={startLocked}
                                      value={sub.start_date || ""}
                                      onChange={(e) =>
                                        patchSubLocal(idx, sIdx, {
                                          start_date: e.target.value || null,
                                        })
                                      }
                                      className="w-full border border-black/10 rounded-lg px-2 py-1.5 text-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-bold uppercase text-[#252A2A]/50 mb-1">
                                      Planned End
                                    </label>
                                    <input
                                      type="date"
                                      value={sub.planned_end_date || ""}
                                      onChange={(e) =>
                                        patchSubLocal(idx, sIdx, {
                                          planned_end_date: e.target.value || null,
                                        })
                                      }
                                      className="w-full border border-black/10 rounded-lg px-2 py-1.5 text-[10px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-bold uppercase text-[#252A2A]/50 mb-1">
                                      Actual End
                                    </label>
                                    <input
                                      type="date"
                                      value={sub.actual_end_date || ""}
                                      onChange={(e) =>
                                        patchSubLocal(idx, sIdx, {
                                          actual_end_date: e.target.value || null,
                                        })
                                      }
                                      className="w-full border border-black/10 rounded-lg px-2 py-1.5 text-[10px]"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[8px] font-bold uppercase text-[#252A2A]/50 mb-1">
                                    Progress %
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={Number(sub.progress_pct) || 0}
                                      onChange={(e) =>
                                        patchSubLocal(idx, sIdx, {
                                          progress_pct: parseProgressInput(e.target.value),
                                        })
                                      }
                                      className="flex-1 gantt-slider"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      inputMode="numeric"
                                      value={progressValue(sub.progress_pct)}
                                      onChange={(e) =>
                                        patchSubLocal(idx, sIdx, {
                                          progress_pct: parseProgressInput(e.target.value),
                                        })
                                      }
                                      onFocus={(e) => e.target.select()}
                                      className="w-16 border border-black/10 rounded-lg px-2 py-1.5 text-xs font-black text-[#B89416] outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                                  <div className="text-[10px] font-semibold text-[#252A2A]/50">
                                    Status:{" "}
                                    <span
                                      className={`font-bold ${
                                        sub.status === "completed"
                                          ? "text-emerald-600"
                                          : sub.status === "in_progress"
                                          ? "text-[#B89416]"
                                          : "text-[#252A2A]/50"
                                      }`}
                                    >
                                      {(sub.status || "pending").replace("_", " ").toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {!isComplete && (
                                      <button
                                        onClick={() => markSubComplete(idx, sub.id, sub.name)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold rounded-lg flex items-center gap-1 text-white"
                                      >
                                        <CheckCircle2 className="w-3 h-3" /> Mark Complete
                                      </button>
                                    )}
                                    <button
                                      onClick={() => saveSubstage(idx, sub)}
                                      disabled={isSavingThis}
                                      className="px-3 py-1.5 bg-[#B89416] hover:bg-[#B89416] text-white text-[10px] font-bold rounded-lg disabled:opacity-60 flex items-center gap-1"
                                    >
                                      {isSavingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                      Save
                                    </button>
                                    <button
                                      onClick={() => deleteSubstage(idx, sub.id)}
                                      className="p-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {substages.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-400 italic">No substages yet</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-black/10 bg-[#F9FAFB] p-4 rounded-xl">
                        <button
                          onClick={() => saveStage(idx)}
                          disabled={saving === idx}
                          className="px-5 py-2.5 bg-[#B89416] hover:bg-[#B89416] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
                        >
                          {saving === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Stage
                        </button>
                        <button
                          onClick={() => deleteStage(idx)}
                          disabled={isHandover}
                          className="px-3 py-2.5 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl disabled:opacity-30 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Stage
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gantt view unchanged structurally — only mounts when viewMode === split */}
      {viewMode === "split" && (
        <div className="flex-1 flex overflow-hidden bg-white" ref={containerRef}>
          <div
            className="flex flex-col shrink-0 border-r border-gray-200 bg-white z-10 shadow-[2px_0_8px_rgba(0,0,0,0.03)]"
            style={{ width: leftWidth }}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden csb flex flex-col">
              <div style={{ width: TABLE_W, minWidth: "100%" }} className="h-full flex flex-col">
                <div className="h-10 shrink-0 bg-[#F9FAFB] border-b-2 border-gray-200 flex items-end text-[9px] font-bold text-gray-500 uppercase tracking-wide pb-1">
                  <div style={{ width: COL.name }} className="pl-2">Task / Activity</div>
                  <div style={{ width: COL.weight }} className="text-center">Wt</div>
                  <div style={{ width: COL.planned }} className="text-center">
                    <div className="border-b border-gray-200 mx-2 mb-0.5">Planned</div>
                    <div className="flex justify-between px-3 text-[8px] normal-case font-semibold">
                      <span>Start</span><span>End</span>
                    </div>
                  </div>
                  <div style={{ width: COL.actual }} className="text-center">
                    <div className="border-b border-gray-200 mx-2 mb-0.5">Actual</div>
                    <div className="flex justify-between px-3 text-[8px] normal-case font-semibold">
                      <span>Start</span><span>End</span>
                    </div>
                  </div>
                  <div style={{ width: COL.progress }} className="pl-2">Progress</div>
                  <div style={{ width: COL.status }} className="text-center">Status</div>
                </div>

                <div ref={leftScrollRef} onScroll={onLeftScroll} className="flex-1 overflow-y-auto csb pb-16">
                  {visibleRows.map((row) => {
                    const d = row.data;
                    const isParent = row.type === "parent";
                    const sIdx = row.sIdx;
                    const open = expandedAll.has(sIdx);
                    const nChild = isParent ? (d.substages || []).filter((x) => !x.archived).length : 0;
                    const wt = isParent ? (nChild ? "100%" : "—") : `${Math.round(100 / (nChild || 1))}%`;

                    return (
                      <div key={row.id} className="flex items-center h-9 border-b border-gray-50 row-h bg-white">
                        <div style={{ width: COL.name }} className="pl-2 flex items-center gap-1 pr-1 min-w-0">
                          {isParent ? (
                            <>
                              <button
                                onClick={() => toggleExpandAll(sIdx)}
                                className="w-4 h-4 grid place-items-center text-gray-400 hover:text-black shrink-0 rounded bg-gray-50"
                              >
                                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                              <span className="text-[9px] font-bold text-gray-700 shrink-0">{sIdx + 1}.</span>
                              <span className="text-[11px] font-bold text-[#252A2A] truncate" title={d.name}>{d.name}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-4 shrink-0" />
                              <span className="text-[8px] font-mono text-gray-400 shrink-0">{sIdx + 1}.{row.subIdx + 1}</span>
                              <span className="text-[10px] text-gray-600 truncate" title={d.name}>{d.name}</span>
                            </>
                          )}
                        </div>
                        <div style={{ width: COL.weight }} className="text-center text-[9px] font-bold text-gray-400">{wt}</div>
                        <div style={{ width: COL.planned }} className="flex justify-between px-2 text-[9px] text-gray-600">
                          <span className="w-1/2 text-center">{fmtDate(d.start_date || d.started_at)}</span>
                          <span className="w-1/2 text-center">{fmtDate(d.planned_end_date || d.expected_date)}</span>
                        </div>
                        <div style={{ width: COL.actual }} className="flex justify-between px-2 text-[9px] text-gray-400">
                          <span className="w-1/2 text-center">{fmtDate(d.actual_start_date || d.started_at)}</span>
                          <span className="w-1/2 text-center font-bold text-gray-700">{fmtDate(d.actual_end_date || d.completed_at)}</span>
                        </div>
                        <div style={{ width: COL.progress }} className="flex items-center gap-1.5 px-2">
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${d.status === "completed" ? "bg-[#10B981]" : "bg-[#B89416]"}`}
                              style={{ width: `${Number(d.progress_pct) || 0}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-800 w-7 text-right">{Number(d.progress_pct) || 0}%</span>
                        </div>
                        <div style={{ width: COL.status }} className="flex justify-center px-1">
                          <StatusPill status={d.status} />
                        </div>
                      </div>
                    );
                  })}
                  {visibleRows.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-400">No tasks found</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="w-2.5 shrink-0 bg-gray-100 hover:bg-[#B89416] border-x border-gray-200 cursor-col-resize z-20 flex items-center justify-center group transition-colors"
            onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
            title="Drag to resize"
          >
            <GripVertical className="w-3.5 h-5 text-gray-400 group-hover:text-white" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col bg-white relative">
            <div className="absolute right-3 top-2 z-30 flex items-center bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
              {["day", "week", "month"].map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2.5 py-0.5 text-[9px] font-bold capitalize rounded ${
                    zoom === z ? "bg-[#B89416] text-white" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>

            <div ref={rightScrollRef} onScroll={onRightScroll} className="flex-1 overflow-auto csb">
              <div style={{ width: Math.max(ganttWidth, 400), minHeight: "100%" }} className="relative flex flex-col">
                <div className="sticky top-0 z-10 h-10 bg-[#F9FAFB] border-b-2 border-gray-200 shrink-0">
                  {monthHeaders.map((m, i) => (
                    <div key={`mh-${i}`} className="absolute top-1 text-[9px] font-bold text-gray-700 -translate-x-1/2 whitespace-nowrap" style={{ left: m.leftPx }}>
                      {m.label}
                    </div>
                  ))}
                  {dateMarkers.map((m, i) => (
                    <div key={`dm-${i}`} className="absolute bottom-1 border-l border-gray-300 pl-1 text-[8px] font-semibold text-gray-500" style={{ left: m.leftPx }}>
                      {m.label}
                    </div>
                  ))}
                </div>

                <div className="relative pb-16">
                  <div className="absolute top-0 bottom-0 w-px bg-red-400 z-[1] pointer-events-none" style={{ left: todayPx }}>
                    <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-b">TODAY</div>
                  </div>

                  {visibleRows.map((row) => {
                    const d = row.data;
                    const isParent = row.type === "parent";
                    const bar = barPx(d.start_date || d.started_at, d.planned_end_date || d.expected_date);
                    const fill =
                      d.status === "completed" ? "bg-[#10B981]" :
                      d.status === "in_progress" ? "bg-[#B89416]" : "bg-gray-300";

                    return (
                      <div key={row.id} className="h-9 border-b border-gray-50 relative row-h">
                        {bar.valid && (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden border border-black/10 ${isParent ? "bg-gray-200" : "bg-gray-100"}`}
                            style={{ left: bar.left, width: bar.width, minWidth: 6 }}
                            title={`${d.name} · ${Number(d.progress_pct) || 0}%`}
                          >
                            <div className={`h-full ${fill} rounded-full`} style={{ width: `${Number(d.progress_pct) || 0}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    completed: { text: "Completed", classes: "bg-[#E6F4EA] text-[#1E8E3E] border border-[#1E8E3E]/20" },
    in_progress: { text: "In Progress", classes: "bg-[#B89416]/10 text-[#B89416] border border-[#B89416]/30" },
    pending: { text: "Not Started", classes: "bg-[#F1F3F4] text-[#5F6368] border border-gray-200" },
  };
  const c = map[status] || map.pending;
  return (
    <span className={`text-[8px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${c.classes}`}>
      {c.text}
    </span>
  );
}