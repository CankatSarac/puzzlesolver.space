import type { Metadata } from "next";
import { Header } from "@/components/Header";
import SkyscraperSolver from "@/solvers/skyscraper/SkyscraperSolver";

export const metadata: Metadata = {
  title: "Skyscraper Puzzle Solver — Free Online Skyscraper Solver",
  description:
    "Solve Skyscraper logic puzzles instantly. Enter the edge clues (how many buildings are visible from each side) and the constraint solver fills the grid automatically.",
  alternates: { canonical: "/skyscraper" },
};

export default function SkyscraperPage() {
  return (
    <>
      <Header />
      <SkyscraperSolver />
    </>
  );
}
