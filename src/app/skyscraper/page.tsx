import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import SkyscraperSolver from "@/solvers/skyscraper/SkyscraperSolver";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("skyscraper_title"),
    description: t("skyscraper_description"),
    alternates: { canonical: "/skyscraper" },
  };
}

export default function SkyscraperPage() {
  return (
    <>
      <Header />
      <main>
        <SkyscraperSolver />
      </main>
    </>
  );
}
