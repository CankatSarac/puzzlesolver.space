"use client";

import { motion } from "framer-motion";
import { SOLVERS } from "@/data/solvers";
import { SolverCard } from "./SolverCard";

export function SolverGrid() {
  return (
    <section id="solvers" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-12">
      <div className="mb-10 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
          Pick your puzzle
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[var(--color-muted)]">
          Every solver is free and runs right in your browser.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {SOLVERS.map((solver) => (
          <motion.div
            key={solver.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <SolverCard solver={solver} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
