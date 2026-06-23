import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "About Us | Ithaca Family Academy",
  description:
    "Learn about Ithaca Family Academy, our mission, teaching philosophy, team, and how we empower youth to explore the future.",
  openGraph: {
    title: "About Us | Ithaca Family Academy",
    description:
      "Learn about Ithaca Family Academy, our mission, teaching philosophy, team, and how we empower youth to explore the future.",
  },
};

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
