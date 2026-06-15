import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";
import { SOLVERS } from "@/data/solvers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
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
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Online Logic Puzzle Solvers",
  itemListElement: SOLVERS.filter((s) => s.status === "available").map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `${s.name} Solver`,
    url: `${SITE.url}${s.url}`,
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
