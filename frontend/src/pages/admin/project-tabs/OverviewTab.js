import React from "react";
import {
  Building2, Users, Package, IndianRupee, ShieldCheck, FileText,
  Video, Wrench, Camera, CheckCircle2, Clock, MapPin, Calendar,
  TrendingUp, HardHat, Target
} from "lucide-react";

export default function OverviewTab({ project }) {
  const stages = project.stages || [];
  const overall = stages.length ? Math.round(stages.reduce((sum, s) => sum + (Number(s.progress_pct) || 0), 0) / stages.length) : 0;
  const done = stages.filter(s => s.status === "completed").length;
  const activeStage = stages.find(s => s.status === "in_progress");

  const startDate = new Date(project.start_date || project.created_at);
  const expectedDate = project.expected_completion ? new Date(project.expected_completion) : null;
  const today = new Date();
  const daysCompleted = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
  const daysRemaining = expectedDate ? Math.max(0, Math.floor((expectedDate - today) / (1000 * 60 * 60 * 24))) : null;

  const cv = project.contract_value || 0;
  const paid = project.amount_spent || 0;
  const balance = cv - paid;

  const stats = {
    team: (project.team_ids || []).length + (project.team_directory || []).filter(t => t.status === "Active").length,
    drawings: (project.drawings || []).length,
    documents: (project.documents || []).length,
    materials: (project.materials || []).length,
    quality: (project.quality_inspections || []).length,
    cameras: (project.cctv_cameras || []).length,
    reports: (project.daily_reports || []).length,
    tickets: (project.maintenance_tickets || []).length,
  };

  const pendingReports = (project.daily_reports || []).filter(r => !r.is_approved).length;
  const pendingDrawings = (project.drawings || []).filter(d => d.status === "pending").length;
  const pendingMaterials = (project.materials || []).filter(m => m.status === "pending").length;

  return (
    <div className="space-y-4">
      
      {/* Top Row: 4 Big KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Target} title="Overall Progress" value={`${overall}%`} sub={`${done} of ${stages.length} stages complete`} color="#FF6600" />
        <KpiCard icon={Clock} title="Days Elapsed" value={daysCompleted} sub={daysRemaining !== null ? `${daysRemaining} days remaining` : "Duration TBD"} color="#3B82F6" />
        <KpiCard icon={IndianRupee} title="Payment Received" value={`₹${(paid/100000).toFixed(1)}L`} sub={`Balance: ₹${(balance/100000).toFixed(1)}L`} color="#10B981" />
        <KpiCard icon={TrendingUp} title="Contract Value" value={`₹${(cv/100000).toFixed(1)}L`} sub={cv > 0 ? `${Math.round((paid/cv)*100)}% collected` : "Not set"} color="#000F1B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT: Active Stage + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Active Stage Card */}
          <div className="bg-gradient-to-br from-[#000F1B] to-[#0F1E30] rounded-xl shadow-lg p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF6600]/15 blur-[40px] rounded-full" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-[#FF6600]" /> Currently In Progress
                </h3>
                {activeStage && (
                  <span className="text-xs font-black bg-[#FF6600] text-white px-3 py-1 rounded-full shadow-md">
                    {activeStage.progress_pct || 0}% Done
                  </span>
                )}
              </div>
              
              {activeStage ? (
                <div>
                  <h4 className="text-2xl font-bold text-white mb-2">{activeStage.name}</h4>
                  {activeStage.description && (
                    <p className="text-sm text-white/70 mb-4 leading-relaxed">{activeStage.description}</p>
                  )}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-[#FF6600] to-[#FFA500] rounded-full transition-all duration-1000" style={{ width: `${activeStage.progress_pct || 0}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[10px]">
                    <div>
                      <div className="text-white/40 font-bold uppercase mb-1">Started</div>
                      <div className="text-white font-bold">{activeStage.start_date || activeStage.started_at?.slice(0,10) || "—"}</div>
                    </div>
                    <div>
                      <div className="text-white/40 font-bold uppercase mb-1">Planned End</div>
                      <div className="text-white font-bold">{activeStage.planned_end_date || activeStage.expected_date || "—"}</div>
                    </div>
                    <div>
                      <div className="text-white/40 font-bold uppercase mb-1">Substages</div>
                      <div className="text-white font-bold">{(activeStage.substages || []).length}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-white/40 italic">No stage is currently in progress.</div>
              )}
            </div>
          </div>

          {/* Stages Overview Table */}
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
              <h3 className="text-xs font-bold text-[#000F1B] uppercase tracking-wider">All Stages Snapshot</h3>
              <span className="text-[10px] font-bold bg-[#F2F2F2] px-2 py-0.5 rounded">{stages.length} stages</span>
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {stages.map((s, i) => {
                const pct = Number(s.progress_pct) || 0;
                const isCompleted = s.status === "completed";
                const isActive = s.status === "in_progress";
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${isActive ? "bg-[#FF6600]/5 border border-[#FF6600]/20" : "hover:bg-[#F9FAFB]"}`}>
                    <span className="text-[9px] font-mono font-bold text-[#111111]/40 w-5">{(i+1).toString().padStart(2, '0')}</span>
                    <span className={`text-xs font-bold flex-1 truncate ${isActive ? "text-[#FF6600]" : "text-[#000F1B]"}`}>{s.name}</span>
                    <div className="w-16 h-1 bg-[#F2F2F2] rounded-full overflow-hidden">
                      <div className={`h-full ${isCompleted ? "bg-emerald-500" : "bg-[#FF6600]"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-black w-9 text-right text-[#000F1B]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Quick Stats Grid + Project Info */}
        <div className="space-y-4">
          
          {/* Project Details Card */}
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
            <h3 className="text-xs font-bold text-[#000F1B] uppercase tracking-wider mb-3 border-b border-black/5 pb-2">Project Details</h3>
            <div className="space-y-3 text-xs">
              <InfoRow icon={Building2} label="Client" value={project.customer_name || "—"} />
              <InfoRow icon={MapPin} label="Location" value={project.address || "Location pending"} />
              <InfoRow icon={Calendar} label="Start Date" value={startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
              <InfoRow icon={Calendar} label="Forecast End" value={expectedDate ? expectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD"} />
              {project.package_slug && <InfoRow icon={Package} label="Package" value={project.package_slug} />}
            </div>
          </div>

          {/* Module Stats Grid */}
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
            <h3 className="text-xs font-bold text-[#000F1B] uppercase tracking-wider mb-3 border-b border-black/5 pb-2">Modules At A Glance</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatBlock icon={Users} label="Team" value={stats.team} color="#3B82F6" />
              <StatBlock icon={FileText} label="Drawings" value={stats.drawings} color="#8B5CF6" badge={pendingDrawings} />
              <StatBlock icon={Package} label="Materials" value={stats.materials} color="#F59E0B" badge={pendingMaterials} />
              <StatBlock icon={ShieldCheck} label="Quality" value={stats.quality} color="#10B981" />
              <StatBlock icon={HardHat} label="Reports" value={stats.reports} color="#FF6600" badge={pendingReports} />
              <StatBlock icon={Wrench} label="Tickets" value={stats.tickets} color="#EF4444" />
              <StatBlock icon={FileText} label="Docs" value={stats.documents} color="#6366F1" />
              <StatBlock icon={Video} label="Cameras" value={stats.cameras} color="#EC4899" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB COMPONENTS
// ============================================================================

function KpiCard({ icon: Icon, title, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-black/5 p-3 sm:p-4 shadow-sm hover:shadow-md transition relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full group-hover:w-1.5 transition-all" style={{ background: color }} />
      <div className="pl-1.5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold text-[#111111]/50 uppercase tracking-wider">{title}</div>
          <Icon className="w-4 h-4 opacity-80" style={{ color }} />
        </div>
        <div className="text-2xl font-black text-[#000F1B] leading-none mb-1">{value}</div>
        <div className="text-[10px] font-semibold text-[#111111]/50">{sub}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-md bg-[#F9FAFB] border border-black/5 grid place-items-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-[#FF6600]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#111111]/40">{label}</div>
        <div className="text-xs font-semibold text-[#000F1B] truncate">{value}</div>
      </div>
    </div>
  );
}

function StatBlock({ icon: Icon, label, value, color, badge }) {
  return (
    <div className="bg-[#F9FAFB] rounded-lg p-2.5 border border-black/5 relative">
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 grid place-items-center animate-pulse">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <div className="text-[9px] font-bold uppercase text-[#111111]/50">{label}</div>
      </div>
      <div className="text-lg font-black text-[#000F1B] leading-none">{value}</div>
    </div>
  );
}