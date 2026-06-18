import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export const metadata = {
  title: "Elite Interviews | Ithaca Family Academy",
  description:
    "A 10-week research and documentary program where students investigate AI and Canada's future through interviews with experts in academia, industry, and policy.",
};

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const RESEARCH_TRACKS = [
  {
    id: "01",
    name: "Talent",
    question:
      "Why does top AI talent keep flowing south? Is immigration policy a trump card or an illusion?",
  },
  {
    id: "02",
    name: "Capital",
    question:
      "World-class research, scale-up fatigue. From Element AI to Cohere.",
  },
  {
    id: "03",
    name: "Policy",
    question:
      'From $20B in sovereign compute to "AI for All" - do government milestones actually work?',
  },
  {
    id: "04",
    name: "Industry",
    question:
      "Banks, hospitals, farms still struggle to adopt AI. What is blocking real productivity gains?",
  },
  {
    id: "05",
    name: "Education",
    question:
      "Is Ontario preparing high schoolers for the AI era? You are the stakeholder on this one.",
  },
] as const;

const INTERVIEW_SECTORS = [
  {
    title: "Academia",
    roles: [
      "University professors",
      "Researchers",
      "Graduate students and postdocs",
    ],
  },
  {
    title: "Industry & Startups",
    roles: ["AI engineers", "Founders", "Major AI research labs"],
  },
  {
    title: "Policy & Public",
    roles: [
      "Policy researchers",
      "Think tank scholars",
      "Legislators' offices",
    ],
  },
] as const;

