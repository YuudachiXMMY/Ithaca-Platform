import Link from "next/link";

const PROGRAMS = [
  { label: "EV Challenge", href: "/programs/ev-challenge" },
  {
    label: "AI Entrepreneurship Camp",
    href: "/programs/ai-entrepreneurship-camp",
  },
  { label: "Engineering Projects", href: "/programs/engineering-projects" },
  { label: "Other Programs", href: "/programs" },
] as const;

export function OurPrograms() {
  return (
    <section className="bg-white py-24" aria-labelledby="programs-heading">
      <div className="max-w-5xl mx-auto px-6">
        <h2
          id="programs-heading"
          className="text-3xl font-bold text-gray-900 mb-8 text-center"
        >
          Our Programs
        </h2>

        <div className="max-w-xl mx-auto">
          {PROGRAMS.map((program) => (
            <Link
              key={program.href}
              href={program.href}
              className="block border-b border-gray-200 py-4 text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {program.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
