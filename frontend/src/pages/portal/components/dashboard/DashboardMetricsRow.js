import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Activity,
  Hourglass,
  IndianRupee,
  Calendar,
  Layers,
  PencilRuler,
  ShieldCheck,
  Box,
  Camera,
  CheckCircle2
} from "lucide-react";

export default function DashboardMetricsRow({ project }) {
  const activities = project?.activities || [];
  const stages = project?.stages || [];
  const drawings = project?.drawings || [];
  const materials = project?.materials || [];

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const recentUpdates = activities
    .filter((a) => new Date(a.timestamp) >= sevenDaysAgo && !a.user_name?.toLowerCase().includes("client"))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  const expectedCompletionDate = project.expected_completion || (stages.length > 0 ? stages[stages.length - 1]?.expected_date : null);
  const daysRemaining = expectedCompletionDate ? Math.max(0, Math.ceil((new Date(expectedCompletionDate) - today) / 86400000)) : null;

  const clientActionsPending =
    drawings.filter((d) => d.status === "pending").length +
    materials.filter((m) => m.status === "pending").length;

  const completedStages = stages.filter((s) => s.status === "completed").length;

  const cv = project?.contract_value || 0;
  const sp = project?.amount_spent || 0;
  const formatMoney = (val) =>
    val >= 10000000 ? `${(val / 10000000).toFixed(2)} Cr` : val >= 100000 ? `${(val / 100000).toFixed(2)} L` : val.toLocaleString("en-IN");
  const pctSpent = cv > 0 ? Math.round((sp / cv) * 100) : 0;
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-['Poppins']">
      
      {/* 1. Recent Updates */}
      <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm flex flex-col h-[200px]">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-[#252A2A]">Recent Updates</h2>
          </div>
          <Link to="/portal/site-reports" className="text-[10px] font-bold text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
          {recentUpdates.length === 0 ? (
            <div className="text-[10px] text-[#252A2A]/40 italic text-center py-10">
              No recent updates in the last 7 days.
            </div>
          ) : (
            recentUpdates.map((act, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#F9FAFB] p-2 rounded-lg border border-black/5 hover:border-black/10 transition">
                <div className="w-7 h-7 rounded-lg bg-white border border-black/10 grid place-items-center shrink-0">
                  {act.module === "Drawings" ? (
                    <PencilRuler className="w-3.5 h-3.5 text-blue-500" />
                  ) : act.module === "Quality" ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ) : act.module === "Materials" ? (
                    <Box className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[8px] text-[#252A2A]/50 font-semibold">{formatDate(act.timestamp)}</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#252A2A] truncate">{act.action}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Glance Grid (Bento Boxes) */}
      <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm flex flex-col h-[200px]">
        <div className="flex items-center gap-1.5 mb-2 shrink-0">
          <Activity className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-[#252A2A]">Project at a Glance</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-2 flex-1">
          {/* Days Remaining */}
          <div className="border border-black/5 rounded-lg p-2.5 bg-[#F9FAFB] flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Hourglass className="w-3.5 h-3.5 text-[#252A2A]/40" />
              <span className="text-base font-black text-[#252A2A] leading-none">
                {daysRemaining !== null ? daysRemaining : "TBD"}
              </span>
            </div>
            <div className="text-[8px] font-bold text-[#252A2A]/50 uppercase tracking-wider">Days Remaining</div>
          </div>

          {/* Budget / Spent */}
          <div className="border border-black/5 rounded-lg p-2.5 bg-[#F9FAFB] flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-[#252A2A]/40" />
              <span className="text-base font-black text-[#252A2A] leading-none truncate">
                {formatMoney(sp)}
              </span>
            </div>
            <div className="text-[8px] font-semibold text-[#252A2A]/60 truncate mb-1">
              of {formatMoney(cv)} Spent ({pctSpent}%)
            </div>
            <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#252A2A] rounded-full transition-all" style={{ width: `${Math.min(pctSpent, 100)}%` }} />
            </div>
          </div>

          {/* Pending Actions */}
          <div className="border border-black/5 rounded-lg p-2.5 bg-[#F9FAFB] flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <span className="text-base font-black text-[#252A2A] leading-none">
                {clientActionsPending}
              </span>
            </div>
            <div className="text-[8px] font-bold text-[#252A2A]/50 uppercase tracking-wider">Actions Pending</div>
          </div>

          {/* Stages Completed */}
          <div className="border border-black/5 rounded-lg p-2.5 bg-[#F9FAFB] flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Layers className="w-3.5 h-3.5 text-[#252A2A]" />
              <span className="text-base font-black text-[#252A2A] leading-none">
                {completedStages}/{stages.length}
              </span>
            </div>
            <div className="text-[8px] font-bold text-[#252A2A]/50 uppercase tracking-wider">Stages Completed</div>
          </div>
        </div>
      </div>

    </div>
  );
}