"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { solveSkyscraper, type Clues, type Solution } from "./skyscraper-solver";

import { PuzzleTools } from '@/learning/PuzzleTools';

type ClueSide = keyof Clues;

const SIDES: ClueSide[] = ["top", "bottom", "left", "right"];

/** Spoken name for an edge clue, e.g. "Top clue, column 2" or "Left clue, row 3". */
function clueLabel(side: ClueSide, i: number) {
  const edge = side[0].toUpperCase() + side.slice(1);
  const line = side === "top" || side === "bottom" ? "column" : "row";
  return `${edge} clue, ${line} ${i + 1}`;
}

function emptyClues(size: number): Clues {
  return {
    top: Array(size).fill(null),
    bottom: Array(size).fill(null),
    left: Array(size).fill(null),
    right: Array(size).fill(null),
  };
}

// A verified, uniquely-solvable 4×4 example.
// Solution grid: [[2,1,4,3],[3,4,1,2],[4,3,2,1],[1,2,3,4]].
const EXAMPLE_4: Clues = {
  top: [3, 2, 1, 2],
  bottom: [2, 3, 2, 1],
  left: [2, 2, 1, 4],
  right: [2, 2, 4, 1],
};

export default function SkyscraperSolver() {
  const [size, setSize] = useState(4);
  const [clues, setClues] = useState<Clues>(() => emptyClues(4));
  const [learningGrid,setLearningGrid]=useState<(number|null)[][]>(()=>Array.from({length:4},()=>Array(4).fill(null)));
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [index, setIndex] = useState(0);
  const [solving, setSolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resetTo = useCallback((nextSize: number, nextClues?: Clues) => {
    setLearningGrid(Array.from({length:nextSize},()=>Array(nextSize).fill(null)));
    setSize(nextSize);
    setClues(nextClues ?? emptyClues(nextSize));
    setSolutions([]);
    setIndex(0);
    setMessage(null);
  }, []);

  const setClue = (side: ClueSide, i: number, raw: string) => {
    const n = raw.trim() === "" ? null : Number.parseInt(raw, 10);
    const value = n !== null && Number.isFinite(n) && n >= 1 && n <= size ? n : null;
    setLearningGrid(Array.from({length:size},()=>Array(size).fill(null)));
    setClues((prev) => {
      const next = { ...prev, [side]: [...prev[side]] };
      next[side][i] = value;
      return next;
    });
    setSolutions([]);
    setMessage(null);
  };

  const handleSolve = () => {
    setSolving(true);
    setMessage(null);
    // Defer so the "Solving…" state can paint before the synchronous solve.
    setTimeout(() => {
      try {
        const result = solveSkyscraper(size, clues);
        const found = result.solutions.filter((s) => s.valid);
        setSolutions(found);
        setIndex(0);
        setMessage(
          found.length === 0
            ? result.stopped
              ? "The search took too long and was stopped. Add more clues or check the ones you entered."
              : "No solution found. Check that the clues are consistent."
            : found.length >= 10 || result.stopped
              ? `Found ${found.length}+ solutions (showing the first ${found.length}) — add more clues to narrow it down.`
              : `Found ${found.length} solution${found.length > 1 ? "s" : ""}.`
        );
      } catch {
        setMessage("Something went wrong while solving. Please review the clues.");
      } finally {
        setSolving(false);
      }
    }, 20);
  };

  const current = solutions[index]?.grid ?? learningGrid;

  // Build a (size+2) grid template: clue gutters around the board.
  const dim = size + 2;
  const clueInput = (side: ClueSide, i: number) => (
    <input
      key={`${side}-${i}`}
      inputMode="numeric"
      aria-label={clueLabel(side, i)}
      value={clues[side][i] ?? ""}
      onChange={(e) => setClue(side, i, e.target.value)}
      className="h-9 w-9 rounded-md border border-amber-200 bg-amber-50 text-center text-base font-semibold text-amber-700 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:h-12 sm:w-12 sm:text-sm"
    />
  );

  const blank = (key: string) => <div key={key} className="h-9 w-9 sm:h-12 sm:w-12" />;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      const onTop = r === 0;
      const onBottom = r === dim - 1;
      const onLeft = c === 0;
      const onRight = c === dim - 1;
      const corner = (onTop || onBottom) && (onLeft || onRight);
      const key = `${r}-${c}`;
      if (corner) {
        cells.push(blank(key));
      } else if (onTop) {
        cells.push(clueInput("top", c - 1));
      } else if (onBottom) {
        cells.push(clueInput("bottom", c - 1));
      } else if (onLeft) {
        cells.push(clueInput("left", r - 1));
      } else if (onRight) {
        cells.push(clueInput("right", r - 1));
      } else {
        const value = current ? current[r - 1][c - 1] : null;
        cells.push(
          <div
            key={key}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-base font-bold text-gray-800 sm:h-12 sm:w-12 sm:text-lg"
          >
            {value ?? ""}
          </div>
        );
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-10 sm:px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Skyscraper Puzzle Solver</h1>
          <p className="mt-2 text-gray-600">
            Enter the edge clues — each counts how many skyscrapers are visible from that side —
            and solve the grid automatically.
          </p>
        </div>

        <Card>
          <CardHeader className="px-3 sm:px-6">
            <h2 className="flex items-center justify-between gap-3 text-2xl font-semibold leading-none tracking-tight">
              <span>Puzzle</span>
              {solutions.length > 0 && (
                <Badge variant="secondary">
                  Solution {index + 1} / {solutions.length}
                </Badge>
              )}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6 px-3 sm:px-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="grid-size">Grid size</Label>
                <Select value={String(size)} onValueChange={(v) => resetTo(Number.parseInt(v, 10))}>
                  <SelectTrigger id="grid-size" aria-label={`Grid size: ${size} by ${size}`} className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} × {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => resetTo(4, EXAMPLE_4)}>
                Load 4×4 example
              </Button>
              <Button variant="outline" onClick={() => resetTo(size)}>
                Clear
              </Button>
            </div>

            <Separator />
            <PuzzleTools type="skyscraper" value={{type:'skyscraper',size,clues,grid:learningGrid}} active={!solving && solutions.length===0} onReset={()=>resetTo(size)} onRestore={saved=>{if(saved.type!=='skyscraper')return;setSize(saved.size);setClues(saved.clues);setLearningGrid(saved.grid);setSolutions([]);setIndex(0);setMessage(null);}} />

            {/* Scrolls inside this box (from the first column) if a screen is still too narrow. */}
            <div className="overflow-x-auto py-2">
              <div
                className="mx-auto grid w-max gap-1"
                style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, max-content))` }}
              >
                {cells}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSolve} disabled={solving} className="bg-amber-700 hover:bg-amber-800">
                {solving ? "Solving…" : "Solve puzzle"}
              </Button>
              {solutions.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIndex((i) => Math.min(solutions.length - 1, i + 1))}
                    disabled={index === solutions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Always mounted (empty when idle) so screen readers announce each result. */}
            <p
              role="status"
              aria-live="polite"
              className={`text-sm font-medium empty:!mt-0 ${
                solutions.length > 0 ? "text-green-700" : "text-orange-700"
              }`}
            >
              {message}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">How to play</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Fill the grid with heights 1–{size}, each used once per row and column.</p>
            <p>• A clue counts how many buildings are visible from that edge — taller ones hide shorter ones behind them.</p>
            <p>• Leave a clue blank if it is not given. {SIDES.length} edges are supported: top, bottom, left, right.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
