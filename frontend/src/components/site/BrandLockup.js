import React from "react";

export default function BrandLockup({
  tone = "light",
  size = "md",
  className = "",
  showLogo = true,
  responsive = false,
}) {
  const isDarkBackground = tone === "dark";

  // Sizes reduced by 50%
  const dimensions = {
    xs: "w-[42px] h-4",
    sm: "w-[56px] h-5",
    md: responsive
      ? "w-[64px] h-5 sm:w-[74px] sm:h-6"
      : "w-[74px] h-6",
    lg: "w-[94px] h-8",
  }[size] || "w-[74px] h-6";

  if (!showLogo) return null;

  return (
    <img
      src={isDarkBackground ? "/logo.svg" : "/logo.svg"}
      alt="[Your Brand]s - Everything Construction. Always On."
      draggable={false}
      className={`${dimensions} shrink-0 object-contain object-left select-none ${className}`}
    />
  );
}