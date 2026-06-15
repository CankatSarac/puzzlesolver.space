/**
 * Custom puzzle-grid icons — one per solver.
 *
 * Each icon shares a rounded "board frame" motif for family cohesion and has a
 * distinct interior glyph for recognizability. All strokes use `currentColor`, so
 * a card's accent color flows in via a single `color` style (and inherits hover).
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const frame = <rect x="3" y="3" width="18" height="18" rx="3.5" />;

/** Tango — sun & moon on a 2×2 grid. */
export function TangoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M12 3v18M3 12h18" />
      <circle cx="7.5" cy="7.5" r="2" fill="currentColor" stroke="none" />
      <path d="M18 14.5a2.4 2.4 0 1 0 0 4 3 3 0 0 1 0-4Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Battleship — ship segments and a water dot in a grid. */
export function BattleshipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity={0.45} />
      <rect x="4.7" y="4.7" width="8.6" height="2.6" rx="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11.8" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="1.05" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Skyscraper — towers of increasing height. */
export function SkyscraperIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M7 17V13M11 17V10.5M15 17V8" />
      <path d="M6 17.2h12" opacity={0.6} />
    </Svg>
  );
}

/** Slitherlink — a single loop threading a dot lattice. */
export function SlitherlinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M8 8h5v5H10.5V11H8Z" />
      {[8, 13, 16].map((x) =>
        [8, 13, 16].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" fill="currentColor" stroke="none" />
        ))
      )}
    </Svg>
  );
}

/** Queens — a crown on the board. */
export function QueensIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M7.5 15.5 6.5 9l3 2.6L12 7.5l2.5 4.1 3-2.6-1 6.5Z" fill="currentColor" stroke="currentColor" strokeWidth={1.2} />
      <path d="M7.5 17.5h9" />
    </Svg>
  );
}

/** Zip — an ordered path connecting numbered nodes. */
export function ZipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M7 7h4v4H7zM7 11v6h6" opacity={0} />
      <path d="M7.5 7.5 16 7.5 16 16 7.5 16" />
      <path d="M7.5 7.5v8.5" opacity={0} />
      <path d="M16 7.5 7.5 16" />
      <circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Star Battle — stars placed so none touch. */
export function StarBattleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <path d="M8.5 6.2l.9 1.9 2 .2-1.5 1.4.45 2L8.5 10.6 6.65 11.7l.45-2L5.6 8.3l2-.2Z" fill="currentColor" stroke="none" />
      <path d="M15.5 13.2l.9 1.9 2 .2-1.5 1.4.45 2-1.85-1.1-1.85 1.1.45-2-1.5-1.4 2-.2Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Bridges — islands linked by bridges. */
export function BridgesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {frame}
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
      <circle cx="16.5" cy="7.5" r="1.6" />
      <path d="M9 6.8h6M9 8.2h6" />
      <path d="M16.5 9.5v5" />
    </Svg>
  );
}

export const PUZZLE_ICONS = {
  tango: TangoIcon,
  battleship: BattleshipIcon,
  skyscraper: SkyscraperIcon,
  slitherlink: SlitherlinkIcon,
  queens: QueensIcon,
  zip: ZipIcon,
  starbattle: StarBattleIcon,
  bridges: BridgesIcon,
} as const;

export type PuzzleIconId = keyof typeof PUZZLE_ICONS;
