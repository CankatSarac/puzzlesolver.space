import Link from "next/link";
import { Coffee, Github } from "lucide-react";
import { SITE } from "@/data/site";

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-rose-500" fill="currentColor" aria-hidden>
      <path d="M9.5 3h2a2.2 2.2 0 0 1 2.2 2.2 1.3 1.3 0 0 0 2.6 0V4.6h3.1v3.4a2.2 2.2 0 0 1-2.2 2.2 1.3 1.3 0 0 0 0 2.6 2.2 2.2 0 0 1 2.2 2.2v4H16a2.2 2.2 0 0 1-2.2-2.2 1.3 1.3 0 0 0-2.6 0A2.2 2.2 0 0 1 9 21H4.6v-4.4A2.2 2.2 0 0 1 6.8 14.4a1.3 1.3 0 0 0 0-2.6 2.2 2.2 0 0 1-2.2-2.2V6.2H8A1.5 1.5 0 0 0 9.5 4.7Z" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Logo />
          <span>
            Puzzle<span className="text-rose-500">Solver</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#solvers"
            className="rounded-full px-3 py-2 text-sm font-medium text-subtle transition-colors hover:text-ink"
          >
            Solvers
          </Link>
          <a
            href={SITE.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="rounded-full p-2 text-subtle transition-colors hover:text-ink"
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
