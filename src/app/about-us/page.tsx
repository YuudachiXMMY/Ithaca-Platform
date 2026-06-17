import type { Metadata } from "next";
import { TEAM_MEMBERS } from "@/types";
import { HeroSection } from "./sections/HeroSection";
import { LearningPathway } from "./sections/LearningPathway";
import { HowWeTeachEthics } from "./sections/HowWeTeachEthics";
import { DecabFramework } from "./sections/DecabFramework";
import { OurPrograms } from "./sections/OurPrograms";
import { StudentOutcomes } from "./sections/StudentOutcomes";
import { StudentHighlights } from "./sections/StudentHighlights";
import { StudentHighlight } from "./sections/StudentHighlight";
import { CommunitySpotlight } from "./sections/CommunitySpotlight";
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
    <div>
      <HeroSection />
      <LearningPathway />
      <HowWeTeachEthics />
      <DecabFramework />
      <OurPrograms />
      <StudentOutcomes />
      <StudentHighlights />
      <StudentHighlight />
      <CommunitySpotlight />
      <TeamSection members={TEAM_MEMBERS} />
      <CTASection />
      <NewsletterSection />
    </div>
  );
}
