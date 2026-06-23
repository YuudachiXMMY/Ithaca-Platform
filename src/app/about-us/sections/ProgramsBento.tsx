"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PROGRAMS = [
  {
    label: "EV Team",
    href: "/programs/ev-challenge",
    image: "/media/images/programs/ev-challenge/EV25-10.s.png",
    description: "Build and race electric vehicles with industry mentors.",
  },
  {
    label: "AI Entrepreneurship Camp",
    href: "/programs/ai-entrepreneurship-camp",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_88.jpg",
    description: "Develop AI-powered solutions to real business problems.",
  },
  {
    label: "Elite Interviews",
    href: "/programs/engineering-projects",
    image: "/media/images/programs/ai-interview/25_Mr. Carmi Levy.png",
    description: "Students investigate real-world issues through expert interviews, producing reports and documentaries.",
  },
  {
    label: "All Programs",
    href: "/programs",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_29.jpg",
    description: "Explore our full range of programs and camps.",
  },
] as const;

export function ProgramsBento() {
  return (
    <section
      className="bg-[#111318] py-12 lg:py-16 lg:min-h-[100dvh] flex flex-col"
      aria-labelledby="programs-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 w-full flex flex-col flex-1">
        <motion.h2
          id="programs-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Our Programs
        </motion.h2>

        {/* Bento: hero card left (tall) + 3 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 mt-6 flex-1">
          {/* Hero program card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="h-full"
          >
            <Link href={PROGRAMS[0].href} className="group block h-full">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[240px] rounded-lg overflow-hidden">
                <Image
                  src={PROGRAMS[0].image}
                  alt={PROGRAMS[0].label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-base font-bold text-white">
                    {PROGRAMS[0].label}
                  </h3>
                  <p className="text-sm text-white/60 mt-0.5">
                    {PROGRAMS[0].description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Stacked smaller cards */}
          <div className="grid grid-cols-1 gap-3">
            {PROGRAMS.slice(1).map((program, i) => (
              <motion.div
                key={program.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
              >
                <Link
                  href={program.href}
                  className="group grid grid-cols-[1fr_1fr] gap-3 items-center"
                >
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                    <Image
                      src={program.image}
                      alt={program.label}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 50vw, 20vw"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#ccdef0] transition-colors">
                      {program.label}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {program.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
