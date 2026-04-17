"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";

interface Highlight {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
}

const HIGHLIGHTS: readonly Highlight[] = [
  {
    title: "Honda Production Line Visit",
    description:
      "Students toured the Honda EV production facility, witnessing cutting-edge manufacturing processes and sustainable engineering in action.",
    image: "/media/images/thumbnail-honda-ev.png",
    alt: "Students visiting Honda electric vehicle production line",
  },
  {
    title: "EV Program Workshop",
    description:
      "Hands-on sessions where students designed and assembled electric vehicle components, learning about motor systems and energy management.",
    image: "/media/images/screenshot-2025-09-15.png",
    alt: "Students working on electric vehicle components during workshop",
  },
  {
    title: "Industry Expert Interviews",
    description:
      "Students conducted professional interviews with industry leaders, developing communication skills and gaining first-hand career insights.",
    image: "/media/images/wechat-img-187.jpg",
    alt: "Student interviewing an industry expert",
  },
  {
    title: "Team Collaboration",
    description:
      "Cross-disciplinary team projects that challenge students to combine technical expertise with creative problem-solving and leadership.",
    image: "/media/images/wechat-img-189.jpg",
    alt: "Students collaborating on a team project",
  },
  {
    title: "Presentation Day",
    description:
      "Students showcased their semester projects to panels of educators and industry mentors, building confidence and public speaking skills.",
    image: "/media/images/screenshot-2025-09-16.png",
    alt: "Student presenting their project on presentation day",
  },
  {
    title: "Hands-On Innovation",
    description:
      "From prototyping to coding, students get their hands dirty building solutions that address real challenges in technology and society.",
    image: "/media/images/wechat-img-197.jpg",
    alt: "Students engaged in hands-on innovation activities",
  },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function StudentHighlights() {
  return (
    <section
      className="bg-background py-20 md:py-28"
      aria-label="Student Highlights"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Student Highlights
          </h2>
          <p className="mx-auto max-w-2xl text-foreground/60">
            Real experiences from our programs that inspire and transform the
            next generation of innovators.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {HIGHLIGHTS.map((highlight) => (
            <HighlightCard key={highlight.title} highlight={highlight} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HighlightCard({
  highlight,
}: {
  readonly highlight: Highlight;
}) {
  return (
    <motion.article
      className="group overflow-hidden rounded-2xl border border-border bg-card-bg transition-all duration-300 hover:border-accent/30"
      variants={cardVariants}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={highlight.image}
          alt={highlight.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
          aria-hidden="true"
        />
      </div>
      <div className="p-6">
        <h3 className="mb-2 text-base font-bold text-foreground">
          {highlight.title}
        </h3>
        <p className="text-sm leading-relaxed text-foreground/60">
          {highlight.description}
        </p>
      </div>
    </motion.article>
  );
}
