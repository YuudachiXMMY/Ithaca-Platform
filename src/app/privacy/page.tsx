import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title"), description: t("description") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");
  const body = t.raw("body") as string[];

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {t("title")}
      </h1>
      <p className="mb-8 text-sm text-foreground/50">{t("updated")}</p>
      <div className="space-y-4 leading-relaxed text-foreground/70">
        {body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
