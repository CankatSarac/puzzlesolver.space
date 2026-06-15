"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import type { CSSProperties } from "react";
import { PUZZLE_ICONS } from "@/components/PuzzleIcons";
import type { Solver } from "@/data/solvers";

type AccentStyle = CSSProperties & {
  "--accent": string;
  "--accent-shadow": string;
};

export function SolverCard({ solver }: { solver: Solver }) {
  const reduce = useReducedMotion();
  const isAvailable = solver.status === "available";
  const Icon = PUZZLE_ICONS[solver.iconId];
  const style: AccentStyle = {
    "--accent": solver.accent,
    "--accent-shadow": solver.accentShadow,
  };

  const inner = (
    <>
      {isAvailable && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 rounded-t-card"
          style={{ backgroundColor: solver.accent }}
        />
      )}
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: isAvailable ? solver.accentTint : "hsl(var(--muted))",
            color: isAvailable ? solver.accent : "hsl(var(--subtle))",
          }}
        >
          <Icon className="h-8 w-8" />
        </span>
        {isAvailable ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ color: solver.accentText, backgroundColor: solver.accentTint }}
          >
            Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-subtle">
            <Lock size={11} />
            Coming soon
          </span>
        )}
      </div>

      <h3 className="mt-5 font-display text-2xl font-bold text-ink">{solver.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-subtle">{solver.tagline}</p>

      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold">
        {isAvailable ? (
          <span className="flex items-center gap-1.5" style={{ color: solver.accentText }}>
            Open solver
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        ) : (
          <span className="text-subtle">In development</span>
        )}
      </div>
    </>
  );

  const base =
    "solver-card group relative block h-full rounded-card border p-6 text-left";

  if (!isAvailable) {
    return (
      <div style={style} className={`${base} border-line bg-canvas`}>
        {inner}
      </div>
    );
  }

  return (
    <motion.div whileHover={reduce ? undefined : { y: -6 }} transition={{ type: "spring", stiffness: 320, damping: 22 }}>
      <Link href={solver.url ?? "#"} style={style} className={`${base} border-line bg-white`}>
        {inner}
      </Link>
    </motion.div>
  );
}
