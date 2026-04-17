"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";

export function FeaturedSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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
      className="bg-background-secondary py-20 md:py-28"
      aria-label="Featured: Meet Dr. Reza Moridi"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Video player */}
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-black shadow-xl"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <div className="relative aspect-video">
              {/* Thumbnail overlay */}
              {!isPlaying && (
                <Image
                  src="/media/images/thumbnail-dr-moridi.png"
                  alt="Dr. Reza Moridi interview thumbnail"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
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
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-colors duration-300 hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {!isPlaying && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-foreground-dark transition-transform duration-300 hover:scale-110">
                    <Play className="h-7 w-7 translate-x-0.5" />
                  </div>
                )}
              </button>

              {/* Mute toggle */}
              {isPlaying && (
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="absolute right-4 bottom-4 z-20 rounded-full bg-black/50 p-2 text-white transition-colors duration-300 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-accent uppercase">
              Featured
            </p>
            <h2 className="mb-6 text-3xl font-bold text-foreground-dark md:text-4xl">
              Meet with Dr. Reza Moridi
            </h2>
            <p className="mb-4 text-base leading-relaxed text-gray-600">
              Our students had the unique opportunity to sit down with Dr. Reza
              Moridi, former Ontario Minister of Research, Innovation and
              Science, for an exclusive interview on the future of AI and its
              impact on the next generation.
            </p>
            <p className="text-base leading-relaxed text-gray-600">
              Dr. Moridi shared his vision for how young people can prepare for
              an AI-driven world, the importance of ethical technology
              development, and why programs like Ithaca are essential for
              building future-ready leaders.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
