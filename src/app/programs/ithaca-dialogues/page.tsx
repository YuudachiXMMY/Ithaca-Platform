import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("programs.eliteInterview.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default async function EliteInterviewPage() {
  const t = await getTranslations("programs.eliteInterview");

  const TRACK_KEYS = ["talent", "capital", "policy", "industry", "education"] as const;
  const TRACK_IDS = ["01", "02", "03", "04", "05"] as const;

  const SECTOR_KEYS = ["academia", "industry", "policy"] as const;

  const PHASE_KEYS = ["research", "fieldwork", "production"] as const;
  const TASK_KEYS = ["0", "1", "2"] as const;

  const REPORT_TAGS = ["0", "1", "2"] as const;
  const DOC_TAGS = ["0", "1", "2"] as const;

  const HERO_PILL_KEYS = ["fall", "grades", "cohort", "duration"] as const;

  const FAQ_KEYS = [
    "whatIsProgram",
    "experience",
    "takeaway",
    "contacts",
    "language",
  ] as const;

  return (
    <div className="bg-background min-h-screen">
      {/* ── 1. Hero: Extreme Asymmetric Split (5:7) ── */}
      <section className="min-h-[85dvh] grid grid-cols-1 lg:grid-cols-[5fr_7fr] items-center gap-0">
        <div className="px-6 md:px-12 lg:pl-[12vw] lg:pr-12 py-24 lg:py-0 order-2 lg:order-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.05] mb-3">
            {t("hero.title")}
          </h1>
          <p className="text-xl md:text-2xl font-light text-foreground/50 tracking-tight mb-8">
            {t("hero.subtitle")}
          </p>
          <p className="text-lg text-foreground/60 leading-relaxed max-w-[44ch] mb-10">
            {t("hero.description")}
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {HERO_PILL_KEYS.map((key) => (
              <span
                key={key}
                className="text-xs font-medium text-foreground/50 border border-border px-4 py-2 rounded-full"
              >
                {t(`hero.pills.${key}`)}
              </span>
            ))}
          </div>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            {t("hero.applyNow")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Desktop image */}
        <div className="hidden lg:block relative h-full min-h-[85dvh] overflow-hidden">
          <Image
            src="/media/images/site/about-hero.jpg"
            alt="Students in professional attire discussing research topics"
            fill
            className="object-cover"
            priority
            sizes="58vw"
          />
        </div>

        {/* Mobile image */}
        <div className="relative h-[40vh] lg:hidden order-1">
          <Image
            src="/media/images/site/about-hero.jpg"
            alt="Students in professional attire discussing research topics"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      </section>

      {/* ── 2. The Question: Editorial Pull-Quote ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground/90 leading-snug tracking-tight max-w-[22ch] mb-12">
            {t("question.quote")}
          </blockquote>
          <div className="lg:pl-[20vw]">
            <p className="text-foreground/60 leading-relaxed max-w-[55ch]">
              {t("question.body")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Why Now: Staggered Stats ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="max-w-[55ch] mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              {t("whyNow.title")}
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              {t("whyNow.description")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-card-bg rounded-xl p-8 md:p-12 lg:max-w-[70%]">
              <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter block mb-3">
                {t("whyNow.stats.gdp.value")}
              </span>
              <span className="text-sm text-foreground/40 uppercase tracking-wide">
                {t("whyNow.stats.gdp.label")}
              </span>
            </div>
            <div className="bg-card-bg rounded-xl p-8 md:p-12 lg:max-w-[50%] lg:ml-auto">
              <span className="text-4xl md:text-5xl font-bold text-foreground tracking-tighter block mb-3">
                {t("whyNow.stats.jobs.value")}
              </span>
              <span className="text-sm text-foreground/40 uppercase tracking-wide">
                {t("whyNow.stats.jobs.label")}
              </span>
            </div>
            <div className="bg-card-bg rounded-xl p-8 md:p-12 lg:max-w-[55%] lg:ml-[25%]">
              <span className="text-4xl md:text-5xl font-bold text-accent tracking-tighter block mb-3">
                {t("whyNow.stats.adoption.value")}
              </span>
              <span className="text-sm text-foreground/40 uppercase tracking-wide">
                {t("whyNow.stats.adoption.label")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Research Tracks: Numbered List + Side Image ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                {t("tracks.title")}
              </h2>
              <p className="text-foreground/60 leading-relaxed mb-12 max-w-[50ch]">
                {t("tracks.subtitle")}
              </p>
              <div>
                {TRACK_KEYS.map((key, i) => (
                  <div
                    key={key}
                    className="flex gap-6 py-6 border-b border-border last:border-b-0"
                  >
                    <span className="text-4xl md:text-5xl font-extralight text-foreground/15 leading-none shrink-0 w-16 tabular-nums">
                      {TRACK_IDS[i]}
                    </span>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1.5">
                        {t(`tracks.items.${key}.name`)}
                      </h3>
                      <p className="text-foreground/60 leading-relaxed">
                        {t(`tracks.items.${key}.question`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[300px] lg:h-auto rounded-xl overflow-hidden">
              <Image
                src="/media/images/pillars/pillar-explore.png"
                alt="Mentor guiding students through research on laptops"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Who You'll Interview ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
            {t("interviewSectors.title")}
          </h2>

          <div className="relative h-[240px] md:h-[360px] rounded-xl overflow-hidden mb-12">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg"
              alt="Students presenting research findings to an audience"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr] gap-8 md:gap-12">
            {SECTOR_KEYS.map((sKey) => (
              <div key={sKey}>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {t(`interviewSectors.sectors.${sKey}.title`)}
                </h3>
                <ul className="space-y-2">
                  {TASK_KEYS.map((rKey) => (
                    <li key={rKey} className="text-foreground/60 leading-relaxed">
                      {t(`interviewSectors.sectors.${sKey}.roles.${rKey}`)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. The Journey: Three Phases ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-12">
            {t("journey.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] gap-4">
            {PHASE_KEYS.map((pKey) => (
              <div
                key={pKey}
                className="bg-background rounded-xl p-8 md:p-10"
              >
                <span className="text-xs font-medium text-accent uppercase tracking-[0.2em] block mb-4">
                  Phase {t(`journey.phases.${pKey}.phase`)}
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t(`journey.phases.${pKey}.title`)}
                </h3>
                <p className="text-sm text-foreground/40 mb-6">
                  {t(`journey.phases.${pKey}.duration`)}
                </p>
                <ul className="space-y-2.5">
                  {TASK_KEYS.map((tKey) => (
                    <li key={tKey} className="text-foreground/60 text-sm leading-relaxed">
                      {t(`journey.phases.${pKey}.tasks.${tKey}`)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. What You'll Produce ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-12">
            {t("produce.title")}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            {/* Research Report */}
            <div className="bg-card-bg rounded-xl p-8 md:p-12">
              <span className="text-xs font-medium text-accent uppercase tracking-[0.2em] block mb-4">
                {t("produce.report.badge")}
              </span>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {t("produce.report.title")}
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                {t("produce.report.description")}
              </p>
              <div className="flex flex-wrap gap-3">
                {REPORT_TAGS.map((key) => (
                  <span
                    key={key}
                    className="text-xs text-foreground/40 border border-border/50 px-3 py-1.5 rounded-full"
                  >
                    {t(`produce.report.tags.${key}`)}
                  </span>
                ))}
              </div>
            </div>

            {/* Documentary */}
            <div className="bg-card-bg rounded-xl p-8 md:p-12 flex flex-col">
              <span className="text-xs font-medium text-accent uppercase tracking-[0.2em] block mb-4">
                {t("produce.documentary.badge")}
              </span>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {t("produce.documentary.title")}
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                {t("produce.documentary.description")}
              </p>
              <div className="flex flex-wrap gap-3 mt-auto">
                {DOC_TAGS.map((key) => (
                  <span
                    key={key}
                    className="text-xs text-foreground/40 border border-border/50 px-3 py-1.5 rounded-full"
                  >
                    {t(`produce.documentary.tags.${key}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 border-l-2 border-accent/30 pl-6 max-w-[60ch]">
            <p className="text-foreground/40 text-sm leading-relaxed">
              {t("produce.disclaimer")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. FAQ: Native Details/Summary ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            {t("faq.title")}
          </h2>
          <p className="text-foreground/40 mb-12">
            Reach us at{" "}
            <a
              href={`mailto:${t("faq.contactEmail")}`}
              className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              {t("faq.contactEmail")}
            </a>{" "}
            if you need more information.
          </p>
          <div>
            {FAQ_KEYS.map((key) => (
              <details
                key={key}
                className="group border-b border-border"
              >
                <summary className="flex items-center justify-between py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-lg font-medium text-foreground pr-4 group-hover:text-accent transition-colors">
                    {t(`faq.items.${key}.question`)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-foreground/40 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="pb-6 text-foreground/60 leading-relaxed max-w-[65ch]">
                  {t(`faq.items.${key}.answer`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA ── */}
      <section className="relative py-24 md:py-32">
        <Image
          src="/media/images/programs/ai-camp/ai-camp-HB8A5465.jpg"
          alt="Student delivering a professional presentation"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto mb-10">
            {t("cta.subtitle")}
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            {t("cta.applyNow")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