const JOURNEY_PHASES = [
  {
    phase: "01",
    title: "Research",
    duration: "Weeks 1-3",
    tasks: [
      "Background literature review",
      "Interview outline design",
      "Guest outreach and scheduling",
    ],
  },
  {
    phase: "02",
    title: "Fieldwork",
    duration: "Weeks 4-7",
    tasks: [
      "Lead and support interviewing",
      "Camera and audio operation",
      "Note-taking and role rotation",
    ],
  },
  {
    phase: "03",
    title: "Production",
    duration: "Weeks 8-10",
    tasks: [
      "Research report drafting",
      "Documentary rough-cut editing",
      "Screening and public release",
    ],
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "What is the Elite Interviews program?",
    answer:
      "A research and documentary program where students investigate a major societal question through real interviews with experts in academia, industry, and policy. Each student claims one research track and contributes to a team documentary.",
  },
  {
    question: "Do students need prior interview or filmmaking experience?",
    answer:
      "No. The research phase covers methodology, interview technique, and documentary production basics. Students learn by doing, with mentor guidance at every step.",
  },
  {
    question: "What do students take away?",
    answer:
      "Two portfolio-ready deliverables in English: a research report suitable for university applications, and an 8-12 minute documentary that is publicly released. Both demonstrate real-world research and communication skills.",
  },
  {
    question: "How are interview contacts arranged?",
    answer:
      "Our mentors provide guaranteed initial introductions to domain experts. Students also develop their own outreach skills through guided cold-contact exercises. All interviews follow consent and likeness-release protocols.",
  },
  {
    question: "Is the program conducted in English or Chinese?",
    answer:
      "All deliverables are produced in English. Interviews may be conducted in either language depending on the guest. Classroom instruction is primarily in English.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function EliteInterviewPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* ── 1. Hero: Extreme Asymmetric Split (5:7) ── */}
      <section className="min-h-[85dvh] grid grid-cols-1 lg:grid-cols-[5fr_7fr] items-center gap-0">
        <div className="px-6 md:px-12 lg:pl-[12vw] lg:pr-12 py-24 lg:py-0 order-2 lg:order-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.05] mb-3">
            Elite Interviews
          </h1>
          <p className="text-xl md:text-2xl font-light text-foreground/50 tracking-tight mb-8">
            AI and Canada&apos;s Future
          </p>
          <p className="text-lg text-foreground/60 leading-relaxed max-w-[44ch] mb-10">
            Ten weeks of fieldwork. Five research angles. One documentary.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {["Fall 2026", "G9-G12", "Small Cohort", "8-10 Weeks"].map(
              (pill) => (
                <span
                  key={pill}
                  className="text-xs font-medium text-foreground/50 border border-border px-4 py-2 rounded-full"
                >
                  {pill}
                </span>
              ),
            )}
          </div>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Desktop image - bleeds to right edge */}
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
            &ldquo;Canada pioneered deep learning. Why hasn&apos;t that
            translated into economic leadership?&rdquo;
          </blockquote>
          <div className="lg:pl-[20vw]">
            <p className="text-foreground/60 leading-relaxed max-w-[55ch]">
              Geoffrey Hinton in Toronto. Yoshua Bengio in Montreal. Deep
              learning was born here. Yet commercialization, talent, and
              productivity have steadily migrated south. This is the question
              your team will investigate, and the story your documentary will
              tell.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Why Now: Staggered Stats ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="max-w-[55ch] mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              Why Now
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              On June 4, 2026, the federal government released its national AI
              strategy &ldquo;AI for All.&rdquo; An entire semester of student
              research coincides with the nation asking the same questions.
            </p>
          </div>

          {/* Asymmetric staggered stat blocks */}
          <div className="space-y-4">
            <div className="bg-card-bg rounded-xl p-8 md:p-12 lg:max-w-[70%]">
              <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter block mb-3">
                $200B
              </span>
              <span className="text-sm text-foreground/40 uppercase tracking-wide">
                GDP Growth Target
              </span>
            </div>
            <div className="bg-card-bg rounded-xl p-8 md:p-12 lg:max-w-[50%] lg:ml-auto">
              <span className="text-4xl md:text-5xl font-bold text-foreground tracking-tighter block mb-3">
                250,000
              </span>
              <span className="text-sm text-foreground/40 uppercase tracking-wide">
                New AI-Related Positions
              </span>
            </div>
            <div className="bg-card-bg rounded-xl p-8 md:p-12 lg:max-w-[55%] lg:ml-[25%]">
              <span className="text-4xl md:text-5xl font-bold text-accent tracking-tighter block mb-3">
                12% &rarr; 60%
              </span>
              <span className="text-sm text-foreground/40 uppercase tracking-wide">
                Enterprise AI Adoption by 2034
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
                Five Research Tracks
              </h2>
              <p className="text-foreground/60 leading-relaxed mb-12 max-w-[50ch]">
                Each student claims one track and owns it for the semester.
              </p>
              <div>
                {RESEARCH_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    className="flex gap-6 py-6 border-b border-border last:border-b-0"
                  >
                    <span className="text-4xl md:text-5xl font-extralight text-foreground/15 leading-none shrink-0 w-16 tabular-nums">
                      {track.id}
                    </span>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1.5">
                        {track.name}
                      </h3>
                      <p className="text-foreground/60 leading-relaxed">
                        {track.question}
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

      {/* ── 5. Who You'll Interview: Panoramic + Asymmetric Grid ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
            Who You&apos;ll Interview
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
            {INTERVIEW_SECTORS.map((sector) => (
              <div key={sector.title}>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {sector.title}
                </h3>
                <ul className="space-y-2">
                  {sector.roles.map((role) => (
                    <li
                      key={role}
                      className="text-foreground/60 leading-relaxed"
                    >
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. The Journey: Unequal Phase Cards ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-12">
            Ten Weeks, Three Phases
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] gap-4">
            {JOURNEY_PHASES.map((p) => (
              <div
                key={p.phase}
                className="bg-background rounded-xl p-8 md:p-10"
              >
                <span className="text-xs font-medium text-accent uppercase tracking-[0.2em] block mb-4">
                  Phase {p.phase}
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-foreground/40 mb-6">{p.duration}</p>
                <ul className="space-y-2.5">
                  {p.tasks.map((task) => (
                    <li
                      key={task}
                      className="text-foreground/60 text-sm leading-relaxed"
                    >
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. What You'll Produce: Asymmetric 3:2 Split ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-12">
            What You&apos;ll Produce
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            {/* Research Report */}
            <div className="bg-card-bg rounded-xl p-8 md:p-12">
              <span className="text-xs font-medium text-accent uppercase tracking-[0.2em] block mb-4">
                Portfolio-Ready
              </span>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                English Research Report
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                Literature review, interview evidence, and original conclusions.
                Directly usable as a university application portfolio piece.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  "Literature Review",
                  "Interview Evidence",
                  "Original Analysis",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-foreground/40 border border-border/50 px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Documentary */}
            <div className="bg-card-bg rounded-xl p-8 md:p-12 flex flex-col">
              <span className="text-xs font-medium text-accent uppercase tracking-[0.2em] block mb-4">
                8-12 Min, Published
              </span>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                English Mini-Documentary
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                Interview footage, narration, and data visualization. Edited and
                publicly released.
              </p>
              <div className="flex flex-wrap gap-3 mt-auto">
                {["Interview Clips", "Narration", "Data Viz"].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-foreground/40 border border-border/50 px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 border-l-2 border-accent/30 pl-6 max-w-[60ch]">
            <p className="text-foreground/40 text-sm leading-relaxed">
              All interviews follow formal consent and likeness-release
              protocols. Guests confirm before publication. Screening events are
              open to families.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. FAQ: Native Details/Summary ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-foreground/40 mb-12">
            Reach us at{" "}
            <a
              href="mailto:joshua.wang@ithacafo.com"
              className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              joshua.wang@ithacafo.com
            </a>{" "}
            if you need more information.
          </p>
          <div>
            {FAQ_ITEMS.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-border"
              >
                <summary className="flex items-center justify-between py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-lg font-medium text-foreground pr-4 group-hover:text-accent transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown className="w-5 h-5 text-foreground/40 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="pb-6 text-foreground/60 leading-relaxed max-w-[65ch]">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA: Photo Background ── */}
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
            Ready to Investigate?
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto mb-10">
            Secure your spot in the 2026 Fall cohort and start building a
            research portfolio that matters.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
