"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Contact data                                                      */
/* ------------------------------------------------------------------ */

interface ContactItem {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

const CONTACT_ITEMS: readonly ContactItem[] = [
  {
    icon: MapPin,
    label: "Address",
    value: "Waterloo, Ontario, Canada",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (519) 998-9368",
    href: "tel:+15199989368",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@ithacateens.com",
    href: "mailto:info@ithacateens.com",
  },
] as const;

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
      className="group inline-flex h-12 items-center gap-2 bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-colors duration-200 hover:bg-accent-hover active:scale-[0.97] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/*  ContactSection - full-bleed CTA with magnetic button              */
/* ------------------------------------------------------------------ */

export function ContactSection() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-[#111318] py-12 md:py-16" aria-label="Contact Us">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-16">
          {/* Left - headline + subtext */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          >
            <h2 className="text-2xl font-bold text-white md:text-4xl lg:text-5xl">
              Get In Touch
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
              Ready to set your child on the road to discovery? Contact us to
              learn more about our programs and enrollment.
            </p>
          </motion.div>

          {/* Right - contact info with 1px separators + CTA */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 20,
              delay: 0.1,
            }}
          >
            <ul className="divide-y divide-white/[0.06]">
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                const inner = (
                  <li key={item.label} className="flex items-center gap-4 py-4">
                    <Icon className="h-4 w-4 shrink-0 text-accent/60" />
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] tracking-[0.15em] text-white/30 uppercase">
                        {item.label}
                      </p>
                      <p className="text-sm text-white">{item.value}</p>
                    </div>
                  </li>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {inner}
                    </a>
                  );
                }

                return <div key={item.label}>{inner}</div>;
              })}
            </ul>

            <div className="mt-8">
              <MagneticButton href="/contact-us">
                Get in touch
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
