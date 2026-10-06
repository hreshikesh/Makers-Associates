import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Building2, Clock, ShieldCheck, CheckSquare, Hammer, Bot } from "lucide-react";
import PortalProjectAdvisorModal from "../PortalProjectAdvisorModal";

export default function DashboardBottomRow({ project }) {
  const [showAdvisor, setShowAdvisor] = useState(false);
  const isHandoverComplete = project?.stages?.some(s => s.name.toLowerCase().includes("handover") && s.status === "completed");

  return (
    <div className="font-['Poppins']">
      
      {/* Quick Vaults (Compact Row) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-1">
        
        <Link to="/portal/approvals" className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 flex items-center justify-center gap-2 hover:bg-amber-100 transition shadow-sm group">
          <CheckSquare className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
          <span className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider">Approvals</span>
        </Link>

        <Link to="/portal/documents" className="rounded-xl border border-black/10 bg-white p-2.5 flex items-center justify-center gap-2 hover:bg-[#F2F2F2] transition shadow-sm group">
          <FileText className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
          <span className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider">Docs ({(project?.documents || []).length})</span>
        </Link>

        <Link to="/portal/quality" className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 flex items-center justify-center gap-2 hover:bg-emerald-100 transition shadow-sm group">
          <ShieldCheck className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition" />
          <span className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider">Quality</span>
        </Link>

        {isHandoverComplete ? (
          <Link to="/portal/maintenance" className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 flex items-center justify-center gap-2 hover:bg-blue-100 transition shadow-sm group">
            <Hammer className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider">Maint.</span>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/50 p-2.5 flex items-center justify-center gap-2 opacity-60">
            <Hammer className="w-4 h-4 text-[#111111]/40" />
            <span className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider">Locked</span>
          </div>
        )}

        <button onClick={() => setShowAdvisor(true)} className="rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 flex items-center justify-center gap-2 hover:bg-indigo-100 transition shadow-sm group">
          <Bot className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
          <span className="text-[10px] font-bold text-[#000F1B] uppercase tracking-wider">AI Advisor</span>
        </button>
      </div>

      {/* Portal AI Advisor Modal Window */}
      {showAdvisor && <PortalProjectAdvisorModal project={project} onClose={() => setShowAdvisor(false)} />}

      {/* Footer Ribbon */}
      <div className="mt-5 pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <FooterItem icon={FileText} text="PLAN WITH CLARITY" />
          <BuildingFooterItem icon={Building2} text="BUILD WITH QUALITY" />
          <ClockFooterItem icon={Clock} text="TRACK WITH TRANSPARENCY" />
        </div>
        <div className="text-[10px] font-bold text-[#000F1B] uppercase tracking-[0.2em] border-l-2 border-[#FF6600] pl-3 hidden md:block">
          ConstructONS
        </div>
      </div>
    </div>
  );
}

function FooterItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-[#111111]/40" />
      <span className="text-[8px] font-bold text-[#111111]/50 uppercase tracking-widest leading-tight">{text}</span>
    </div>
  );
}

function BuildingFooterItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-[#111111]/40" />
      <span className="text-[8px] font-bold text-[#111111]/50 uppercase tracking-widest leading-tight">{text}</span>
    </div>
  );
}

function ClockFooterItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-[#111111]/40" />
      <span className="text-[8px] font-bold text-[#111111]/50 uppercase tracking-widest leading-tight">{text}</span>
    </div>
  );
}