import React, { useMemo } from "react";
import {
  GitBranch, CheckCircle2, PlayCircle, Circle,
  Calendar, FileText, Camera, Clock, ArrowRight
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import ComingSoon from "../components/ComingSoon";

const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

const statusMeta = (status) => {
  if (status === "completed") {
    return {
      label: "Completed",
      Icon: CheckCircle2,
      node: "text-emerald-600 bg-white border-emerald-200",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      card: "bg-white border-emerald-100 shadow-sm",
      line: "bg-emerald-200",
    };
  }
  if (status === "in_progress") {
    return {
      label: "In Progress",
      Icon: PlayCircle,
      node: "text-[#FF6600] bg-white border-[#FF6600]/30",
      badge: "bg-[#FF6600]/10 text-[#FF6600] border-[#FF6600]/20",
      card: "bg-[#FF6600]/5 border-[#FF6600]/25 shadow-sm",
      line: "bg-[#FF6600]/30",
    };
  }
  return {
    label: "Upcoming",
    Icon: Circle,
    node: "text-gray-300 bg-white border-gray-200",
    badge: "bg-gray-50 text-gray-500 border-gray-200",
    card: "bg-white border-black/5 opacity-80",
    line: "bg-gray-100",
  };
};

function StageCard({ stage, index, meta }) {
  const { Icon } = meta;
  const hasPhotos = stage.photos?.length > 0;
  const hasDocs = stage.documents?.length > 0;

  const started = fmtDate(stage.started_at);
  const completed = fmtDate(stage.completed_at);
  const expected = fmtDate(stage.expected_date);

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition ${meta.card}`}>
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
              Stage {index + 1}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.badge}`}
            >
              <Icon className="w-3 h-3" />
              {meta.label}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#000F1B] leading-snug">
            {stage.name}
          </h3>
          {stage.description && (
            <p className="text-xs text-[#111111]/60 mt-1 leading-relaxed">
              {stage.description}
            </p>
          )}
        </div>
      </div>

      {/* Dates block */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {expected && (
          <div className="flex items-center gap-2 rounded-lg bg-white/80 border border-black/5 px-2.5 py-2">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                Expected
              </div>
              <div className="text-[11px] font-bold text-[#000F1B] truncate">
                {expected}
              </div>
            </div>
          </div>
        )}
        {started && (
          <div className="flex items-center gap-2 rounded-lg bg-white/80 border border-black/5 px-2.5 py-2">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                Started
              </div>
              <div className="text-[11px] font-bold text-[#000F1B] truncate">
                {started}
              </div>
            </div>
          </div>
        )}
        {completed && (
          <div className="flex items-center gap-2 rounded-lg bg-white/80 border border-black/5 px-2.5 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                Finished
              </div>
              <div className="text-[11px] font-bold text-emerald-700 truncate">
                {completed}
              </div>
            </div>
          </div>
        )}
        {!expected && !started && !completed && (
          <div className="text-[11px] text-gray-400 italic col-span-full">
            Dates not set yet
          </div>
        )}
      </div>

      {/* Site notes */}
      {stage.notes && (
        <div className="mt-3 p-3 rounded-xl bg-black/[0.03] border border-black/5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Site Notes
          </div>
          <p className="text-xs text-[#000F1B] leading-relaxed whitespace-pre-wrap">
            {stage.notes}
          </p>
        </div>
      )}

      {/* Attachments */}
      {(hasPhotos || hasDocs) && (
        <div className="mt-3 pt-3 border-t border-black/5 space-y-3">
          {hasPhotos && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#000F1B] mb-2">
                <Camera className="w-3.5 h-3.5 text-[#FF6600]" />
                Progress Photos
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {stage.photos.map((url, pid) => (
                  <a
                    key={pid}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-black/10 hover:border-[#FF6600] transition"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {hasDocs && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#000F1B] mb-2">
                <FileText className="w-3.5 h-3.5 text-[#FF6600]" />
                Stage Documents
              </div>
              <div className="flex flex-col gap-1.5">
                {stage.documents.map((doc, did) => (
                  <a
                    key={did}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#111111]/70 hover:text-[#FF6600] transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {doc.name || `Document ${did + 1}`}
                    <ArrowRight className="w-3 h-3 opacity-40" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  const { project } = usePortal();

  // ALL hooks defined unconditionally at top level
  const stages = useMemo(() => project?.stages || [], [project]);

  const summary = useMemo(() => {
    const total = stages.length;
    const completed = stages.filter((s) => s.status === "completed").length;
    const inProgress = stages.filter((s) => s.status === "in_progress").length;
    const upcoming = total - completed - inProgress;
    return { total, completed, inProgress, upcoming };
  }, [stages]);

  // Early return comes AFTER all hooks
  if (!project) return <ComingSoon title="Timeline" icon={GitBranch} />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-['Poppins'] pb-12 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#000F1B] grid place-items-center shrink-0">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#000F1B] tracking-tight">
              Project Timeline
            </h1>
            <p className="text-sm text-[#111111]/60 mt-0.5">
              Stage-by-stage construction journey with key dates.
            </p>
          </div>
        </div>

        {/* Mini summary chips */}
        {stages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {summary.completed} Done
            </span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/20">
              {summary.inProgress} Active
            </span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
              {summary.upcoming} Upcoming
            </span>
          </div>
        )}
      </div>

      {/* Timeline body */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 sm:p-8 overflow-hidden">
        {stages.length === 0 ? (
          <div className="text-sm text-[#111111]/50 text-center py-16">
            No timeline stages recorded yet.
          </div>
        ) : (
          <div className="relative">
            {/* Center vertical line — desktop only */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100" />

            {/* Left rail line — mobile only */}
            <div className="md:hidden absolute left-[15px] top-2 bottom-2 w-[2px] bg-gray-100" />

            <div className="space-y-8 md:space-y-12">
              {stages.map((stage, i) => {
                const meta = statusMeta(stage.status);
                const { Icon } = meta;
                const isLeft = i % 2 === 0; // even = left, odd = right

                return (
                  <div key={stage.id || i} className="relative">
                    {/* ===== DESKTOP: left / right zigzag ===== */}
                    <div className="hidden md:grid md:grid-cols-[1fr_56px_1fr] md:gap-4 md:items-start">
                      {/* Left column */}
                      <div className={isLeft ? "text-right" : ""}>
                        {isLeft ? (
                          <StageCard stage={stage} index={i} meta={meta} />
                        ) : (
                          /* Date peek on empty side */
                          <div className="pt-4 pr-2 flex flex-col items-end gap-1">
                            {fmtDate(stage.expected_date) && (
                              <span className="text-[11px] font-bold text-gray-400">
                                {fmtDate(stage.expected_date)}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                              Stage {i + 1}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Center node */}
                      <div className="relative flex justify-center">
                        <div
                          className={`w-10 h-10 rounded-full border-2 grid place-items-center shadow-sm z-10 ${meta.node}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Right column */}
                      <div>
                        {!isLeft ? (
                          <StageCard stage={stage} index={i} meta={meta} />
                        ) : (
                          <div className="pt-4 pl-2 flex flex-col items-start gap-1">
                            {fmtDate(stage.expected_date) && (
                              <span className="text-[11px] font-bold text-gray-400">
                                {fmtDate(stage.expected_date)}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                              Stage {i + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ===== MOBILE: single column + left rail ===== */}
                    <div className="md:hidden flex items-start gap-4">
                      <div className="relative z-10 shrink-0 mt-1">
                        <div
                          className={`w-8 h-8 rounded-full border-2 grid place-items-center bg-white shadow-sm ${meta.node}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Date chip above card on mobile */}
                        {fmtDate(stage.expected_date) && (
                          <div className="mb-1.5 text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(stage.expected_date)}
                          </div>
                        )}
                        <StageCard stage={stage} index={i} meta={meta} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}