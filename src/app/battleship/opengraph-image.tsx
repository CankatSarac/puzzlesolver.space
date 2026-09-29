import { OG_SIZE, renderSolverOgImage, solverOgAlt } from "@/lib/og";

export const alt = solverOgAlt("battleship");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderSolverOgImage("battleship");
}
