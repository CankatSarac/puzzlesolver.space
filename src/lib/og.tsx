import { ImageResponse } from "next/og";
import { SITE } from "@/data/site";
import { SOLVERS } from "@/data/solvers";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Shared 1200×630 social card: cream board background, a status line with a
 * coloured dot, a two-line headline (second line in an accent colour) and the
 * domain. Used by the home card and by every solver route's card.
 */
export function renderOgImage({
  eyebrow,
  dotColor,
  line1,
  line2,
  line2Color,
  footer,
}: {
  eyebrow: string;
  dotColor: string;
  line1: string;
  line2: string;
  line2Color: string;
  footer: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#faf9f6",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(26,26,46,0.06) 2px, transparent 0)",
          backgroundSize: "50px 50px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#6b7280", fontSize: 30 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: dotColor }} />
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 96,
            fontWeight: 800,
            color: "#1a1a2e",
            lineHeight: 1.05,
            marginTop: 24,
          }}
        >
          {line1}
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: line2Color, lineHeight: 1.05 }}>
          {line2}
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 36, color: "#6b7280" }}>{footer}</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

/** Social card for one solver route, e.g. "Tango / Puzzle Solver" in the Tango accent. */
export function renderSolverOgImage(solverId: string) {
  const solver = SOLVERS.find((s) => s.id === solverId);
  if (!solver || !solver.url) throw new Error(`Unknown solver: ${solverId}`);
  return renderOgImage({
    eyebrow: "Free online solver · no signup",
    dotColor: solver.accent,
    line1: solver.name,
    line2: "Puzzle Solver",
    line2Color: solver.accentText,
    footer: `${SITE.domain}${solver.url}`,
  });
}

export function solverOgAlt(solverId: string) {
  const solver = SOLVERS.find((s) => s.id === solverId);
  return `${solver?.name ?? "Puzzle"} Puzzle Solver — free online solver on ${SITE.name}`;
}
