import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import TangoSolver from "@/solvers/tango/TangoSolver";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("tango_title"),
    description: t("tango_description"),
    alternates: { canonical: "/tango" },
  };
}

export default async function TangoPage() {
  const t = await getTranslations("metadata");
  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">{t("tango_h1")}</h1>
        <TangoSolver />
      </main>
    </>
  );
}
