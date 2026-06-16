import { HeroSection } from "@/components/home/HeroSection";
import { MissionSection } from "@/components/home/MissionSection";
import { ProgramsShowcase } from "@/components/home/ProgramsShowcase";
import { ImpactStats } from "@/components/home/ImpactStats";
import { CinematicDivider } from "@/components/home/CinematicDivider";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { StudentHighlights } from "@/components/home/StudentHighlights";
import { ContactSection } from "@/components/home/ContactSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MissionSection />
      <ProgramsShowcase />
      <ImpactStats />
      <CinematicDivider />
      <FeaturedSection />
      <StudentHighlights />
      <ContactSection />
    </>
  );
}
