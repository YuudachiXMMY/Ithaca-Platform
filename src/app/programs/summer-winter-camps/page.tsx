import { getTranslations } from "next-intl/server";
import { PlaceholderProgram } from "@/components/programs/PlaceholderProgram";

export async function generateMetadata() {
  const t = await getTranslations("metadata.summerWinterCamps");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SummerWinterCampsPage() {
  return (
    <PlaceholderProgram
      heroImage="/media/images/programs/ev-challenge/ev-challenge-stock.jpg"
      heroAlt="Students engaged in summer camp activities"
    />
  );
}
