import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { SITE } from "@/data/site";
import { SOLVERS } from "@/data/solvers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  themeColor: "#faf9f6",
};

// Metadata is generated per request so the title and description follow the
// visitor locale (cookie override or Accept Language auto detection).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    metadataBase: new URL(SITE.url),
    title: t("home_title"),
    description: t("home_description"),
    keywords: [
      "puzzle solver",
      "logic puzzle solver",
      "tango solver",
      "battleship solver",
      "skyscraper solver",
      "slitherlink solver",
      "linkedin puzzle solver",
    ],
    authors: [{ name: SITE.author }],
    alternates: { canonical: SITE.url },
    openGraph: {
      type: "website",
      url: SITE.url,
      siteName: SITE.name,
      title: t("home_og_title"),
      description: t("home_description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("home_og_title"),
      description: t("home_description"),
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("metadata");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("list_name"),
    itemListElement: SOLVERS.filter((s) => s.status === "available").map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${s.name} Solver`,
      url: `${SITE.url}${s.url}`,
    })),
  };

  return (
    <html lang={locale} className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
