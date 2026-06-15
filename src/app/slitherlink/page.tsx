import type { Metadata } from "next";
import { Header } from "@/components/Header";
import SlitherlinkSolver from "@/solvers/slitherlink/SlitherlinkSolver";

export const metadata: Metadata = {
  title: "Slitherlink Puzzle Solver — Free Online Loop Puzzle Solver",
  description:
    "Solve Slitherlink (loop) puzzles instantly. Enter the number clues and the solver draws the single closed loop that satisfies every cell, with multi-solution browsing.",
  alternates: { canonical: "/slitherlink" },
};

export default function SlitherlinkPage() {
  return (
    <>
      <Header />
      <main>
        <h1 className="sr-only">Slitherlink Puzzle Solver</h1>
        <SlitherlinkSolver />
      </main>
    </>
  );
}
