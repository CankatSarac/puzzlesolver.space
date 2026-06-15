# PuzzleSolver Hub — Design Spec

**Date:** 2026-06-15
**Owner:** Cankat Sarac
**Status:** Approved (pending spec review)

## 1. Purpose

Replace the current `puzzlesolver.fun` landing page with a redesigned, design-centric
**hub**: a single static page that presents all of Cankat's logic-puzzle solvers as a
cohesive product family and links out (same tab) to each solver's live deployment.

This project is a **landing/directory site only**. It does not contain or port any
solver logic — each solver remains its own separately-deployed app.

## 2. Goals & Non-Goals

**Goals**
- A single, polished, responsive landing page ("Playful Puzzle Board" aesthetic).
- Clear catalog of 8 solvers: 4 available (linked), 4 "Coming Soon" (muted).
- One config file as the single source of truth for the solver list.
- Strong SEO/metadata + social share cards.
- Deployable to Vercel with zero config; portable to a new domain.

**Non-Goals**
- No solver algorithms / interactive puzzle UI on this site.
- No backend, database, auth, or analytics pipeline.
- No internationalization in v1 (the old site's locale routes are out of scope).
- No CMS — content is code.

## 3. Target Domain

- Canonical domain: **`https://puzzlesolver.space`** (to be purchased by owner).
- Used in canonical URL, Open Graph / Twitter tags, and JSON-LD.
- The existing `puzzlesolver.fun` may later redirect to or co-exist with `.space`.

## 4. Tech Stack

- **Next.js 15 (App Router)** + **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** for playful micro-interactions
- **lucide-react** for line icons (matches existing solver repos)
- Fonts via `next/font/google`: **Outfit** (display/headings) + **Inter** (body)
- Output: static (no server runtime needed). Deploy target: **Vercel**.

Rationale: matches the existing `linkedin-tango-puzzle-solver` stack (Next 15 + TS +
Tailwind v4), gives the Metadata API for clean SEO, and deploys to Vercel with zero
config.

## 5. Page Structure (single page)

1. **Header** — "PuzzleSolver" wordmark; nav links: Solvers (anchor), GitHub,
   ☕ Buy me a coffee. Sticky, translucent on scroll.
2. **Hero** — headline *"Solve any logic puzzle, instantly"*, supporting subhead,
   animated subtle dot-grid background (the puzzle-board motif), primary CTA scrolls
   to the solver grid.
3. **Solver grid** — responsive cards, 3-col (desktop) → 2-col (tablet) → 1-col
   (mobile). See §6.
4. **Why-use-it strip** — four value props: Free · No signup · Instant results ·
   Works on mobile.
5. **Footer** — dev attribution (Cankat Sarac), social links, legal links,
   copyright. See §8.

## 6. Solver Card Component

Each card is driven by one entry in the solver config (§7).

- **Available card:** icon + accent color, title, one-line tagline, **"Solve →"**
  button linking to the solver URL **in the same tab** (`<a href>` standard nav).
- **Coming Soon card:** same layout but muted/desaturated, a "Coming Soon" badge,
  no link, `aria-disabled` and not keyboard-focusable as an action.
- **Interactions (Framer Motion):** hover lift (translateY) + soft accent-colored
  glow shadow + slight icon wiggle. Respects `prefers-reduced-motion`.

## 7. Solver Catalog (single source of truth)

A `src/data/solvers.ts` exports a typed array. Shape:

```ts
type SolverStatus = "available" | "coming-soon";
interface Solver {
  id: string;
  name: string;
  tagline: string;     // one line
  icon: string;        // lucide icon name or emoji motif
  accent: string;      // Tailwind accent token / hex
  url: string | null;  // null when coming-soon
  status: SolverStatus;
}
```

Initial data (URLs verified live 2026-06-15):

| id          | name         | status      | url                                        | accent |
|-------------|--------------|-------------|--------------------------------------------|--------|
| tango       | Tango        | available   | https://linkedintango.puzzlesolver.fun/    | rose   |
| battleship  | Battleship   | available   | https://battleship.puzzlesolver.fun/       | blue   |
| skyscraper  | Skyscraper   | available   | https://skyscraper.puzzlesolver.fun/       | amber  |
| slitherlink | Slitherlink  | available   | https://slitherlink.puzzlesolver.fun/      | teal   |
| queens      | Queens       | coming-soon | null                                       | purple |
| zip         | Zip          | coming-soon | null                                       | orange |
| starbattle  | Star Battle  | coming-soon | null                                       | indigo |
| bridges     | Bridges      | coming-soon | null                                       | cyan   |

Note: solver URLs currently live under `*.puzzlesolver.fun`. They are stored in this
one file so they can be re-pointed to `*.puzzlesolver.space` later without code changes.

## 8. Footer Content (dev: Cankat Sarac)

- Buy me a coffee: `https://buymeacoffee.com/cankatsarac`
- GitHub: `https://github.com/CankatSarac`
- LinkedIn: `https://www.linkedin.com/in/cankatsarac/`
- Twitter/X: `https://twitter.com/puzzlesolverfun`
- Legal: Privacy, Terms (lightweight static pages or anchors — v1 may link to the
  existing `puzzlesolver.fun/privacy` and `/terms` until dedicated pages are written).
- Copyright: "© 2026 Cankat Sarac".

## 9. Visual Design Tokens ("Playful Puzzle Board")

- **Background:** warm off-white (`#FAFAF7`) with a subtle dot-grid pattern overlay.
- **Cards:** white, `rounded-2xl`, soft shadow, colored accent (top border or icon
  chip); accent saturates on hover.
- **Type:** Outfit for display/headings, Inter for body.
- **Accents:** per-solver pastel→saturated palette (rose, blue, amber, teal, purple,
  orange, indigo, cyan).
- **Spacing:** generous, mobile-first.

## 10. SEO / Metadata

- `metadata` export: title, description, keywords, canonical `https://puzzlesolver.space`.
- Open Graph + Twitter card with an OG image (`/public/og-image.png`, 1200×630).
- JSON-LD `ItemList` enumerating the available solvers (name + url).
- `sitemap.xml` + `robots.txt`.

## 11. Accessibility & Responsiveness

- Semantic landmarks (`header`, `main`, `nav`, `footer`); single `h1`.
- Available solve buttons are real links; coming-soon cards are `aria-disabled` and
  excluded from tab order.
- WCAG AA contrast for text on accent backgrounds.
- `prefers-reduced-motion` disables non-essential animation.
- Mobile-first; verified at 360px, 768px, 1280px widths.

## 12. Project Layout

```
puzzlesolver.space/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # fonts, metadata, JSON-LD
│   │   ├── page.tsx          # composes sections
│   │   └── globals.css       # Tailwind + tokens
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── SolverGrid.tsx
│   │   ├── SolverCard.tsx
│   │   ├── Features.tsx
│   │   └── Footer.tsx
│   └── data/
│       └── solvers.ts        # single source of truth
├── public/                   # og-image, icons, favicon
├── docs/superpowers/specs/   # this spec
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── README.md
```

## 13. Verification

- `npm run build` succeeds; `npm run lint` clean.
- Local `npm run dev` smoke check: all 4 available buttons resolve to a 200 page;
  coming-soon cards are non-clickable.
- Responsive screenshot check at 360 / 768 / 1280.
- Lighthouse pass on SEO + Accessibility before deploy.

## 14. Out-of-Scope / Future

- Re-pointing solver subdomains to `.space`.
- Dedicated localized routes.
- Per-solver detail pages / blog / how-to-play content.
- Analytics.
