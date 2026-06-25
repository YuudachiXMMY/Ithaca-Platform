import { getTranslations } from "next-intl/server";
import { TEAM_MEMBERS } from "@/types";
import { HeroSection } from "./sections/HeroSection";
import { MissionGrid } from "./sections/MissionGrid";
import { Approach } from "./sections/Approach";
import { DecabFramework } from "./sections/DecabFramework";
import { ProgramsBento } from "./sections/ProgramsBento";
import { Outcomes } from "./sections/Outcomes";
import { Highlights } from "./sections/Highlights";
import { TeamGrid } from "./sections/TeamGrid";
import { ConnectCTA } from "./sections/ConnectCTA";

export async function generateMetadata() {
  const t = await getTranslations("metadata.aboutUs");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function AboutUsPage() {
  return (
    <div>
      <HeroSection />
      <MissionGrid />
      <Approach />
      <DecabFramework />
      <ProgramsBento />
      <Outcomes />
      <Highlights />
      <TeamGrid members={TEAM_MEMBERS} />
      <ConnectCTA />
    </div>
  );
}
