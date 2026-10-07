import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { BellRing, ExternalLink } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "") + "/api";

const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [projectsList, setProjectsList] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(localStorage.getItem("cons_active_project") || null);
  const [project, setProject] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ref to track known notification IDs to prevent duplicate toasts & bypass array length limits
  const knownNotifIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Helper to trigger Sonner toast popup
  const triggerNotificationToast = useCallback((notif) => {
    if (!notif || !notif.title) return;

    toast.custom((t) => (
      <div className="flex items-start gap-3 p-4 bg-white border border-[#B89416]/30 rounded-2xl shadow-2xl shadow-[#B89416]/15 w-[350px] font-['Poppins'] relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#B89416]" />
        
        <div className="w-10 h-10 rounded-xl bg-[#B89416]/10 border border-[#B89416]/20 grid place-items-center shrink-0 mt-0.5">
          <BellRing className="w-5 h-5 text-[#B89416] animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold text-[#B89416] uppercase tracking-wider">Live Project Update</span>
            <span className="text-[9px] text-[#252A2A]/40 font-medium">Just now</span>
          </div>
          
          <div className="font-bold text-[#252A2A] text-sm leading-snug line-clamp-1">{notif.title}</div>
          <div className="text-[11px] text-[#252A2A]/70 mt-1 line-clamp-2 leading-relaxed">{notif.message}</div>
          
          <button 
            onClick={() => {
              toast.dismiss(t);
              if (notif.link) navigate(notif.link);
            }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-[#252A2A] hover:bg-[#B89416] px-3 py-2 rounded-xl transition-all shadow-md active:scale-95"
          >
            <span>View Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ), { duration: 7000 });
  }, [navigate]);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const me = await axios.get(`${API_BASE}/customer/me`, { withCredentials: true });
      setUser(me.data);

      try {
        const listRes = await axios.get(`${API_BASE}/portal/my-projects-list`, { withCredentials: true });
        const list = listRes.data?.projects || [];
        setProjectsList(list);

        let targetId = activeProjectId;
        if (list.length > 0 && (!targetId || !list.find(p => p.id === targetId))) {
          targetId = list[0].id;
          setActiveProjectId(targetId);
          localStorage.setItem("cons_active_project", targetId);
        }

        const url = targetId ? `${API_BASE}/portal/my-project?project_id=${targetId}` : `${API_BASE}/portal/my-project`;
        const pr = await axios.get(url, { withCredentials: true });
        const rawProj = pr.data?.project !== undefined ? pr.data.project : pr.data;
        
        if (rawProj && (rawProj.id || rawProj.title || rawProj.project_code)) {
          setProject(rawProj);

          // Populate initial known notifications so we don't toast historical items on first load
          const notifs = rawProj.notifications || [];
          notifs.forEach(n => {
            if (n.id) knownNotifIdsRef.current.add(n.id);
          });
        } else {
          setProject(null);
        }
      } catch {
        setProject(null);
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/portal/login", { replace: true });
        return;
      }
      if (!isSilent) toast.error("Failed to load your portal");
    } finally {
      if (!isSilent) setLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [activeProjectId, navigate]);

  // Initial Load
  useEffect(() => {
    load();
  }, [load]);

  // Reset known notifications when switching projects
  useEffect(() => {
    knownNotifIdsRef.current.clear();
    isInitialLoadRef.current = true;
  }, [activeProjectId]);

  // Background Real-Time Polling (Checks every 8 seconds)
  useEffect(() => {
    if (!user || !activeProjectId) return;
    
    const interval = setInterval(async () => {
      try {
        const url = `${API_BASE}/portal/my-project?project_id=${activeProjectId}`;
        const pr = await axios.get(url, { withCredentials: true });
        const rawProj = pr.data?.project !== undefined ? pr.data.project : pr.data;
        
        if (rawProj && rawProj.notifications) {
          const currentNotifs = rawProj.notifications || [];

          // Find any unread notification that is NOT in our knownSet
          const freshNotifications = currentNotifs.filter(
            n => n.id && !knownNotifIdsRef.current.has(n.id) && !n.is_read
          );

          // Trigger popup toast for each fresh unread notification
          if (freshNotifications.length > 0 && !isInitialLoadRef.current) {
            freshNotifications.forEach(newNotif => {
              triggerNotificationToast(newNotif);
              knownNotifIdsRef.current.add(newNotif.id);
            });
          }

          // Always add current IDs to set
          currentNotifs.forEach(n => {
            if (n.id) knownNotifIdsRef.current.add(n.id);
          });

          setProject(rawProj);
        }
      } catch (e) {
        // Silently fail background poll
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [user, activeProjectId, triggerNotificationToast]);

  const logout = async () => {
    try {
      localStorage.removeItem("cons_active_project");
      await axios.post(`${API_BASE}/customer/logout`, {}, { withCredentials: true });
    } catch {}
    navigate("/portal/login", { replace: true });
  };

  const switchProject = (id) => {
    setActiveProjectId(id);
    localStorage.setItem("cons_active_project", id);
  };

  const value = {
    user,
    project,
    projectsList,
    activeProjectId,
    switchProject,
    loading,
    reload: load,
    logout,
    sidebarOpen,
    setSidebarOpen,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}