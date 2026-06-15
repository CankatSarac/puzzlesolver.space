import { ImageResponse } from "next/og";
import { SITE } from "@/data/site";
import { AVAILABLE_COUNT } from "@/data/solvers";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#10b981" }} />
          {AVAILABLE_COUNT} logic puzzle solvers live
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
          Solve any logic puzzle,
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#f43f5e", lineHeight: 1.05 }}>
          instantly.
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 36, color: "#6b7280" }}>
          {SITE.domain}
        </div>
      </div>
    ),
    { ...size }
  );
}
