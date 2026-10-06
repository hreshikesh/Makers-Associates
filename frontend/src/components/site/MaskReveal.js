"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function MaskReveal({
  children,
  revealContent,
  size = 40,
  revealSize = 320,
  className = "",
}) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return;
    setPos({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    });
  };

  const radius = hovered ? revealSize : size;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchMove={handleMove}
      onTouchEnd={() => setHovered(false)}
      className={`relative overflow-hidden cursor-none select-none ${className}`}
    >
      <div className="absolute inset-0 bg-[#000F1B] flex items-center justify-center p-8">
        <div className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-white/70 leading-relaxed max-w-4xl">
          {children}
        </div>
      </div>

      <motion.div
        className="absolute inset-0 bg-white flex items-center justify-center p-8"
        style={{
          WebkitMaskImage: `radial-gradient(circle ${radius}px at ${pos.x}% ${pos.y}%, black 100%, transparent 100%)`,
          maskImage: `radial-gradient(circle ${radius}px at ${pos.x}% ${pos.y}%, black 100%, transparent 100%)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="text-center max-w-4xl">{revealContent}</div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute rounded-full border-2 border-[#FF6600] mix-blend-difference"
        animate={{
          width: hovered ? 40 : 20,
          height: hovered ? 40 : 20,
        }}
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        transition={{ duration: 0.15 }}
      />

      {!hovered && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 text-white/70 text-[11px] font-semibold uppercase tracking-[0.15em]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6600] animate-pulse" />
            Hover to reveal
          </div>
        </div>
      )}
    </div>
  );
}