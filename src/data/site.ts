/** Site-wide constants: canonical URL, author, and footer links. */

export const SITE = {
  name: "PuzzleSolver",
  domain: "puzzlesolver.space",
  url: "https://puzzlesolver.space",
  title: "PuzzleSolver — Free Online Logic Puzzle Solvers",
  description:
    "Solve any logic puzzle instantly. Free online solvers for Tango, Battleship, Skyscraper, Slitherlink and more — no signup, works on mobile.",
  author: "Cankat Sarac",
  links: {
    github: "https://github.com/CankatSarac",
    linkedin: "https://www.linkedin.com/in/cankatsarac/",
    // Project handle on X; swap for a personal handle if preferred.
    twitter: "https://twitter.com/puzzlesolverfun",
    buyMeACoffee: "https://buymeacoffee.com/cankatsarac",
    // v1 reuses the existing legal pages until dedicated ones are written.
    privacy: "https://puzzlesolver.fun/privacy",
    terms: "https://puzzlesolver.fun/terms",
  },
} as const;
