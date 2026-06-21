"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const COMPETENCIES = [
  {
    letter: "D",
    name: "Design & Principles",
    description: "Creative problem-solving, system design, and design thinking.",
    skills: ["Design Thinking", "CAD", "Prototyping", "UX"],
  },
  {
    letter: "E",
    name: "Electrical Engineering",
    description: "Circuit design, electronics, and hardware prototyping.",
    skills: ["Circuits", "PCB Layout", "Sensors", "Motor Control"],
  },
  {
    letter: "C",
    name: "Computer Programming",
    description: "Software development, algorithms, and computational thinking.",
    skills: ["Python", "Algorithms", "AI / ML", "Web Dev"],
  },
  {
    letter: "A",
    name: "Application of Math & Physics",
    description: "Applied reasoning with real-world math and physics.",
    skills: ["Modeling", "Data Analysis", "Physics Sim", "Estimation"],
  },
  {
    letter: "B",
    name: "Business & Communication",
    description: "Collaboration, pitching, and professional communication.",
    skills: ["Pitching", "Market Research", "Teamwork", "Storytelling"],
  },
] as const;

const PATHWAY_STEPS = [
  "Maker",
  "Rocket Lab",
  "Engineering Systems",
  "Drone Lab",
  "EV Challenge / AI Camp",
] as const;

export function Approach() {
  return (
    <section
      className="bg-[#0c0e12] py-12 lg:py-16"
      aria-label="Our Approach"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Block 1: Full-width cinematic image + offset text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg"
              alt="Students learning through hands-on projects"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-3 mt-4">
          <div className="hidden lg:block" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <h3 className="text-xl font-bold text-white">How We Teach</h3>
            <p className="text-base text-gray-400 mt-2 leading-relaxed max-w-2xl">
              We teach through a studio-style, project-based model where
              students learn by building. Each cohort works in small teams with
              clear weekly milestones, structured mentoring, and frequent
              technical reviews.
            </p>
          </motion.div>
        </div>

        {/* Block 2: Image left + text right - ethics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mt-10 items-center"
        >
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5065.jpg"
              alt="Students discussing AI ethics and integrity"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Ethics &amp; Integrity
            </h3>
            <p className="text-base text-gray-400 mt-2 leading-relaxed">
              We hold a high bar for safety, academic honesty, and responsible
              technology use. Students learn to cite sources properly, document
              AI-assisted work transparently, and maintain design logs that can
              be reviewed through demonstrations and Q&amp;A.
            </p>
          </div>
        </motion.div>

        {/* Block 3: DECAB Competency Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <h3 className="text-xl font-bold text-white mb-2">
            DECAB Competency Map
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-lg leading-relaxed">
            Five dimensions of growth, from creative design to professional
            communication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 gap-3">
            {COMPETENCIES.map((comp, i) => (
              <motion.div
                key={comp.letter}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group relative rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden hover:border-[#ccdef0]/20 hover:bg-white/[0.04] transition-all duration-300 ${
                  i < 3 ? "md:col-span-2" : "md:col-span-3"
                } lg:col-span-1`}
              >
                {/* Watermark letter */}
                <span
                  className="absolute -bottom-5 -right-1 font-mono text-[100px] font-bold text-white/[0.025] leading-none select-none pointer-events-none group-hover:text-[#ccdef0]/[0.05] transition-colors duration-500"
                  aria-hidden="true"
                >
                  {comp.letter}
                </span>

                <div className="relative z-10">
                  <span className="inline-block font-mono text-2xl font-bold text-[#ccdef0] leading-none mb-3">
                    {comp.letter}
                  </span>
                  <h4 className="text-sm font-semibold text-white leading-tight">
                    {comp.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    {comp.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {comp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[10px] uppercase tracking-wider text-[#ccdef0]/35 bg-[#ccdef0]/[0.04] border border-[#ccdef0]/[0.06] rounded px-2 py-0.5 group-hover:text-[#ccdef0]/55 group-hover:bg-[#ccdef0]/[0.07] transition-colors duration-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Block 4: Learning Pathway - inline flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-8 border-t border-white/[0.06] pt-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_5fr] gap-4 items-start">
            <div>
              <h3 className="text-xl font-bold text-white">
                Learning Pathway
              </h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Progressing from foundational tool literacy to advanced
                engineering and AI projects.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end items-center">
              {PATHWAY_STEPS.map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white/70 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded">
                    {step}
                  </span>
                  {i < PATHWAY_STEPS.length - 1 && (
                    <span
                      className="text-white/20 text-xs"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
