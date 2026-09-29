"use client"

import { useRef, useState } from "react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SITE } from "@/data/site"
import { solveSlitherlink, type EdgeState } from "./slitherlink-solver"

type Grid = (number | string | null)[][]
type HorizontalEdges = EdgeState[][]
type VerticalEdges = EdgeState[][]

/** The solver lists at most this many solutions. */
const MAX_SOLUTIONS = 20

// Board geometry in SVG units. Dots sit PAD + i × PITCH from the top-left corner. Around every
// edge there is a 2 × BAND strip that toggles it; the square left inside each cell holds the clue
// input. The board never shrinks below MIN_SCALE, so both stay at least 24 CSS px on phones.
const PITCH = 60
const PAD = 15
const BAND = 15
const MIN_SCALE = 0.8
const dot = (i: number) => PAD + i * PITCH

const EDGE_STATE_NAMES: Record<EdgeState, string> = { empty: "empty", line: "line", cross: "cross" }

const DEFAULT_GRID_SIZE = 5

// Built synchronously so the server-rendered HTML already contains the board.
const emptyGrid = (size: number): Grid => Array.from({ length: size }, () => Array(size).fill(null))
// Horizontal edges: (size + 1) rows × size columns; vertical edges: size rows × (size + 1) columns
const emptyHorizontalEdges = (size: number): HorizontalEdges =>
  Array.from({ length: size + 1 }, () => Array<EdgeState>(size).fill("empty"))
const emptyVerticalEdges = (size: number): VerticalEdges =>
  Array.from({ length: size }, () => Array<EdgeState>(size + 1).fill("empty"))

