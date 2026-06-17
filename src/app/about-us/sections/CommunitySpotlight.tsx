"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

const IMAGES = [
  "/media/images/highlights/screenshot-2025-09-15.png",
  "/media/images/highlights/screenshot-2025-09-16.png",
  "/media/images/highlights/wechat-img-187.jpg",
  "/media/images/highlights/wechat-img-189.jpg",
  "/media/images/highlights/wechat-img-197.jpg",
] as const;

export function CommunitySpotlight() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const children = container.children;
    if (index < 0 || index >= children.length) return;
    const child = children[index] as HTMLElement;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  }, []);

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

  const goLeft = useCallback(() => {
    scrollToIndex(Math.max(0, activeIndex - 1));
  }, [activeIndex, scrollToIndex]);

  const goRight = useCallback(() => {
    scrollToIndex(Math.min(IMAGES.length - 1, activeIndex + 1));
  }, [activeIndex, scrollToIndex]);

  return (
    <section className="bg-[#111318] py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-10">
          Ithaca Community Spotlight
        </h2>

        {/* Carousel */}
        <div className="relative overflow-hidden rounded-lg">
          {/* Scroll track */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            data-carousel-track=""
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`
              [data-carousel-track]::-webkit-scrollbar { display: none; }
            `}</style>
            {IMAGES.map((src, i) => (
              <div
                key={src}
                className="min-w-[300px] md:min-w-[450px] h-[400px] md:h-[600px] snap-start shrink-0 relative rounded-lg overflow-hidden"
              >
                <Image
                  src={src}
                  alt={`Community spotlight photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 300px, 450px"
                />
              </div>
            ))}
          </div>

          {/* Left arrow */}
          <button
            onClick={goLeft}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center transition-colors"
          >
            <svg
              width="16"
              height="16"
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

          {/* Right arrow */}
          <button
            onClick={goRight}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center transition-colors"
          >
            <svg
              width="16"
              height="16"
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

        {/* Caption */}
        <p className="text-sm text-gray-400 mt-6 max-w-3xl">
          Dr. Peter Teertstra, Professor at the Faculty of Engineering,
          University of Waterloo, and Director of the Sedra Student Design
          Centre, was leading the Ithaca students on a tour of the Student
          Design Centre.
        </p>

        {/* Thumbnail strip */}
        <div className="flex gap-2 justify-start mt-4">
          {IMAGES.map((src, i) => (
            <button
              key={src}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`relative w-[60px] h-[60px] rounded-lg overflow-hidden cursor-pointer shrink-0 transition-opacity ${
                activeIndex === i
                  ? "ring-2 ring-[#ccdef0] opacity-100"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={src}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="60px"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
