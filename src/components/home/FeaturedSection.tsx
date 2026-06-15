"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  FeaturedSection - full-width cinematic video                      */
/* ------------------------------------------------------------------ */

export function FeaturedSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const reduce = useReducedMotion();

  function handlePlayPause() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function handleMuteToggle() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  }

  function handleVideoEnd() {
    setIsPlaying(false);
  }

  return (
    <section
      className="bg-[#111318] py-12 md:py-16"
      aria-label="Featured: Meet Dr. Reza Moridi"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
        {/* Full-width cinematic video player */}
        <motion.div
          className="relative overflow-hidden bg-black"
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          <div className="relative aspect-[21/9]">
            {/* Thumbnail overlay */}
            {!isPlaying && (
              <Image
                src="/media/images/thumbnail-dr-moridi.png"
                alt="Dr. Reza Moridi interview thumbnail"
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            )}

            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              preload="metadata"
              playsInline
              muted={isMuted}
              onEnded={handleVideoEnd}
              aria-label="Interview with Dr. Reza Moridi"
            >
              <source
                src="/media/videos/dr-moridi-ai-talk.mp4"
                type="video/mp4"
              />
            </video>

            {/* Play/pause overlay */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="absolute inset-0 z-10 flex items-center justify-center transition-colors duration-200 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {!isPlaying && (
                <div className="flex h-16 w-16 items-center justify-center bg-white/90 text-[#111318] transition-transform duration-200 hover:scale-105">
                  <Play className="h-7 w-7 translate-x-0.5" />
                </div>
              )}
            </button>

            {/* Mute toggle */}
            {isPlaying && (
              <button
                type="button"
                onClick={handleMuteToggle}
                className="absolute bottom-4 right-4 z-20 bg-black/50 p-2.5 text-white transition-colors duration-200 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Info strip below video */}
        <motion.div
          className="mt-6 grid gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            delay: 0.15,
          }}
        >
          {/* Eyebrow + title */}
          <div className="shrink-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
              Featured
            </p>
            <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
              Meet Dr. Reza Moridi
            </h2>
          </div>

          {/* Description */}
          <div className="max-w-xl border-t border-white/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <p className="text-sm leading-relaxed text-white/55">
              Our students sat down with Dr. Reza Moridi, former Ontario
              Minister of Research, Innovation and Science, for an exclusive
              interview on the future of AI and its impact on the next
              generation. He shared his vision for how young people can prepare
              for an AI-driven world and why programs like Ithaca are essential.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
