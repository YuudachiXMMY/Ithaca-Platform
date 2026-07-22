"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BLUR_DATA_URL } from "@/lib/utils";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { FadeIn } from "@/components/animations/FadeIn";

export function ConnectCTA() {
  const t = useTranslations("about");

  return (
    <section className="bg-[#111318] py-12 lg:py-16" aria-label={t("connect.ariaLabel")}>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Cinematic CTA image strip */}
        <FadeIn>
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_07.jpg"
              alt={t("connect.imageAlt")}
              fill
              className="object-cover"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-end p-4 md:p-6">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                {t("connect.heading")}
              </h2>
            </div>
          </div>
        </FadeIn>

        {/* Three-column: Educators + Mentors + Newsletter */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div>
              <h3 className="text-sm font-bold text-white">
                {t("connect.educators.heading")}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {t("connect.educators.description")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                {t("connect.mentors.heading")}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {t("connect.mentors.description")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-2">
                {t("connect.newsletter.heading")}
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
              {t("connect.cta")}
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
