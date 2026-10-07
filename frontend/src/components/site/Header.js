"use client";

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLeadModal } from "@/components/site/LeadModalProvider";
import BrandLockup from "@/components/site/BrandLockup";

const NAV = [
  { label: "Home", to: "/", hash: "top" },
  // { label: "Home Collection", to: "/#home-collection", hash: "home-collection" },
  { label: "AI Platform", to: "/#ai-platform", hash: "ai-platform" },
  { label: "Marketplace", to: "/#marketplace", hash: "marketplace" },
  { label: "Financial Services", to: "/#financial", hash: "financial" },
  { label: "Packages", to: "/packages" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { open: openLead } = useLeadModal();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const hashId = location.hash.replace("#", "");
      setTimeout(() => scrollToSection(hashId), 100);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header data-testid="site-header" className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto w-full max-w-[1536px]">
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`
            flex items-center justify-between
            rounded-full border px-2 py-2 sm:px-3
            ${scrolled
              ? "border-black/[0.06] bg-white/95 shadow-[0_12px_40px_rgba(17,17,17,0.08)] backdrop-blur-xl"
              : "border-white/15 bg-[#252A2A]/30 backdrop-blur-md"
            }
          `}
        >
        <Link
  to="/"
  data-testid="header-logo"
  aria-label="[Your Brand]s home"
  className="flex shrink-0 items-center py-1 pl-3 pr-4 sm:pl-4"
>
  <BrandLockup tone={scrolled ? "light" : "dark"} size="lg" responsive />
</Link>


          <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-0.5">
            {NAV.map((item) => (
              <NavItem key={item.label} item={item} scrolled={scrolled} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/portal/login"
              data-testid="header-client-login"
              className={`
                hidden min-h-11 items-center justify-center rounded-full px-4
                text-sm font-semibold transition-all duration-300 md:inline-flex
                ${scrolled
                  ? "text-[#252A2A] hover:text-[#B89416]"
                  : "text-white hover:text-[#B89416]"
                }
              `}
            >
              Client Login
            </Link>

            <button
              type="button"
              onClick={() => openLead({ source: "header" })}
              data-testid="header-cta"
              className="
                hidden min-h-11 items-center justify-center gap-2 rounded-full
                bg-gradient-to-r from-[#B89416] to-[#B89416] px-5 text-sm font-semibold text-white
                transition-all duration-300
                hover:opacity-90 hover:shadow-[0_8px_30px_rgba(255,102,0,0.35)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89416]
                focus-visible:ring-offset-2 md:inline-flex
              "
            >
              Talk to an Expert
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setOpen((c) => !c)}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              data-testid="mobile-menu-button"
              className={`
                grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors xl:hidden
                ${scrolled
                  ? "bg-[#252A2A] text-white hover:bg-[#B89416]"
                  : "border border-white/20 bg-white/10 text-white hover:bg-[#B89416] hover:border-[#B89416]"
                }
              `}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.14)] xl:hidden"
            >
              <nav aria-label="Mobile navigation" className="p-2">
                {NAV.map((item) => (
                  <MobileNavItem key={item.label} item={item} onClose={() => setOpen(false)} />
                ))}

                <div className="mt-2 border-t border-black/[0.06] pt-2">
                  <Link
                    to="/portal/login"
                    onClick={() => setOpen(false)}
                    data-testid="mobile-client-login"
                    className="flex min-h-12 items-center rounded-2xl px-4 text-sm font-semibold text-[#252A2A] transition-colors hover:text-[#B89416] hover:bg-[#B89416]/5"
                  >
                    Client Login
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openLead({ source: "header" });
                    }}
                    className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#B89416] to-[#B89416] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Talk to an Expert
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function NavItem({ item, scrolled }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (event) => {
    if (!item.hash) return;
    event.preventDefault();

    if (item.hash === "top") {
      if (location.pathname !== "/") navigate("/");
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (location.pathname !== "/") {
      navigate(`/#${item.hash}`);
      return;
    }
    scrollToSection(item.hash);
  };

  const baseClass = `
    relative rounded-full px-3 py-2.5 text-[13px] font-medium
    transition-colors duration-200 cursor-pointer
    ${scrolled
      ? "text-[#252A2A]/75 hover:text-[#B89416]"
      : "text-white/80 hover:text-[#B89416]"
    }
  `;

  if (!item.hash) {
    return (
      <Link to={item.to} className={baseClass}>
        {item.label}
      </Link>
    );
  }

  return (
    <a href={item.to} onClick={handleClick} className={baseClass}>
      {item.label}
    </a>
  );
}

function MobileNavItem({ item, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (event) => {
    if (!item.hash) {
      onClose();
      return;
    }
    event.preventDefault();
    onClose();

    if (item.hash === "top") {
      if (location.pathname !== "/") navigate("/");
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (location.pathname !== "/") {
      navigate(`/#${item.hash}`);
      return;
    }
    scrollToSection(item.hash);
  };

  const className = `
    flex min-h-12 items-center justify-between rounded-2xl px-4 text-sm
    font-medium text-[#252A2A]/80 transition-colors cursor-pointer
    hover:bg-[#B89416]/5 hover:text-[#B89416]
  `;

  if (!item.hash) {
    return (
      <Link to={item.to} onClick={onClose} className={className}>
        <span>{item.label}</span>
        <ArrowRight className="h-4 w-4 opacity-30" />
      </Link>
    );
  }

  return (
    <a href={item.to} onClick={handleClick} className={className}>
      <span>{item.label}</span>
      <ArrowRight className="h-4 w-4 opacity-30" />
    </a>
  );
}

function scrollToSection(id) {
  const cleanId = id.startsWith("#") ? id.slice(1) : id;
  const element = document.getElementById(cleanId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}