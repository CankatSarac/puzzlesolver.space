import type { Metadata } from "next";
import { Header } from "@/components/Header";
import BattleshipSolver from "@/solvers/battleship/BattleshipSolver";

export const metadata: Metadata = {
  title: "Battleship Puzzle Solver — Free Online Bimaru Solver",
  description:
    "Solve Battleship (Bimaru) grid puzzles instantly. Enter the row and column ship-count clues and any cell hints, then auto-solve via constraint-based deduction.",
  alternates: { canonical: "/battleship" },
};

export default function BattleshipPage() {
  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">Battleship Puzzle Solver</h1>
        <BattleshipSolver />
      </main>
    </>
  );
}
