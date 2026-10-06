import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { Home, Package, Star, Newspaper, Inbox, ArrowRight, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    (async () => {
      // Helper: if any request fails/404s, return an empty array instead of crashing Promise.all
      const fetchSafe = (promise) => promise.catch(() => []);

      const [homes, packages, blogs, testimonials, leadsList, quizList] = await Promise.all([
        fetchSafe(adminApi.list("homes")),
        fetchSafe(adminApi.list("packages")),
        fetchSafe(adminApi.list("blogs")),
        fetchSafe(adminApi.list("testimonials")),
        fetchSafe(adminApi.listLeads()),
        fetchSafe(adminApi.listQuizSubmissions()),
      ]);

      const safeArr = (res) => (Array.isArray(res) ? res : []);
      const h = safeArr(homes);
      const p = safeArr(packages);
      const b = safeArr(blogs);
      const t = safeArr(testimonials);
      const l = safeArr(leadsList);
      const q = safeArr(quizList);

      setCounts({
        homes: h.length,
        packages: p.length,
        blogs: b.length,
        testimonials: t.length,
        leads: l.length,
        quizzes: q.length,
      });
      setLeads(l.slice(0, 5));
    })();
  }, []);

  return (
    <div className="font-['Poppins']">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-semibold text-[#FF6600] uppercase tracking-wider">Overview</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-[#000F1B]">Dashboard</h1>
        </div>
        <Link to="/" className="text-sm text-[#111111]/60 hover:text-[#FF6600] transition">
          View public site →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[
          { label: "Homes", value: counts.homes, path: "homes", icon: Home },
          { label: "Packages", value: counts.packages, path: "packages", icon: Package },
          { label: "Blogs", value: counts.blogs, path: "blogs", icon: Newspaper },
          { label: "Testimonials", value: counts.testimonials, path: "testimonials", icon: Star },
          { label: "Leads", value: counts.leads, path: "leads", icon: Inbox },
          { label: "Quiz Submissions", value: counts.quizzes, path: "quiz-submissions", icon: ClipboardList },
        ].map((s) => (
          <Link
            to={`/admin/${s.path}`}
            key={s.label}
            className="rounded-2xl bg-white border border-black/5 shadow-sm p-4 hover:shadow-md transition group"
          >
            <s.icon className="w-5 h-5 text-[#FF6600]" />
            <div className="mt-2 text-2xl font-bold text-[#000F1B]">{s.value ?? "0"}</div>
            <div className="text-xs text-[#111111]/60">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white border border-black/5 shadow-sm">
        <div className="p-4 flex items-center justify-between border-b border-black/5">
          <div className="font-semibold text-[#000F1B]">Recent leads</div>
          <Link to="/admin/leads" className="text-sm text-[#FF6600] font-semibold inline-flex items-center gap-1 hover:underline">
            All leads <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-black/5">
          {leads.length === 0 && <div className="p-6 text-sm text-[#111111]/50 italic">No leads recorded yet.</div>}
          {leads.map((l) => (
            <div key={l.id || l.created_at} className="p-4 flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold text-[#000F1B]">
                  {l.name} <span className="text-[#111111]/50 font-normal">· {l.phone}</span>
                </div>
                <div className="text-xs text-[#111111]/60 mt-0.5">
                  {l.message || l.interested_home || l.interested_package || "General enquiry"}
                </div>
              </div>
              <div className="text-xs text-[#111111]/40">
                {l.created_at ? new Date(l.created_at).toLocaleString() : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}