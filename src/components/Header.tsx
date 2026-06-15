import { Coffee, Github } from "lucide-react";
import { SITE } from "@/data/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
          <span aria-hidden className="text-xl">🧩</span>
          <span>
            Puzzle<span className="text-rose-500">Solver</span>
          </span>
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="#solvers"
            className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            Solvers
          </a>
          <a
            href={SITE.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="rounded-full p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <Github size={20} />
          </a>
          <a
            href={SITE.links.buyMeACoffee}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-2 text-sm font-semibold text-amber-950 transition-transform hover:scale-105"
          >
            <Coffee size={16} />
            <span className="hidden sm:inline">Buy me a coffee</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
