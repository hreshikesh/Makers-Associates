import React, { useState, useRef, useEffect } from "react";
import { 
  Menu, Search, Bell, LogOut, MapPin, X, ChevronDown, 
  Check, UserPlus, HardHat, FileText, CheckCircle2, Power,
  Package, PencilRuler, FolderOpen, Users
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BrandLockup from "@/components/site/BrandLockup";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";

export default function PortalTopBar() {
  const navigate = useNavigate();
  const { user, project, projectsList, switchProject, activeProjectId, logout, setSidebarOpen, reload } = usePortal();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [projDropdownOpen, setProjDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  // Local state to hide notifications without deleting from DB
  const [hiddenNotifIds, setHiddenNotifIds] = useState(new Set());

  const projDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const searchRef = useRef(null);

  const projectTitle = project?.title || project?.name || "My Project";
  const projectLocation = project?.address || project?.location || project?.city || "Awaiting Location";
  
  // Filter out locally cleared notifications
  const rawNotifications = project?.notifications || [];
  const visibleNotifs = rawNotifications.filter(n => !hiddenNotifIds.has(n.id));
  const unreadCount = visibleNotifs.filter(n => !n.is_read).length;
  
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Handle outside clicks for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (projDropdownRef.current && !projDropdownRef.current.contains(event.target)) {
        setProjDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset hidden notifications if project changes
  useEffect(() => {
    setHiddenNotifIds(new Set());
    setSearchQuery("");
    setIsSearchOpen(false);
  }, [project?.id]);

  // Instant Real-Time Search Logic
  useEffect(() => {
    if (!searchQuery.trim() || !project) {
      setSearchResults({});
      setIsSearchOpen(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    const results = { Drawings: [], Documents: [], Materials: [], Team: [] };

    // Search Drawings
    (project.drawings || []).forEach(d => {
      if (d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) {
        results.Drawings.push({ id: d.id, title: d.name, subtitle: `Version ${d.current_version} • ${d.category}`, link: "/portal/drawings", icon: PencilRuler });
      }
    });

    // Search Documents
    (project.documents || []).forEach(d => {
      if (d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) {
        results.Documents.push({ id: d.id, title: d.name, subtitle: d.category, link: "/portal/documents", icon: FolderOpen });
      }
    });

    // Search Materials
    (project.materials || []).forEach(m => {
      if (m.item_name.toLowerCase().includes(q) || (m.brand && m.brand.toLowerCase().includes(q))) {
        results.Materials.push({ id: m.id, title: m.item_name, subtitle: `${m.quantity} ${m.unit} • ${m.status}`, link: "/portal/materials", icon: Package });
      }
    });

    // Search Team
    (project.team_directory || []).forEach(t => {
      if ((t.name && t.name.toLowerCase().includes(q)) || (t.role && t.role.toLowerCase().includes(q))) {
        results.Team.push({ id: t.id, title: t.name, subtitle: t.role, link: "/portal/team", icon: Users });
      }
    });

    setSearchResults(results);
    setIsSearchOpen(true);
  }, [searchQuery, project]);

  const handleResultClick = (link) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(link);
  };

  const handleReadNotification = async (notifId, link) => {
    setNotifDropdownOpen(false);
    navigate(link);
    try {
      await axios.patch(`${API_BASE}/portal/my-project/notifications/read`, { notification_id: notifId }, { withCredentials: true });
      reload(true);
    } catch (e) { console.error(e); }
  };

  const handleClearAllLocal = () => {
    setHiddenNotifIds(new Set(rawNotifications.map(n => n.id)));
  };

  const totalSearchResults = Object.values(searchResults).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <header className="h-16 bg-white border-b border-black/5 sticky top-0 z-30 shrink-0 font-['Poppins']">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        
        {/* Left Side */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl grid place-items-center hover:bg-[#F2F2F2] text-[#000F1B] min-h-[44px]"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo for Mobile */}
          <BrandLockup tone="light" size="sm" className="lg:hidden" />

          {/* Active Project Dropdown Trigger (Desktop) */}
          <div className="relative hidden lg:block" ref={projDropdownRef}>
            <button 
              onClick={() => projectsList?.length > 1 ? setProjDropdownOpen(!projDropdownOpen) : null}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border min-w-0 transition ${
                projectsList?.length > 1 
                  ? "bg-white border-black/10 hover:bg-[#F2F2F2] cursor-pointer" 
                  : "bg-[#F2F2F2]/80 border-black/5 cursor-default"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#000F1B] grid place-items-center shrink-0 overflow-hidden border border-black/10">
                {project?.cover_image ? (
                  <img src={resolveMediaUrl(project.cover_image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-[#FF6600]">CO</span>
                )}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-[#000F1B] truncate max-w-[160px] lg:max-w-[220px]">
                  {projectTitle}
                </div>
                <div className="text-[10px] text-[#111111]/50 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{projectLocation}</span>
                </div>
              </div>
              {projectsList?.length > 1 && (
                <ChevronDown className={`w-4 h-4 text-[#111111]/40 transition ml-2 ${projDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Projects Dropdown Menu */}
            {projDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-black/10 shadow-2xl rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 text-[10px] font-bold text-[#FF6600] uppercase tracking-wider border-b border-black/5 mb-1">
                  Your Projects ({projectsList.length})
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {projectsList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProject(p.id);
                        setProjDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F2F2F2] transition text-left ${p.id === activeProjectId ? 'bg-[#FF6600]/5' : ''}`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className={`text-xs font-bold truncate ${p.id === activeProjectId ? 'text-[#FF6600]' : 'text-[#000F1B]'}`}>
                          {p.title || "Unnamed Project"}
                        </div>
                        <div className="text-[10px] text-[#111111]/50 truncate mt-0.5">
                          {p.user_role} • {p.project_code || "Active"}
                        </div>
                      </div>
                      {p.id === activeProjectId && <Check className="w-4 h-4 text-[#FF6600] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* SEARCH BAR */}
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F9FAFB] px-3 py-2 w-48 xl:w-64 focus-within:ring-2 focus-within:ring-[#FF6600] focus-within:bg-white transition">
              <Search className="w-4 h-4 text-[#111111]/40" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project..."
                className="bg-transparent outline-none text-xs text-[#000F1B] w-full placeholder:text-[#111111]/40"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }} className="text-[#111111]/40 hover:text-[#000F1B]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {isSearchOpen && (
              <div className="absolute top-full right-0 mt-2 w-[320px] bg-white border border-black/10 shadow-2xl rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col max-h-[400px]">
                {totalSearchResults === 0 ? (
                  <div className="p-6 text-center text-xs text-[#111111]/50 italic">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="overflow-y-auto">
                    {Object.entries(searchResults).map(([category, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <div key={category} className="border-b border-black/5 last:border-0">
                          <div className="px-4 py-2 bg-[#F9FAFB] text-[9px] font-bold text-[#111111]/40 uppercase tracking-wider">
                            {category} ({items.length})
                          </div>
                          {items.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleResultClick(item.link)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FF6600]/5 transition text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center shrink-0 text-[#000F1B]">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#000F1B] truncate">{item.title}</div>
                                <div className="text-[10px] text-[#111111]/50 truncate mt-0.5">{item.subtitle}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NOTIFICATION BELL WITH NUMBER BADGE */}
          <div className="relative" ref={notifDropdownRef}>
            <button 
              type="button" 
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative w-10 h-10 rounded-xl grid place-items-center hover:bg-[#F2F2F2] text-[#000F1B] min-h-[44px] transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[#FF0000] border-[1.5px] border-white text-white text-[8px] font-black shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-black/10 shadow-2xl rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col max-h-[450px]">
                <div className="px-4 py-3 border-b border-black/5 bg-[#F9FAFB] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#000F1B] uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && <span className="text-[9px] font-bold text-white bg-[#FF6600] px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                  </div>
                  
                  {/* LOCAL CLEAR BUTTON */}
                  {visibleNotifs.length > 0 && (
                    <button 
                      onClick={handleClearAllLocal}
                      className="text-[10px] font-bold text-[#111111]/40 hover:text-[#000F1B] transition uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {visibleNotifs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#111111]/50 italic">You're all caught up. No new notifications.</div>
                  ) : (
                    visibleNotifs.map(n => (
                      <button 
                        key={n.id} 
                        onClick={() => handleReadNotification(n.id, n.link)}
                        className={`w-full text-left p-4 border-b border-black/5 last:border-0 hover:bg-[#F2F2F2]/50 transition flex gap-3 ${!n.is_read ? "bg-[#FF6600]/5" : ""}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${!n.is_read ? "border-[#FF6600]/20 bg-white" : "border-black/5 bg-[#F9FAFB]"}`}>
                          {n.icon === "progress" && <HardHat className={`w-4 h-4 ${!n.is_read ? "text-[#FF6600]" : "text-[#111111]/40"}`} />}
                          {n.icon === "attendance" && <CheckCircle2 className={`w-4 h-4 ${!n.is_read ? "text-emerald-500" : "text-[#111111]/40"}`} />}
                          {n.icon === "team" && <UserPlus className={`w-4 h-4 ${!n.is_read ? "text-blue-500" : "text-[#111111]/40"}`} />}
                          {n.icon === "system" && <FileText className={`w-4 h-4 ${!n.is_read ? "text-purple-500" : "text-[#111111]/40"}`} />}
                          {n.icon === "general" && <Bell className={`w-4 h-4 ${!n.is_read ? "text-[#FF6600]" : "text-[#111111]/40"}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold truncate ${!n.is_read ? "text-[#000F1B]" : "text-[#111111]/70"}`}>{n.title}</div>
                          <div className={`text-[10px] mt-0.5 leading-relaxed ${!n.is_read ? "text-[#111111]/70" : "text-[#111111]/50"}`}>{n.message}</div>
                          <div className="text-[9px] font-semibold text-[#111111]/40 mt-1.5 uppercase tracking-wider">{new Date(n.timestamp).toLocaleString("en-IN", {month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"})}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                
                <Link to="/portal/site-reports" onClick={() => setNotifDropdownOpen(false)} className="block w-full p-3 text-center text-[10px] font-bold text-[#FF6600] bg-white border-t border-black/5 hover:bg-[#F9FAFB] transition shrink-0 uppercase tracking-widest">
                  View Full Activity Log
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-black/5">
            {user?.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-black/10 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#000F1B] text-white text-[10px] font-bold grid place-items-center">
                {initials}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight max-w-[120px]">
              <div className="text-xs font-semibold text-[#000F1B] truncate">{user?.name?.split(" ")[0] || "Client"}</div>
              <div className="text-[10px] text-[#111111]/45 truncate">Client Portal</div>
            </div>
            <button onClick={logout} type="button" className="w-9 h-9 rounded-xl grid place-items-center hover:bg-red-50 text-[#111111]/60 hover:text-[#FF0000] min-h-[36px]" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}