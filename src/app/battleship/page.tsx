import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, solverJsonLd } from "@/lib/seo";
import BattleshipSolver from "@/solvers/battleship/BattleshipSolver";

const title = "Battleship Puzzle Solver — Free Online Bimaru Solver";
const description =
  "Solve Battleship (Bimaru) grid puzzles instantly. Enter the row and column ship-count clues and any cell hints, then auto-solve via constraint-based deduction.";

export const metadata = pageMetadata({ path: "/battleship", title, description });

export default function BattleshipPage() {
  return (
    <>
      <JsonLd data={solverJsonLd("battleship", description)} />
      <Header />
      <main>
        <BattleshipSolver />
      </main>
      <Footer className="mt-0" />
    </>
  );
}
