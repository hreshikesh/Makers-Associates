import React from "react";
import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComingSoon({
  title = "Coming Soon",
  description = "This module is part of the [Your Brand]s Client Portal roadmap and will unlock as your project data is connected.",
  icon: Icon = Construction,
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-['Poppins']">
      <div className="w-16 h-16 rounded-2xl bg-[#B89416]/10 grid place-items-center mb-5">
        <Icon className="w-8 h-8 text-[#B89416]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#252A2A] tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-[#252A2A]/65 max-w-md leading-relaxed">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#252A2A]/5 text-[11px] font-semibold text-[#252A2A]/70 uppercase tracking-wider">
        Phase roadmap · Tracking live on Dashboard
      </div>
      <Link
        to="/portal"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#B89416] hover:bg-[#B89416] text-white px-5 py-3 text-sm font-semibold min-h-[44px] transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}