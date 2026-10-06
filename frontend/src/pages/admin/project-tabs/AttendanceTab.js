import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Check, Loader2 } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export default function AttendanceTab({ project, onSaved }) {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const staff = await adminApi.list("team");
        const staffMap = Object.fromEntries((staff || []).map((s) => [s.id, s]));
        const internal = (project.team_ids || [])
          .map((id) => staffMap[id])
          .filter(Boolean)
          .map((s) => ({
            id: s.id,
            name: s.name,
            role: s.designation || s.role || "Staff",
            photo: s.photo,
          }));
        const external = (project.team_directory || [])
          .filter((e) => e.status === "Active")
          .map((e) => ({
            id: e.id,
            name: e.name,
            role: e.role,
            photo: e.avatar,
          }));
        setMembers([...internal, ...external]);
        const today = new Date().toLocaleDateString("en-CA");
        const entry = (project.attendance || []).find((a) => a.date === today);
        setSelected(new Set(entry?.member_ids || []));
      } catch {
        toast.error("Failed to load team");
      } finally {
        setLoading(false);
      }
    })();
  }, [project]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/projects/${project.id}/attendance`, {
        member_ids: [...selected],
      });
      toast.success(`Attendance saved`);
      onSaved();
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 max-w-4xl mx-auto font-['Poppins']">
      <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#000F1B]">
            Daily Site Attendance
          </h3>
          <p className="text-[10px] text-[#111111]/50 mt-1">
            Mark who is present on site today ({new Date().toLocaleDateString("en-IN")})
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}{" "}
          Save Attendance
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : members.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs italic text-[#111111]/40 border border-dashed border-black/10 rounded-xl">
            No team members assigned to this project yet. Assign team members in the "Team" tab first.
          </div>
        ) : (
          members.map((m) => {
            const on = selected.has(m.id);
            return (
              <div
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  on
                    ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30"
                    : "border-black/10 bg-white hover:border-black/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#000F1B] text-white grid place-items-center text-xs font-bold shrink-0">
                      {m.name?.[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#000F1B] truncate">
                      {m.name}
                    </div>
                    <div className="text-[9px] text-[#111111]/50 truncate font-semibold mt-0.5">
                      {m.role}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded grid place-items-center shrink-0 transition ${
                    on
                      ? "bg-emerald-500 text-white"
                      : "border border-black/20 bg-white"
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}