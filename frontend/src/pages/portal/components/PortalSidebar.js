import React from "react";
import { NavLink, Link } from "react-router-dom";
import BrandLockup from "@/components/site/BrandLockup";
import {
  LayoutDashboard,
  Home,
  Video,
  TrendingUp,
  GitBranch,
  PencilRuler,
  Package,
  ShieldCheck,
  FolderOpen,
  Wallet,
  Users,
  CheckSquare,
  ClipboardList,
  Wrench,
  Settings,
  X,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";

const NAV_SECTIONS = [
  {
    label: "Core",
    items: [
      { to: "/portal", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/portal/my-project", label: "My Project", icon: Home },
      { to: "/portal/cctv", label: "Live CCTV", icon: Video },
      { to: "/portal/progress", label: "Progress", icon: TrendingUp },
      { to: "/portal/timeline", label: "Timeline", icon: GitBranch },
    ],
  },
  {
    label: "Project Control",
    items: [
      { to: "/portal/drawings", label: "Drawings", icon: PencilRuler },
      { to: "/portal/materials", label: "Materials", icon: Package },
      { to: "/portal/quality", label: "Quality", icon: ShieldCheck },
      { to: "/portal/documents", label: "Documents", icon: FolderOpen },
      { to: "/portal/payments", label: "Payments", icon: Wallet },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { to: "/portal/team", label: "Team", icon: Users },
      { to: "/portal/approvals", label: "Approvals", icon: CheckSquare },
      { to: "/portal/site-reports", label: "Activity Log", icon: ClipboardList },
    ],
  },
  {
    label: "After Handover",
    items: [{ to: "/portal/maintenance", label: "Maintenance", icon: Wrench }],
  },
  {
    label: "Account",
    items: [{ to: "/portal/settings", label: "Settings", icon: Settings }],
  },
];

export default function PortalSidebar({ open, onClose }) {
  const { project } = usePortal();
  const pendingApprovalsCount = project?.pending_approvals || 0;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#000F1B]/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[220px] bg-[#0B1220] text-white
          flex flex-col transition-transform duration-300 ease-out font-['Poppins']
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand logo */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-white/10 shrink-0">
          <Link
            to="/portal"
            onClick={onClose}
            className="flex items-center gap-2 min-w-0 select-none"
            aria-label="ConstructONS Portal Home"
          >
            <BrandLockup tone="dark" size="sm" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg grid place-items-center hover:bg-white/10 shrink-0"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 pb-4 space-y-0.5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-2.5 mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] font-medium transition min-h-[36px] group ${
                          isActive
                            ? "bg-[#FF6600] text-white shadow-sm"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <item.icon
                              className={`w-3.5 h-3.5 shrink-0 transition ${
                                isActive ? "text-white" : "group-hover:text-[#FF6600]"
                              }`}
                              strokeWidth={2}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.label === "Approvals" && pendingApprovalsCount > 0 && (
                            <span className="bg-[#FF0000] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                              {pendingApprovalsCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer strip — compact */}
        <div className="px-3.5 py-3 border-t border-white/10 shrink-0">
          <p className="text-[9px] text-white/35 leading-snug font-semibold tracking-wide">
            PLAN · BUILD · MONITOR · COMPLETE
          </p>
          <p className="text-[9px] text-[#FF6600] mt-0.5 font-bold">
            Your Home. Our Commitment.
          </p>
        </div>
      </aside>
    </>
  );
}