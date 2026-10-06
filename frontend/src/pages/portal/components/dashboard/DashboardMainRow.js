import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Calendar, Building2 } from "lucide-react";

export default function DashboardMainRow({ project }) {
  const drawings = project?.drawings || [];
  const materials = project?.materials || [];
  const stages = project?.stages || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAhead = new Date(today);
  thirtyDaysAhead.setDate(today.getDate() + 30);
  thirtyDaysAhead.setHours(23, 59, 59, 999);

  const clientActions = [
    ...drawings
      .filter((d) => d.status === "pending")
      .map((d, i) => ({
        id: `d${i}`,
        title: `Approve ${d.name}`,
        due: d.uploaded_at
          ? new Date(new Date(d.uploaded_at).setDate(new Date(d.uploaded_at).getDate() + 3))
          : today,
        link: "/portal/approvals",
        priority: "High",
      })),
    ...materials
      .filter((m) => m.status === "pending")
      .map((m, i) => ({
        id: `m${i}`,
        title: `Select ${m.item_name}`,
        due: m.created_at
          ? new Date(new Date(m.created_at).setDate(new Date(m.created_at).getDate() + 5))
          : today,
        link: "/portal/materials",
        priority: "Medium",
      })),
  ].sort((a, b) => a.due - b.due);

  // ★ FIXED: show ALL stages planned in the next 1 month (no .slice limit)
  const upcomingEvents = stages
    .filter((s) => {
      if (s.status === "completed") return false;
      if (!s.expected_date) return false;

      const expected = new Date(s.expected_date);
      expected.setHours(0, 0, 0, 0);

      return expected >= today && expected <= thirtyDaysAhead;
    })
    .sort((a, b) => new Date(a.expected_date) - new Date(b.expected_date));

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 font-['Poppins']">
      {/* Actions */}
      <div className="lg:col-span-2 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col h-[200px] shadow-sm">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-[#000F1B]">
              Your Actions ({clientActions.length})
            </h2>
          </div>
          <Link
            to="/portal/approvals"
            className="text-[10px] font-bold text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
          {clientActions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#111111]/40">
              <CheckCircle2 className="w-6 h-6 mb-1 opacity-30" />
              <p className="text-[10px] font-semibold">Caught up!</p>
            </div>
          ) : (
            clientActions.map((act, i) => (
              <Link
                key={act.id}
                to={act.link}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#FF6600] text-white text-[9px] font-bold grid place-items-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="text-[11px] font-bold text-[#000F1B] truncate">
                    {act.title}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      act.priority === "High"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {act.priority}
                  </span>
                  <span className="text-[9px] font-semibold text-[#111111]/50 hidden sm:inline">
                    Due {formatDate(act.due)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* What's Coming Next */}
      <div className="lg:col-span-3 bg-white border border-black/5 rounded-2xl p-4 flex flex-col h-[200px] shadow-sm">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-[#000F1B]">
              What's Coming Next
              {upcomingEvents.length > 0 && (
                <span className="ml-1 text-[10px] font-semibold text-gray-400">
                  ({upcomingEvents.length})
                </span>
              )}
            </h2>
          </div>
          <Link
            to="/portal/timeline"
            className="text-[10px] font-bold text-blue-600 hover:underline"
          >
            Full Timeline
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {upcomingEvents.length === 0 ? (
            <div className="text-[10px] text-[#111111]/40 italic text-center py-8">
              No scheduled stages in the next 30 days.
            </div>
          ) : (
            upcomingEvents.map((evt, i) => (
              <div
                key={evt.id || `${evt.name}-${i}`}
                className="flex items-center gap-3 hover:bg-[#F9FAFB] p-2 rounded-lg transition border border-transparent hover:border-black/5"
              >
                <div className="w-12 text-right text-[10px] font-bold text-[#111111]/60 shrink-0">
                  {formatDate(evt.expected_date)}
                </div>
                <div className="w-6 h-6 rounded-md bg-[#F5F6F8] grid place-items-center shrink-0 border border-black/5">
                  <Building2 className="w-3 h-3 text-[#111111]/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#000F1B] truncate">
                    {evt.name}
                  </div>
                </div>
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                    i === 0
                      ? "bg-amber-50 text-amber-600"
                      : "bg-[#F2F2F2] text-[#111111]/50"
                  }`}
                >
                  {i === 0 ? "Next Up" : evt.status || "Scheduled"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}