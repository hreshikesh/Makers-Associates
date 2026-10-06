import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { adminApi } from "@/lib/api";
import { User, Check, Loader2, Save } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export default function TeamTab({ project, onSaved }) {
  const [allStaff, setAllStaff] = useState([]);
  const [selectedIds, setSelectedIds] = useState(project.team_ids || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedIds(project.team_ids || []);
  }, [project]);

  useEffect(() => {
    adminApi
      .list("team")
      .then((res) => setAllStaff(Array.isArray(res) ? res : []))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load staff list");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/projects/${project.id}`, { team_ids: selectedIds });
      toast.success("Project team assigned successfully!");
      onSaved();
    } catch {
      toast.error("Failed to update project team");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 max-w-4xl mx-auto font-['Poppins']">
      <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#000F1B]">Assign Core Team</h3>
          <p className="text-[10px] text-[#111111]/50 mt-1">
            Select staff members who will manage this project.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#FF6600] hover:bg-[#FF0000] rounded-xl transition shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}{" "}
          Save Assignments
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6600]" />
          </div>
        ) : (
          allStaff.map((staff) => {
            const isSelected = selectedIds.includes(staff.id);
            return (
              <div
                key={staff.id}
                onClick={() => toggleSelect(staff.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? "border-[#FF6600] bg-[#FF6600]/5 ring-1 ring-[#FF6600]/30"
                    : "border-black/10 bg-white hover:border-black/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {staff.photo ? (
                    <img
                      src={resolveMediaUrl(staff.photo)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#000F1B] text-white grid place-items-center shrink-0">
                      <User className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#000F1B] truncate">
                      {staff.name}
                    </div>
                    <div className="text-[9px] text-[#111111]/50 truncate font-semibold mt-0.5">
                      {staff.designation || staff.role}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded grid place-items-center shrink-0 transition ${
                    isSelected
                      ? "bg-[#FF6600] text-white"
                      : "border border-black/20 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}