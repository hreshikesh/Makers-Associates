import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { toast, Toaster } from "sonner";
import BrandLockup from "@/components/site/BrandLockup";
import { 
  Loader2, 
  Lock, 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await adminApi.login(email, password);
      toast.success("Welcome back to ConstructONS™ Admin Portal");
      navigate("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-between font-['Poppins'] text-[#111111] selection:bg-[#FF6600]/20 selection:text-[#000F1B] p-4 sm:p-6 lg:p-8">
      <Toaster richColors position="top-right" />

      {/* 🧭 Top Navigation Exit Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          aria-label="Back to ConstructONS Website"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#111111]/70 hover:text-[#FF6600] transition-colors py-2 px-3 -ml-2 rounded-xl hover:bg-white/80 min-h-[44px] group"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6600] transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
          <span>Back to Home</span>
        </Link>

        <span className="text-xs font-semibold text-[#111111]/40 uppercase tracking-widest hidden sm:inline-block">
          ConstructONS™ Internal Access
        </span>
      </header>

      {/* 🔐 Centered Admin Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-10 relative overflow-hidden">
          {/* Top Orange Stripe */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]" />

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center">
            <BrandLockup tone="light" size="md" />

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-[#000F1B]/5 border border-black/5 rounded-full text-[11px] font-semibold text-[#000F1B] tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6600]" aria-hidden="true" />
              <span>Admin & Staff Portal</span>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-[#000F1B] tracking-tight">
              Sign in to Dashboard
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#111111]/60 leading-relaxed">
              Enter your authorized credentials to manage projects, quality checks, and ecosystem operations.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="mt-8 space-y-4">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="admin-email" 
                className="block text-xs font-semibold text-[#000F1B] mb-1.5"
              >
                Email Address
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-[#F2F2F2]/60 px-3.5 py-3 transition focus-within:bg-white focus-within:border-[#FF6600] focus-within:ring-2 focus-within:ring-[#FF6600]/20 min-h-[48px]">
                <Mail className="w-4 h-4 text-[#111111]/40 shrink-0" aria-hidden="true" />
                <input
                  id="admin-email"
                  data-testid="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-[#000F1B] placeholder-[#111111]/40"
                  placeholder="name@constructons.com"
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-xs font-semibold text-[#000F1B] mb-1.5"
              >
                Password
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-[#F2F2F2]/60 pl-3.5 pr-2 py-1.5 transition focus-within:bg-white focus-within:border-[#FF6600] focus-within:ring-2 focus-within:ring-[#FF6600]/20 min-h-[48px]">
                <Lock className="w-4 h-4 text-[#111111]/40 shrink-0" aria-hidden="true" />
                <input
                  id="admin-password"
                  data-testid="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-[#000F1B] placeholder-[#111111]/40 py-1.5"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="p-2 rounded-lg text-[#111111]/40 hover:text-[#000F1B] hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6600]/40 shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              data-testid="admin-login-submit"
              type="submit"
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#FF0000] active:scale-[0.99] transition duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Switcher Link */}
          <div className="mt-8 pt-6 border-t border-black/5 text-center">
            <p className="text-xs text-[#111111]/60">
              Are you a home owner tracking a build?
            </p>
            <Link
              to="/portal/login"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#FF6600] hover:underline focus:outline-none focus:ring-1 focus:ring-[#FF6600] rounded px-1 py-0.5"
            >
              <span>Go to Customer Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer System Stamp */}
      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-[#111111]/40 py-2">
        ConstructONS™ — India's First Integrated Construction Ecosystem.
      </footer>
    </div>
  );
}