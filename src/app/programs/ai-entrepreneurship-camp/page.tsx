"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { getBlurDataURL } from "@/lib/blur-data";

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="w-full flex items-center justify-between py-6 text-left group"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-foreground pr-4 group-hover:text-accent transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-foreground/40 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-foreground/60 leading-relaxed max-w-[65ch]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function AIEntrepreneurshipCampPage() {
  const t = useTranslations("programs.aiCamp");

  const PROGRAM_DETAIL_KEYS = [
    "target",
    "length",
    "teamSize",
    "schedule",
    "classHours",
    "pitchDay",
  ] as const;

  const COMPETITION_MODULE_KEYS = ["0", "1", "2"] as const;

  const GOAL_KEYS = ["competitive", "portfolio", "mentors", "exposure"] as const;

  const FAQ_KEYS = [
    "whatIsIthaca",
    "services",
    "whoCanParticipate",
    "onlyCoders",
    "takeaway",
    "when",
  ] as const;

  return (
    <div className="bg-background min-h-screen">
      {/* ── 1. Hero: Asymmetric Split ── */}
      <section className="min-h-[85dvh] grid grid-cols-1 lg:grid-cols-2 items-center gap-0">
        <div className="px-6 md:px-12 lg:pl-[8vw] lg:pr-12 py-24 lg:py-0 order-2 lg:order-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.05] mb-6">
            {t("hero.title")}
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed max-w-[44ch] mb-10">
            {t("hero.subtitle")}<br /><br />
            {t("hero.startDate")}
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            {t("hero.registerNow")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Desktop: 3-photo mosaic */}
        <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 h-full p-2 order-2">
          <div className="relative row-span-2 rounded-xl overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg"
              alt="Students collaborating on AI projects"
              fill
              className="object-cover"
              priority
              sizes="25vw"
            placeholder="blur"
            blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg")}
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_70.jpg"
              alt="Student presenting their startup pitch"
              fill
              className="object-cover"
              priority
              sizes="25vw"
            placeholder="blur"
            blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_70.jpg")}
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-179.jpg"
              alt="Workshop session in progress"
              fill
              className="object-cover"
              sizes="25vw"
            placeholder="blur"
            blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-179.jpg")}
            />
          </div>
        </div>

        {/* Mobile: single hero image */}
        <div className="relative h-[40vh] lg:hidden order-1">
          <Image
            src="/media/images/programs/ai-camp/ai-camp-hero.png"
            alt="AI Entrepreneurship Camp"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          placeholder="blur"
          blurDataURL={getBlurDataURL("/media/images/programs/ai-camp/ai-camp-hero.png")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      </section>

      {/* ── 2. Overview: Offset Editorial + Photo Grid ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:pl-[12vw] lg:pr-[8vw] mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
            {t("overview.title")}
          </h2>
          <div className="space-y-5 text-foreground/60 leading-relaxed max-w-[58ch]">
            <p>{t("overview.p1")}</p>
            <p>{t("overview.p2")}</p>
            <p>{t("overview.p3")}</p>
          </div>
        </div>

        {/* Asymmetric 4-photo grid */}
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="relative h-[180px] md:h-[280px] md:col-span-2 rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_05.jpg"
                alt="Students working on prototypes"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 66vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_05.jpg")}
              />
            </div>
            <div className="relative h-[180px] md:h-[280px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AIEC2026/AIEC2026-clossette_2s.png"
                alt="Team brainstorming session"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AIEC2026/AIEC2026-clossette_2s.png")}
              />
            </div>
            <div className="relative h-[180px] md:h-[280px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_65.jpg"
                alt="Mentor coaching students"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_65.jpg")}
              />
            </div>
            <div className="relative h-[180px] md:h-[280px] md:col-span-2 rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_79.jpg"
                alt="Student demo day presentation"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 66vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_79.jpg")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Program Details: Photo Left + Detail Grid Right ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-14">
            <div className="relative h-[300px] lg:h-auto rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_12.jpg"
                alt="Students in an AI workshop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_12.jpg")}
              />
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10">
                {t("structure.title")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                {PROGRAM_DETAIL_KEYS.map((key) => (
                  <div key={key}>
                    <span className="text-sm font-medium text-accent uppercase tracking-wide block mb-1.5">
                      {t(`structure.details.${key}.label`)}
                    </span>
                    <span className="text-foreground/70 leading-relaxed block">
                      {t(`structure.details.${key}.value`)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-l-2 border-accent/30 pl-6">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {t("structure.fieldTrips.title")}
                </h3>
                <p className="text-foreground/60 leading-relaxed max-w-[55ch]">
                  {t("structure.fieldTrips.description", {
                    fidelity: t("structure.fieldTrips.fidelity"),
                    vanguard: t("structure.fieldTrips.vanguard"),
                    russell: t("structure.fieldTrips.russell"),
                    rbc: t("structure.fieldTrips.rbc"),
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Contest Alignment: Constrained Text + Photo Pair ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="lg:max-w-[60%] mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              {t("contest.title")}
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-6">
              {t("contest.intro")}{" "}
              <a
                href="https://aiec-youth.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors font-medium"
              >
                {t("contest.linkText")}
              </a>
            </p>
            <p className="text-foreground/60 leading-relaxed mb-6">
              {t("contest.optional")}
            </p>
            <ol className="space-y-3 mb-8">
              {COMPETITION_MODULE_KEYS.map((key, i) => (
                <li
                  key={key}
                  className="flex items-start gap-3 text-foreground/60"
                >
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{t(`contest.modules.${key}`)}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
            >
              {t("contest.learnMore")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative h-[220px] md:h-[300px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_50.jpg"
                alt="Students preparing competition materials"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_50.jpg")}
              />
            </div>
            <div className="relative h-[220px] md:h-[300px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-164.jpg"
                alt="Team working on pitch deck"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-164.jpg")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Goals & Outcomes: Accordion + Photo ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10">
                {t("goals.title")}
              </h2>
              <div>
                {GOAL_KEYS.map((key) => (
                  <AccordionItem key={key} title={t(`goals.items.${key}.title`)}>
                    <p>{t(`goals.items.${key}.description`)}</p>
                  </AccordionItem>
                ))}
              </div>
              <p className="text-foreground/40 mt-8 text-sm leading-relaxed max-w-[50ch]">
                {t("goals.footer")}
              </p>
            </div>

            <div className="relative h-[300px] lg:h-auto rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_89.jpg"
                alt="Students presenting their final projects"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_89.jpg")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Team & Support: Panoramic Photo + 2-Col Text ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
            {t("team.title")}
          </h2>

          <div className="relative h-[260px] md:h-[400px] rounded-xl overflow-hidden mb-12">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_93s.jpg"
              alt="Ithaca teaching team with students"
              fill
              className="object-cover"
              sizes="100vw"
            placeholder="blur"
            blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_93s.jpg")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {t("team.educators.title")}
              </h3>
              <p className="text-foreground/60 leading-relaxed max-w-[50ch]">
                {t("team.educators.description")}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {t("team.mentors.title")}
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                {t("team.mentors.description")}
              </p>
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-2 border border-accent/30 text-accent font-medium px-6 py-3 rounded-full hover:bg-accent/5 transition-colors text-sm active:scale-[0.98]"
              >
                {t("team.mentors.cta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FAQ: Centered Accordion ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            {t("faq.title")}
          </h2>
          <p className="text-foreground/40 mb-12">
            {" "}
            <a
              href="/contact-us"
              className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              {t("faq.contactLink")}
            </a>{" "}
            {t("faq.contactPrompt")}
          </p>
          <div>
            {FAQ_KEYS.map((key) => (
              <AccordionItem key={key} title={t(`faq.items.${key}.question`)}>
                <p>{t(`faq.items.${key}.answer`)}</p>
              </AccordionItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA: Image Background ── */}
      <section className="relative py-24 md:py-32">
        <Image
          src="/media/images/programs/ai-entrepreneurship/AI-Entrep_70.jpg"
          alt="AI Entrepreneurship Camp community"
          fill
          className="object-cover"
          sizes="100vw"
        placeholder="blur"
        blurDataURL={getBlurDataURL("/media/images/programs/ai-entrepreneurship/AI-Entrep_70.jpg")}
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto mb-10">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
            >
              {t("cta.registerNow")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 text-foreground/70 hover:text-accent transition-colors font-medium text-sm"
            >
              {t("cta.requestBrochure")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
