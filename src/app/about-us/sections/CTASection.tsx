import Image from "next/image";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-[#111318] py-28" aria-label="Join Us">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Full-bleed image with dark overlay */}
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <Image
            src="/media/images/programs/ai-entrepreneurship/AI-Entrep_07.jpg"
            alt="Mentors and students collaborating at Ithaca"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end p-8 md:p-12">
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Join Us
            </h2>
          </div>
        </div>

        {/* Two-column content below, offset right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 mt-12">
          <div className="hidden lg:block" aria-hidden="true" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-base font-bold text-white">
                Educators &amp; Instructional Leads
              </h3>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                Our teaching team blends classroom expertise with hands-on
                engineering practice. Instructors guide students through core
                concepts, workshop safety, and disciplined project execution.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Industry Mentors &amp; Guest Experts
              </h3>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                We invite professionals from engineering, AI, and related
                industries to mentor, review student work, and share real-world
                perspectives.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:pl-[33.333%] mt-10">
          <Link
            href="/contact-us"
            className="inline-block px-8 py-3.5 bg-[#ccdef0] text-[#111318] font-semibold rounded-lg text-sm hover:bg-[#b8d0e8] transition-colors"
          >
            Connect Now
          </Link>
        </div>
      </div>
    </section>
  );
}
