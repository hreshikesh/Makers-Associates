"use client";

import React from "react";
import { Star, User, Quote } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                            DEFAULT TESTIMONIALS                            */
/* -------------------------------------------------------------------------- */

const DEFAULT_TESTIMONIALS = [
  {
    name: "Anita Sharma",
    location: "Pune • Sky Villa",
    rating: 5,
    review:
      "Professional team, premium quality, and great support throughout. Our Sky Villa is a dream.",
  },
  {
    name: "Rohit Verma",
    location: "Chennai • Urban Nest",
    rating: 5,
    review:
      "Best decision we made. The floor plan is exactly what we wanted and the pricing was crystal clear.",
  },
  {
    name: "Sneha Iyer",
    location: "Mumbai • Luxury Duplex",
    rating: 5,
    review:
      "[Your Brand]s delivered on time and within budget. The whole family loves it.",
  },
  {
    name: "Arjun Mehta",
    location: "Bengaluru • Eco Residence",
    rating: 5,
    review:
      "The live updates kept us completely stress-free during the construction phase. Highly recommended!",
  },
];

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function TestimonialsSection({
  items,
  testimonials,
}) {
  // HomePage passes: <Testimonials items={data.testimonials} />
  const source =
    (Array.isArray(items) && items.length > 0 && items) ||
    (Array.isArray(testimonials) && testimonials.length > 0 && testimonials) ||
    DEFAULT_TESTIMONIALS;

  // Map exact backend Testimonial model fields → UI fields
  // models.py:
  // customer_name, location, quote, rating, avatar, home_purchased
  const normalized = source.map((t) => {
    const locationParts = [
      t?.location,
      t?.home_purchased,
    ].filter(Boolean);

    return {
      name: t?.customer_name || t?.name || "Happy Customer",
      location: locationParts.length
        ? locationParts.join(" • ")
        : t?.city || "[Your Brand]s Home",
      rating: Number(t?.rating) || 5,
      review: t?.quote || t?.review || t?.content || t?.message || "",
      avatar: t?.avatar || null,
    };
  });

  const marqueeList = [...normalized, ...normalized];

  return (
    <section className="bg-[#F8F9FA] py-16 sm:py-20 lg:py-24 font-sans text-slate-800 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-4 z-10 bg-[#F8F9FA]">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-[2px] w-6 bg-[#B89416]" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#B89416]">
                TESTIMONIALS
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-[#252A2A] sm:text-4xl lg:text-5xl leading-[1.15]">
              Happy Families. <br />
              <span className="bg-gradient-to-r from-[#B89416] to-[#B89416] bg-clip-text text-transparent">
                Happy Homes.
              </span>
            </h2>

            <p className="mt-4 text-sm text-slate-600 sm:text-base max-w-md">
              Real families. Real homes. Real stories of transparent
              construction with [Your Brand]s.
            </p>

            <div className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-[#252A2A] px-5 py-3.5 text-white shadow-xl w-fit">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">4.5</span>
                <span className="text-xs font-bold text-[#B89416]">/5</span>
              </div>

              <div className="h-7 w-[1px] bg-white/20" />

              <div>
                <div className="flex text-[#B89416] gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[#B89416] text-[#B89416]"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  CUSTOMER RATING
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT MOVING MARQUEE COLUMN */}
          <div className="lg:col-span-8 relative overflow-hidden mask-gradient">
            <style jsx>{`
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                display: flex;
                width: max-content;
                animation: marquee 25s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
              .mask-gradient {
                mask-image: linear-gradient(
                  to right,
                  transparent 0%,
                  black 8%,
                  black 92%,
                  transparent 100%
                );
                -webkit-mask-image: linear-gradient(
                  to right,
                  transparent 0%,
                  black 8%,
                  black 92%,
                  transparent 100%
                );
              }
            `}</style>

            <div className="animate-marquee py-4 flex gap-6">
              {marqueeList.map((item, idx) => (
                <div
                  key={idx}
                  className="w-[300px] sm:w-[340px] shrink-0 rounded-3xl bg-white p-6 shadow-md border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-500 overflow-hidden">
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6" />
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-[#252A2A] leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-xs font-medium text-slate-400">
                            {item.location}
                          </p>
                        </div>
                      </div>

                      <Quote className="h-6 w-6 text-[#B89416]/30 shrink-0" />
                    </div>

                    <div className="flex text-[#B89416] gap-0.5 mb-3">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-[#B89416] text-[#B89416]"
                        />
                      ))}
                    </div>

                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-600 italic">
                      "{item.review}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}