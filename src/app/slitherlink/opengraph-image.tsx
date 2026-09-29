import { OG_SIZE, renderSolverOgImage, solverOgAlt } from "@/lib/og";

export const alt = solverOgAlt("slitherlink");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderSolverOgImage("slitherlink");
}
