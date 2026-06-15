import { ArrowDown } from "lucide-react";
import { AVAILABLE_COUNT, SOLVERS } from "@/data/solvers";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="board-bg pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-muted)] shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {AVAILABLE_COUNT} solvers live · {SOLVERS.length - AVAILABLE_COUNT} on the way
        </span>

        <h1 className="mt-7 font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          Solve any logic
          <br />
          puzzle,{" "}
          <span className="bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 bg-clip-text text-transparent">
            instantly
          </span>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-muted)]">
          A growing collection of free, instant solvers for the daily logic puzzles you
          love. No signup, no ads in your way, works on every device.
        </p>

        <div className="mt-9 flex justify-center">
          <a
            href="#solvers"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-3.5 text-base font-semibold text-white transition-transform hover:scale-105"
          >
            Browse solvers
            <ArrowDown size={18} className="transition-transform group-hover:translate-y-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
