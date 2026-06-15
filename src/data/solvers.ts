/**
 * Single source of truth for the puzzle-solver catalog.
 *
 * All 4 built solvers live as internal routes in this same app (true merge).
 * To launch a "coming-soon" solver: build its route, flip `status`, set `url`.
 *
 * Accent derivatives (tint/text/shadow) are PRECOMPUTED here instead of using
 * runtime color-mix(), so styling works on all browsers and in Tailwind v3.
 *  - accent:       vibrant decoration (top bar, icon glyph, hover border)
 *  - accentTint:   light chip background behind the icon
 *  - accentText:   darkened accent that passes WCAG AA as small text on white
 *  - accentShadow: rgba accent for the hover lift shadow
 */
import type { PuzzleIconId } from "@/components/PuzzleIcons";

export type SolverStatus = "available" | "coming-soon";

export interface Solver {
  id: string;
  iconId: PuzzleIconId;
  name: string;
  tagline: string;
  accent: string;
  accentTint: string;
  accentText: string;
  accentShadow: string;
  url: string | null;
  status: SolverStatus;
}

export const SOLVERS: Solver[] = [
  {
    id: "tango",
    iconId: "tango",
    name: "Tango",
    tagline: "Balance suns and moons under the no-three-in-a-row and =/≠ rules.",
    accent: "#f43f5e",
    accentTint: "#ffe4e6",
    accentText: "#be123c",
    accentShadow: "rgba(244,63,94,0.30)",
    url: "/tango",
    status: "available",
  },
  {
    id: "battleship",
    iconId: "battleship",
    name: "Battleship",
    tagline: "Locate every hidden ship from the row and column clues.",
    accent: "#3b82f6",
    accentTint: "#dbeafe",
    accentText: "#1d4ed8",
    accentShadow: "rgba(59,130,246,0.30)",
    url: "/battleship",
    status: "available",
  },
  {
    id: "skyscraper",
    iconId: "skyscraper",
    name: "Skyscraper",
    tagline: "Place towers so every edge clue counts the right skyline.",
    accent: "#f59e0b",
    accentTint: "#fef3c7",
    accentText: "#b45309",
    accentShadow: "rgba(245,158,11,0.30)",
    url: "/skyscraper",
    status: "available",
  },
  {
    id: "slitherlink",
    iconId: "slitherlink",
    name: "Slitherlink",
    tagline: "Draw a single closed loop that satisfies every numbered cell.",
    accent: "#14b8a6",
    accentTint: "#ccfbf1",
    accentText: "#0f766e",
    accentShadow: "rgba(20,184,166,0.30)",
    url: "/slitherlink",
    status: "available",
  },
  {
    id: "queens",
    iconId: "queens",
    name: "Queens",
    tagline: "One queen per row, column, and color region — none touching.",
    accent: "#a855f7",
    accentTint: "#f3e8ff",
    accentText: "#7e22ce",
    accentShadow: "rgba(168,85,247,0.30)",
    url: null,
    status: "coming-soon",
  },
  {
    id: "zip",
    iconId: "zip",
    name: "Zip",
    tagline: "Connect the numbers in order, filling every cell on the path.",
    accent: "#f97316",
    accentTint: "#ffedd5",
    accentText: "#c2410c",
    accentShadow: "rgba(249,115,22,0.30)",
    url: null,
    status: "coming-soon",
  },
  {
    id: "starbattle",
    iconId: "starbattle",
    name: "Star Battle",
    tagline: "Position the stars so none touch, in every row, column and region.",
    accent: "#6366f1",
    accentTint: "#e0e7ff",
    accentText: "#4338ca",
    accentShadow: "rgba(99,102,241,0.30)",
    url: null,
    status: "coming-soon",
  },
  {
    id: "bridges",
    iconId: "bridges",
    name: "Bridges",
    tagline: "Link the islands with the right number of non-crossing bridges.",
    accent: "#06b6d4",
    accentTint: "#cffafe",
    accentText: "#0e7490",
    accentShadow: "rgba(6,182,212,0.30)",
    url: null,
    status: "coming-soon",
  },
];

export const AVAILABLE_COUNT = SOLVERS.filter((s) => s.status === "available").length;
