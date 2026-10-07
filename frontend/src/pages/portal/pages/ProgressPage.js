import React, { useState } from "react";
import {
  TrendingUp, Calendar, CheckCircle2, PlayCircle, Circle,
  Download, Image as ImageIcon, FileText, HardHat, LayoutGrid, List,
  Clock, Target, ChevronRight
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";
import { toast } from "sonner";
import { API_BASE } from "../../../lib/api";

const TABS = ["Overview", "Site Schedule", "Monthly Progress", "Project Photos", "Progress Report"];

export default function ProgressPage() {
  const { project } = usePortal();
  const [activeTab, setActiveTab] = useState("Overview");

  if (!project) {
    return <div className="p-10 flex justify-center"><div className="w-6 h-6 md:w-8 md:h-8 border-2 border-[#B89416] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stages = project.stages || [];
  const totalWeight = stages.length || 1;
  const overallProgress = Math.round(stages.reduce((sum, s) => sum + (Number(s.progress_pct) || 0), 0) / totalWeight);
  const stagesCompleted = stages.filter(s => s.status === "completed").length;

  const startDate = new Date(project.start_date || project.created_at || Date.now());
  const expectedDate = project.expected_completion ? new Date(project.expected_completion) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  const today = new Date();

  const daysCompleted = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.max(1, Math.floor((expectedDate - startDate) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.floor((expectedDate - today) / (1000 * 60 * 60 * 24)));

  const approvedReports = (project.daily_reports || []).filter(r => r.is_approved).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="w-full max-w-[1400px] 2xl:max-w-[1800px] mx-auto space-y-3 md:space-y-4 2xl:space-y-6 font-['Poppins'] pb-10 px-3 sm:px-4 2xl:px-8 mt-2 md:mt-4">

      {/* TABS HEADER */}
      <div className="mb-2 md:mb-3">
        <h1 className="text-xl md:text-2xl 2xl:text-3xl font-bold text-[#252A2A] mb-2 md:mb-3">Project Progress</h1>
        <div className="flex overflow-x-auto no-scrollbar border-b border-black/5 gap-1 md:gap-2 pb-0.5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 md:py-2 text-[10px] md:text-xs 2xl:text-sm uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? "border-[#B89416] text-[#252A2A]" : "border-transparent text-gray-400 hover:text-[#252A2A]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* COMPACT KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 2xl:gap-4">
        <KpiBlock title="Overall Progress" value={`${overallProgress}%`} subtitle={overallProgress >= 100 ? "Completed" : "On Track"} accent="#B89416" icon={Target} />
        <KpiBlock title="Stages Done" value={`${stagesCompleted}/${stages.length}`} subtitle="Milestones" accent="#10B981" icon={CheckCircle2} />
        <KpiBlock title="Days Completed" value={daysCompleted} subtitle={`of ${totalDays} total`} accent="#FF8C00" icon={Clock} />
        <KpiBlock title="Days Remaining" value={daysRemaining} subtitle="Estimated" accent="#EAB308" icon={Calendar} />
        <KpiBlock title="Forecast Handover" value={expectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} subtitle={expectedDate.getFullYear()} accent="#252A2A" icon={TrendingUp} />
      </div>

      {/* DYNAMIC TAB CONTENT */}
      <div className="min-h-[400px] 2xl:min-h-[500px] mt-2 md:mt-3">
        {activeTab === "Overview" && <OverviewTab project={project} stages={stages} />}
        {activeTab === "Site Schedule" && <SiteScheduleTab stages={stages} startDate={startDate} expectedDate={expectedDate} />}
        {activeTab === "Monthly Progress" && <MonthlyProgressTab project={project} startDate={startDate} expectedDate={expectedDate} />}
        {activeTab === "Project Photos" && <ProjectPhotosTab reports={approvedReports} stages={stages} />}
        {activeTab === "Progress Report" && <DailyProgressTab project={project} reports={approvedReports} />}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ project, stages }) {
  const currentStageIdx = stages.findIndex(s => s.status === "in_progress");
  const activeStage = currentStageIdx !== -1 ? stages[currentStageIdx] : null;
  const team = project.team_directory || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 2xl:gap-6">
      <div className="lg:col-span-8 order-2 lg:order-1 bg-white rounded-xl border border-black/5 shadow-sm p-3 md:p-4 2xl:p-6">
        <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
          <h3 className="text-xs md:text-sm 2xl:text-base font-bold text-[#252A2A] uppercase tracking-wider">Construction Master Plan</h3>
          <span className="text-[9px] md:text-xs 2xl:text-sm font-bold bg-[#F2F2F2] px-2 py-1 rounded-md text-[#252A2A]">{stages.length} Stages</span>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[10px] md:text-xs 2xl:text-sm min-w-[500px]">
            <thead className="text-gray-500 border-b border-black/5 bg-[#F9FAFB]">
              <tr>
                <th className="py-2 px-3 font-bold uppercase tracking-wider w-8">#</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">Stage</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-center">Status</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider w-[100px] 2xl:w-[140px]">Progress</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-right">Actual End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {stages.map((stage, i) => {
                const isActive = stage.status === "in_progress";
                const isCompleted = stage.status === "completed";
                const pct = Number(stage.progress_pct) || 0;
                const actualEnd = stage.actual_end_date
                  ? new Date(stage.actual_end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
                  : "—";

                return (
                  <tr key={i} className={`transition-colors ${isActive ? "bg-[#B89416]/5" : "hover:bg-[#F9FAFB]"}`}>
                    <td className="py-2 px-3 text-gray-400 font-mono font-bold">{(i + 1).toString().padStart(2, '0')}</td>
                    <td className={`py-2 px-3 font-bold ${isActive ? "text-[#B89416]" : "text-[#252A2A]"}`}>{stage.name}</td>
                    <td className="py-2 px-3 text-center"><StatusBadge status={stage.status} /></td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 2xl:gap-2">
                        <div className="flex-1 h-1 md:h-1.5 2xl:h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-[#B89416] to-[#FFA500]"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] md:text-[10px] 2xl:text-xs font-black w-6 2xl:w-8 text-right text-[#252A2A]">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500 font-semibold">{actualEnd}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="sm:hidden space-y-2">
          {stages.map((stage, i) => {
            const isActive = stage.status === "in_progress";
            const pct = Number(stage.progress_pct) || 0;
            const actualEnd = stage.actual_end_date ? new Date(stage.actual_end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

            return (
              <div key={i} className={`p-2.5 rounded-lg border ${isActive ? "border-[#B89416] bg-[#B89416]/5 shadow-sm" : "border-black/5 bg-white"}`}>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400 shrink-0">#{(i + 1).toString().padStart(2, '0')}</span>
                    <span className={`text-xs font-bold truncate ${isActive ? "text-[#B89416]" : "text-[#252A2A]"}`}>{stage.name}</span>
                  </div>
                  <StatusBadge status={stage.status} />
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-black/5">
                  <div className="flex-1 h-1.5 bg-[#F2F2F2] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stage.status === "completed" ? "bg-emerald-500" : "bg-[#B89416]"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-[#252A2A] shrink-0">{pct}%</span>
                  <span className="text-[8px] text-gray-300">|</span>
                  <span className="text-[9px] font-bold text-gray-500 shrink-0">End: {actualEnd}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-4 order-1 lg:order-2 space-y-3 md:space-y-4">

        <div className="bg-gradient-to-br from-[#252A2A] via-[#0F1E30] to-[#252A2A] rounded-xl shadow-sm p-4 md:p-5 2xl:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#B89416]" />
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B89416]/20 blur-[15px] rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] md:text-xs 2xl:text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3 h-3 2xl:w-4 2xl:h-4 text-[#B89416]" /> Active Stage
              </h3>
              {activeStage && (
                <span className="text-[10px] md:text-xs 2xl:text-sm font-black bg-[#B89416] text-white px-2 py-0.5 rounded">{activeStage.progress_pct || 0}%</span>
              )}
            </div>

            {activeStage ? (
              <div className="space-y-2">
                <h4 className="text-sm md:text-base 2xl:text-lg font-bold text-white leading-tight">{activeStage.name}</h4>
                <div className="h-1 md:h-1.5 2xl:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#B89416] to-[#FFA500] rounded-full" style={{ width: `${activeStage.progress_pct || 0}%` }} />
                </div>
                {activeStage.description && (
                  <p className="text-[10px] md:text-xs 2xl:text-sm text-white/70 bg-white/5 p-2 rounded border border-white/10 italic leading-relaxed mt-2">
                    "{activeStage.description}"
                  </p>
                )}
              </div>
            ) : (
              <div className="text-[10px] md:text-xs 2xl:text-sm text-white/40 italic py-4 text-center">No active stage currently in progress.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-3 md:p-4 2xl:p-6">
          <h3 className="text-[10px] md:text-xs 2xl:text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-black/5 pb-1.5">Project Team</h3>
          <div className="space-y-2 2xl:space-y-3">
            {team.filter(t => t.status !== "Pending").slice(0, 5).map((member, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {member.avatar || member.photo
                  ? <img src={resolveMediaUrl(member.avatar || member.photo)} alt="" className="w-7 h-7 md:w-8 md:h-8 2xl:w-10 2xl:h-10 rounded-full object-cover border border-black/10" />
                  : <div className="w-7 h-7 md:w-8 md:h-8 2xl:w-10 2xl:h-10 rounded-full bg-gray-100 border border-black/5 flex items-center justify-center text-[#252A2A] font-bold text-xs 2xl:text-sm">{member.name?.[0] || "?"}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] md:text-xs 2xl:text-sm font-bold text-[#252A2A] truncate">{member.name}</div>
                  <div className="text-[9px] md:text-[10px] 2xl:text-xs text-gray-500 font-semibold truncate">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SITE SCHEDULE (GANTT CHART - FULLY HORIZONTAL)
// ============================================================================

function SiteScheduleTab({ stages, startDate, expectedDate }) {
  const totalMs = expectedDate - startDate || 1;
  const today = new Date();

  const todayPct = Math.max(0, Math.min(100, ((today - startDate) / totalMs) * 100));

  const monthMarkers = [];
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (cur <= expectedDate) {
    const pct = Math.max(0, ((cur - startDate) / totalMs) * 100);
    monthMarkers.push({ label: cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), pct });
    cur.setMonth(cur.getMonth() + 1);
  }

  const shortDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: '2-digit' }) : "—";

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-3 md:p-5 2xl:p-6 overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 border-b border-black/5 pb-3">
        <div>
          <h3 className="text-xs md:text-sm 2xl:text-base font-bold text-[#252A2A]">Master Gantt Schedule</h3>
          <p className="text-[9px] md:text-[10px] 2xl:text-xs text-gray-500 font-medium mt-0.5">Timeline of stages, substages & tracking dates</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] 2xl:text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#F9FAFB] p-1.5 rounded border border-black/5 flex-wrap">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm" /> Done</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#B89416] rounded-sm" /> Active</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-sm" /> Pending</div>
          <div className="w-px h-3 bg-black/10 mx-0.5" />
          <div className="flex items-center gap-1"><div className="w-0.5 h-3 bg-red-500 rounded-full" /> Today</div>
        </div>
      </div>

      {/* Main Gantt Body - Fully horizontally scrollable for all devices */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="min-w-[800px] md:min-w-[900px] 2xl:min-w-[1200px] pb-2">

          <div className="flex mb-2">
            <div className="w-[45%] shrink-0 border-r border-black/10 pr-2 flex items-end pb-1 gap-2">
              <div className="flex-1 text-[9px] md:text-[10px] 2xl:text-xs font-bold text-gray-400 uppercase tracking-wider">Task Breakdown</div>
              <div className="w-14 md:w-16 2xl:w-20 text-center text-[8px] md:text-[9px] 2xl:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start</div>
              <div className="w-14 md:w-16 2xl:w-20 text-center text-[8px] md:text-[9px] 2xl:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Planned</div>
              <div className="w-14 md:w-16 2xl:w-20 text-center text-[8px] md:text-[9px] 2xl:text-[10px] font-bold text-[#252A2A] uppercase tracking-wider">Actual</div>
            </div>

            <div className="w-[55%] shrink-0 pl-2 relative h-5 md:h-6 border-b border-black/10">
              {monthMarkers.map((m, i) => (
                <div key={i} className="absolute top-0 border-l border-black/10 pl-1 h-full flex flex-col justify-end pb-0.5" style={{ left: `${m.pct}%` }}>
                  <div className="text-[8px] md:text-[9px] 2xl:text-[10px] font-bold text-[#252A2A] leading-none">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative space-y-1">
            <div className="absolute top-0 bottom-0 pointer-events-none z-20" style={{ left: `calc(45% + 8px + ${todayPct}% * 0.55)` }}>
              <div className="w-px h-full bg-red-500/80 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
            </div>

            {stages.map((stage, idx) => {
              const substages = stage.substages || [];
              const sStart = stage.start_date ? new Date(stage.start_date) : stage.started_at ? new Date(stage.started_at) : null;
              const sPlannedEnd = stage.planned_end_date ? new Date(stage.planned_end_date) : stage.expected_date ? new Date(stage.expected_date) : null;
              const sActualEnd = stage.actual_end_date ? new Date(stage.actual_end_date) : null;

              const hasDates = sStart && (sActualEnd || sPlannedEnd);
              const activeEnd = sActualEnd || sPlannedEnd;
              const leftPct = hasDates ? Math.max(0, ((sStart - startDate) / totalMs) * 100) : 0;
              const widthPct = hasDates ? Math.max(0.5, ((activeEnd - sStart) / totalMs) * 100) : 0;
              const isCompleted = stage.status === "completed";
              const isActive = stage.status === "in_progress";
              const barColor = isCompleted ? "bg-emerald-500" : isActive ? "bg-[#B89416]" : "bg-slate-300";

              return (
                <div key={idx} className="group pb-1.5">
                  <div className="flex items-center py-1 bg-white hover:bg-[#F9FAFB] rounded border border-transparent hover:border-black/5 transition">

                    {/* TASK INFO & DATES */}
                    <div className="w-[45%] shrink-0 px-2 flex items-center gap-1.5 min-w-0 border-r border-black/5">
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <div className="text-[8px] md:text-[9px] 2xl:text-[10px] font-black text-white bg-[#252A2A] w-4 h-4 rounded-[3px] grid place-items-center shrink-0">{(idx + 1)}</div>
                        <div className="font-bold text-[10px] md:text-xs 2xl:text-sm text-[#252A2A] truncate">{stage.name}</div>
                        <div className="text-[9px] md:text-[10px] 2xl:text-xs font-black text-[#B89416] ml-auto">{stage.progress_pct || 0}%</div>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] text-gray-500">
                        <div className="w-14 md:w-16 text-center font-medium">{shortDate(sStart)}</div>
                        <div className="w-14 md:w-16 text-center font-medium">{shortDate(sPlannedEnd)}</div>
                        <div className="w-14 md:w-16 text-center font-bold text-[#252A2A]">{shortDate(sActualEnd)}</div>
                      </div>
                    </div>

                    {/* TIMELINE BAR */}
                    <div className="w-[55%] shrink-0 pl-2 relative h-3 md:h-4 flex items-center overflow-hidden">
                      {hasDates && (
                        <div className="absolute h-2 md:h-2.5 rounded shadow-sm overflow-hidden" style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '3px' }}>
                          <div className={`h-full ${barColor} relative`}>
                            {isActive && stage.progress_pct > 0 && <div className="absolute top-0 left-0 h-full bg-white/30" style={{ width: `${stage.progress_pct}%` }} />}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {substages.length > 0 && (
                    <div className="ml-3 md:ml-4 border-l border-black/10 space-y-0.5 pt-0.5">
                      {substages.map((sub, sIdx) => {
                        const subStart = sub.start_date ? new Date(sub.start_date) : sStart;
                        const subPlanned = sub.planned_end_date ? new Date(sub.planned_end_date) : sPlannedEnd;
                        const subActual = sub.actual_end_date ? new Date(sub.actual_end_date) : null;
                        const subHasDates = subStart && (subActual || subPlanned);
                        const subActiveEnd = subActual || subPlanned;
                        const subLeft = subHasDates ? Math.max(0, ((subStart - startDate) / totalMs) * 100) : 0;
                        const subWidth = subHasDates ? Math.max(0.5, ((subActiveEnd - subStart) / totalMs) * 100) : 0;
                        const subColor = sub.status === "completed" ? "bg-emerald-400" : sub.status === "in_progress" ? "bg-[#FFA500]" : "bg-slate-200";

                        return (
                          <div key={sIdx} className="flex items-center hover:bg-[#F9FAFB] transition relative py-0.5">
                            <div className="absolute top-1/2 left-0 w-2 border-t border-black/10" />

                            <div className="w-[45%] shrink-0 pl-3 flex items-center gap-1.5 min-w-0 border-r border-black/5">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                                <div className="font-semibold text-[9px] md:text-[10px] 2xl:text-xs text-gray-500 truncate">{sub.name}</div>
                                <span className="text-[8px] md:text-[9px] 2xl:text-[10px] font-bold text-gray-400 ml-auto">{sub.progress_pct || 0}%</span>
                              </div>

                              <div className="flex items-center gap-2 text-[8px] text-gray-400">
                                <div className="w-14 md:w-16 text-center">{shortDate(subStart)}</div>
                                <div className="w-14 md:w-16 text-center">{shortDate(subPlanned)}</div>
                                <div className="w-14 md:w-16 text-center font-bold text-gray-600">{shortDate(subActual)}</div>
                              </div>
                            </div>

                            <div className="w-[55%] shrink-0 pl-2 relative h-2 md:h-2.5 flex items-center overflow-hidden">
                              {subHasDates && <div className={`absolute h-1 md:h-1.5 rounded-full ${subColor} opacity-90`} style={{ left: `${subLeft}%`, width: `${subWidth}%`, minWidth: '2px' }} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MONTHLY PROGRESS
// ============================================================================

function MonthlyProgressTab({ project, startDate, expectedDate }) {
  const calculateChartData = () => {
    const dbRecords = project.monthly_progress || [];
    const data = [];
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const today = new Date();
    const totalDurationMonths = Math.max(1, (expectedDate.getFullYear() - startDate.getFullYear()) * 12 + (expectedDate.getMonth() - startDate.getMonth()));
    let monthIndex = 0;
    let lastKnownActual = 0;

    while (current <= today && monthIndex <= totalDurationMonths) {
      const monthLabel = current.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const plannedPct = Math.min(100, Math.round(((monthIndex + 1) / totalDurationMonths) * 100));
      const dbRecord = dbRecords.find(r => r.month === monthLabel);
      if (dbRecord) lastKnownActual = dbRecord.actual_pct;
      data.push({ label: current.toLocaleDateString("en-US", { month: "short" }), fullLabel: monthLabel, planned: plannedPct, actual: lastKnownActual, status: lastKnownActual >= plannedPct - 5 ? "On Track" : "Delayed" });
      current.setMonth(current.getMonth() + 1);
      monthIndex++;
    }
    return data.slice(-8);
  };

  const chartData = calculateChartData();

  const handleDownloadReport = async (monthStr) => {
    toast.info(`Generating ${monthStr} Report...`);
    const formattedMonth = monthStr.replace(" ", "-").toLowerCase();
    window.open(`${API_BASE}/portal/my-project/${project.id}/monthly-report/${formattedMonth}/pdf`, "_blank");
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-3 md:p-4 2xl:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-xs md:text-sm 2xl:text-base text-[#252A2A]">Planned vs Actual Progression</h3>
          <div className="flex gap-2 md:gap-3 text-[9px] md:text-[10px] 2xl:text-xs font-bold uppercase tracking-wider text-gray-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 rounded-sm" /> Planned</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#B89416] rounded-sm" /> Actual</div>
          </div>
        </div>

        {/* Compact Chart Height */}
        <div className="relative h-40 md:h-48 w-full mt-2 border-l border-b border-black/10 pb-4 pl-6">
          <div className="absolute left-0 top-0 bottom-4 w-4 flex flex-col justify-between text-[8px] md:text-[9px] font-bold text-gray-400 text-right pr-1">
            <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
          </div>
          <div className="absolute left-6 right-0 top-0 bottom-4 flex flex-col justify-between pointer-events-none z-0">
            {[100, 75, 50, 25].map(val => <div className="w-full border-t border-black/5 border-dashed" key={val}></div>)}
          </div>

          <div className="absolute left-6 right-0 top-0 bottom-4 flex items-end justify-around px-1 z-10">
            {chartData.map((d, i) => (
              <div key={i} className="flex gap-0.5 md:gap-1 h-full items-end group relative w-full justify-center cursor-pointer">
                <div className="absolute -top-10 bg-[#252A2A] text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded shadow-lg hidden group-hover:block z-20 whitespace-nowrap text-center">
                  <div className="text-white/60 mb-0.5">{d.fullLabel}</div>
                  <span className="text-slate-300">Plan: {d.planned}%</span> <span className="mx-0.5 opacity-40">|</span> <span className="text-[#B89416]">Act: {d.actual}%</span>
                </div>
                <div className="w-3 md:w-5 bg-slate-200 rounded-t-sm transition-all duration-700 ease-out group-hover:bg-slate-300" style={{ height: `${d.planned}%` }}></div>
                <div className="w-3 md:w-5 bg-gradient-to-t from-[#B89416] to-[#FFA500] rounded-t-sm shadow-[0_-1px_4px_rgba(255,90,0,0.2)] transition-all duration-700 ease-out group-hover:brightness-110" style={{ height: `${d.actual}%` }}></div>
              </div>
            ))}
          </div>

          <div className="absolute left-6 right-0 bottom-[-6px] md:bottom-[-8px] h-4 flex justify-around items-end text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-wider">
            {chartData.map((d, i) => <div key={i} className="text-center w-full">{d.label}</div>)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-3 md:p-4 border-b border-black/5 bg-[#F9FAFB]">
          <h3 className="text-xs md:text-sm font-bold text-[#252A2A]">Monthly Archive</h3>
        </div>

        {/* NON-SCROLLING TABLE CONTAINER FOR MOBILE */}
        <div className="w-full">
          <table className="w-full text-left text-[9px] md:text-xs table-fixed md:table-auto">
            <thead className="text-gray-400 border-b border-black/5 bg-white">
              <tr>
                <th className="px-2 md:px-4 py-2 font-bold uppercase tracking-wider w-[25%] md:w-auto">Month</th>
                <th className="px-1 md:px-3 py-2 font-bold uppercase tracking-wider text-center w-[15%] md:w-auto">Plan</th>
                <th className="px-1 md:px-3 py-2 font-bold uppercase tracking-wider text-center w-[15%] md:w-auto">Act</th>
                <th className="px-1 md:px-3 py-2 font-bold uppercase tracking-wider text-center hidden sm:table-cell">Status</th>
                <th className="px-2 md:px-4 py-2 font-bold uppercase tracking-wider text-right w-[45%] md:w-auto">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[...chartData].reverse().map((d) => (
                <tr key={d.fullLabel} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-2 md:px-4 py-2.5 font-bold text-[#252A2A] whitespace-nowrap overflow-hidden text-ellipsis">{d.fullLabel}</td>
                  <td className="px-1 md:px-3 py-2.5 text-center font-medium text-gray-500">{d.planned}%</td>
                  <td className="px-1 md:px-3 py-2.5 text-center font-black text-[#B89416]">{d.actual}%</td>
                  <td className="px-1 md:px-3 py-2.5 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] md:text-[9px] 2xl:text-[10px] font-bold uppercase tracking-wider ${d.status === 'On Track' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Circle className="w-1.5 h-1.5 fill-current" /> {d.status}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-2.5 text-right">
                    <button onClick={() => handleDownloadReport(d.fullLabel)} className="inline-flex items-center justify-center gap-1 text-[8px] md:text-[10px] font-bold text-white bg-[#252A2A] hover:bg-[#B89416] px-2 py-1.5 rounded transition shadow-sm ml-auto">
                      <Download className="w-2.5 h-2.5" /> <span className="hidden sm:inline">PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT PHOTOS
// ============================================================================

function ProjectPhotosTab({ reports, stages }) {
  const [viewMode, setViewMode] = useState("card");

  let photos = [];

  reports.forEach(rep => {
    (rep.photos || []).forEach(p => {
      const imgUrl = typeof p === 'string' ? p : (p.url || p.absoluteUrl);
      if (imgUrl) {
        photos.push({ url: imgUrl, caption: p.caption || "Site Update", date: rep.date, category: "Daily Update" });
      }
    });
  });

  stages.forEach(stg => {
    (stg.photos || []).forEach(p => {
      const imgUrl = typeof p === 'string' ? p : (p.url || p.absoluteUrl);
      if (imgUrl) {
        photos.push({ url: imgUrl, caption: `${stg.name} Progress`, date: stg.updated_at || stg.start_date, category: stg.name });
      }
    });
  });

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-black/5 grid place-items-center mb-3">
          <ImageIcon className="w-5 h-5 text-gray-300" />
        </div>
        <h3 className="font-bold text-sm md:text-base text-[#252A2A]">No photos available</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">Images and site progress captures will appear here once uploaded by the engineering team.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-3 md:p-4 2xl:p-6 space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-3 gap-3">
        <div>
          <h3 className="text-xs md:text-sm 2xl:text-base font-bold text-[#252A2A]">Site Gallery</h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">{photos.length} visual records</p>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F6F8] p-0.5 rounded border border-black/5 self-start sm:self-auto">
          <button onClick={() => setViewMode("card")} className={`p-1.5 rounded-[4px] transition ${viewMode === "card" ? "bg-white shadow-sm text-[#B89416]" : "text-gray-400 hover:text-[#252A2A]"}`} title="Grid View">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-[4px] transition ${viewMode === "list" ? "bg-white shadow-sm text-[#B89416]" : "text-gray-400 hover:text-[#252A2A]"}`} title="List View">
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
          {photos.map((img, idx) => (
            <div key={idx} className="group rounded-lg border border-black/5 overflow-hidden bg-black/5 relative aspect-square hover:shadow-sm transition-all duration-300">
              <img src={resolveMediaUrl(img.url)} alt="Site Progress" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                <span className="text-white text-[10px] md:text-xs font-bold truncate mb-0.5">{img.caption}</span>
                <div className="flex items-center justify-between text-white/80 text-[8px] md:text-[9px] font-semibold">
                  <span className="truncate pr-1">{img.category}</span>
                  <span className="shrink-0">{img.date ? new Date(img.date).toLocaleDateString("en-IN") : "Recent"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[10px] md:text-xs 2xl:text-sm min-w-[600px]">
            <thead className="bg-[#F9FAFB] text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 font-bold rounded-tl w-16">Preview</th>
                <th className="px-3 py-2 font-bold">Caption</th>
                <th className="px-3 py-2 font-bold">Category</th>
                <th className="px-3 py-2 font-bold text-right rounded-tr">Upload Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {photos.map((img, idx) => (
                <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-3 py-1.5">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden border border-black/10 bg-gray-100">
                      <img src={resolveMediaUrl(img.url)} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-3 py-1.5 font-bold text-[#252A2A]">{img.caption}</td>
                  <td className="px-3 py-1.5 text-[#B89416] font-semibold text-[9px] md:text-[10px] uppercase tracking-wider">{img.category}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-500">{img.date ? new Date(img.date).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROGRESS REPORT (Updated inside ProgressPage.js)
// ============================================================================

function DailyProgressTab({ project, reports }) {
  const [selectedDate, setSelectedDate] = useState(reports[0]?.date || "");
  const report = reports.find(r => r.date === selectedDate);

  const handleDownloadFullPDF = () => {
    toast.info("Generating Full Progress Report...");
    window.open(`${API_BASE}/portal/my-project/${project.id}/full-progress-report/pdf`, "_blank");
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-[#B89416]/10 grid place-items-center mb-3">
          <FileText className="w-5 h-5 text-[#B89416]" />
        </div>
        <h3 className="font-bold text-sm md:text-base text-[#252A2A]">No verified reports</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">Check back later when site updates are published by the PM.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">

      {/* Header Controls */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-black/5 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-xs md:text-sm text-[#252A2A] flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-[#B89416]" /> Daily Progress Report
          </h3>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-medium mt-0.5">PM-verified daily site updates & logs</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full sm:w-auto bg-[#F5F6F8] border border-black/10 rounded-lg px-3 py-1.5 text-[10px] md:text-xs font-bold text-[#252A2A] focus:outline-none focus:border-[#B89416] cursor-pointer">
            {reports.map(r => <option key={r.id} value={r.date}>{new Date(r.date).toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</option>)}
          </select>
          <button onClick={handleDownloadFullPDF} className="w-full sm:w-auto px-3 py-1.5 bg-[#252A2A] hover:bg-[#B89416] text-white text-[10px] md:text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap">
            <Download className="w-3 h-3" /> Full PDF
          </button>
        </div>
      </div>

      {/* Report Body */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">

          <div className="lg:col-span-4 space-y-3 md:space-y-4">

            {/* Status Briefing Card */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 md:p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <h4 className="text-[9px] md:text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Site Status</h4>
              <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs md:text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 fill-current" /> {report.overall_status}
              </div>
              {report.status_notes && <p className="text-[10px] md:text-xs text-emerald-800 mt-2 font-medium leading-relaxed bg-emerald-100/50 p-2 rounded border border-emerald-200/50">"{report.status_notes}"</p>}
            </div>

            {/* ★ NEW: Labor Force Deployment Info Card */}
            <div className="bg-white border border-black/5 shadow-sm rounded-xl p-3 md:p-4 space-y-2.5">
              <h4 className="font-bold text-[10px] md:text-xs text-[#252A2A] uppercase tracking-wide border-b border-black/5 pb-1.5">On-Site Labor Deployment</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Workers Strength</div>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{report.workers_count || 0}</div>
                  <span className="text-[8px] text-gray-400">General Helpers</span>
                </div>
                <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  <div className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Masteries Strength</div>
                  <div className="text-sm font-black text-blue-900 mt-0.5">{report.masteries_count || 0}</div>
                  <span className="text-[8px] text-blue-400">Skilled Masons</span>
                </div>
              </div>
            </div>

            {/* ★ NEW: Chronological briefing descriptions */}
            <div className="bg-white border border-black/5 shadow-sm rounded-xl p-3 md:p-4 space-y-3">
              <h4 className="font-bold text-[10px] md:text-xs text-[#252A2A] uppercase tracking-wide border-b border-black/5 pb-1.5">Execution Details</h4>
              <div className="space-y-2">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[10px] md:text-xs">
                  <div className="font-bold text-gray-400 uppercase tracking-wider text-[8px] mb-1">Work Done Yesterday (Audited)</div>
                  <div className="text-gray-700 font-semibold leading-relaxed">{report.work_done_yesterday || "—"}</div>
                </div>
                <div className="p-2.5 bg-[#B89416]/5 rounded-lg border border-[#B89416]/10 text-[10px] md:text-xs">
                  <div className="font-bold text-[#B89416] uppercase tracking-wider text-[8px] mb-1">
                    Work Planned for Today
                  </div>
                  <div className="text-gray-900 font-bold leading-relaxed">
                    {report.work_completed_today || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Line Items checklist */}
            <div className="bg-white border border-black/5 shadow-sm rounded-xl p-3 md:p-4">
              <h4 className="font-bold text-[10px] md:text-xs text-[#252A2A] mb-2 uppercase tracking-wide border-b border-black/5 pb-1.5">Completed Checklist Items</h4>
              <ul className="space-y-1.5">
                {(report.work_completed || []).map((work, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] md:text-xs font-medium text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> <span className="leading-relaxed">{work}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-black/5 shadow-sm rounded-xl p-3 md:p-4">
              <h4 className="font-bold text-[10px] md:text-xs text-[#252A2A] mb-2 uppercase tracking-wide border-b border-black/5 pb-1.5">Planned Tomorrow</h4>
              <ul className="space-y-1.5">
                {(report.planned_tomorrow || []).map((work, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] md:text-xs font-medium text-gray-500">
                    <Circle className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" /> <span className="leading-relaxed">{work}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-black/5 shadow-sm rounded-xl p-3 md:p-4 2xl:p-6">
            <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
              <h4 className="font-bold text-[10px] md:text-xs 2xl:text-sm text-[#252A2A] uppercase tracking-wider">Site Execution Images</h4>
              <span className="text-[9px] md:text-[10px] font-bold text-gray-500 bg-[#F5F6F8] px-2 py-0.5 rounded">{(report.photos || []).length} photos attached</span>
            </div>

            {(report.photos || []).length === 0 ? (
              <div className="text-center py-10 text-[10px] md:text-xs italic text-gray-400 border border-dashed border-black/5 rounded-lg bg-gray-50">No photos attached for this date.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
                {(report.photos || []).map((p, i) => {
                  const u = typeof p === 'string' ? p : p.url;
                  return (
                    <div key={i} className="group rounded-lg border border-black/5 bg-[#F9FAFB] overflow-hidden hover:shadow-sm transition duration-300">
                      <div className="aspect-video bg-black/5 overflow-hidden relative">
                        <img src={resolveMediaUrl(u)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        {p.time && <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm">{p.time}</div>}
                      </div>
                      <div className="p-2 text-[9px] md:text-[10px] font-bold text-[#252A2A] truncate" title={p.caption}>{p.caption || "Site update"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function StatusBadge({ status }) {
  const config = {
    completed: { label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle2 },
    in_progress: { label: "Active", color: "text-[#B89416] bg-[#B89416]/10 border-[#B89416]/30", Icon: PlayCircle },
    pending: { label: "Pending", color: "text-gray-500 bg-[#F5F6F8] border-black/10", Icon: Circle }
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-bold uppercase tracking-wider border ${c.color}`}>
      <c.Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

function KpiBlock({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-lg border border-black/5 p-2 sm:p-3 shadow-sm hover:shadow transition relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full transition-all group-hover:w-1.5" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-1 mb-1 pl-1">
        <div className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</div>
        <Icon className="w-3 h-3 shrink-0 opacity-80" style={{ color: accent }} />
      </div>
      <div className="pl-1">
        <div className="text-sm sm:text-base lg:text-lg font-black text-[#252A2A] leading-none mb-0.5">{value}</div>
        <div className="text-[8px] sm:text-[9px] font-semibold text-gray-400">{subtitle}</div>
      </div>
    </div>
  );
}