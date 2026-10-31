import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import BattleshipSolver from "@/solvers/battleship/BattleshipSolver";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("battleship_title"),
    description: t("battleship_description"),
    alternates: { canonical: "/battleship" },
  };
}

export default async function BattleshipPage() {
  const t = await getTranslations("metadata");
  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">{t("battleship_h1")}</h1>
        <BattleshipSolver />
      </main>
    </>
  );
}
