"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { TeamMember } from "@/types";

interface TeamGridProps {
  readonly members: readonly TeamMember[];
}

export function TeamGrid({ members }: TeamGridProps) {
  return (
    <section
      className="bg-[#0c0e12] py-12 lg:py-16"
      aria-labelledby="team-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="team-heading"
            className="text-2xl md:text-4xl font-bold text-white tracking-tight"
          >
            Team &amp; Mentors
          </h2>
          <p className="text-base text-gray-400 mt-2 max-w-md leading-relaxed">
            Our team combines classroom expertise with industry experience to
            guide students through real-world challenges.
          </p>
        </motion.div>

        {/* Compact 4-column grid - all equal for density */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {members.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#111318]">
                {member.image && (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                )}
              </div>
              <h4 className="text-sm font-bold text-white mt-3">
                {member.name}
              </h4>
              <p className="text-xs font-medium text-[#ccdef0]/70">
                {member.title}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {member.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
