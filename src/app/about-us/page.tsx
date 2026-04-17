import type { Metadata } from "next";
import { TEAM_MEMBERS } from "@/types";
import { HeroSection } from "./sections/HeroSection";
import { PillarsSection } from "./sections/PillarsSection";
import { LearningPathway } from "./sections/LearningPathway";
import { HowWeTeach } from "./sections/HowWeTeach";
import { EthicsSection } from "./sections/EthicsSection";
import { DecabFramework } from "./sections/DecabFramework";
import { StudentOutcomes } from "./sections/StudentOutcomes";
import { StudentHighlight } from "./sections/StudentHighlight";
import { TeamSection } from "./sections/TeamSection";
import { CTASection } from "./sections/CTASection";
import { NewsletterSection } from "./sections/NewsletterSection";

export const metadata: Metadata = {
  title: "About Us | Ithaca Family Academy",
  description:
    "Learn about Ithaca Family Academy — our mission, teaching philosophy, team, and how we empower youth to explore the future.",
  openGraph: {
    title: "About Us | Ithaca Family Academy",
    description:
      "Learn about Ithaca Family Academy — our mission, teaching philosophy, team, and how we empower youth to explore the future.",
  },
};

export default function AboutUsPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <PillarsSection />
      <LearningPathway />
      <HowWeTeach />
      <EthicsSection />
      <DecabFramework />
      <StudentOutcomes />
      <StudentHighlight />
      <TeamSection members={TEAM_MEMBERS} />
      <CTASection />
      <NewsletterSection />
    </div>
  );
}
