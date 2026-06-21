import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { FadeIn } from "@/components/animations/FadeIn";

export function ConnectCTA() {
  return (
    <section className="bg-[#111318] py-12 lg:py-16" aria-label="Join Us">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Cinematic CTA image strip */}
        <FadeIn>
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_07.jpg"
              alt="Mentors and students collaborating at Ithaca"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-end p-4 md:p-6">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                Join Us
              </h2>
            </div>
          </div>
        </FadeIn>

        {/* Three-column: Educators + Mentors + Newsletter */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div>
              <h3 className="text-sm font-bold text-white">
                Educators &amp; Instructional Leads
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Our teaching team blends classroom expertise with hands-on
                engineering practice. Instructors guide students through core
                concepts, workshop safety, and disciplined project execution.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                Industry Mentors &amp; Guest Experts
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                We invite professionals from engineering, AI, and related
                industries to mentor, review student work, and share real-world
                perspectives.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-2">
                Stay Updated
              </h3>
              <NewsletterForm variant="dark" />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-6">
            <Link
              href="/contact-us"
              className="inline-block px-6 py-3 bg-[#ccdef0] text-[#111318] font-semibold rounded-lg text-sm hover:bg-[#b8d0e8] transition-colors active:scale-[0.98]"
            >
              Connect Now
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
