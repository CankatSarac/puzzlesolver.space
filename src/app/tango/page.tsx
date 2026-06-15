import type { Metadata } from "next";
import { Header } from "@/components/Header";
import TangoSolver from "@/solvers/tango/TangoSolver";

export const metadata: Metadata = {
  title: "Tango Puzzle Solver — Free Online LinkedIn Tango Solver",
  description:
    "Solve LinkedIn's Tango puzzle instantly. Fill the grid with suns and moons under the balance, no-three-in-a-row, and =/≠ constraints — all solutions found automatically.",
  alternates: { canonical: "/tango" },
};

export default function TangoPage() {
  return (
    <>
      <Header />
      <TangoSolver />
    </>
  );
}
