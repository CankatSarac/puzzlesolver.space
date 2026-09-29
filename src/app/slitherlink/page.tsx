import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, solverJsonLd } from "@/lib/seo";
import SlitherlinkSolver from "@/solvers/slitherlink/SlitherlinkSolver";

const title = "Slitherlink Puzzle Solver — Free Online Loop Puzzle Solver";
const description =
  "Free online Slitherlink (loop) puzzle helper. Enter the number clues, draw lines and crosses on an interactive grid, and let the solver fill in the edges that follow directly from the clues.";

export const metadata = pageMetadata({ path: "/slitherlink", title, description });

export default function SlitherlinkPage() {
  return (
    <>
      <JsonLd data={solverJsonLd("slitherlink", description)} />
      <Header />
      <main>
        <SlitherlinkSolver />
      </main>
      <Footer />
    </>
  );
}
