"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.08em]">
      <button
        onClick={() => switchLocale("en")}
        className={locale === "en" ? "text-accent" : "text-white/60 hover:text-white transition-colors"}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-white/30" aria-hidden="true">|</span>
      <button
        onClick={() => switchLocale("zh")}
        className={locale === "zh" ? "text-accent" : "text-white/60 hover:text-white transition-colors"}
        aria-label="切换为中文"
      >
        中文
      </button>
    </div>
  );
}
