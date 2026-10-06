import React from "react";

/**
 * ConstructONS logo mark — stylized "C" inside an orange circle.
 * Matches brand reference: solid orange disc + white C with subtle inner shadow.
 */
export default function LogoMark({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Orange disc gradient — subtle premium sheen */}
        <linearGradient id="cons-disc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF7A2E" />
          <stop offset="55%" stopColor="#FF6600" />
          <stop offset="100%" stopColor="#E64F00" />
        </linearGradient>
        {/* Inner shadow so the C looks embossed */}
        <filter id="cons-inner" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" />
          <feOffset dx="0" dy="0.6" result="off" />
          <feComposite in="off" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="cut" />
          <feColorMatrix in="cut" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" result="shd" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shd" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer orange disc */}
      <circle cx="32" cy="32" r="30" fill="url(#cons-disc)" />

      {/* Highlight ring */}
      <circle
        cx="32"
        cy="32"
        r="28.5"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />

      {/*
        Stylized "C" — an arc opening to the right with a squared cap.
        Built from a thick stroked circle minus a wedge on the right side.
      */}
      <g filter="url(#cons-inner)">
        <path
          d="M46 20.2
             A18 18 0 1 0 46 43.8
             L46 36.2
             A11 11 0 1 1 46 27.8
             Z"
          fill="#FFFFFF"
        />
        {/* Small square accent inside opening — subtle 'construction pixel' */}
        <rect x="40.5" y="30" width="4" height="4" rx="0.6" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  );
}
