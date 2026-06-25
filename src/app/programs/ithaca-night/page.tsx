import { getTranslations } from "next-intl/server";
import { PlaceholderProgram } from "@/components/programs/PlaceholderProgram";

export async function generateMetadata() {
  const t = await getTranslations("metadata.ithacaNight");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function IthacaNightPage() {
  return (
    <PlaceholderProgram
      heroImage="/media/images/programs/ev-challenge/ev-challenge-stock.jpg"
      heroAlt="Students showcasing projects at Ithaca Night event"
    />
  );
}
