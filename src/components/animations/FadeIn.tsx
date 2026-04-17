"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly duration?: number;
  readonly direction?: "up" | "down" | "left" | "right" | "none";
  readonly className?: string;
  readonly as?: "div" | "section" | "article" | "aside";
}

const directionOffsets = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
  none: {},
} as const;

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  className,
  as = "div",
}: FadeInProps) {
  const offset = directionOffsets[direction];
  const Component = motion.create(as);

  return (
    <Component
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </Component>
  );
}
