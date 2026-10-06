import React from "react";
import { Home, MapPin, Package, Hash, User } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import ComingSoon from "../components/ComingSoon";

export default function MyProjectPage() {
  const { user, project } = usePortal();

  if (!project) return <ComingSoon title="My Project" icon={Home} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-['Poppins'] pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#000F1B] grid place-items-center shrink-0">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#000F1B] tracking-tight">Master Project Profile</h1>
          <p className="text-sm text-[#111111]/60 mt-0.5">Core details and contract parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Info */}
        <div className="rounded-2xl bg-white border border-black/5 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-[#000F1B] border-b border-black/5 pb-3">Project Identity</h2>
          
          <InfoRow icon={Home} label="Project Name" value={project.title || "Unknown"} />
          <InfoRow icon={Hash} label="Project ID" value={project.id || "Pending"} isMono />
          <InfoRow icon={MapPin} label="Location" value={project.address || "Pending Address"} />
          <InfoRow icon={Package} label="Package Linked" value={project.package_slug || "None"} />
        </div>

        {/* Client & Status */}
        <div className="rounded-2xl bg-white border border-black/5 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-[#000F1B] border-b border-black/5 pb-3">Client & Status</h2>
          
          <InfoRow icon={User} label="Primary Client" value={user?.name || project.customer_name || "Unknown"} />
          <InfoRow icon={User} label="Registered Email" value={user?.email || project.customer_email || "Unknown"} />
          
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#111111]/50 font-semibold mb-1">Status</div>
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] text-xs font-bold uppercase tracking-wider">
              {project.status || "Active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isMono = false }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[#111111]/40 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#111111]/50 font-semibold">{label}</div>
        <div className={`text-sm font-semibold text-[#000F1B] mt-0.5 ${isMono ? 'font-mono text-xs' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}