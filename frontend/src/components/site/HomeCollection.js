import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bed, Bath, Layers, Ruler } from "lucide-react";
import { FadeIn } from "@/components/site/Primitives";
import DiagonalCarousel from "@/components/site/DiagonalCarousel";

export default function HomeCollection({ homes = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!Array.isArray(homes) || homes.length === 0) return null;

  const safeIndex = activeIndex >= 0 && activeIndex < homes.length ? activeIndex : 0;
  const activeHome = homes[safeIndex] || homes[0];

  const carouselItems = homes.map((h, i) => ({
    id: h?.id || h?.slug || `home-${i}`,
    src: h?.cover_image || "/images/placeholder.webp",
    title: h?.name || "Home Design",
    alt: h?.name || "Home Design",
    data: h,
  }));

  const formatFloors = (floors) => {
    if (floors === undefined || floors === null) return "G+1";
    if (typeof floors === "string") return floors;
    return floors === 0 ? "G" : `G+${floors}`;
  };

  return (
    <section
      id="home-collection"
      data-testid="home-collection-section"
      className="relative overflow-hidden py-16 md:py-20 lg:py-24 font-['Poppins',sans-serif] selection:bg-[#FF6600] selection:text-white scroll-mt-20"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/bg/homecollection.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(300px,400px)_1fr] lg:gap-10 xl:gap-14 items-stretch">
          
          {/* LEFT PANEL */}
          <FadeIn className="h-full">
            <div className="relative flex h-full min-h-[520px] flex-col justify-between overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              
              <div className="absolute inset-0 z-0">
                <img
                  src="/images/bg/homecollection.webp"
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#111111]/95 via-[#111111]/90 to-[#111111]/80" />
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#FF6600]/20 blur-3xl pointer-events-none" />
              </div>

              <div className="relative z-10 p-7 sm:p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <span className="h-[2px] w-9 bg-gradient-to-r from-[#FF6600] to-[#FF0000]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    02 — Home Collection
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-bold leading-[1.1] text-white sm:text-3xl md:text-[34px] lg:text-[36px]">
                  Ready-to-Build{" "}
                  <span className="bg-gradient-to-r from-[#FF6600] to-[#FF0000] bg-clip-text text-transparent">
                    Home Designs.
                  </span>
                </h2>

                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/70 sm:text-sm font-normal">
                  Choose from our expertly designed homes with complete structural plans,
                  material specifications, and 3D walkthroughs — built to bring your vision to life.
                </p>
              </div>

              {/* Active Home Specs */}
              <div className="relative z-10 p-7 sm:p-8 md:p-10 pt-0">
                <AnimatePresence mode="wait">
                  {activeHome && (
                    <motion.div
                      key={activeHome?.id || safeIndex}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {activeHome?.style && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF6600]">
                              {activeHome.style}
                            </span>
                          )}
                          <h3 className="mt-1 text-lg font-bold text-white tracking-tight">
                            {activeHome?.name || "Featured Design"}
                          </h3>
                        </div>

                        {activeHome?.estimated_cost && (
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] uppercase tracking-[0.15em] text-white/50">
                              Estimated
                            </span>
                            <span className="text-sm font-bold text-white">
                              {activeHome.estimated_cost}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-[11px] font-medium text-white/80">
                        {(activeHome?.dimensions || activeHome?.area_sqft) && (
                          <span className="inline-flex items-center gap-1.5">
                            <Ruler className="h-3.5 w-3.5 text-[#FF6600]" />
                            {activeHome.dimensions || `${activeHome.area_sqft} sq.ft`}
                          </span>
                        )}

                        {activeHome?.bedrooms && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-white/30" />
                            <span className="inline-flex items-center gap-1.5">
                              <Bed className="h-3.5 w-3.5 text-[#FF6600]" />
                              {activeHome.bedrooms} BHK
                            </span>
                          </>
                        )}

                        {activeHome?.bathrooms && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-white/30" />
                            <span className="inline-flex items-center gap-1.5">
                              <Bath className="h-3.5 w-3.5 text-[#FF6600]" />
                              {activeHome.bathrooms} Bath
                            </span>
                          </>
                        )}

                        <span className="h-1 w-1 rounded-full bg-white/30" />
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-[#FF6600]" />
                          {formatFloors(activeHome?.floors)}
                        </span>
                      </div>

                      {activeHome?.slug && (
                        <Link
                          to={`/homes/${activeHome.slug}`}
                          className="group mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#FF6600] transition-all hover:gap-3 hover:text-[#FF0000]"
                        >
                          View Details
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          </FadeIn>

          {/* RIGHT CAROUSEL */}
          <div className="relative min-h-[520px] lg:min-h-[580px] w-full overflow-hidden rounded-2xl bg-transparent border border-white/20 shadow-2xl backdrop-blur-sm">
            <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6600]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
                {homes.length} Designs Available
              </span>
            </div>

            <div className="relative z-10 h-full w-full">
              <DiagonalCarousel
                items={carouselItems}
                activeIndex={safeIndex}
                onActiveIndexChange={setActiveIndex}
                autoPlay={true}
                autoPlayInterval={3500}
                slideSize={220}
                slideAspect={0.72}
                rotationStep={20}
                verticalStep={78}
                inactiveScale={0.58}
                labelClassName="text-white"
              />
            </div>
          </div>

        </div>

        {/* Mobile Strip */}
        <div className="mt-6 flex gap-2.5 overflow-x-auto pb-2 scrollbar-none lg:hidden">
          {homes.map((h, idx) => (
            <button
              type="button"
              key={h?.id || idx}
              onClick={() => setActiveIndex(idx)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                idx === safeIndex
                  ? "border-[#FF6600] scale-105 shadow-md"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img
                src={h?.cover_image || "/images/placeholder.webp"}
                alt={h?.name || "Thumbnail"}
                className="h-20 w-16 object-cover"
              />
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}