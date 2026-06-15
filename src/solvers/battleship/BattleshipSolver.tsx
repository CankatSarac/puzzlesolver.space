"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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

export default function BattleshipSolver() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [gridSize, setGridSize] = useState(10)
  const [grid, setGrid] = useState<Grid>([])
  const [clues, setClues] = useState<Clues>({ left: [], top: [], cells: {} })
  const [solved, setSolved] = useState(false)
  const [solution, setSolution] = useState<any>(null)
  const [showControls, setShowControls] = useState(true)

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Initialize grid and clues
  const initializeGrid = useCallback(() => {
    const newGrid: Grid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(""))
    const newClues: Clues = {
      left: Array(gridSize).fill(null),
      top: Array(gridSize).fill(null),
      cells: {},
    }
    setGrid(newGrid)
    setClues(newClues)
    setSolved(false)
    setSolution(null)
  }, [gridSize])

  useEffect(() => {
    initializeGrid()
  }, [initializeGrid])

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
  }

  // Handle clue changes
  const updateClue = (direction: "left" | "top", index: number, value: string) => {
    const num = value === "" ? null : Number.parseInt(value)
    if (num !== null && (num < 0 || num > gridSize)) return

    const newClues = { ...clues }
    newClues[direction][index] = num
    setClues(newClues)
    setSolved(false)
    setSolution(null)
  }

  // Reset puzzle
  const resetPuzzle = () => {
    initializeGrid()
  }

  // Solve puzzle
  const solvePuzzle = () => {
    const puzzle: BattleshipPuzzle = {
      rows: gridSize,
      cols: gridSize,
      clues: clues,
    }

    try {
      const result = solveBattleshipPuzzle(puzzle)
      setSolution(result)

      if (result.valid) {
        const formattedGrid = formatBattleshipSolution(result)
        setGrid(formattedGrid)
        setSolved(true)
      } else {
        setSolved(false)
        alert("No solution found. Please check your clues.")
      }
    } catch (error) {
      console.error("Solver error:", error)
      alert("Error solving puzzle. Please check your clues.")
    }
  }

  // Load example puzzle
  const loadExample = () => {
    const newGrid: Grid = Array(10)
      .fill(null)
      .map(() => Array(10).fill(""))
    const newClues: Clues = {
      left: [2, 1, 2, 1, 4, 0, 3, 1, 2, 4],
      top: [3, 1, 2, 2, 1, 2, 1, 1, 3, 4],
      cells: {
        "1,3": "o", // Single ship
        "4,0": "d", // Ship top
        "7,8": "w", // Water
      },
    }

    // Update grid with example clues
    newGrid[1][3] = "o"
    newGrid[4][0] = "d"
    newGrid[7][8] = "w"

    setGrid(newGrid)
    setClues(newClues)
    setSolved(false)
    setSolution(null)
  }
  // Copy to clipboard
  const copyToClipboard = () => {
    const gridString = grid.map((row) => row.map((cell) => cell ?? ".").join(" ")).join("\n")
    navigator.clipboard.writeText(gridString)
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battleship solver...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Battleship Puzzle Solver</CardTitle>
            <p className="text-gray-600">
              Free online Battleship puzzle solver with interactive grid. Place ships according to row/column clues.
              Ships cannot touch each other, even diagonally.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="grid-size">Grid Size:</Label>
                <Select
                  value={gridSize.toString()}
                  onValueChange={(value: string) => setGridSize(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8×8</SelectItem>
                    <SelectItem value="10">10×10</SelectItem>
                    <SelectItem value="12">12×12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={solvePuzzle} variant="default">
                Solve Puzzle
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

            {solved && (
              <div className="text-center">
                <Badge className="text-lg px-4 py-2 bg-green-600">✓ Puzzle Solved!</Badge>
              </div>
            )}

            <Separator />

            {/* Puzzle Grid */}
            <div className="flex justify-center">
              <div className="inline-block">
                {/* Top clues */}
                <div className="flex">
                  <div className="w-8 h-8"></div>
                  {clues.top.map((clue, i) => (
                    <div key={i} className="w-8 h-8 flex items-center justify-center">
                      <Input
                        type="text"
                        value={clue ?? ""}
                        onChange={(e) => updateClue("top", i, e.target.value)}
                        className="w-6 h-6 text-center text-xs border-gray-300 p-0"
                        maxLength={2}
                      />
                    </div>
                  ))}
                  <div className="w-8 h-8"></div>
                </div>

                {/* Main grid with left clues */}
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {/* Left clue */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Input
                        type="text"
                        value={clues.left[rowIndex] ?? ""}
                        onChange={(e) => updateClue("left", rowIndex, e.target.value)}
                        className="w-6 h-6 text-center text-xs border-gray-300 p-0"
                        maxLength={2}
                      />
                    </div>

                    {/* Grid cells */}
                    {row.map((cell, colIndex) => (
                      <div key={colIndex} className="w-8 h-8 flex items-center justify-center">
                        <Select
                          value={cell === "" ? "empty" : cell}
                          onValueChange={(value) => updateGridCell(rowIndex, colIndex, value)}
                        >
                          <SelectTrigger className="w-6 h-6 text-xs border-2 border-gray-400 p-0">
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

                    <div className="w-8 h-8"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {showControls && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">How to Play</CardTitle>
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
                <CardTitle className="text-lg text-center">About the Developer</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  This Battleship puzzle solver was created with passion for puzzle games and web development.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => window.open("https://www.linkedin.com/in/cankatsarac/", "_blank")}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Connect on LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open("https://buymeacoffee.com/cankatsarac", "_blank")}
                    className="flex items-center gap-2 text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-.766-1.613a4.44 4.44 0 0 0-1.364-1.04c-.476-.275-1.039-.428-1.612-.428-.297 0-.583.034-.863.1-.274.065-.54.159-.795.275-.255.117-.49.256-.713.416-.222.16-.425.344-.61.548a2.8 2.8 0 0 0-.438.65 18.84 18.84 0 0 0-.401.968c-.074.204-.12.417-.138.632-.018.218-.006.438.038.649.044.21.123.413.232.598.109.185.249.35.417.49.17.14.363.25.577.327.214.077.439.117.663.117.224 0 .447-.04.663-.117.214-.077.406-.188.577-.327.168-.14.308-.305.417-.49.109-.185.188-.388.232-.598.044-.211.056-.431.038-.649-.018-.215-.064-.428-.138-.632a18.84 18.84 0 0 0-.401-.968 2.8 2.8 0 0 0-.438-.65 4.44 4.44 0 0 0-.61-.548c-.223-.16-.458-.299-.713-.416a4.478 4.478 0 0 0-.795-.275 4.44 4.44 0 0 0-.863-.1c-.573 0-1.136.153-1.612.428a4.44 4.44 0 0 0-1.364 1.04c-.378.45-.647 1.015-.766 1.613L3.784 6.415c-.02.1-.029.202-.026.304.003.102.017.203.041.301.024.098.058.194.101.284.043.09.095.174.154.251.059.077.125.147.198.21.073.063.153.119.238.167.085.048.175.088.268.119.093.031.189.053.286.065.097.012.195.014.292.006.097-.008.193-.026.286-.053.093-.027.183-.063.268-.108.085-.045.165-.099.238-.162.073-.063.139-.133.198-.21.059-.077.111-.161.154-.251.043-.09.077-.186.101-.284.024-.098.038-.199.041-.301.003-.102-.006-.204-.026-.304z" />
                    </svg>
                    Buy Me a Coffee
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
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
