import Image from "next/image";
import type { TeamMember } from "@/types";

interface TeamSectionProps {
  readonly members: readonly TeamMember[];
}

export function TeamSection({ members }: TeamSectionProps) {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
          Team &amp; Mentors
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map((member) => (
            <div key={member.name}>
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  width={182}
                  height={182}
                  className="rounded object-cover w-[182px] h-[182px]"
                />
              ) : (
                <div className="w-[182px] h-[182px] rounded bg-gray-200" />
              )}

              <h4 className="text-base font-bold text-gray-900 mt-4">
                {member.name}
              </h4>

              <div>
                <p className="text-sm font-semibold text-gray-600">
                  <strong>{member.title}</strong>
                </p>
                {member.name === "Mr. Grant Bourne" && (
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    <strong>Race Driver</strong>
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  {member.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
