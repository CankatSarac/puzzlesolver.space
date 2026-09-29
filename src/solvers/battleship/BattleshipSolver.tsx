"use client"

import { useState } from "react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SITE } from "@/data/site"
import { solveBattleshipPuzzle, formatBattleshipSolution, type BattleshipPuzzle } from "./battleship-solver"

type Grid = string[][]
type Clues = {
  left: (number | null)[] // Row counts
  top: (number | null)[] // Column counts
  cells: { [key: string]: string } // Cell clues (o, d, l, r, u, m, w)
}

const CELL_TYPES = {
  empty: "Water/Empty",
  o: "● Single ship",
  d: "▲ Ship top",
  u: "▼ Ship bottom",
  l: "◄ Ship left",
  r: "► Ship right",
  m: "■ Ship middle",
  w: "~ Water",
}

/** Spoken names for cell values, used in each cell's accessible name. */
const CELL_NAMES: Record<string, string> = {
  "": "empty",
  o: "single ship",
  d: "ship top end",
  u: "ship bottom end",
  l: "ship left end",
  r: "ship right end",
  m: "ship middle",
  w: "water",
}

const DEFAULT_GRID_SIZE = 10

const emptyGrid = (size: number): Grid => Array.from({ length: size }, () => Array(size).fill(""))
const emptyClues = (size: number): Clues => ({
  left: Array(size).fill(null),
  top: Array(size).fill(null),
  cells: {},
})

