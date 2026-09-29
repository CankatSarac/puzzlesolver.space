import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PUZZLE_ICONS } from "@/components/PuzzleIcons";
import { SOLVERS } from "@/data/solvers";

export const metadata: Metadata = {
  title: "Page not found — PuzzleSolver",
  description: "This page doesn't exist. Pick one of PuzzleSolver's free logic puzzle solvers instead.",
  alternates: { canonical: null },
};

export default function NotFound() {
  const available = SOLVERS.filter((s) => s.status === "available" && s.url);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-24">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-subtle">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-subtle">
          That page doesn&apos;t exist or has moved. Try one of the solvers below, or head back home.
        </p>

        <ul className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {available.map((s) => {
            const Icon = PUZZLE_ICONS[s.iconId];
            return (
              <li key={s.id}>
                <Link
                  href={s.url!}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ink/30"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: s.accentTint, color: s.accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-semibold text-ink">{s.name} solver</span>
                  <ArrowRight aria-hidden size={16} className="ml-auto" style={{ color: s.accentText }} />
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-semibold text-white transition-transform hover:scale-105"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
