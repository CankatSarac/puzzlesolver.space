# PuzzleSolver — puzzlesolver.space

A design-centric hub **and** all of [Cankat Sarac](https://www.linkedin.com/in/cankatsarac/)'s
logic-puzzle solvers, unified into **one Next.js app, one Vercel deploy**.

- Landing page at `/` — the "Playful Puzzle Board" hub with custom SVG icons per puzzle.
- Each solver is an internal route:
  - `/tango` — LinkedIn Tango (suns & moons)
  - `/battleship` — Battleship / Bimaru
  - `/skyscraper` — Skyscraper (edge-clue constraint solver)
  - `/slitherlink` — Slitherlink (loop puzzle)
- Coming soon: Queens, Zip, Star Battle, Bridges.

Built with **Next.js 16 · React 19 · TypeScript · Tailwind CSS v3 · shadcn/ui · Framer Motion**.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build && npm run start
```

## Architecture

```
src/
  app/
    page.tsx                # hub landing
    layout.tsx              # fonts, metadata, JSON-LD
    globals.css             # Tailwind v3 + shadcn tokens + Playful Puzzle Board
    tango|battleship|skyscraper|slitherlink/page.tsx   # solver routes (+ per-route SEO)
    sitemap.ts robots.ts icon.svg opengraph-image.tsx
  components/
    Header Hero SolverGrid SolverCard Features Footer
    PuzzleIcons.tsx         # custom per-puzzle SVG icons
    ui/                     # shared shadcn primitives (button, card, select, …)
  solvers/<id>/             # each solver's component + logic, namespaced
  data/
    solvers.ts              # single source of truth (catalog + accents + routes)
    site.ts                 # domain, author, links
  lib/utils.ts              # shadcn cn()
```

## Adding / launching a solver

1. Build the solver under `src/solvers/<id>/` and a route `src/app/<id>/page.tsx`.
2. In `src/data/solvers.ts`, set the entry's `status` to `"available"` and `url` to `/<id>`.

The grid, cards, icons, sitemap, and JSON-LD all read from `solvers.ts`.

## Deploy (Vercel)

Push to GitHub → import in Vercel (auto-detects Next.js; `vercel.json` pins the framework).
Add the custom domain `puzzlesolver.space` under Settings → Domains.

## Notes

- Solver source repos (`linkedin-tango-puzzle-solver`, `battleship-solver`,
  `slitherlink-solver`, `skyscapper-solver`) are now vendored here as routes; this app
  supersedes the per-solver `*.puzzlesolver.fun` deployments.
- The Skyscraper route is a **new UI** wired to the existing `AdvancedSkyscraperSolver`
  logic (the original `skyscapper-solver` repo shipped a battleship UI by mistake).
