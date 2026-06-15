import type { Config } from "tailwindcss";

/**
 * Tailwind v3 + shadcn config for the unified PuzzleSolver app.
 *
 * - shadcn HSL tokens (background/foreground/primary/...) drive the shared ui/ components.
 * - Custom "Playful Puzzle Board" tokens (canvas, ink, subtle, line, font-display, rounded-card)
 *   are first-class utilities. They use the `hsl(var(--x) / <alpha-value>)` form so opacity
 *   modifiers like `bg-canvas/80` work (the Header frosted-glass relies on this).
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn tokens (consumed by src/components/ui/*)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Playful Puzzle Board design tokens
        canvas: "hsl(var(--canvas) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        subtle: "hsl(var(--subtle) / <alpha-value>)",
        line: "hsl(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
