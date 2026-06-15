"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { solveSkyscraperPuzzle, type Clues, type Solution } from "./skyscraper-solver";

type ClueSide = keyof Clues;

const SIDES: ClueSide[] = ["top", "bottom", "left", "right"];

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
  const [isHydrated, setIsHydrated] = useState(false);
  const [size, setSize] = useState(4);
  const [clues, setClues] = useState<Clues>(() => emptyClues(4));
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [index, setIndex] = useState(0);
  const [solving, setSolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => setIsHydrated(true), []);

  const resetTo = useCallback((nextSize: number, nextClues?: Clues) => {
    setSize(nextSize);
    setClues(nextClues ?? emptyClues(nextSize));
    setSolutions([]);
    setIndex(0);
    setMessage(null);
  }, []);

  const setClue = (side: ClueSide, i: number, raw: string) => {
    const n = raw.trim() === "" ? null : Number.parseInt(raw, 10);
    const value = n !== null && Number.isFinite(n) && n >= 1 && n <= size ? n : null;
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
        const found = solveSkyscraperPuzzle(size, clues).filter((s) => s.valid);
        setSolutions(found);
        setIndex(0);
        setMessage(
          found.length === 0
            ? "No solution found. Check that the clues are consistent."
            : found.length >= 10
              ? "Found 10+ solutions (showing the first 10) — add more clues to narrow it down."
              : `Found ${found.length} solution${found.length > 1 ? "s" : ""}.`
        );
      } catch {
        setMessage("Something went wrong while solving. Please review the clues.");
      } finally {
        setSolving(false);
      }
    }, 20);
  };

  const current = solutions[index]?.grid ?? null;

  // Build a (size+2) grid template: clue gutters around the board.
  const dim = size + 2;
  const clueInput = (side: ClueSide, i: number) => (
    <input
      key={`${side}-${i}`}
      inputMode="numeric"
      aria-label={`${side} clue ${i + 1}`}
      value={clues[side][i] ?? ""}
      onChange={(e) => setClue(side, i, e.target.value)}
      className="h-10 w-10 rounded-md border border-amber-200 bg-amber-50 text-center text-sm font-semibold text-amber-700 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:h-12 sm:w-12"
    />
  );

  const blank = (key: string) => <div key={key} className="h-10 w-10 sm:h-12 sm:w-12" />;

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
            className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-base font-bold text-gray-800 sm:h-12 sm:w-12 sm:text-lg"
          >
            {value ?? ""}
          </div>
        );
      }
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading skyscraper solver…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Skyscraper Puzzle Solver</h1>
          <p className="mt-2 text-gray-600">
            Enter the edge clues — each counts how many skyscrapers are visible from that side —
            and solve the grid automatically.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Puzzle</span>
              {solutions.length > 0 && (
                <Badge variant="secondary">
                  Solution {index + 1} / {solutions.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label>Grid size</Label>
                <Select value={String(size)} onValueChange={(v) => resetTo(Number.parseInt(v, 10))}>
                  <SelectTrigger className="w-32">
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

            <div className="flex justify-center overflow-x-auto py-2">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, max-content))` }}
              >
                {cells}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSolve} disabled={solving} className="bg-amber-600 hover:bg-amber-700">
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

            {message && (
              <p
                className={`text-sm font-medium ${
                  solutions.length > 0 ? "text-green-700" : "text-orange-600"
                }`}
              >
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to play</CardTitle>
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
