/**
 * Single source of truth for the puzzle-solver catalog.
 *
 * To launch a "coming-soon" solver: flip `status` to "available" and set its `url`.
 * To add a new solver: append an entry. Nothing else in the UI needs to change.
 *
 * URLs verified live on 2026-06-15. They currently point at *.puzzlesolver.fun;
 * re-point here if/when the solvers move to *.puzzlesolver.space.
 */

export type SolverStatus = "available" | "coming-soon";

export interface Solver {
  /** stable slug, used as React key */
  id: string;
  /** display name */
  name: string;
  /** single-line description */
  tagline: string;
  /** emoji motif shown on the card */
  icon: string;
  /** accent color (hex) — drives the card's CSS custom property */
  accent: string;
  /** destination; null when not yet deployed */
  url: string | null;
  status: SolverStatus;
}

export const SOLVERS: Solver[] = [
  {
    id: "tango",
    name: "Tango",
    tagline: "Balance suns and moons across LinkedIn's daily grid.",
    icon: "🌗",
    accent: "#f43f5e", // rose
    url: "https://linkedintango.puzzlesolver.fun/",
    status: "available",
  },
  {
    id: "battleship",
    name: "Battleship",
    tagline: "Locate every hidden fleet with pure logical deduction.",
    icon: "⚓",
    accent: "#3b82f6", // blue
    url: "https://battleship.puzzlesolver.fun/",
    status: "available",
  },
  {
    id: "skyscraper",
    name: "Skyscraper",
    tagline: "Place towers to satisfy every edge-clue sightline.",
    icon: "🏙️",
    accent: "#f59e0b", // amber
    url: "https://skyscraper.puzzlesolver.fun/",
    status: "available",
  },
  {
    id: "slitherlink",
    name: "Slitherlink",
    tagline: "Draw a single loop that obeys every numbered cell.",
    icon: "🔗",
    accent: "#14b8a6", // teal
    url: "https://slitherlink.puzzlesolver.fun/",
    status: "available",
  },
  {
    id: "queens",
    name: "Queens",
    tagline: "One queen per row, column, and color region.",
    icon: "👑",
    accent: "#a855f7", // purple
    url: null,
    status: "coming-soon",
  },
  {
    id: "zip",
    name: "Zip",
    tagline: "Connect the numbers in order, filling every cell.",
    icon: "🔢",
    accent: "#f97316", // orange
    url: null,
    status: "coming-soon",
  },
  {
    id: "starbattle",
    name: "Star Battle",
    tagline: "Position the stars so none touch, in every region.",
    icon: "⭐",
    accent: "#6366f1", // indigo
    url: null,
    status: "coming-soon",
  },
  {
    id: "bridges",
    name: "Bridges",
    tagline: "Link the islands with the right number of bridges.",
    icon: "🌉",
    accent: "#06b6d4", // cyan
    url: null,
    status: "coming-soon",
  },
];

export const AVAILABLE_COUNT = SOLVERS.filter((s) => s.status === "available").length;
