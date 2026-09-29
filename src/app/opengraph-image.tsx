import { SITE } from "@/data/site";
import { AVAILABLE_COUNT } from "@/data/solvers";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = SITE.title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderOgImage({
    eyebrow: `${AVAILABLE_COUNT} logic puzzle solvers live`,
    dotColor: "#10b981",
    line1: "Solve any logic puzzle,",
    line2: "instantly.",
    line2Color: "#f43f5e",
    footer: SITE.domain,
  });
}
