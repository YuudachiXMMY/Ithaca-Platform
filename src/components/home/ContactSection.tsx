"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { CONTACT_INFO } from "@/types";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Contact data                                                      */
/* ------------------------------------------------------------------ */

interface ContactItem {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly labelKey: string;
  readonly value: string;
  readonly href?: string;
}

const CONTACT_ITEMS: readonly ContactItem[] = [
  {
    icon: MapPin,
    labelKey: "contact.addressLabel",
    value: CONTACT_INFO.address,
  },
  {
    icon: Phone,
    labelKey: "contact.phoneLabel",
    value: CONTACT_INFO.phone,
    href: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, "")}`,
  },
  {
    icon: Mail,
    labelKey: "contact.emailLabel",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Floating particle positions                                       */
/* ------------------------------------------------------------------ */

const PARTICLES = [
  { x: "12%", y: "18%", size: 4, dur: 6, delay: 0 },
  { x: "86%", y: "30%", size: 3, dur: 7.5, delay: 0.8 },
  { x: "22%", y: "74%", size: 4, dur: 8, delay: 1.6 },
  { x: "74%", y: "70%", size: 3, dur: 6.5, delay: 2.4 },
  { x: "48%", y: "10%", size: 3, dur: 9, delay: 3.2 },
  { x: "90%", y: "80%", size: 4, dur: 7, delay: 1.2 },
] as const;

/* ------------------------------------------------------------------ */
/*  OrbitalField - perpetual non-transition animation                 */
/*  Three concentric rings rotating at different speeds/directions,   */
/*  a breathing ambient glow, and scattered floating particles.       */
/* ------------------------------------------------------------------ */

function OrbitalField() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Breathing ambient glow at center */}
      <motion.div
        animate={{ opacity: [0.04, 0.12, 0.04] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-40 w-40 rounded-full bg-accent blur-[100px] md:h-56 md:w-56"
      />

      {/* Outer ring - slowest, clockwise */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute h-[18rem] w-[18rem] rounded-full border border-accent/[0.06] md:h-[26rem] md:w-[26rem]"
        style={{ willChange: "transform" }}
      >
        <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent/20" />
        <div className="absolute -right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent/10" />
      </motion.div>

      {/* Middle ring - counter-clockwise */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        className="absolute h-[12rem] w-[12rem] rounded-full border border-accent/[0.04] md:h-[17rem] md:w-[17rem]"
        style={{ willChange: "transform" }}
      >
        <div className="absolute left-1/2 -top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent/25" />
      </motion.div>

      {/* Inner ring - fastest, clockwise */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className="absolute h-[7rem] w-[7rem] rounded-full border border-accent/[0.08] md:h-[10rem] md:w-[10rem]"
        style={{ willChange: "transform" }}
      >
        <div className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent/30" />
        <div className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent/15" />
      </motion.div>

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -8, 0, 6, 0],
            opacity: [0.12, 0.28, 0.12, 0.2, 0.12],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          className="absolute rounded-full bg-accent/20"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MagneticButton - spring-physics hover pull                        */
/* ------------------------------------------------------------------ */

function MagneticButton({
  href,
  children,
}: {
  readonly href: string;
  readonly children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 12 });
  const springY = useSpring(y, { stiffness: 150, damping: 12 });

  function handleMouseMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.25);
    y.set((e.clientY - centerY) * 0.25);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      style={reduce ? undefined : { x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group/cta inline-flex h-12 items-center gap-2 bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-colors duration-200 hover:bg-accent-hover active:scale-[0.97] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/*  ContactSection                                                    */
/*  Centered, symmetric layout (VARIANCE=1) with generous spacing     */
/*  (DENSITY=3) and perpetual orbital animation (MOTION=10).          */
/*  Uses lg:min-h to share viewport with Footer as one screen.        */
/* ------------------------------------------------------------------ */

export function ContactSection() {
  const reduce = useReducedMotion();
  const t = useTranslations("home");

  return (
    <section
      className="relative flex items-center justify-center bg-[#111318] px-5 py-16 sm:px-8 lg:min-h-[calc(100dvh-25.5rem)] lg:pt-[4.5rem] lg:pb-0"
      aria-label="Contact Us"
    >
      <OrbitalField />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Heading */}
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="text-3xl font-bold text-white md:text-5xl"
        >
          {t("contact.heading")}
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            delay: 0.08,
          }}
          className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50"
        >
          {t("contact.subtext")}
        </motion.p>

        {/* Contact details - centered horizontal row */}
        <motion.ul
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            delay: 0.16,
          }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6"
        >
          {CONTACT_ITEMS.map((item) => {
            const Icon = item.icon;
            const content = (
              <span className="flex items-center gap-2 text-sm text-white/50 transition-colors duration-200">
                <Icon className="h-3.5 w-3.5 shrink-0 text-accent/50" />
                {item.value}
              </span>
            );

            return (
              <li key={item.labelKey}>
                {item.href ? (
                  <a
                    href={item.href}
                    className="[&_span]:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </motion.ul>

        {/* CTA */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            delay: 0.24,
          }}
          className="mt-8"
        >
          <MagneticButton href="/contact-us">{t("contact.cta")}</MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
