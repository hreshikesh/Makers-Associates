"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Construction } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { publicApi } from "@/lib/api";
import SEO from "@/components/site/SEO";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    publicApi?.getSiteSettings?.().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="not-found-page min-h-screen flex flex-col bg-[#000F1B] font-['Poppins',sans-serif] text-white selection:bg-[#FF6600] selection:text-white">
      <SEO
        title="404 - Page Under Construction"
        description="The page you are looking for has been moved or does not exist."
        canonical="/404"
        noindex={true}
      />

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-30 md:py-30 lg:py-32">
        {/* Ambient */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-[#FF6600]/[0.12] blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 w-full max-w-3xl mx-auto text-center mt-20">
          {/* Animated SVG scene */}
          <div className="w-full max-w-2xl mx-auto not_found_container">
            <svg
              className="not_found_svg w-full h-auto drop-shadow-2xl"
              viewBox="0 0 1000 320"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Clouds */}
              <g id="not_found_cloud1" className="opacity-25">
                <path
                  fill="#FFFFFF"
                  d="M120,40 Q140,15 170,25 Q200,5 230,25 Q260,15 280,40 Z"
                />
              </g>
              <g id="not_found_cloud2" className="opacity-20">
                <path
                  fill="#FFFFFF"
                  d="M720,45 Q740,20 770,30 Q800,10 830,30 Q860,20 880,45 Z"
                />
              </g>
              <g id="not_found_cloud3" className="opacity-15">
                <path
                  fill="#FFFFFF"
                  d="M420,28 Q440,10 465,18 Q490,5 515,18 Q540,10 555,28 Z"
                />
              </g>

              {/* 404 */}
              <text
                x="500"
                y="88"
                textAnchor="middle"
                fill="#FF6600"
                fontSize="88"
                fontWeight="900"
                letterSpacing="10"
                opacity="0.95"
                style={{ fontFamily: "Poppins, system-ui, sans-serif" }}
              >
                404
              </text>

              {/* Road */}
              <line
                x1="40"
                y1="260"
                x2="960"
                y2="260"
                stroke="#FF6600"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <g id="not_found_tracks">
                <line
                  x1="40"
                  y1="268"
                  x2="1100"
                  y2="268"
                  stroke="#5D89AF"
                  strokeWidth="3"
                  strokeDasharray="14 10"
                />
              </g>

              {/* Subtle ground bumps */}
              <g id="not_found_bumps" opacity="0.35">
                <path
                  d="M80 255 Q100 248 120 255 Q140 262 160 255"
                  fill="none"
                  stroke="#709abf"
                  strokeWidth="1.5"
                />
                <path
                  d="M800 255 Q820 248 840 255 Q860 262 880 255"
                  fill="none"
                  stroke="#709abf"
                  strokeWidth="1.5"
                />
              </g>

              {/* Bulldozer */}
              <g id="not_found_car-layers" transform="translate(370, 120)">
                {/* Smoke */}
                <g id="not_found_cloud4">
                  <circle cx="67" cy="-2" r="4" fill="#FFFFFF" opacity="0.3" />
                  <circle cx="72" cy="-10" r="7" fill="#FFFFFF" opacity="0.18" />
                </g>
                <g id="not_found_cloud5">
                  <circle cx="78" cy="-18" r="5" fill="#FFFFFF" opacity="0.12" />
                </g>

                <rect x="65" y="5" width="5" height="20" fill="#64748B" rx="1" />

                {/* Cabin */}
                <path
                  d="M55,25 L90,25 L115,70 L45,70 Z"
                  fill="#0F172A"
                  stroke="#FF6600"
                  strokeWidth="2.5"
                />
                <path
                  d="M62,30 L86,30 L105,65 L53,65 Z"
                  fill="#38BDF8"
                  opacity="0.75"
                />

                {/* Body */}
                <rect x="90" y="50" width="85" height="40" rx="4" fill="#FF6600" />
                <rect
                  x="100"
                  y="58"
                  width="25"
                  height="15"
                  rx="2"
                  fill="#0F172A"
                  opacity="0.4"
                />

                {/* Arm */}
                <path
                  d="M140,75 L190,90 L205,115"
                  stroke="#0F172A"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M140,75 L190,90 L205,115"
                  stroke="#FF6600"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Bucket */}
                <path
                  d="M195,85 L225,85 L215,140 L185,140 Z"
                  fill="#0F172A"
                  stroke="#FF6600"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Tracks */}
                <g id="not_found_bracefront">
                  <rect
                    x="20"
                    y="105"
                    width="160"
                    height="35"
                    rx="17.5"
                    fill="#0F172A"
                    stroke="#FF6600"
                    strokeWidth="2.5"
                  />
                  {[40, 70, 100, 130, 160].map((cx) => (
                    <circle
                      key={cx}
                      cx={cx}
                      cy="122.5"
                      r="9"
                      fill="#334155"
                      stroke="#64748B"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
                <g id="not_found_braceback" opacity="0">
                  {/* reserved for animation parity */}
                </g>
              </g>
            </svg>
          </div>

          {/* Copy */}
          <div className="mt-2 sm:mt-4 space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Under Construction
            </h1>
            <p className="text-white/65 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              The page you are looking for has been moved, removed, or is still
              being built by our crew.
            </p>

            {/* CTAs */}
            <div className="pt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>

              <Link
                to="/"
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#FF6600] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#E04F00] hover:shadow-[0_12px_32px_rgba(255,90,0,0.35)] active:scale-[0.98]"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </div>

            {/* Quick links */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/40">
              <Link to="/#packages" className="hover:text-[#FF6600] transition">
                Packages
              </Link>
              <span className="text-white/15">·</span>
              <Link to="/#home-collection" className="hover:text-[#FF6600] transition">
                Home Designs
              </Link>
              <span className="text-white/15">·</span>
              <Link to="/contact" className="hover:text-[#FF6600] transition">
                Contact
              </Link>
              <span className="text-white/15">·</span>
              <Link to="/about" className="hover:text-[#FF6600] transition">
                About
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer settings={settings} />

      {/* Scoped animation styles */}
      <style>{`
        .not_found_svg {
          overflow: visible;
        }

        #not_found_cloud1 {
          animation: nf_cloud_drift 12s ease-in-out infinite alternate;
        }
        #not_found_cloud2 {
          animation: nf_cloud_drift 18s ease-in-out infinite alternate-reverse;
        }
        #not_found_cloud3 {
          animation: nf_cloud_drift 15s ease-in-out infinite alternate;
        }
        #not_found_cloud4,
        #not_found_cloud5 {
          animation: nf_float 4s ease-in-out infinite;
        }

        @keyframes nf_cloud_drift {
          0%   { transform: translateX(-12px) translateY(0); }
          100% { transform: translateX(16px) translateY(-6px); }
        }
        @keyframes nf_float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.25; }
          50%      { transform: translateY(-8px) scale(1.06); opacity: 0.55; }
        }

        #not_found_tracks {
          animation: nf_slide 0.75s linear infinite;
        }
        @keyframes nf_slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-24px); }
        }

        #not_found_bumps {
          animation: nf_bumps 10s ease-in-out infinite alternate;
        }
        @keyframes nf_bumps {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-36px); }
        }

        #not_found_car-layers {
          animation: nf_jig 0.35s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center bottom;
        }
        @keyframes nf_jig {
          0%, 100% { transform: translate(370px, 120px) translateY(0); }
          50%      { transform: translate(370px, 120px) translateY(-1.5px); }
        }

        #not_found_bracefront {
          animation: nf_braces 0.6s ease-in-out infinite;
        }
        @keyframes nf_braces {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(1.5px); }
        }

        @media (prefers-reduced-motion: reduce) {
          #not_found_cloud1,
          #not_found_cloud2,
          #not_found_cloud3,
          #not_found_cloud4,
          #not_found_cloud5,
          #not_found_tracks,
          #not_found_bumps,
          #not_found_car-layers,
          #not_found_bracefront {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}