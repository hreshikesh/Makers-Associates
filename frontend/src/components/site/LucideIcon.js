import React from "react";
import * as Lucide from "lucide-react";

export default function LucideIcon({ name, ...props }) {
  const Cmp = Lucide[name] || Lucide.Sparkles;
  return <Cmp {...props} />;
}
