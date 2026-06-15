import { Coffee, Github, Linkedin, Twitter } from "lucide-react";
import { SITE } from "@/data/site";

export function Footer() {
  const year = 2026;
  return (
    <footer className="mt-12 border-t border-[var(--color-line)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-10 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <a href="#top" className="font-[family-name:var(--font-display)] text-lg font-bold">
            Puzzle<span className="text-rose-500">Solver</span>
          </a>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Built by{" "}
            <a
              href={SITE.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-ink)] underline-offset-2 hover:underline"
            >
              {SITE.author}
            </a>
            . © {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FooterIcon href={SITE.links.github} label="GitHub">
            <Github size={18} />
          </FooterIcon>
          <FooterIcon href={SITE.links.linkedin} label="LinkedIn">
            <Linkedin size={18} />
          </FooterIcon>
          <FooterIcon href={SITE.links.twitter} label="X / Twitter">
            <Twitter size={18} />
          </FooterIcon>
          <FooterIcon href={SITE.links.buyMeACoffee} label="Buy me a coffee">
            <Coffee size={18} />
          </FooterIcon>
        </div>
      </div>

      <div className="border-t border-[var(--color-line)]">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-5 gap-y-2 px-5 py-4 text-sm text-[var(--color-muted)] sm:justify-end">
          <a href={SITE.links.privacy} className="hover:text-[var(--color-ink)]">
            Privacy
          </a>
          <a href={SITE.links.terms} className="hover:text-[var(--color-ink)]">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
    >
      {children}
    </a>
  );
}
