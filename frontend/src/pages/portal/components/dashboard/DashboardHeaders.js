import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, Flag, CloudRain, Droplets, CheckCircle2,
  Clock, ShieldAlert, Camera, Video, Sun, Cloud, Check
} from "lucide-react";
import axios from "axios";

export default function DashboardHeaders({ user, project }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const hasCoords = project?.site_lat != null && project?.site_lng != null && !Number.isNaN(Number(project.site_lat));
  const lat = hasCoords ? Number(project.site_lat) : null;
  const lng = hasCoords ? Number(project.site_lng) : null;

  useEffect(() => {
    if (!lat || !lng) { setWeather(null); return; }
    setWeatherLoading(true);
    axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m&current_weather=true&timezone=auto`)
      .then((res) => {
        setWeather({
          temp: res.data.current?.temperature_2m ?? res.data.current_weather?.temperature,
          humidity: res.data.current?.relative_humidity_2m ?? 65,
          weathercode: res.data.current_weather?.weathercode ?? 0
        });
      })
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));
  }, [lat, lng]);

  const stages = project?.stages || [];
  const materials = project?.materials || [];
  const quality = project?.quality_inspections || [];
  const drawings = project?.drawings || [];
  const cameras = project?.cctv_cameras || [];
  const today = new Date();

  const completedStages = stages.filter((s) => s.status === "completed").length;
  const progressVal = stages.length ? Math.round(stages.reduce((sum, s) => sum + (Number(s.progress_pct) || 0), 0) / stages.length) : 0;
  const currentStage = stages.find((s) => s.status === "in_progress");
  const expectedCompletionDate = project?.expected_completion || (stages.length > 0 ? stages[stages.length - 1]?.expected_date : null);

  // REAL DATA MAPPING FOR HEALTH METRICS
  const healthData = [
    { 
      key: "Schedule", 
      status: stages.some((s) => s.status !== "completed" && s.expected_date && new Date(s.expected_date) < today) 
        ? "At Risk" 
        : "On Track" 
    },
    { 
      key: "Cost", 
      status: (Number(project?.amount_spent) > Number(project?.contract_value) && Number(project?.contract_value) > 0) 
        ? "At Risk" 
        : "On Track" 
    },
    { 
      key: "Materials", 
      status: materials.length > 0 && materials.every(m => m.status !== "delivered" && m.status !== "installed") 
        ? "Attention" 
        : "On Track" 
    },
    { 
      key: "Quality", 
      status: quality.some((q) => q.status === "failed" || q.status === "rectification") 
        ? "At Risk" 
        : "On Track" 
    },
    { 
      key: "Approvals", 
      status: drawings.some((d) => d.status === "pending" || d.status === "changes_required" || d.status === "rejected") 
        ? "Attention" 
        : "On Track" 
    },
    { 
      key: "Payments", 
      status: (Number(project?.amount_spent) > (Number(project?.contract_value) || 0)) 
        ? "At Risk" 
        : "On Track" 
    }
  ];

  const overallHealth = healthData.some((h) => h.status === "At Risk") 
    ? "At Risk" 
    : healthData.some((h) => h.status === "Attention") 
    ? "Attention" 
    : "On Track";

  const hColors = {
    "On Track": { text: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2, ring: "#10B981" },
    "Attention": { text: "text-amber-600", bg: "bg-amber-50", icon: Clock, ring: "#F59E0B" },
    "At Risk": { text: "text-red-600", bg: "bg-red-50", icon: ShieldAlert, ring: "#EF4444" },
  };

  const HealthIcon = hColors[overallHealth].icon;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-3 font-['Poppins']">
      
      {/* 1. Welcome Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full md:w-auto gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#000F1B] leading-none">Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p className="text-[10px] text-[#111111]/60 mt-1">Here's how your dream home is progressing this week.</p>
          </div>
          
          {hasCoords && (weatherLoading ? (
            <div className="animate-pulse text-[10px] bg-slate-50 border border-black/5 px-2.5 py-1 rounded-xl text-slate-400">Loading forecast...</div>
          ) : weather ? (
            <div className="flex items-center gap-2 bg-[#F9FAFB] border border-black/5 px-2.5 py-1 rounded-xl self-start sm:self-center">
              <span className="text-[10px] font-bold text-[#000F1B] flex items-center gap-1">
                {weather.weathercode === 0 ? <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {Math.round(weather.temp)}°C
              </span>
              <span className="w-px h-3 bg-black/10" />
              <span className="text-[10px] font-bold text-[#111111]/60 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {weather.humidity}% Hum
              </span>
            </div>
          ) : null)}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 border-t border-black/5 pt-2 md:pt-0 md:border-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#111111]/40" />
            <div>
              <div className="text-[8px] text-[#111111]/50 font-bold uppercase tracking-wider">Project Start</div>
              <div className="text-[11px] font-bold text-[#000F1B]">{formatDate(project?.start_date || project?.created_at)}</div>
            </div>
          </div>
          <div className="w-px h-6 bg-black/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#111111]/40" />
            <div>
              <div className="text-[8px] text-[#111111]/50 font-bold uppercase tracking-wider">Forecast Completion</div>
              <div className="text-[11px] font-bold text-[#000F1B]">{formatDate(expectedCompletionDate)}</div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-[10px] font-bold ${hColors[overallHealth].bg} ${hColors[overallHealth].text}`}>
            {overallHealth === "On Track" ? "Healthy" : overallHealth}
          </div>
        </div>
      </div>

      {/* 2. Horizontal Stages Progress Strip */}
      {stages.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-3.5 shadow-sm">
          <div className="text-[9px] font-bold text-[#111111]/50 uppercase tracking-widest mb-2.5">Project Roadmap</div>
          
          <div className="overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center min-w-[760px] md:min-w-0 justify-between relative py-1.5 px-2">
              
              {/* Connecting Background Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />

              {stages.map((stg, idx) => {
                const isCompleted = stg.status === "completed";
                const isCurrent = stg.status === "in_progress";
                
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 relative z-10 px-1">
                    
                    {/* Circle Indicator */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isCompleted ? "bg-emerald-500 text-white" : 
                      isCurrent ? "bg-[#FF6600] text-white ring-4 ring-[#FF6600]/25 animate-pulse" : 
                      "bg-white border-2 border-slate-200 text-slate-400"
                    }`}>
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="text-[10px] font-black">{idx + 1}</span>
                      )}
                    </div>

                    {/* Stage Name */}
                    <span className={`text-[9px] font-bold mt-2 text-center max-w-[110px] truncate leading-tight ${
                      isCompleted ? "text-emerald-600" : 
                      isCurrent ? "text-[#000F1B] font-black" : 
                      "text-[#111111]/45"
                    }`}>
                      {stg.name}
                    </span>

                    {/* Stage mini-status badge */}
                    <span className="text-[7px] font-semibold mt-0.5 uppercase tracking-wider opacity-60">
                      {isCompleted ? "Completed" : isCurrent ? `${stg.progress_pct}% Done` : "Pending"}
                    </span>

                  </div>
                );
              })}

            </div>
          </div>
        </div>
      )}

      {/* 3. Row 1 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* Project & Payment Health */}
        <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm flex flex-col h-[185px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-[#000F1B]">Project Health</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1 flex-1">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#F2F2F2" strokeWidth="6" fill="none" />
                <circle cx="28" cy="28" r="24" stroke={hColors[overallHealth].ring} strokeWidth="6" fill="none" strokeDasharray="150" strokeDashoffset={0} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className={`flex items-center gap-1 text-sm font-bold ${hColors[overallHealth].text}`}>
                <HealthIcon className="w-4 h-4" /> {overallHealth === "On Track" ? "Healthy" : overallHealth}
              </div>
              <p className="text-[10px] text-[#111111]/60 mt-0.5 leading-tight">
                {overallHealth === "On Track" ? "All core tracking metrics are healthy." : "Some areas require attention."}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 mt-auto border-t border-black/5">
            {healthData.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className={`w-full py-0.5 text-center rounded text-[7px] font-bold uppercase tracking-normal ${hColors[h.status].bg} ${hColors[h.status].text}`}>
                  {h.status === "On Track" ? "Healthy" : h.status === "Attention" ? "Review" : "Risk"}
                </div>
                <div className="text-[8px] font-semibold text-[#111111]/60 truncate w-full text-center leading-none">{h.key}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm flex flex-col h-[185px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-[#000F1B]">Overall Progress</h2>
            </div>
            <Link to="/portal/timeline" className="text-[10px] font-bold text-blue-600 hover:underline">Timeline</Link>
          </div>
          <div className="flex items-center gap-4 mt-1 flex-1">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#F2F2F2" strokeWidth="6" fill="none" />
                <circle cx="28" cy="28" r="24" stroke="#10B981" strokeWidth="6" fill="none" strokeDasharray="150" strokeDashoffset={150 - (progressVal / 100) * 150} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#000F1B]">{progressVal}%</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-bold text-[#111111]/40 uppercase tracking-wider mb-0.5">Current Stage</div>
              <div className="text-xs font-bold text-[#000F1B] truncate leading-tight">{currentStage ? currentStage.name : "Awaiting Start"}</div>
              {currentStage && <span className="inline-block mt-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">In Progress</span>}
            </div>
          </div>
          <div className="pt-2 mt-auto text-[9px] font-semibold text-[#111111]/60 flex justify-between border-t border-black/5">
            <span>{completedStages} of {stages.length} stages completed</span>
          </div>
        </div>

        {/* CCTV Camera Grid */}
        <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm flex flex-col h-[185px] md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#FF6600]" />
              <h2 className="text-sm font-bold text-[#000F1B]">CCTV Grid</h2>
            </div>
            <Link to="/portal/cctv" className="text-[10px] font-bold text-blue-600 hover:underline">View All</Link>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {cameras.slice(0, 4).map((cam, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden bg-[#000F1B] border border-black/10 flex items-center justify-center">
                {cam.status === "online" ? (
                  cam.camera_type === "youtube" ? (
                    <iframe src={`${cam.url}?autoplay=0&mute=1&controls=0`} className="absolute inset-0 w-full h-full pointer-events-none opacity-80" title={`cctv-${idx}`} />
                  ) : (
                    <Video className="w-4 h-4 text-white/30" />
                  )
                ) : (
                  <div className="text-center">
                    <Video className="w-4 h-4 text-white/20 mx-auto" />
                    <span className="text-[7px] text-white/40 block">Offline</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[6px] font-bold text-white uppercase tracking-wider truncate max-w-[80%]">
                  {cam.name || `Cam ${idx + 1}`}
                </div>
                <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-600 text-white text-[5px] font-bold px-1 py-0.2 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              </div>
            ))}
            {cameras.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center text-[#111111]/40 border border-dashed border-black/10 rounded-lg bg-[#F9FAFB]">
                <Video className="w-6 h-6 mb-1 opacity-40" />
                <span className="text-[10px] font-semibold">No Cameras Setup</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}