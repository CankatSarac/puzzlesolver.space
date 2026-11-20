import Image from "next/image";
import Link from "next/link";
import { Coffee, Github } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SITE } from "@/data/site";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("header");
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
          <Image
            src="/logo.png"
            alt={t("logo_alt")}
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg"
          />
          <span>
            Puzzle<span className="text-rose-500">Solver</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#solvers"
            className="rounded-full px-3 py-2 text-sm font-medium text-subtle transition-colors hover:text-ink"
          >
            {t("nav_solvers")}
          </Link>
          <LanguageSwitcher />
          <a
            href={SITE.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("github_aria")}
            className="rounded-full p-2 text-subtle transition-colors hover:text-ink"
          >
            <Github size={20} />
          </a>
          <a
            href={SITE.links.buyMeACoffee}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("coffee_aria")}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-2 text-sm font-semibold text-amber-950 transition-transform hover:scale-105"
          >
            <Coffee size={16} />
            <span className="hidden sm:inline">{t("coffee_label")}</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
