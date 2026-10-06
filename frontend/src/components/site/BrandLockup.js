import React from "react";

export default function BrandLockup({
  tone = "light",
  size = "md",
  className = "",
  showLogo = true,
  responsive = false,
}) {
  const isDarkBackground = tone === "dark";

  // Your original sizes - KEPT EXACTLY SAME
  const dimensions = {
    xs: "w-[84px] h-8",
    sm: "w-[112px] h-10",
    md: responsive
      ? "w-[128px] h-10 sm:w-[148px] sm:h-12"
      : "w-[148px] h-12",
    lg: "w-[188px] h-16",
  }[size] || "w-[148px] h-12";

  if (!showLogo) return null;

  return (
    <img
      src={isDarkBackground ? "/logoLight.svg" : "/logoDark.svg"}
      alt="ConstructONS - Everything Construction. Always On."
      draggable={false}
      className={`${dimensions} shrink-0 object-cover object-left select-none ${className}`}
    />
  );
}