export default function SlitherlinkSolver() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE)
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(DEFAULT_GRID_SIZE))
  const [horizontalEdges, setHorizontalEdges] = useState<HorizontalEdges>(() => emptyHorizontalEdges(DEFAULT_GRID_SIZE))
  const [verticalEdges, setVerticalEdges] = useState<VerticalEdges>(() => emptyVerticalEdges(DEFAULT_GRID_SIZE))
  const [solved, setSolved] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [solutionCount, setSolutionCount] = useState(0)
  const [solutionsCapped, setSolutionsCapped] = useState(false)
  const [currentExample, setCurrentExample] = useState(0)
  const [allSolutions, setAllSolutions] = useState<{ horizontal: HorizontalEdges; vertical: VerticalEdges }[]>([])
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0)
  const [showAllSolutions, setShowAllSolutions] = useState(false)
  const [showComplexPuzzleDialog, setShowComplexPuzzleDialog] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  } | null>(null)
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear the edges (lines and crosses) but keep the clues
  const clearEdges = (size: number = gridSize) => {
    setHorizontalEdges(emptyHorizontalEdges(size))
    setVerticalEdges(emptyVerticalEdges(size))
    setSolved(false)
  }

  // Reset grid and edges (optionally to a new size)
  const initializeGrid = (size: number = gridSize) => {
    setGrid(emptyGrid(size))
    clearEdges(size)
  }

  // Solve: a backtracking search for single closed loops that satisfy every clue. Lines and
  // crosses already drawn are kept. Deferred a tick so the "Solving..." state can paint first.
  const solvePuzzle = () => {
    setIsLoading(true)
    setSolutionCount(0)
    setSolutionsCapped(false)
    setAllSolutions([])
    setCurrentSolutionIndex(0)
    setShowAllSolutions(false)

    setTimeout(() => {
      try {
        const drewEdges = [...horizontalEdges.flat(), ...verticalEdges.flat()].some((edge) => edge !== "empty")
        const result = solveSlitherlink(
          { size: gridSize, clues: grid, horizontal: horizontalEdges, vertical: verticalEdges },
          MAX_SOLUTIONS,
        )
        const found = result.solutions

        if (found.length > 0) {
          const more = result.capped || result.stopped
          setAllSolutions(found)
          setSolutionCount(found.length)
          setSolutionsCapped(more)
          setHorizontalEdges(found[0].horizontal)
          setVerticalEdges(found[0].vertical)
          setSolved(true)
          if (found.length === 1 && !more) {
            showNotification("success", "Puzzle Solved!", "Found the loop. It is the only one that fits these clues.")
          } else {
            showNotification(
              "success",
              "Multiple Solutions Found!",
              more
                ? `Found ${found.length}+ loops that fit these clues (showing the first ${found.length}). Add clues to narrow it down.`
                : `Found ${found.length} loops that fit these clues. Add clues to narrow it down.`,
            )
          }
        } else if (result.stopped) {
          setSolved(false)
          setShowComplexPuzzleDialog(true)
        } else {
          setSolved(false)
          showNotification(
            "error",
            "No Solution",
            drewEdges
              ? "No single loop fits these clues together with the lines and crosses you drew. Check them, or clear the drawn edges and try again."
              : "No single loop fits these clues. Please check them.",
          )
        }
      } catch (error) {
        console.error("Solver error:", error)
        showNotification("error", "Solver Error", "An error occurred while solving the puzzle. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }, 20)
  }

  // Handle grid cell changes
  const updateGridCell = (row: number, col: number, value: string) => {
    let newValue: number | string | null = null

    if (value === "") {
      newValue = null
    } else if (value === "s") {
      newValue = "s" // inside loop
    } else if (value === "w") {
      newValue = "w" // outside loop
    } else {
      const num = Number.parseInt(value)
      if (!isNaN(num) && num >= 0 && num <= 4) {
        newValue = num
      } else {
        return // Invalid input
      }
    }

    const newGrid = [...grid]
    newGrid[row][col] = newValue
    setGrid(newGrid)
    setSolved(false)
  }

  // Handle edge clicks
  const toggleHorizontalEdge = (row: number, col: number) => {
    const newEdges = [...horizontalEdges]
    const current = newEdges[row][col]
    newEdges[row][col] = current === "empty" ? "line" : current === "line" ? "cross" : "empty"
    setHorizontalEdges(newEdges)
    setSolved(false)
  }

  const toggleVerticalEdge = (row: number, col: number) => {
    const newEdges = [...verticalEdges]
    const current = newEdges[row][col]
    newEdges[row][col] = current === "empty" ? "line" : current === "line" ? "cross" : "empty"
    setVerticalEdges(newEdges)
    setSolved(false)
  }

  // Reset puzzle
  const resetPuzzle = () => {
    initializeGrid()
    setAllSolutions([])
    setCurrentSolutionIndex(0)
    setShowAllSolutions(false)
    setSolutionCount(0)
    setSolutionsCapped(false)
    setNotification(null)
  }

  // Add a showNotification helper function
  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotification({ type, title, message })
    // One timer at a time, so an older toast's timer cannot hide a newer toast early.
    if (notificationTimer.current) clearTimeout(notificationTimer.current)
    notificationTimer.current = setTimeout(() => setNotification(null), 5000)
  }

  // Example puzzles. Each has exactly one solution (checked with the solver).
  const getExamplePuzzles = () => {
    const examples = {
      4: [
        {
          grid: [
            [0, 2, 3, null],
            [1, null, null, 2],
            [null, null, 2, 1],
            [null, null, null, 3],
          ],
          name: "Easy 4x4",
        },
      ],
      5: [
        {
          grid: [
            [null, 1, 1, 0, 0],
            [3, null, null, 2, null],
            [3, null, null, null, null],
            [2, null, null, 3, 0],
            [2, null, null, 3, 1],
          ],
          name: "Classic 5x5",
        },
        {
          grid: [
            [null, 0, 2, null, null],
            [0, 1, null, null, 3],
            [null, 0, null, null, null],
            [null, null, null, 1, 3],
            [1, null, null, null, 2],
          ],
          name: "Medium 5x5",
        },
      ],
      6: [
        {
          grid: [
            [1, null, 3, null, null, null],
            [2, 1, null, 1, null, null],
            [null, null, 1, 1, 0, 0],
            [null, null, null, null, null, 0],
            [1, null, null, 2, 2, null],
            [2, null, 1, null, null, 1],
          ],
          name: "Easy 6x6",
        },
      ],
    }
    return examples[gridSize as keyof typeof examples] || []
  }

  const loadExample = (exampleIndex: number = currentExample) => {
    const examples = getExamplePuzzles()
    if (examples.length > 0) {
      const example = examples[exampleIndex % examples.length]
      setGrid(example.grid.map((row) => [...row]))
      clearEdges() // Reset edges only; the example's clues must survive
      setSolved(false)
      setSolutionCount(0)
      setSolutionsCapped(false)
      setAllSolutions([])
      setShowAllSolutions(false)

      setTimeout(() => {
        showNotification("success", "Example Loaded", `Successfully loaded: ${example.name}`)
      }, 100)
    }
  }

  const nextSolution = () => {
    if (allSolutions.length > 1) {
      const nextIndex = (currentSolutionIndex + 1) % allSolutions.length
      setCurrentSolutionIndex(nextIndex)
      setHorizontalEdges(allSolutions[nextIndex].horizontal)
      setVerticalEdges(allSolutions[nextIndex].vertical)
    }
  }

  const previousSolution = () => {
    if (allSolutions.length > 1) {
      const prevIndex = currentSolutionIndex === 0 ? allSolutions.length - 1 : currentSolutionIndex - 1
      setCurrentSolutionIndex(prevIndex)
      setHorizontalEdges(allSolutions[prevIndex].horizontal)
      setVerticalEdges(allSolutions[prevIndex].vertical)
    }
  }

  const toggleAllSolutions = () => {
    setShowAllSolutions(!showAllSolutions)
  }

  const nextExample = () => {
    const next = currentExample + 1
    setCurrentExample(next)
    loadExample(next)
  }

  // Copy to clipboard with proper error handling
  const copyToClipboard = () => {
    const gridString = grid
      .map((row) => row.map((cell) => (cell === null ? "." : cell.toString())).join(" "))
      .join("\n")

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(gridString)
        .then(() => {
          showNotification("success", "Copied!", "Grid has been copied to clipboard")
        })
        .catch(() => {
          showNotification("error", "Copy Failed", "Failed to copy grid to clipboard")
        })
    } else {
      showNotification("error", "Copy Failed", "Clipboard not available in this browser")
    }
  }

  // Board geometry (SVG units). The SVG only draws the board and scales down to fit narrow
  // screens. The edge buttons and clue inputs sit in an HTML layer on top, positioned in
  // percentages so they scale with it. (Inputs inside a scaled SVG <foreignObject> are
  // mis-positioned in WebKit, so they are not placed there.)
  const boardSize = gridSize * PITCH + 2 * PAD
  const pct = (units: number) => `${(units / boardSize) * 100}%`

  // Spoken names, e.g. "Top edge of row 1, column 2: line" or "Right edge of row 3, column 5: empty"
  const horizontalEdgeLabel = (row: number, col: number, edge: EdgeState) =>
    row < gridSize
      ? `Top edge of row ${row + 1}, column ${col + 1}: ${EDGE_STATE_NAMES[edge]}`
      : `Bottom edge of row ${gridSize}, column ${col + 1}: ${EDGE_STATE_NAMES[edge]}`
  const verticalEdgeLabel = (row: number, col: number, edge: EdgeState) =>
    col < gridSize
      ? `Left edge of row ${row + 1}, column ${col + 1}: ${EDGE_STATE_NAMES[edge]}`
      : `Right edge of row ${row + 1}, column ${gridSize}: ${EDGE_STATE_NAMES[edge]}`

  const edgeButtonClass =
    "absolute z-10 cursor-pointer rounded-sm bg-transparent hover:bg-teal-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"

  const horizontalEdgeButton = (row: number, col: number) => (
    <button
      key={`hb-${row}-${col}`}
      type="button"
      aria-label={horizontalEdgeLabel(row, col, horizontalEdges[row][col])}
      onClick={() => toggleHorizontalEdge(row, col)}
      className={edgeButtonClass}
      style={{ left: pct(dot(col) + BAND), top: pct(dot(row) - BAND), width: pct(PITCH - 2 * BAND), height: pct(2 * BAND) }}
    />
  )

  const verticalEdgeButton = (row: number, col: number) => (
    <button
      key={`vb-${row}-${col}`}
      type="button"
      aria-label={verticalEdgeLabel(row, col, verticalEdges[row][col])}
      onClick={() => toggleVerticalEdge(row, col)}
      className={edgeButtonClass}
      style={{ left: pct(dot(col) - BAND), top: pct(dot(row) + BAND), width: pct(2 * BAND), height: pct(PITCH - 2 * BAND) }}
    />
  )

  const clueInput = (row: number, col: number) => (
    <Input
      key={`in-${row}-${col}`}
      type="text"
      aria-label={`Row ${row + 1}, column ${col + 1} clue`}
      value={grid[row][col] ?? ""}
      onChange={(e) => updateGridCell(row, col, e.target.value)}
      className="absolute rounded-none p-0 text-center font-bold border-0 bg-transparent text-transparent focus:text-black focus:bg-white"
      maxLength={1}
      style={{
        left: pct(dot(col) + BAND),
        top: pct(dot(row) + BAND),
        width: pct(PITCH - 2 * BAND),
        height: pct(PITCH - 2 * BAND),
        caretColor: "black",
      }}
    />
  )

  // Controls in reading order, so Tab moves across each row: the row's top edges, then for each
  // cell its left edge and clue, then the row's right edge; the bottom edges come last.
  const boardControls: React.ReactNode[] = []
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) boardControls.push(horizontalEdgeButton(row, col))
    for (let col = 0; col < gridSize; col++) {
      boardControls.push(verticalEdgeButton(row, col))
      boardControls.push(clueInput(row, col))
    }
    boardControls.push(verticalEdgeButton(row, gridSize))
  }
  for (let col = 0; col < gridSize; col++) boardControls.push(horizontalEdgeButton(gridSize, col))

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight">Slitherlink Puzzle Solver</h1>
            <p className="text-gray-600">
              Free online Slitherlink puzzle solver with interactive grid. Draw a single continuous loop where number
              clues indicate how many edges around each cell are part of the loop. Click edges to draw lines or mark
              with X.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-3 sm:px-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="grid-size">Grid Size:</Label>
                <Select
                  value={gridSize.toString()}
                  onValueChange={(value) => {
                    const newSize = Number.parseInt(value)
                    setGridSize(newSize)
                    initializeGrid(newSize)
                    setAllSolutions([])
                    setSolutionCount(0)
                    setCurrentSolutionIndex(0)
                    setShowAllSolutions(false)
                  }}
                >
                  <SelectTrigger id="grid-size" aria-label={`Grid size: ${gridSize} by ${gridSize}`} className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4×4</SelectItem>
                    <SelectItem value="5">5×5</SelectItem>
                    <SelectItem value="6">6×6</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => solvePuzzle()}
                variant="default"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Solving..." : "🧩 Solve Puzzle"}
              </Button>

              <Button onClick={resetPuzzle} variant="outline">
                🔄 Reset
              </Button>

              <Button onClick={() => setShowControls(!showControls)} variant="outline">
                {showControls ? "👁️ Hide" : "👁️ Show"} Controls
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => loadExample()}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 border-green-300"
                >
                  📝 Load Example
                </Button>
                {getExamplePuzzles().length > 1 && (
                  <Button
                    onClick={nextExample}
                    variant="outline"
                    size="sm"
                    className="bg-green-50 hover:bg-green-100 border-green-300"
                  >
                    ⏭️ Next Example
                  </Button>
                )}
              </div>

              <Button onClick={copyToClipboard} variant="outline">
                📋 Copy Grid
              </Button>
            </div>

            {/* Notification Toast. The wrapper is always mounted so screen readers announce each result. */}
            <div role="status" aria-live="polite" className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:max-w-md">
            {notification && (
              <div
                className={`p-4 rounded-lg shadow-lg border-l-4 ${(() => {
                  switch (notification.type) {
                    case "success":
                      return "bg-green-50 border-green-400 text-green-800"
                    case "error":
                      return "bg-red-50 border-red-400 text-red-800"
                    case "warning":
                      return "bg-yellow-50 border-yellow-400 text-yellow-800"
                    default:
                      return "bg-blue-50 border-blue-400 text-blue-800"
                  }
                })()}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === "success" && <span className="text-xl">✅</span>}
                    {notification.type === "error" && <span className="text-xl">❌</span>}
                    {notification.type === "warning" && <span className="text-xl">⚠️</span>}
                    {notification.type === "info" && <span className="text-xl">ℹ️</span>}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setNotification(null)}
                    className="ml-4 flex-shrink-0 text-lg hover:opacity-70"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Enhanced Status Section */}
            {solved && (
              <div className="text-center space-y-4">
                <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                  ✅ Puzzle Solved!
                </Badge>

                {solutionCount > 1 && (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      🔢 {solutionCount}
                      {solutionsCapped ? "+" : ""} solution{solutionCount > 1 ? "s" : ""} found
                    </Badge>

                    {solutionCount >= 13 && (
                      <div className="space-y-2">
                        <p className="text-sm text-orange-700 font-medium">
                          ⚠️ Multiple solutions detected! This puzzle may need additional clues for uniqueness.
                        </p>
                        <Button
                          onClick={toggleAllSolutions}
                          variant="outline"
                          className="bg-orange-50 hover:bg-orange-100 border-orange-300"
                        >
                          {showAllSolutions ? "🔽 Hide All Solutions" : "🔼 View All Solutions"}
                        </Button>
                      </div>
                    )}

                    {solutionCount > 1 && solutionCount < 13 && (
                      <div className="flex justify-center gap-2 items-center">
                        <Button
                          onClick={previousSolution}
                          variant="outline"
                          size="sm"
                          disabled={allSolutions.length <= 1}
                        >
                          ⬅️ Previous
                        </Button>
                        <span className="text-sm px-3 py-1 bg-gray-100 rounded">
                          Solution {currentSolutionIndex + 1} of {solutionCount}
                          {solutionsCapped ? "+" : ""}
                        </span>
                        <Button
                          onClick={nextSolution}
                          variant="outline"
                          size="sm"
                          disabled={allSolutions.length <= 1}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                        >
                          ➡️ Next Solution
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complex Puzzle Dialog */}
            {showComplexPuzzleDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div
                  role="dialog"
                  aria-labelledby="complex-puzzle-title"
                  className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-xl">⏱️</span>
                      </div>
                      <h2 id="complex-puzzle-title" className="text-lg font-semibold text-gray-900">
                        Complex Puzzle Detected
                      </h2>
                    </div>

                    <div className="space-y-4 text-sm text-gray-600">
                      <p className="font-medium text-gray-800">
                        The solver stopped after a few seconds without finding a loop.
                      </p>

                      <div className="space-y-2">
                        <p>
                          <strong>Possible reasons:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>The puzzle has too many possible solutions (under-constrained)</li>
                          <li>Some clues may be incorrect or contradictory</li>
                          <li>The grid size makes the search too long</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p>
                          <strong>Suggestions:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Double-check your clues for accuracy</li>
                          <li>Try adding more number clues to constrain the solution</li>
                          <li>Start with a smaller grid size</li>
                          <li>Load an example puzzle to test the solver</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => setShowComplexPuzzleDialog(false)}
                        variant="outline"
                        className="flex-1"
                        autoFocus
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          setShowComplexPuzzleDialog(false)
                          loadExample()
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Try Example
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Puzzle Grid. Scrolls inside this box (from the first column) if a screen is too narrow
                for the smallest board scale. */}
            <div className="overflow-x-auto py-1">
              <div
                className="relative mx-auto w-full border border-gray-300"
                style={{ maxWidth: boardSize + 2, minWidth: Math.ceil(boardSize * MIN_SCALE) + 2 }}
              >
                <svg
                  viewBox={`0 0 ${boardSize} ${boardSize}`}
                  width={boardSize}
                  height={boardSize}
                  className="block h-auto w-full"
                  aria-hidden="true"
                  focusable="false"
                >
                  {/* Cell backgrounds and clues */}
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <g key={`cell-${rowIndex}-${colIndex}`}>
                        <rect
                          x={dot(colIndex) + 8}
                          y={dot(rowIndex) + 8}
                          width={PITCH - 16}
                          height={PITCH - 16}
                          fill="white"
                          stroke="none"
                        />
                        {cell !== null && (
                          <text
                            x={dot(colIndex) + PITCH / 2}
                            y={dot(rowIndex) + PITCH / 2 + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="20"
                            fontWeight="bold"
                            fill={typeof cell === "number" ? "#000" : cell === "s" ? "#00a000" : "#a00000"}
                          >
                            {cell}
                          </text>
                        )}
                      </g>
                    )),
                  )}

                  {/* Horizontal edges */}
                  {horizontalEdges.map((row, rowIndex) =>
                    row.map((edge, colIndex) => {
                      const x = dot(colIndex) + PITCH / 2
                      const y = dot(rowIndex)
                      return (
                        <g key={`h-${rowIndex}-${colIndex}`}>
                          {edge === "line" && (
                            <line x1={dot(colIndex) + 6} y1={y} x2={dot(colIndex + 1) - 6} y2={y} stroke="#000" strokeWidth="3" />
                          )}
                          {edge === "cross" && (
                            <path d={`M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}`} stroke="#999" strokeWidth="2" />
                          )}
                        </g>
                      )
                    }),
                  )}

                  {/* Vertical edges */}
                  {verticalEdges.map((row, rowIndex) =>
                    row.map((edge, colIndex) => {
                      const x = dot(colIndex)
                      const y = dot(rowIndex) + PITCH / 2
                      return (
                        <g key={`v-${rowIndex}-${colIndex}`}>
                          {edge === "line" && (
                            <line x1={x} y1={dot(rowIndex) + 6} x2={x} y2={dot(rowIndex + 1) - 6} stroke="#000" strokeWidth="3" />
                          )}
                          {edge === "cross" && (
                            <path d={`M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}`} stroke="#999" strokeWidth="2" />
                          )}
                        </g>
                      )
                    }),
                  )}

                  {/* Grid dots */}
                  {Array.from({ length: gridSize + 1 }).map((_, row) =>
                    Array.from({ length: gridSize + 1 }).map((_, col) => (
                      <circle key={`dot-${row}-${col}`} cx={dot(col)} cy={dot(row)} r="3" fill="#666" />
                    )),
                  )}
                </svg>

                {/* Edge buttons and clue inputs, laid over the board */}
                {boardControls}
              </div>
            </div>

            {/* All Solutions Display */}
            {showAllSolutions && allSolutions.length >= 13 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <h2 className="text-lg font-semibold tracking-tight text-blue-800 flex items-center gap-2">
                    🔢 {solutionsCapped ? `First ${solutionCount}` : `All ${solutionCount}`} Solutions
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {allSolutions.map((solution, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            Solution {index + 1}
                          </Badge>
                        </div>
                        <div className="inline-block border-2 border-gray-300 rounded p-2 bg-white">
                          <svg width={gridSize * 20 + 10} height={gridSize * 20 + 10}>
                            {/* Mini grid visualization */}
                            {Array.from({ length: gridSize + 1 }).map((_, row) =>
                              Array.from({ length: gridSize + 1 }).map((_, col) => (
                                <circle
                                  key={`mini-dot-${row}-${col}`}
                                  cx={5 + col * 20}
                                  cy={5 + row * 20}
                                  r="1"
                                  fill="#666"
                                />
                              )),
                            )}
                            {solution.horizontal.map((row, rowIndex) =>
                              row.map(
                                (edge, colIndex) =>
                                  edge === "line" && (
                                    <line
                                      key={`mini-h-${rowIndex}-${colIndex}`}
                                      x1={7 + colIndex * 20}
                                      y1={5 + rowIndex * 20}
                                      x2={3 + (colIndex + 1) * 20}
                                      y2={5 + rowIndex * 20}
                                      stroke="#000"
                                      strokeWidth="1"
                                    />
                                  ),
                              ),
                            )}
                            {solution.vertical.map((row, rowIndex) =>
                              row.map(
                                (edge, colIndex) =>
                                  edge === "line" && (
                                    <line
                                      key={`mini-v-${rowIndex}-${colIndex}`}
                                      x1={5 + colIndex * 20}
                                      y1={7 + rowIndex * 20}
                                      x2={5 + colIndex * 20}
                                      y2={3 + (rowIndex + 1) * 20}
                                      stroke="#000"
                                      strokeWidth="1"
                                    />
                                  ),
                              ),
                            )}
                          </svg>
                        </div>
                        <div className="text-center">
                          <Button
                            onClick={() => {
                              setHorizontalEdges(solution.horizontal)
                              setVerticalEdges(solution.vertical)
                              setCurrentSolutionIndex(index)
                              setShowAllSolutions(false)
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Use This Solution
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {showControls && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <h2 className="text-lg font-semibold tracking-tight">How to Play</h2>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Draw a single continuous loop by connecting dots</p>
                  <p>• Numbers in cells show how many edges around that cell are part of the loop</p>
                  <p>• Click edges to cycle through: empty → line → cross → empty</p>
                  <p>• Lines are part of the loop, crosses mark edges that are NOT part of the loop</p>
                  <p>• Enter numbers (0-4) for clues, 's' for inside loop, 'w' for outside loop</p>
                  <p>• The loop must be continuous with no branches or isolated segments</p>
                  <p>• Click &quot;Solve Puzzle&quot; to find the loop. Lines and crosses you have drawn are kept</p>
                  <p>• Keyboard: Tab to an edge and press Enter or Space to change it</p>
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
                  This Slitherlink puzzle solver was created with passion for puzzle games and web development.
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
