"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { MapPin, Mail, Phone, MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "@/types/index";
import { ContactForm } from "@/components/contact/ContactForm";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/* Lazy-loaded Google Maps iframe                                      */
/* ------------------------------------------------------------------ */

const MAPS_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2882.5!2d-79.4!3d43.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s205+Placer+Ct+unit+325%2C+North+York+ON!5e0!3m2!1sen!2sca!4v1";

function LazyMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(false);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) setVisible(true);
    },
    [],
  );

  /* Observe viewport entry to lazy-mount the iframe */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  /* On unmount: blank the iframe src BEFORE React removes the DOM node.
     This releases Google Maps' heavy JS runtime synchronously so the
     browser doesn't block the main thread tearing it down during
     the navigation transition. */
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-border/60 h-[350px] lg:h-full lg:min-h-[400px]"
      style={{ contain: "strict" }}
    >
      {visible ? (
        <iframe
          ref={iframeRef}
          title="Ithaca Family Academy Location"
          src={MAPS_EMBED_SRC}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-border/10 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-foreground/20" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ContactUsPage() {
  const t = useTranslations("contact");
  const heroRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroFade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  const CONTACT_CHANNELS = [
    {
      icon: MapPin,
      label: t("page.channels.address"),
      value: CONTACT_INFO.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`,
      external: true,
      mono: false,
    },
    {
      icon: Mail,
      label: t("page.channels.email"),
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      external: false,
      mono: false,
    },
    {
      icon: Phone,
      label: t("page.channels.phone"),
      value: CONTACT_INFO.phone,
      href: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, "")}`,
      external: false,
      mono: true,
    },
    {
      icon: MessageCircle,
      label: t("page.channels.wechat"),
      value: CONTACT_INFO.wechat,
      href: undefined,
      external: false,
      mono: true,
    },
  ] as const;

  return (
    <div className="bg-background min-h-screen">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative pt-28 pb-12 md:pt-32 md:pb-14 px-6 overflow-hidden"
      >
        {/* Layered ambient gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute -top-32 -right-24 w-[600px] h-[500px] rounded-full blur-[140px] bg-accent/12" />
          <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full blur-[120px] bg-accent/6" />
          <div className="absolute -bottom-20 right-1/3 w-[350px] h-[300px] rounded-full blur-[100px] bg-accent/8" />
        </div>

        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          style={reduce ? undefined : { opacity: heroFade, y: heroY }}
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {t("page.title")}
          </motion.h1>
          <motion.p
            className="text-base md:text-lg text-foreground/60 max-w-xl mx-auto"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {t("page.description")}
          </motion.p>
        </motion.div>
      </section>

      {/* ── Contact Info Cards ─────────────────────────────────────── */}
      <section className="px-6 pb-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CONTACT_CHANNELS.map((ch, i) => {
            const content = (
              <div className="group border border-border/60 rounded-xl p-4 h-full hover:border-accent/40 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <ch.icon className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">
                    {ch.label}
                  </p>
                </div>
                <p
                  className={`text-foreground/80 text-sm leading-snug group-hover:text-foreground transition-colors ${ch.mono ? "font-mono" : ""}`}
                >
                  {ch.value}
                </p>
              </div>
            );

            return (
              <motion.div
                key={ch.label}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {ch.href ? (
                  <a
                    href={ch.href}
                    target={ch.external ? "_blank" : undefined}
                    rel={
                      ch.external ? "noopener noreferrer" : undefined
                    }
                    className="block h-full"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Form + Map ─────────────────────────────────────────────── */}
      <section className="px-6 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
          {/* Contact Form */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">
              {t("page.sendMessage")}
            </h2>
            <ContactForm />
          </motion.div>

          {/* Google Maps */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">
              {t("page.findUs")}
            </h2>
            <LazyMap />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
