import React from "react";
import { motion } from "framer-motion";

export function FadeIn({ children, delay = 0, y = 24, once = true, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className = "", stagger = 0.08, once = true }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const stagItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function SectionLabel({ number, eyebrow }) {
  // Page numbers intentionally hidden per brand guidelines.
  // Keeping the "number" prop for backward compatibility.
  void number;
  return (
    <div className="flex items-center gap-3" data-testid="section-label">
      <span className="h-px w-6 bg-brand-navy/20" />
      <span className="section-eyebrow">{eyebrow}</span>
    </div>
  );
}

export function GradientBlob({ className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-40 ${className}`}
      style={{ background: "radial-gradient(closest-side, #B89416, transparent)" }}
    />
  );
}
