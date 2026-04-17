import { HeroSection } from "@/components/home/HeroSection";
import { MissionSection } from "@/components/home/MissionSection";
import { ProgramsShowcase } from "@/components/home/ProgramsShowcase";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { StudentHighlights } from "@/components/home/StudentHighlights";
import { ContactSection } from "@/components/home/ContactSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MissionSection />
      <ProgramsShowcase />
      <FeaturedSection />
      <StudentHighlights />
      <ContactSection />
    </>
  );
}
