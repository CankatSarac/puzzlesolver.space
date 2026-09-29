import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, solverJsonLd } from "@/lib/seo";
import SkyscraperSolver from "@/solvers/skyscraper/SkyscraperSolver";

const title = "Skyscraper Puzzle Solver — Free Online Skyscraper Solver";
const description =
  "Solve Skyscraper logic puzzles instantly. Enter the edge clues (how many buildings are visible from each side) and the constraint solver fills the grid automatically.";

export const metadata = pageMetadata({ path: "/skyscraper", title, description });

export default function SkyscraperPage() {
  return (
    <>
      <JsonLd data={solverJsonLd("skyscraper", description)} />
      <Header />
      <main>
        <SkyscraperSolver />
      </main>
      <Footer className="mt-0" />
    </>
  );
}
