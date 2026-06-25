"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

const PROGRAM_IMAGES = [
  "/media/images/programs/ev-challenge/EV25-10.s.png",
  "/media/images/programs/ai-entrepreneurship/AI-Entrep_88.jpg",
  "/media/images/programs/ai-interview/25_Mr. Carmi Levy.png",
  "/media/images/programs/ai-entrepreneurship/AI-Entrep_29.jpg",
] as const;

const PROGRAM_HREFS = [
  "/programs/ev-challenge",
  "/programs/ai-entrepreneurship-camp",
  "/programs/engineering-projects",
  "/programs",
] as const;

const PROGRAM_KEYS = ["evTeam", "aiCamp", "eliteInterviews", "allPrograms"] as const;

export function ProgramsBento() {
  const t = useTranslations("about");

  const programs = PROGRAM_KEYS.map((key, i) => ({
    label: t(`programs.${key}.label`),
    description: t(`programs.${key}.description`),
    href: PROGRAM_HREFS[i],
    image: PROGRAM_IMAGES[i],
  }));

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
          {t("programs.heading")}
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
            <Link href={programs[0].href} className="group block h-full">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[240px] rounded-lg overflow-hidden">
                <Image
                  src={programs[0].image}
                  alt={programs[0].label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-base font-bold text-white">
                    {programs[0].label}
                  </h3>
                  <p className="text-sm text-white/60 mt-0.5">
                    {programs[0].description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Stacked smaller cards */}
          <div className="grid grid-cols-1 gap-3">
            {programs.slice(1).map((program, i) => (
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
