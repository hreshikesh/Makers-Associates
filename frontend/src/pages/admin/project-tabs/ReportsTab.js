import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";
import {
  Plus, X, Save, Loader2, CheckCircle2, Circle, Camera,
  HardHat, Trash2, Users, Users2, History, FileSpreadsheet
} from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

/** Prevent 0100 / leading-zero bug on number fields */
const parseCountInput = (raw) => {
  if (raw === "" || raw === null || raw === undefined) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits === "") return "";
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return "";
  return Math.max(0, n);
};
const countValue = (v) => (v === "" || v === null || v === undefined ? "" : v);

export default function ReportsTab({ project, onSaved }) {
  const [activeTab, setActiveTab] = useState("queue");
  const [reports, setReports] = useState(project.daily_reports || []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [overallStatus, setOverallStatus] = useState("Work as per plan");
  const [statusNotes, setStatusNotes] = useState("");

  // Labor — empty string while typing, not stuck on 0
  const [workersCount, setWorkersCount] = useState("");
  const [masteriesCount, setMasteriesCount] = useState("");

  const [workDoneYesterday, setWorkDoneYesterday] = useState("");
  const [workCompletedToday, setWorkCompletedToday] = useState(""); // planned for today

  const [workCompletedInput, setWorkCompletedInput] = useState("");
  const [workCompletedList, setWorkCompletedList] = useState([]);
  const [plannedTomorrowInput, setPlannedTomorrowInput] = useState("");
  const [plannedTomorrowList, setPlannedTomorrowList] = useState([]);
  const [photosList, setPhotosList] = useState([]);

  useEffect(() => {
    setReports(project.daily_reports || []);
  }, [project]);

  const fetchReports = async () => {
    try {
      const { data } = await api.get(`/admin/projects/${project.id}/daily-reports`);
      setReports(data.reports || []);
      onSaved?.();
    } catch {
      toast.error("Failed to refresh daily reports");
    }
  };

  const handleAddWorkCompleted = () => {
    if (!workCompletedInput.trim()) return;
    setWorkCompletedList((prev) => [...prev, workCompletedInput.trim()]);
    setWorkCompletedInput("");
  };

  const handleAddPlannedTomorrow = () => {
    if (!plannedTomorrowInput.trim()) return;
    setPlannedTomorrowList((prev) => [...prev, plannedTomorrowInput.trim()]);
    setPlannedTomorrowInput("");
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, "daily-reports");
      const photoUrl = res.url || res.absoluteUrl;
      const currentTimeStr = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setPhotosList((prev) => [
        ...prev,
        { url: photoUrl, caption: "Site Progress Photo", time: currentTimeStr },
      ]);
      toast.success("Photo attached!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setDate(todayStr);
    setOverallStatus("Work as per plan");
    setStatusNotes("");
    setWorkersCount("");
    setMasteriesCount("");
    setWorkDoneYesterday("");
    setWorkCompletedToday("");
    setWorkCompletedList([]);
    setPlannedTomorrowList([]);
    setPhotosList([]);
    setWorkCompletedInput("");
    setPlannedTomorrowInput("");
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (workCompletedList.length === 0) {
      toast.error("Please add at least one item under 'Completed Line Items'");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/admin/projects/${project.id}/daily-reports`, {
        date,
        overall_status: overallStatus,
        status_notes: statusNotes,
        work_completed: workCompletedList,
        planned_tomorrow: plannedTomorrowList,
        photos: photosList,
        workers_count: Number(workersCount) || 0,
        masteries_count: Number(masteriesCount) || 0,
        work_done_yesterday: workDoneYesterday,
        work_completed_today: workCompletedToday, // stores "planned for today"
      });
      toast.success("Daily report published to client portal");
      resetForm();
      setActiveTab("queue");
      await fetchReports();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Permanently delete this report?")) return;
    try {
      await api.delete(`/admin/projects/${project.id}/daily-reports/${reportId}`);
      toast.success("Report deleted");
      await fetchReports();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4 font-['Poppins']">
      {/* Tabs */}
      <div className="flex border-b border-black/5 bg-white px-4 gap-6 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab("queue")}
          className={`py-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "queue"
              ? "border-[#FF6600] text-[#FF6600]"
              : "border-transparent text-[#111111]/50 hover:text-[#111111]"
          }`}
        >
          <span>Report Queue & History ({reports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`py-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "create"
              ? "border-[#FF6600] text-[#FF6600]"
              : "border-transparent text-[#111111]/50 hover:text-[#111111]"
          }`}
        >
          <Plus className="w-4 h-4" /> <span>Log Daily Report</span>
        </button>
      </div>

      {activeTab === "create" && (
        <form
          onSubmit={handleSubmitReport}
          className="bg-white rounded-xl border border-black/5 p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              New Daily Site Report
            </h3>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              Publishes directly to client portal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-[#111111]">
                Report Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#FF6600]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-[#111111]">
                Overall Site Status *
              </label>
              <select
                value={overallStatus}
                onChange={(e) => setOverallStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-[#111111] bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#FF6600]"
              >
                <option>Work as per plan</option>
                <option>Ahead of schedule</option>
                <option>Slightly delayed</option>
                <option>Impacted by weather</option>
                <option>Material arrival pending</option>
              </select>
            </div>
          </div>

          {/* Labor */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#FF6600]" /> Labor & Site Strength Allocation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                  Number of Workers *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  inputMode="numeric"
                  value={countValue(workersCount)}
                  onChange={(e) => setWorkersCount(parseCountInput(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#FF6600]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                  Number of Masteries (Masons / Mistris) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  inputMode="numeric"
                  value={countValue(masteriesCount)}
                  onChange={(e) => setMasteriesCount(parseCountInput(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#FF6600]"
                />
              </div>
            </div>
          </div>

          {/* Yesterday + Planned Today */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-[#111111] flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-gray-500" /> Work Done Yesterday
              </label>
              <textarea
                rows={2}
                value={workDoneYesterday}
                onChange={(e) => setWorkDoneYesterday(e.target.value)}
                placeholder="State work done yesterday..."
                className="w-full px-3 py-2 border rounded-xl text-xs resize-none outline-none focus:ring-2 focus:ring-[#FF6600]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-[#111111] flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" /> Work Planned for Today
              </label>
              <textarea
                rows={2}
                value={workCompletedToday}
                onChange={(e) => setWorkCompletedToday(e.target.value)}
                placeholder="What is planned for execution today..."
                className="w-full px-3 py-2 border rounded-xl text-xs resize-none outline-none focus:ring-2 focus:ring-[#FF6600]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase mb-1 text-[#111111]">
              Status Briefing / Notes
            </label>
            <textarea
              rows={2}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Brief morning notes or site conditions..."
              className="w-full px-3 py-2 border rounded-xl text-xs resize-none outline-none focus:ring-2 focus:ring-[#FF6600]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-black/5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-2 text-[#111111]">
                Completed Line Items *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={workCompletedInput}
                  onChange={(e) => setWorkCompletedInput(e.target.value)}
                  placeholder="e.g. Block work (50%)"
                  className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF6600]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddWorkCompleted();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddWorkCompleted}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {workCompletedList.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setWorkCompletedList((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-2 text-[#111111]">
                Planned Tomorrow
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={plannedTomorrowInput}
                  onChange={(e) => setPlannedTomorrowInput(e.target.value)}
                  placeholder="e.g. Service conduits marking"
                  className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF6600]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPlannedTomorrow();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPlannedTomorrow}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {plannedTomorrowList.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPlannedTomorrowList((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-black/5">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-bold uppercase text-[#111111]">
                Attach Today's Photos
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600]/10 hover:bg-[#FF6600]/20 text-[#FF6600] rounded-lg text-xs font-bold cursor-pointer transition">
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadPhoto}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {photosList.map((p, i) => (
                <div
                  key={i}
                  className="relative group rounded-xl overflow-hidden border border-black/10 aspect-square bg-black/5"
                >
                  <img
                    src={resolveMediaUrl(p.url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotosList((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white grid place-items-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    value={p.caption}
                    onChange={(e) =>
                      setPhotosList((prev) =>
                        prev.map((item, idx) =>
                          idx === i ? { ...item, caption: e.target.value } : item
                        )
                      )
                    }
                    className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] px-2 py-1 outline-none font-medium"
                    placeholder="Caption..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 flex justify-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6600] to-[#FF0000] hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              Publish Report
            </button>
          </div>
        </form>
      )}

      {activeTab === "queue" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-xs text-[#111111]/50 italic shadow-sm">
              No daily reports logged yet.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/5 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl grid place-items-center font-bold text-xs bg-emerald-100 text-emerald-800">
                      <HardHat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#111111] text-sm">
                          {new Date(rep.date + "T00:00:00").toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Published to Client
                        </span>
                      </div>
                      <p className="text-[10px] text-[#111111]/50 mt-0.5">
                        Status: <strong>{rep.overall_status}</strong> · By{" "}
                        {rep.submitted_by || "Site Engineer"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteReport(rep.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 grid place-items-center hover:bg-red-600 hover:text-white transition self-end sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg mb-3">
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-[#FF6600]" /> Deployments:{" "}
                    {rep.workers_count || 0} Workers
                  </div>
                  <div className="w-px h-3 bg-slate-300" />
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Users2 className="w-3.5 h-3.5 text-blue-600" /> Masteries:{" "}
                    {rep.masteries_count || 0} Skilled
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] bg-white border border-gray-100 p-3 rounded-lg mb-4">
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-500 uppercase tracking-wider text-[8px]">
                      Work Done Yesterday
                    </div>
                    <div className="text-gray-800 font-semibold">
                      {rep.work_done_yesterday || "—"}
                    </div>
                  </div>
                  <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-3">
                    <div className="font-bold text-gray-500 uppercase tracking-wider text-[8px]">
                      Work Planned for Today
                    </div>
                    <div className="text-gray-900 font-bold">
                      {rep.work_completed_today || "—"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-1">
                      Completed Line Items:
                    </div>
                    <ul className="space-y-1 pl-1">
                      {(rep.work_completed || []).map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-1.5 text-[#111111]/80 font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(rep.photos || []).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Attached Photos:
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {rep.photos.map((p, idx) => (
                          <img
                            key={idx}
                            src={resolveMediaUrl(p.url)}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover border border-black/10 shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}