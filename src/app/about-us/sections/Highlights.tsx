"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const HIGHLIGHT_VIDEOS = [
  {
    src: "https://player.vimeo.com/video/1117749184?badge=0&byline=0&h=c1bb956d04&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1",
    title: "Ithaca EV team visits Honda production line",
    caption:
      "Students visited Honda's production line to learn about AI in car manufacturing.",
  },
  {
    src: "https://player.vimeo.com/video/1118090619?badge=0&byline=0&h=b985930d23&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1",
    title: "EV program hands-on workshop experience",
    caption: "Hands-on experience in the EV workshop.",
  },
  {
    src: "https://player.vimeo.com/video/1118510980?badge=0&byline=0&h=86cf6488c8&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1",
    title: "Student interview with Dr. Peter Teertstra",
    caption:
      "Interview with Dr. Teertstra, Faculty of Engineering, University of Waterloo.",
  },
] as const;

const COMMUNITY_IMAGES = [
  "/media/images/highlights/screenshot-2025-09-15.png",
  "/media/images/highlights/screenshot-2025-09-16.png",
  "/media/images/highlights/wechat-img-187.jpg",
  "/media/images/highlights/wechat-img-189.jpg",
  "/media/images/highlights/wechat-img-197.jpg",
] as const;

export function Highlights() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const scrollLeft = container.scrollLeft;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < children.length; i++) {
      const dist = Math.abs(children[i].offsetLeft - scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const children = container.children;
    if (index < 0 || index >= children.length) return;
    const child = children[index] as HTMLElement;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  }, []);

  return (
    <section
      className="bg-[#111318] py-12 lg:py-16"
      aria-labelledby="highlights-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <motion.h2
          id="highlights-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Student Highlights
        </motion.h2>

        {/* Featured spotlight: Andy Song - prominent display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-5 lg:gap-8 items-end mt-8"
        >
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0c0e12]">
            <iframe
              className="w-full h-full absolute inset-0"
              src="https://player.vimeo.com/video/1118098299?badge=0&byline=0&h=7bcd85eebf&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              title="Andy Song interviewing Scotiabank executives"
            />
          </div>
          <div className="pb-1">
            <p className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight">
              Andy Song
            </p>
            <p className="text-sm font-medium text-[#ccdef0] mt-1.5">
              AI Pioneers Interview Project
            </p>
            <div className="w-8 h-px bg-[#ccdef0]/30 my-4" />
            <p className="text-sm text-gray-400 leading-relaxed">
              Andy interviewed Mr. Carlos Orencio Horta, Director of AI at
              Scotiabank, and Mr. Tanaby Zibamanzar, Director of Data Analytics.
              Andy graduated from high school in June 2025 and began his studies
              at Princeton University in September 2025.
            </p>
          </div>
        </motion.div>

        {/* Gallery: compact vertical video strip */}
        <div className="grid grid-cols-3 gap-3 mt-8 max-w-[560px]">
          {HIGHLIGHT_VIDEOS.map((video, i) => (
            <motion.div
              key={video.src}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-[#0c0e12]">
                <iframe
                  className="w-full h-full absolute inset-0"
                  src={video.src}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={video.title}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                {video.caption}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Community gallery - horizontal scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Community Spotlight
          </h3>

          <div className="relative overflow-hidden rounded-lg">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              data-gallery-track=""
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`[data-gallery-track]::-webkit-scrollbar { display: none; }`}</style>
              {COMMUNITY_IMAGES.map((src, i) => (
                <div
                  key={src}
                  className="min-w-[260px] md:min-w-[380px] h-[320px] md:h-[480px] snap-start shrink-0 relative rounded-lg overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={`Community spotlight photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 260px, 380px"
                  />
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                scrollToIndex(
                  Math.min(COMMUNITY_IMAGES.length - 1, activeIndex + 1)
                )
              }
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 max-w-2xl">
            Dr. Peter Teertstra, Professor at the Faculty of Engineering,
            University of Waterloo, and Director of the Sedra Student Design
            Centre, leading the Ithaca students on a tour.
          </p>

          {/* Thumbnail dots */}
          <div className="flex gap-1.5 mt-3">
            {COMMUNITY_IMAGES.map((src, i) => (
              <button
                key={src}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeIndex === i
                    ? "bg-[#ccdef0]"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