export default function BattleshipSolver() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE)
  // Built synchronously so the server-rendered HTML already contains the board.
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(DEFAULT_GRID_SIZE))
  const [clues, setClues] = useState<Clues>(() => emptyClues(DEFAULT_GRID_SIZE))
  const [solved, setSolved] = useState(false)
  const [solution, setSolution] = useState<any>(null)
  const [showControls, setShowControls] = useState(true)
  const [solving, setSolving] = useState(false)
  const [status, setStatus] = useState<{ tone: "success" | "info" | "error"; text: string } | null>(null)

  // Reset grid and clues (optionally to a new size)
  const initializeGrid = (size: number = gridSize) => {
    setGrid(emptyGrid(size))
    setClues(emptyClues(size))
    setSolved(false)
    setSolution(null)
    setStatus(null)
  }

  // Handle grid cell changes
  const updateGridCell = (row: number, col: number, value: string) => {
    const newGrid = [...grid]
    const actualValue = value === "empty" ? "" : value
    newGrid[row][col] = actualValue
    setGrid(newGrid)

    // Update cell clues
    const newClues = { ...clues }
    const key = `${row},${col}`
    if (actualValue === "") {
      delete newClues.cells[key]
    } else {
      newClues.cells[key] = actualValue
    }
    setClues(newClues)
    setSolved(false)
    setSolution(null)
    setStatus(null)
  }

  // Handle clue changes
  const updateClue = (direction: "left" | "top", index: number, value: string) => {
    const num = value === "" ? null : Number.parseInt(value)
    if (num !== null && (Number.isNaN(num) || num < 0 || num > gridSize)) return

    const newClues = { ...clues }
    newClues[direction][index] = num
    setClues(newClues)
    setSolved(false)
    setSolution(null)
    setStatus(null)
  }

  // Reset puzzle
  const resetPuzzle = () => {
    initializeGrid()
  }

  // Solve puzzle. Deferred a tick so the "Solving…" state can paint before the synchronous search.
  const solvePuzzle = () => {
    const puzzle: BattleshipPuzzle = {
      rows: gridSize,
      cols: gridSize,
      clues: clues,
    }

    setSolving(true)
    setStatus(null)
    setTimeout(() => {
      try {
        const result = solveBattleshipPuzzle(puzzle)
        setSolution(result)

        if (result.valid) {
          setGrid(formatBattleshipSolution(result))
          setSolved(true)
          setStatus(
            result.multiple
              ? { tone: "info", text: "More than one arrangement fits these clues. This is one of them; add a hint to pin it down." }
              : { tone: "success", text: "This is the only arrangement that fits the clues." },
          )
        } else {
          setSolved(false)
          setStatus({ tone: "error", text: result.message ?? "No solution found. Please check your clues." })
        }
      } catch (error) {
        console.error("Solver error:", error)
        setStatus({ tone: "error", text: "Something went wrong while solving. Please check your clues." })
      } finally {
        setSolving(false)
      }
    }, 20)
  }

  // Load example puzzle: a verified 10×10 puzzle with a single solution.
  const loadExample = () => {
    const newGrid: Grid = emptyGrid(10)
    const newClues: Clues = {
      left: [2, 1, 2, 1, 5, 1, 2, 1, 3, 2],
      top: [5, 0, 0, 3, 2, 5, 1, 1, 1, 2],
      cells: {
        "1,9": "d", // Ship top (row 2, column 10)
        "7,0": "m", // Ship middle (row 8, column 1)
      },
    }

    // Update grid with example clues
    for (const [key, value] of Object.entries(newClues.cells)) {
      const [r, c] = key.split(",").map(Number)
      newGrid[r][c] = value
    }

    setGridSize(10)
    setGrid(newGrid)
    setClues(newClues)
    setSolved(false)
    setSolution(null)
    setStatus(null)
  }
  // Copy to clipboard
  const copyToClipboard = () => {
    const gridString = grid.map((row) => row.map((cell) => cell || ".").join(" ")).join("\n")
    navigator.clipboard.writeText(gridString)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader className="text-center px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight">Battleship Puzzle Solver</h1>
            <p className="text-gray-600">
              Free online Battleship puzzle solver with interactive grid. Place ships according to row/column clues.
              Ships cannot touch each other, even diagonally.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-3 sm:px-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="grid-size">Grid Size:</Label>
                <Select
                  value={gridSize.toString()}
                  onValueChange={(value: string) => {
                    const newSize = Number.parseInt(value)
                    setGridSize(newSize)
                    initializeGrid(newSize)
                  }}
                >
                  <SelectTrigger id="grid-size" aria-label={`Grid size: ${gridSize} by ${gridSize}`} className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8×8</SelectItem>
                    <SelectItem value="10">10×10</SelectItem>
                    <SelectItem value="12">12×12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={solvePuzzle} variant="default" disabled={solving}>
                {solving ? "Solving…" : "Solve Puzzle"}
              </Button>

              <Button onClick={resetPuzzle} variant="outline">
                Reset
              </Button>

              <Button onClick={() => setShowControls(!showControls)} variant="outline">
                {showControls ? "Hide" : "Show"} Controls
              </Button>

              <Button onClick={loadExample} variant="outline">
                Load Example
              </Button>

              <Button onClick={copyToClipboard} variant="outline">
                Copy Grid
              </Button>
            </div>

            {/* Solve result. Always mounted (empty when idle) so screen readers announce changes. */}
            <div role="status" aria-live="polite" className="space-y-2 text-center empty:!mt-0">
              {solved && <Badge className="text-lg px-4 py-2 bg-green-600">✓ Puzzle Solved!</Badge>}
              {status && (
                <p
                  className={`text-sm font-medium ${
                    status.tone === "error" ? "text-red-700" : status.tone === "info" ? "text-blue-800" : "text-green-700"
                  }`}
                >
                  {status.text}
                </p>
              )}
            </div>

            <Separator />

            {/* Puzzle Grid. Boxes shrink a little on phones; anything still too wide
                scrolls inside this box, starting from the clue column. */}
            <div className="overflow-x-auto py-1">
              <div className="mx-auto w-max">
                {/* Top clues */}
                <div className="flex">
                  <div className="w-[26px] h-[26px] sm:w-8 sm:h-8"></div>
                  {clues.top.map((clue, i) => (
                    <div key={i} className="w-[26px] h-[26px] sm:w-8 sm:h-8 flex items-center justify-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Column ${i + 1} ship count`}
                        value={clue ?? ""}
                        onChange={(e) => updateClue("top", i, e.target.value)}
                        className="w-6 h-6 text-center text-xs max-sm:text-base border-gray-300 p-0"
                        maxLength={2}
                      />
                    </div>
                  ))}
                  <div className="hidden sm:block w-8 h-8"></div>
                </div>

                {/* Main grid with left clues */}
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {/* Left clue */}
                    <div className="w-[26px] h-[26px] sm:w-8 sm:h-8 flex items-center justify-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Row ${rowIndex + 1} ship count`}
                        value={clues.left[rowIndex] ?? ""}
                        onChange={(e) => updateClue("left", rowIndex, e.target.value)}
                        className="w-6 h-6 text-center text-xs max-sm:text-base border-gray-300 p-0"
                        maxLength={2}
                      />
                    </div>

                    {/* Grid cells */}
                    {row.map((cell, colIndex) => (
                      <div key={colIndex} className="w-[26px] h-[26px] sm:w-8 sm:h-8 flex items-center justify-center">
                        <Select
                          value={cell === "" ? "empty" : cell}
                          onValueChange={(value) => updateGridCell(rowIndex, colIndex, value)}
                        >
                          <SelectTrigger
                            aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}: ${CELL_NAMES[cell] ?? cell}`}
                            className="w-6 h-6 text-xs border-2 border-gray-400 p-0"
                          >
                            <SelectValue>
                              <span className="text-xs">
                                {cell === ""
                                  ? ""
                                  : cell === "o"
                                    ? "●"
                                    : cell === "d"
                                      ? "▲"
                                      : cell === "u"
                                        ? "▼"
                                        : cell === "l"
                                          ? "◄"
                                          : cell === "r"
                                            ? "►"
                                            : cell === "m"
                                              ? "■"
                                              : cell === "w"
                                                ? "~"
                                                : cell}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CELL_TYPES).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <div className="hidden sm:block w-8 h-8"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {showControls && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <h2 className="text-lg font-semibold tracking-tight">How to Play</h2>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Place ships on the grid according to the row and column count clues</p>
                  <p>• Ships cannot touch each other, not even diagonally</p>
                  <p>• Use the dropdown menus to place ship parts or water</p>
                  <p>• Standard fleet: 1×4 battleship, 2×3 cruisers, 3×2 destroyers, 4×1 submarines</p>
                  <p>• Numbers around the edge show how many ship segments are in that row/column</p>
                  <p>• Ship symbols: ● (single), ▲▼ (vertical ends), ◄► (horizontal ends), ■ (middle), ~ (water)</p>
                  <p>• Click "Solve Puzzle" to automatically solve the current puzzle</p>
                </CardContent>
              </Card>
            )}

            {/* Developer Contact Section */}
            <Card className="bg-gray-100 border-gray-200">
              <CardHeader>
                <h2 className="text-lg font-semibold tracking-tight text-center">About the Developer</h2>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  This Battleship puzzle solver was created with passion for puzzle games and web development.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <a href={SITE.links.linkedin} target="_blank" rel="noopener noreferrer">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      Connect on LinkedIn
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex items-center gap-2 text-orange-700 border-orange-700 hover:bg-orange-50 hover:text-orange-800"
                  >
                    <a href={SITE.links.buyMeACoffee} target="_blank" rel="noopener noreferrer">
                      <Coffee aria-hidden="true" />
                      Buy Me a Coffee
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  If you enjoy this puzzle solver, consider connecting or supporting future development!
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
