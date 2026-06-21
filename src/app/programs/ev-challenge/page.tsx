"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import WorkshopToRolesTransition from "@/components/programs/ev-challenge/WorkshopToRolesTransition";

const EVModel3DSection = dynamic(
  () => import("@/components/programs/ev-challenge/EVModel3D"),
  {
    ssr: false,
    loading: () => (
      <section className="min-h-[100dvh] bg-background border-t border-border" aria-hidden />
    ),
  },
);

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const STATS = [
  { label: "Season", value: "03" },
  { label: "Grades", value: "8 - 11" },
  { label: "Duration", value: "9 mo" },
  { label: "Cadence", value: "Bi-weekly Sat" },
  { label: "Window", value: "Sep 2026 - May 2027" },
] as const;

const PROGRAM_DETAILS = [
  { label: "Target", value: "Grades 8 - 11, Greater Toronto Area" },
  { label: "Duration", value: "September 2026 - May 2027 (9 months)" },
  { label: "Schedule", value: "Bi-weekly Saturdays" },
  { label: "Morning", value: "10:00 AM - 12:00 PM" },
  { label: "Afternoon", value: "1:00 PM - 3:00 PM" },
  { label: "Season", value: "Season 3 (2026 - 2027)" },
] as const;


const STUDENT_GAINS = [
  {
    title: "Real engineering project experience",
    description:
      "Design thinking, hands-on fabrication, and cross-discipline collaboration on a vehicle that actually races.",
  },
  {
    title: "Business and leadership capabilities",
    description:
      "Fundraising, sponsorship acquisition, resource management, and the experience of building a team from scratch.",
  },
  {
    title: "Competitive university applications",
    description:
      "A distinctive portfolio piece for top engineering and business programs across North America.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Who can join the EV team?",
    answer:
      "Students in Grades 8 through 11 in the Greater Toronto Area. We welcome anyone interested in engineering, automotive technology, or team-based projects. No prior experience is required.",
  },
  {
    question: "Do I need engineering experience?",
    answer:
      "No. The program teaches everything from the ground up. Roles span engineering design, assembly, test driving, and team operations. Every team member contributes regardless of technical background.",
  },
  {
    question: "What is the Waterloo EV Challenge?",
    answer:
      "An electric vehicle endurance race organized by the University of Waterloo Faculty of Engineering. High school teams design, build, and race their own EVs. The 2027 competition is scheduled for late May.",
  },
  {
    question: "What does the schedule look like?",
    answer:
      "Sessions run bi-weekly on Saturdays from September 2026 through May 2027. Morning session covers 10:00 AM to 12:00 PM, afternoon session runs 1:00 PM to 3:00 PM.",
  },
  {
    question: "What will my child take away?",
    answer:
      "Beyond the EV itself, students gain project management skills, technical documentation experience, presentation abilities, and real sponsorship negotiation practice. These are portfolio-ready experiences for university applications.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function AccordionItem({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="w-full flex items-center justify-between py-5 text-left group"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground pr-4 group-hover:text-accent transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-foreground/40 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-sm text-foreground/60 leading-relaxed max-w-[60ch]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function EVChallengePage() {
  const shouldReduceMotion = useReducedMotion();

  /* Hero scroll-linked parallax */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], [0, 50]);
  const heroContentOpacity = useTransform(heroProgress, [0.2, 0.65], [1, 0]);
  const heroContentY = useTransform(heroProgress, [0.2, 0.65], [0, 40]);

  return (
    <div className="bg-background min-h-screen">
      {/* ── 1. Hero: Full-bleed race photo with overlay ── */}
      <section ref={heroRef} className="relative min-h-[85dvh] flex items-end overflow-hidden">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={shouldReduceMotion ? undefined : { y: heroImageY }}
        >
          <Image
            src="/media/images/programs/ev-challenge/EV26-1.JPG"
            alt="Ithaca EV team racing at the Waterloo EV Challenge"
            fill
            className="object-cover scale-[1.15] origin-center"
            priority
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <motion.div
          className="relative z-10 w-full px-6 md:px-12 lg:px-[8vw] pb-0"
          style={shouldReduceMotion ? undefined : { opacity: heroContentOpacity, y: heroContentY }}
        >
          <div className="max-w-[540px] mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.05] mb-4">
              Build. Race. Lead.
            </h1>
            <p className="text-foreground/70 leading-relaxed max-w-[38ch] mb-6">
              Design and build a real electric vehicle. Run a team. Compete at
              the Waterloo EV Challenge.
            </p>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-6 py-3 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
            >
              Register Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="border-t border-foreground/15 py-3 flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="text-[10px] text-foreground/35 uppercase tracking-wider">
                  {s.label}
                </span>
                <span className="font-mono text-xs text-foreground/70">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 2. Mission Statement ── */}
      <section className="ev-ambient-a border-t border-border py-16 md:py-24 lg:max-h-[calc(100dvh_-_var(--nav-h))] lg:overflow-y-auto">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <motion.h2
                initial={shouldReduceMotion ? false : { opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter leading-[1.1] mb-6"
              >
                We don&apos;t just build a car.
              </motion.h2>
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-base md:text-lg text-foreground/60 leading-relaxed max-w-[48ch] mb-8"
              >
                We build an EV, run a team, and race at competition. Through
                engineering and business training, we prepare the next
                generation of builders, operators, and leaders.
              </motion.p>
              <motion.blockquote
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="border-l-2 border-accent/30 pl-4"
              >
                <p className="text-foreground/40 italic text-sm leading-relaxed max-w-[40ch]">
                  &quot;When you set out for Ithaca, hope the voyage is long,
                  full of adventure, full of discovery.&quot;
                </p>
                <cite className="text-foreground/25 text-xs mt-2 block not-italic">
                  - Cavafy
                </cite>
              </motion.blockquote>
            </div>
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[300px] lg:h-[400px] rounded-sm overflow-hidden"
            >
              <Image
                src="/media/images/programs/ev-challenge/EV25-12.jpg"
                alt="Students assembling radiator and fan components together"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. The Machine + Two Tracks (scroll-driven combined section) ── */}
      <EVModel3DSection />

      {/* ── 4. Workshop to Track -> Team Roles (scroll-driven transition) ── */}
      <WorkshopToRolesTransition />

      {/* ── 6. Program Details: Vertical list + image ── */}
      <section className="ev-ambient-b border-t border-border py-24 md:py-32">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16 lg:gap-24 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-12">
                Program Details
              </h2>
              <div className="space-y-6">
                {PROGRAM_DETAILS.map((d) => (
                  <div key={d.label}>
                    <span className="text-[10px] text-foreground/35 uppercase tracking-wider block mb-1">
                      {d.label}
                    </span>
                    <span className="text-base text-foreground/70 font-mono">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[400px] lg:h-full lg:min-h-[520px] rounded-sm overflow-hidden">
              <Image
                src="/media/images/programs/ev-challenge/EV25-10.s.png"
                alt="Students collaborating during an EV build session"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. What You Walk Away With ── */}
      <section className="border-t border-border lg:min-h-[calc(100dvh-var(--nav-h))] lg:flex lg:items-center">
        <div className="px-6 md:px-12 lg:px-[8vw] py-16 md:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center">
            {/* Left: headline + vertical list */}
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-14">
                What You Walk Away With
              </h2>
              <div className="space-y-10">
                {STUDENT_GAINS.map((gain, i) => (
                  <motion.div
                    key={gain.title}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative pl-6 border-l-2 border-accent/20 hover:border-accent/50 transition-colors"
                  >
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
                      {gain.title}
                    </h3>
                    <p className="text-sm text-foreground/55 leading-relaxed max-w-[48ch]">
                      {gain.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: single tall photo */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[360px] lg:h-[520px] rounded-sm overflow-hidden"
            >
              <Image
                src="/media/images/programs/ev-challenge/EV25-8.jpg"
                alt="Students hands-on with EV mechanical assembly in the workshop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 8. Competition: Full-bleed background ── */}
      <section className="relative min-h-[60dvh] md:min-h-[70dvh] lg:max-h-[calc(100dvh_-_var(--nav-h))] flex items-center overflow-hidden">
        <Image
          src="/media/images/programs/ev-challenge/EV26-2.JPG"
          alt="Ithaca EV driver celebrating during the race at Waterloo"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 md:bg-gradient-to-r md:from-background md:via-background/80 md:to-transparent" />
        <div className="relative z-10 px-6 md:px-12 lg:px-[8vw] py-24">
          <div className="max-w-[480px]">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              Waterloo EV Challenge 2027
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed mb-8 max-w-[44ch]">
              Organized by the University of Waterloo Faculty of Engineering,
              the EV Challenge is a high school electric vehicle endurance
              race. Teams design, build, and drive their own EVs, evaluated on
              engineering quality, vehicle performance, driving strategy, and
              team collaboration.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Engineering", "Teamwork", "Endurance Racing"].map((cat) => (
                <span
                  key={cat}
                  className="text-xs border border-accent/30 text-accent px-3 py-1.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-foreground/30 text-xs mb-6 font-mono">
              Late May 2027 / University of Waterloo
            </p>
            <a
              href="https://uwaterloo.ca/electric-vehicle-challenge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors font-medium text-xs"
            >
              Official competition page
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── 8. Past Seasons ── */}
      <section className="ev-ambient-c border-t border-border py-24 md:py-40">
        {/* Heading - normal content padding */}
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter leading-[1.05] mb-3">
            Past Seasons
          </h2>
          <p className="text-sm text-foreground/40 mb-14 md:mb-20 max-w-[50ch]">
            From first welds to race day at Waterloo.
          </p>
        </div>

        {/* Featured video */}
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="relative rounded-sm overflow-hidden bg-card-bg border border-border hover:border-accent/15 transition-colors"
              style={{ paddingTop: "56.25%" }}
            >
              <iframe
                src="https://player.vimeo.com/video/1202133392?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                title="EV 2026 Season Highlights"
              />
            </div>
          </motion.div>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-px w-10 bg-accent/50" />
            <span className="font-mono text-[11px] text-accent/70 tracking-wider">
              Season 2
            </span>
            <span className="text-[11px] text-foreground/30">
              2025-26 Highlights
            </span>
          </div>
        </div>

        {/* Secondary videos - two organized groups with asymmetric offset */}
        <div className="px-6 md:px-12 lg:px-[8vw] mt-12 md:mt-20 space-y-3 lg:space-y-4">
          {/* Season 1 highlights - landscape, left-aligned, constrained width */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.7,
              delay: 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="lg:max-w-[62%]"
          >
            <div
              className="relative rounded-sm overflow-hidden bg-card-bg border border-border hover:border-accent/15 transition-colors"
              style={{ paddingTop: "56.25%" }}
            >
              <iframe
                src="https://player.vimeo.com/video/1202133393?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                title="EV 2025 Season Highlights"
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="h-px w-6 bg-foreground/15" />
              <span className="font-mono text-[10px] text-foreground/30 tracking-wider">
                Season 1
              </span>
            </div>
          </motion.div>

          {/* Portrait clips - tight trio, right-aligned, constrained width */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-3 lg:max-w-[52%] lg:ml-auto">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div
                className="relative rounded-sm overflow-hidden bg-card-bg border border-border hover:border-accent/15 transition-colors"
                style={{ paddingTop: "177.78%" }}
              >
                <iframe
                  src="https://player.vimeo.com/video/1202133768?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Students welding the EV chassis"
                />
              </div>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div
                className="relative rounded-sm overflow-hidden bg-card-bg border border-border hover:border-accent/15 transition-colors"
                style={{ paddingTop: "177.78%" }}
              >
                <iframe
                  src="https://player.vimeo.com/video/1202133767?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Ithaca EV team at Waterloo competition"
                />
              </div>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div
                className="relative rounded-sm overflow-hidden bg-card-bg border border-border hover:border-accent/15 transition-colors"
                style={{ paddingTop: "177.78%" }}
              >
                <iframe
                  src="https://player.vimeo.com/video/1202133769?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Workshop highlights from the EV build"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 9. FAQ + CTA: Combined closer ── */}
      <section className="ev-ambient-close border-t border-border py-12 md:py-16 lg:max-h-[calc(100dvh_-_var(--nav-h))] lg:overflow-y-auto">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16">
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                  Ready to Build Something Real?
                </h2>
                <p className="text-sm text-foreground/60 max-w-[34ch] mb-6">
                  Join the Ithaca EV Team and be part of a team that designs,
                  builds, and races an electric vehicle.
                </p>
                <Link
                  href="/contact-us"
                  className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-6 py-3 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative h-[200px] rounded-sm overflow-hidden mt-8 hidden lg:block">
                <Image
                  src="/media/images/programs/ev-challenge/EV26-5.JPG"
                  alt="Full Ithaca EV team at the Waterloo competition"
                  fill
                  className="object-cover"
                  sizes="35vw"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">FAQ</h3>
              <p className="text-foreground/40 text-xs mb-5">
                Have more questions?{" "}
                <Link
                  href="/contact-us"
                  className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
                >
                  Get in touch
                </Link>
                .
              </p>
              <div>
                {FAQ_ITEMS.map((faq) => (
                  <AccordionItem key={faq.question} title={faq.question}>
                    <p>{faq.answer}</p>
                  </AccordionItem>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
