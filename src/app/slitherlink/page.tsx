import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import SlitherlinkSolver from "@/solvers/slitherlink/SlitherlinkSolver";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("slitherlink_title"),
    description: t("slitherlink_description"),
    alternates: { canonical: "/slitherlink" },
  };
}

export default async function SlitherlinkPage() {
  const t = await getTranslations("metadata");
  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">{t("slitherlink_h1")}</h1>
        <SlitherlinkSolver />
      </main>
    </>
  );
}
