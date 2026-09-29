import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, solverJsonLd } from "@/lib/seo";
import SlitherlinkSolver from "@/solvers/slitherlink/SlitherlinkSolver";

const title = "Slitherlink Puzzle Solver — Free Online Loop Puzzle Solver";
const description =
  "Solve Slitherlink (loop) puzzles instantly. Enter the number clues and the solver draws the single closed loop that satisfies every cell, with multi-solution browsing.";

export const metadata = pageMetadata({ path: "/slitherlink", title, description });

export default function SlitherlinkPage() {
  return (
    <>
      <JsonLd data={solverJsonLd("slitherlink", description)} />
      <Header />
      <main>
        <SlitherlinkSolver />
      </main>
      <Footer className="mt-0" />
    </>
  );
}
