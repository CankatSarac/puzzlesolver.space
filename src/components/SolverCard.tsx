"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import type { CSSProperties } from "react";
import type { Solver } from "@/data/solvers";

type AccentStyle = CSSProperties & { "--accent": string };

export function SolverCard({ solver }: { solver: Solver }) {
  const isAvailable = solver.status === "available";
  const style: AccentStyle = { "--accent": solver.accent };

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: `color-mix(in srgb, var(--accent) 14%, white)` }}
        >
          {solver.icon}
        </span>
        {isAvailable ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              color: "var(--accent)",
              backgroundColor: `color-mix(in srgb, var(--accent) 12%, white)`,
            }}
          >
            Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
            <Lock size={11} />
            Coming soon
          </span>
        )}
      </div>

      <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold">
        {solver.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
        {solver.tagline}
      </p>

      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold" style={{ color: isAvailable ? "var(--accent)" : "var(--color-muted)" }}>
        {isAvailable ? (
          <>
            Solve now
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </>
        ) : (
          <span className="text-[var(--color-muted)]">In development</span>
        )}
      </div>
    </>
  );

  const baseClass =
    "group relative block h-full rounded-[var(--radius-card)] border bg-white p-6 text-left transition-shadow";

  if (!isAvailable) {
    return (
      <div
        style={style}
        aria-disabled
        className={`${baseClass} cursor-default border-[var(--color-line)] opacity-70`}
      >
        {inner}
      </div>
    );
  }

  return (
    <motion.a
      href={solver.url ?? "#"}
      style={style}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`${baseClass} border-[var(--color-line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,white)] hover:shadow-[0_18px_40px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)]`}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 rounded-t-[var(--radius-card)]"
        style={{ backgroundColor: "var(--accent)" }}
      />
      {inner}
    </motion.a>
  );
}
