/**
 * PortalHome — Customer's project status dashboard.
 * ConstructONS™ — India's First Integrated Construction Ecosystem.
 */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import BrandLockup from "@/components/site/BrandLockup";
import {
  Loader2,
  LogOut,
  CheckCircle2,
  Circle,
  PlayCircle,
  Camera,
  FileText,
  Building2,
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
  HardHat,
  Calendar,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL + "/api";

export default function PortalHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = location.hash || "";
    const run = async () => {
      try {
        if (hash.includes("session_id=")) {
          const sid = new URLSearchParams(hash.replace(/^#/, "")).get(
            "session_id"
          );
          if (sid) {
            const res = await axios.post(
              `${API_BASE}/customer/auth/session`,
              { session_id: sid },
              { withCredentials: true }
            );
            setUser(res.data);
            window.history.replaceState(null, "", "/portal");
          }
        } else {
          const me = await axios.get(`${API_BASE}/customer/me`, {
            withCredentials: true,
          });
          setUser(me.data);
        }
        const pr = await axios.get(`${API_BASE}/portal/my-project`, {
          withCredentials: true,
        });
        setProject(pr.data?.project || null);
      } catch (e) {
        if (e?.response?.status === 401) {
          navigate("/portal/login", { replace: true });
        } else {
          toast.error("Failed to load your project portal");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [location.hash, navigate]);

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE}/customer/logout`,
        {},
        { withCredentials: true }
      );
    } catch {}
    navigate("/portal/login", { replace: true });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen grid place-items-center bg-[#F2F2F2] font-['Poppins']"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
          <span className="text-sm font-medium text-[#111111]/70">
            Loading your project details...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const overallProgress = project?.stages?.length
    ? Math.round(
        project.stages.reduce(
          (sum, stage) => sum + (Number(stage.progress_pct) || 0),
          0
        ) / project.stages.length
      )
    : 0;

  const completedStagesCount =
    project?.stages?.filter((s) => s.status === "completed").length || 0;

  return (
    <div
      className="min-h-screen bg-[#F2F2F2] text-[#111111] font-['Poppins'] flex flex-col selection:bg-[#FF6600]/20 selection:text-[#000F1B]"
      data-testid="portal-home"
    >
      <Toaster richColors position="top-right" />

      {/* 🧭 Top Navigation Bar */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Back to Home + Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/"
              aria-label="Back to ConstructONS Website"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#111111]/80 hover:text-[#FF6600] transition-colors py-2 px-2.5 -ml-2 rounded-lg hover:bg-[#F2F2F2] min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF6600]" aria-hidden="true" />
              <span className="hidden xs:inline">Back to</span> Home
            </Link>

            <div className="h-5 w-px bg-black/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <BrandLockup tone="light" size="sm" />
              <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-[#FF6600]/10 text-[10px] font-semibold text-[#FF6600] uppercase tracking-wider">
                Live Tracker
              </span>
            </div>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || "User profile"}
                className="w-8 h-8 rounded-full border border-black/10 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#000F1B] text-white text-xs font-bold grid place-items-center">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-[#000F1B] max-w-[140px] truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-[#111111]/50 max-w-[140px] truncate">
                {user.email}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              data-testid="portal-logout"
              aria-label="Sign out of portal"
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#F2F2F2] hover:text-[#FF0000] transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
            >
              <LogOut className="w-3.5 h-3.5 text-[#111111]/70" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 📋 Main Portal Workspace */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {!project ? (
          /* Empty State: No active project linked yet */
          <section
            className="rounded-2xl bg-white border border-black/5 shadow-sm p-8 sm:p-12 text-center"
            data-testid="portal-no-project"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF6600]/10 grid place-items-center mb-5">
              <Building2 className="w-8 h-8 text-[#FF6600]" aria-hidden="true" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#000F1B] tracking-tight">
              Welcome, {user.name?.split(" ")[0]}
            </h1>
            <p className="mt-3 text-sm text-[#111111]/70 max-w-lg mx-auto leading-relaxed">
              Your live project tracker has not been activated yet. Once your site consultation, planning, and agreement stages are confirmed, your live milestone tracker will appear here with daily progress photos, verified quality checks, and digital documents.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF6600] text-white px-6 py-3 text-sm font-semibold hover:bg-[#FF0000] transition min-h-[44px] shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Return to Home</span>
              </Link>
              <Link
                to="/#services"
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[#000F1B] hover:bg-[#F2F2F2] transition min-h-[44px]"
              >
                <span>Explore Ecosystem Services</span>
              </Link>
            </div>
          </section>
        ) : (
          /* Active Project Timeline */
          <div className="space-y-6">
            {/* Project Master Card */}
            <section
              className="rounded-2xl bg-[#000F1B] text-white p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden"
              data-testid="portal-project-header"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FF6600]/20 border border-[#FF6600]/30 text-[10px] font-semibold text-[#FF6600] tracking-wider uppercase">
                    Active Home Construction
                  </span>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {project.title}
                  </h1>
                  {project.address && (
                    <p className="mt-1 text-xs sm:text-sm text-white/70 max-w-xl">
                      {project.address}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-[#FF6600]">
                    {overallProgress}%
                  </div>
                  <div className="text-xs text-white/60">Overall Completion</div>
                </div>
              </div>

              {/* Progress Bar (Design System: Orange fill, Grey track) */}
              <div className="mt-6">
                <div
                  className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={overallProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-[#FF6600] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                  <span>
                    {completedStagesCount} of {project.stages?.length || 0} stages completed
                  </span>
                  <span>ConstructONS™ Verified</span>
                </div>
              </div>
            </section>

            {/* Stages Milestone List */}
            <section aria-label="Construction Milestones" className="space-y-3">
              <h2 className="text-base font-bold text-[#000F1B] px-1">
                Construction Stages & Milestones
              </h2>

              <div className="space-y-3">
                {project.stages?.map((stage, idx) => (
                  <StageCard
                    key={stage.id || stage.index || idx}
                    stage={stage}
                    displayIndex={idx + 1}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function StageCard({ stage, displayIndex }) {
  const [isOpen, setIsOpen] = useState(stage.status === "in_progress");

  const statusConfig = {
    completed: {
      Icon: CheckCircle2,
      label: "Completed",
      iconColor: "text-emerald-500",
      chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    in_progress: {
      Icon: PlayCircle,
      label: "In Progress",
      iconColor: "text-[#FF6600]",
      chipClass: "bg-[#FF6600]/10 text-[#FF6600] border-[#FF6600]/20",
    },
    pending: {
      Icon: Circle,
      label: "Pending",
      iconColor: "text-[#A6A6A6]",
      chipClass: "bg-black/5 text-[#111111]/60 border-black/5",
    },
  };

  const currentStatus = statusConfig[stage.status] || statusConfig.pending;
  const StatusIcon = currentStatus.Icon;

  return (
    <article
      className="rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden transition duration-200"
      data-testid={`portal-stage-${stage.index ?? displayIndex}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left hover:bg-[#F2F2F2]/50 transition min-h-[56px] focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:ring-inset"
      >
        <StatusIcon
          className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${currentStatus.iconColor}`}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-[#111111]/50 font-semibold">
              Stage {displayIndex}
            </span>
            <span
              className={`text-[11px] rounded-full px-2.5 py-0.5 font-semibold border ${currentStatus.chipClass}`}
            >
              {currentStatus.label}
            </span>
          </div>

          <h3 className="font-bold text-[#000F1B] text-sm sm:text-base mt-0.5 truncate">
            {stage.name}
          </h3>

          {stage.description && (
            <p className="text-xs sm:text-sm text-[#111111]/60 mt-0.5 line-clamp-1">
              {stage.description}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 flex items-center gap-3">
          <div className="hidden xs:block text-xs text-[#111111]/50">
            {stage.expected_date && (
              <div className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{stage.expected_date}</span>
              </div>
            )}
            {stage.status === "in_progress" && (
              <div className="font-bold text-[#FF6600] text-sm mt-0.5">
                {stage.progress_pct || 0}%
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-[#F2F2F2] grid place-items-center text-[#111111]/60">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Accordion Expanded Content */}
      {isOpen && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-black/5 bg-[#F2F2F2]/20 space-y-4 text-xs sm:text-sm">
          {stage.notes && (
            <div className="bg-white p-3.5 rounded-xl border border-black/5 text-[#111111]/80 leading-relaxed whitespace-pre-wrap">
              <span className="font-semibold block text-[#000F1B] mb-1">
                Engineer Site Notes:
              </span>
              {stage.notes}
            </div>
          )}

          {/* Photos from Site */}
          {(stage.photos || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#000F1B] uppercase tracking-wider mb-2.5 inline-flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#FF6600]" aria-hidden="true" />
                <span>Site Progress Photos</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stage.photos.map((photoUrl, i) => (
                  <a
                    key={i}
                    href={photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block group relative rounded-xl overflow-hidden aspect-video bg-black/5 border border-black/5"
                  >
                    <img
                      src={photoUrl}
                      alt={`Site milestone photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Documents & Checklists */}
          {(stage.documents || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#000F1B] uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#FF6600]" aria-hidden="true" />
                <span>Verified Inspection Documents</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {stage.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-black/5 text-[#000F1B] hover:text-[#FF6600] hover:border-[#FF6600]/40 transition min-h-[44px]"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-[#FF6600]" />
                    <span className="truncate font-medium">{doc.name || "Inspection Document"}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Milestones Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 text-[11px] text-[#111111]/50">
            {stage.started_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Started: {new Date(stage.started_at).toLocaleDateString()}
              </span>
            )}
            {stage.completed_at && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed: {new Date(stage.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}