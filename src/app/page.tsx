import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { SolverGrid } from "@/components/SolverGrid";
import { SITE } from "@/data/site";
import { SOLVERS } from "@/data/solvers";
import { PERSON } from "@/lib/seo";

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Online Logic Puzzle Solvers",
  itemListElement: SOLVERS.filter((s) => s.status === "available").map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `${s.name} Solver`,
    url: `${SITE.url}${s.url}`,
  })),
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  url: `${SITE.url}/`,
  description: SITE.description,
  inLanguage: "en",
  author: { "@id": PERSON["@id"] },
};

const personLd = { "@context": "https://schema.org", ...PERSON };

export default function Home() {
  return (
    <>
      <JsonLd data={itemListLd} />
      <JsonLd data={websiteLd} />
      <JsonLd data={personLd} />
      <Header />
      <main>
        <Hero />
        <SolverGrid />
        <Features />
      </main>
      <Footer />
    </>
  );
}
