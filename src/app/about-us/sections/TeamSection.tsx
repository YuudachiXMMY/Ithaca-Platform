import Image from "next/image";
import type { TeamMember } from "@/types";

interface TeamSectionProps {
  readonly members: readonly TeamMember[];
}

export function TeamSection({ members }: TeamSectionProps) {
  const [first, ...rest] = members;

  return (
    <section className="bg-[#0c0e12] py-28" aria-labelledby="team-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2
          id="team-heading"
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Team &amp; Mentors
        </h2>
        <p className="text-gray-400 mt-4 max-w-xl leading-relaxed">
          Our team combines classroom expertise with industry experience to
          guide students through real-world challenges.
        </p>

        {/* Asymmetric layout: featured member (large) + others (stacked right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 mt-12">
          {/* Featured member */}
          {first && (
            <div>
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#111318]">
                {first.image && (
                  <Image
                    src={first.image}
                    alt={first.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                )}
              </div>
              <h4 className="text-base font-bold text-white mt-5">
                {first.name}
              </h4>
              <p className="text-sm font-medium text-[#ccdef0]">
                {first.title}
              </p>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                {first.description}
              </p>
            </div>
          )}

          {/* Remaining members in a grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {rest.map((member) => (
              <div key={member.name}>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#111318]">
                  {member.image && (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-4">
                  {member.name}
                </h4>
                <p className="text-xs font-medium text-gray-500">
                  {member.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
