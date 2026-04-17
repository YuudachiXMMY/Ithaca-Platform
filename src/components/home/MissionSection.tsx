"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";

interface Pillar {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
}

const PILLARS: readonly Pillar[] = [
  {
    title: "Explore the Future",
    description:
      "We help teens explore the future. From AI and engineering to entrepreneurship, our programs connect students with cutting-edge industries and real-world professionals, sparking curiosity and ambition for what lies ahead.",
    image: "/media/images/pillar-explore.png",
    alt: "Students exploring future technology and innovation",
  },
  {
    title: "Project-Based Learning",
    description:
      "At Ithaca, students are not passive learners. They are project owners. Through hands-on, project-based learning, students tackle real challenges, build prototypes, and present their work — developing critical thinking, teamwork, and leadership skills.",
    image: "/media/images/pillar-pbl.jpg",
    alt: "Students engaged in project-based learning activities",
  },
  {
    title: "Ethics & Social Impact",
    description:
      "We value social impact and AI ethics. Our curriculum integrates discussions on responsible technology use, ensuring students understand the societal implications of the tools they build and the decisions they make as future innovators.",
    image: "/media/images/pillar-ethics.jpg",
    alt: "Students discussing AI ethics and social impact",
  },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function MissionSection() {
  return (
    <section
      className="bg-background-secondary py-20 md:py-28"
      aria-label="Our Mission"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          className="mx-auto mb-16 max-w-3xl text-center text-2xl font-bold leading-snug text-foreground-dark md:text-3xl md:leading-snug"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          Empowering youth to explore the future and build the skills to thrive
          in the AI era.
        </motion.h2>

        <motion.div
          className="grid gap-8 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.title} pillar={pillar} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PillarCard({ pillar }: { readonly pillar: Pillar }) {
  return (
    <motion.article
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
      variants={cardVariants}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={pillar.image}
          alt={pillar.alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="mb-3 text-lg font-bold text-foreground-dark">
          {pillar.title}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">
          {pillar.description}
        </p>
      </div>
    </motion.article>
  );
}
