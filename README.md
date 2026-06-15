# PuzzleSolver Hub — puzzlesolver.space

A design-centric landing page that collects all of [Cankat Sarac](https://www.linkedin.com/in/cankatsarac/)'s
free online logic-puzzle solvers in one place. Each card links out to a live solver;
not-yet-released solvers show as "Coming Soon".

Built with **Next.js 15 · TypeScript · Tailwind CSS v4 · Framer Motion**.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Adding or launching a solver

Everything is driven by one file: [`src/data/solvers.ts`](src/data/solvers.ts).

- **Launch a "coming-soon" solver:** set its `status` to `"available"` and add the `url`.
- **Add a new solver:** append an entry to the `SOLVERS` array.

No component or layout changes are needed — the grid, cards, SEO `ItemList`, and counts
all read from that array.

Site-wide constants (domain, author, social/legal links) live in
[`src/data/site.ts`](src/data/site.ts).

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel — it auto-detects Next.js, no config needed.
3. Add the custom domain `puzzlesolver.space` in Vercel → Settings → Domains.

## Design spec

See [`docs/superpowers/specs/2026-06-15-puzzlesolver-hub-design.md`](docs/superpowers/specs/2026-06-15-puzzlesolver-hub-design.md).
