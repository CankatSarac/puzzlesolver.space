"use client"

import { useState, useEffect } from "react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SITE } from "@/data/site"

type Grid = (number | string | null)[][]
type EdgeState = "empty" | "line" | "cross"
type HorizontalEdges = EdgeState[][]
type VerticalEdges = EdgeState[][]

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
  const [currentExample, setCurrentExample] = useState(0)
  const [allSolutions, setAllSolutions] = useState<{ horizontal: HorizontalEdges; vertical: VerticalEdges }[]>([])
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0)
  const [showAllSolutions, setShowAllSolutions] = useState(false)
  const [solveTimeout, setSolveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isComplexPuzzle, setIsComplexPuzzle] = useState(false)
  const [showComplexPuzzleDialog, setShowComplexPuzzleDialog] = useState(false)
  const [wasExampleLoaded, setWasExampleLoaded] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  } | null>(null)

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (solveTimeout) {
        clearTimeout(solveTimeout)
      }
    }
  }, [solveTimeout])

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

  // Count edges around a cell
  const countEdgesAroundCell = (row: number, col: number): number => {
    let count = 0

    // Top edge
    if (horizontalEdges[row][col] === "line") count++
    // Bottom edge
    if (horizontalEdges[row + 1][col] === "line") count++
    // Left edge
    if (verticalEdges[row][col] === "line") count++
    // Right edge
    if (verticalEdges[row][col + 1] === "line") count++

    return count
  }

  // Validate current state
  const isValidState = (): boolean => {
    // Check number constraints
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const clue = grid[row][col]
        if (typeof clue === "number") {
          const edgeCount = countEdgesAroundCell(row, col)
          if (edgeCount > clue) return false
        }
      }
    }
    return true
  }

  // True when the line edges form exactly one closed loop and every number clue is satisfied.
  const isCompleteLoop = (h: HorizontalEdges, v: VerticalEdges): boolean => {
    const n = gridSize
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const clue = grid[row][col]
        if (typeof clue === "number" && countEdgesAroundCellInState(h, v, row, col) !== clue) return false
      }
    }
    // Dots are (n + 1) × (n + 1); list the dots joined to (r, c) by a line
    const neighbours = (r: number, c: number): [number, number][] => {
      const out: [number, number][] = []
      if (c > 0 && h[r][c - 1] === "line") out.push([r, c - 1])
      if (c < n && h[r][c] === "line") out.push([r, c + 1])
      if (r > 0 && v[r - 1][c] === "line") out.push([r - 1, c])
      if (r < n && v[r][c] === "line") out.push([r + 1, c])
      return out
    }
    let start: [number, number] | null = null
    let lineCount = 0
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c <= n; c++) {
        const degree = neighbours(r, c).length
        if (degree !== 0 && degree !== 2) return false
        if (degree === 2 && !start) start = [r, c]
        lineCount += degree
      }
    }
    lineCount /= 2
    if (!start) return false
    // Walk the loop once; a single loop visits every line edge.
    let prev: [number, number] | null = null
    let cur: [number, number] = start
    let steps = 0
    do {
      const next: [number, number] | undefined = neighbours(cur[0], cur[1]).find(
        ([r, c]) => !prev || r !== prev[0] || c !== prev[1],
      )
      if (!next) return false
      prev = cur
      cur = next
      steps++
    } while ((cur[0] !== start[0] || cur[1] !== start[1]) && steps <= lineCount)
    return steps === lineCount
  }

  // Solver: applies the deductions that follow directly from the clues, then checks whether
  // that already completes the loop. Only a complete loop is reported as solved.
  const solvePuzzle = async (): Promise<boolean> => {
    setIsLoading(true)
    setSolutionCount(0)
    setAllSolutions([])
    setIsComplexPuzzle(false)
    setShowAllSolutions(false)

    const timeoutDuration = 15000 // 15 seconds timeout
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let isSolved = false

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          setIsComplexPuzzle(true)
          setShowComplexPuzzleDialog(true)
          reject(new Error("Timeout"))
        }, timeoutDuration)
        setSolveTimeout(timeoutId)
      })

      const solvePromise = new Promise<void>((resolve) => {
        const [result] = solveSlitherlink()
        const before = [...horizontalEdges.flat(), ...verticalEdges.flat()]
        const after = [...result.horizontal.flat(), ...result.vertical.flat()]
        const deduced = after.filter((edge, i) => edge !== before[i]).length

        setHorizontalEdges(result.horizontal)
        setVerticalEdges(result.vertical)

        if (isCompleteLoop(result.horizontal, result.vertical)) {
          isSolved = true
          setAllSolutions([result])
          setSolutionCount(1)
          setSolved(true)
        } else {
          setSolved(false)
          if (deduced > 0) {
            showNotification(
              "info",
              "Partial result",
              `Filled in ${deduced} edge${deduced === 1 ? "" : "s"} that follow directly from the clues. The rest of the loop is still open.`,
            )
          } else {
            showNotification(
              "info",
              "No direct deductions",
              "No edges follow directly from these clues (0s and 4s help most). Draw some lines yourself or add more clues.",
            )
          }
        }

        resolve()
      })

      await Promise.race([solvePromise, timeoutPromise])
    } catch (error) {
      console.warn("Solver timeout or error:", error)

      if (!(error instanceof Error && error.message === "Timeout") && !wasExampleLoaded) {
        showNotification("error", "Solver Error", "An error occurred while solving the puzzle. Please try again.")
      }
    } finally {
      // Always cancel the timer; otherwise the "Complex Puzzle" dialog pops up 15s after every solve.
      clearTimeout(timeoutId)
      setSolveTimeout(null)
      setIsLoading(false)
    }

    return isSolved
  }

  // Simple backtracking solver
  const solveSlitherlink = (): { horizontal: HorizontalEdges; vertical: VerticalEdges }[] => {
    const solutions: { horizontal: HorizontalEdges; vertical: VerticalEdges }[] = []

    // Create working copies
    const workingHorizontal = horizontalEdges.map((row) => [...row])
    const workingVertical = verticalEdges.map((row) => [...row])

    // Simple constraint propagation
    let changed = true
    while (changed) {
      changed = false

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const clue = grid[row][col]
          if (typeof clue === "number") {
            const currentCount = countEdgesAroundCellInState(workingHorizontal, workingVertical, row, col)
            const possibleCount = countPossibleEdgesAroundCell(workingHorizontal, workingVertical, row, col)

            // If we've reached the required number, mark remaining as crosses
            if (currentCount === clue) {
              if (markRemainingAsCross(workingHorizontal, workingVertical, row, col)) {
                changed = true
              }
            }
            // If we need all remaining edges, mark them as lines
            else if (currentCount + possibleCount === clue) {
              if (markRemainingAsLine(workingHorizontal, workingVertical, row, col)) {
                changed = true
              }
            }
          }
        }
      }
    }

    // For now, return the constraint-propagated solution
    solutions.push({
      horizontal: workingHorizontal,
      vertical: workingVertical,
    })

    return solutions
  }

  const countEdgesAroundCellInState = (h: HorizontalEdges, v: VerticalEdges, row: number, col: number): number => {
    let count = 0
    if (h[row][col] === "line") count++
    if (h[row + 1][col] === "line") count++
    if (v[row][col] === "line") count++
    if (v[row][col + 1] === "line") count++
    return count
  }

  const countPossibleEdgesAroundCell = (h: HorizontalEdges, v: VerticalEdges, row: number, col: number): number => {
    let count = 0
    if (h[row][col] === "empty") count++
    if (h[row + 1][col] === "empty") count++
    if (v[row][col] === "empty") count++
    if (v[row][col + 1] === "empty") count++
    return count
  }

  const markRemainingAsCross = (h: HorizontalEdges, v: VerticalEdges, row: number, col: number): boolean => {
    let changed = false
    if (h[row][col] === "empty") {
      h[row][col] = "cross"
      changed = true
    }
    if (h[row + 1][col] === "empty") {
      h[row + 1][col] = "cross"
      changed = true
    }
    if (v[row][col] === "empty") {
      v[row][col] = "cross"
      changed = true
    }
    if (v[row][col + 1] === "empty") {
      v[row][col + 1] = "cross"
      changed = true
    }
    return changed
  }

  const markRemainingAsLine = (h: HorizontalEdges, v: VerticalEdges, row: number, col: number): boolean => {
    let changed = false
    if (h[row][col] === "empty") {
      h[row][col] = "line"
      changed = true
    }
    if (h[row + 1][col] === "empty") {
      h[row + 1][col] = "line"
      changed = true
    }
    if (v[row][col] === "empty") {
      v[row][col] = "line"
      changed = true
    }
    if (v[row][col + 1] === "empty") {
      v[row][col + 1] = "line"
      changed = true
    }
    return changed
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
    setIsComplexPuzzle(false)
    setWasExampleLoaded(false)
    setNotification(null)
    if (solveTimeout) {
      clearTimeout(solveTimeout)
      setSolveTimeout(null)
    }
  }

  // Add a showNotification helper function
  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotification({ type, title, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Enhanced example puzzles
  const getExamplePuzzles = () => {
    const examples = {
      4: [
        {
          grid: [
            [null, 2, null, null],
            [3, null, 1, null],
            [null, 2, null, 3],
            [null, null, 2, null],
          ],
          name: "Easy 4x4",
        },
      ],
      5: [
        {
          grid: [
            [null, 2, null, 3, null],
            [1, null, null, null, 2],
            [null, null, 2, null, null],
            [3, null, null, null, 1],
            [null, 1, null, 2, null],
          ],
          name: "Classic 5x5",
        },
        {
          grid: [
            [2, null, 3, null, 1],
            [null, 1, null, 2, null],
            [3, null, null, null, 3],
            [null, 2, null, 1, null],
            [1, null, 2, null, 2],
          ],
          name: "Medium 5x5",
        },
      ],
      6: [
        {
          grid: [
            [null, 1, null, 2, null, null],
            [2, null, 3, null, 1, null],
            [null, null, null, null, null, 2],
            [1, null, null, null, null, null],
            [null, 2, null, 3, null, 1],
            [null, null, 1, null, 2, null],
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
      setWasExampleLoaded(true)

      setTimeout(() => {
        showNotification("success", "Example Loaded", `Successfully loaded: ${example.name}`)
      }, 100)

      setTimeout(() => {
        setWasExampleLoaded(false)
      }, 2000)
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

  // Board geometry (SVG units). The SVG scales down to fit narrow screens; the clue inputs sit in
  // an HTML layer on top, positioned in percentages so they scale with it. (Inputs inside a scaled
  // SVG <foreignObject> are mis-positioned in WebKit, so they are not placed there.)
  const boardSize = gridSize * 60 + 20
  const pct = (units: number) => `${(units / boardSize) * 100}%`

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

            {/* Notification Toast */}
            {notification && (
              <div
                className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 ${(() => {
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

            {/* Enhanced Status Section */}
            {solved && (
              <div className="text-center space-y-4">
                <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                  ✅ Puzzle Solved!
                </Badge>

                {solutionCount > 1 && (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      🔢 {solutionCount} solution{solutionCount > 1 ? "s" : ""} found
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
                <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-xl">⏱️</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Complex Puzzle Detected</h2>
                    </div>

                    <div className="space-y-4 text-sm text-gray-600">
                      <p className="font-medium text-gray-800">This puzzle is taking longer than expected to solve.</p>

                      <div className="space-y-2">
                        <p>
                          <strong>Possible reasons:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>The puzzle has too many possible solutions (under-constrained)</li>
                          <li>Some clues may be incorrect or contradictory</li>
                          <li>The puzzle requires advanced loop-finding techniques</li>
                          <li>The grid size makes it computationally intensive</li>
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
                        onClick={() => {
                          setShowComplexPuzzleDialog(false)
                          setIsComplexPuzzle(false)
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          setShowComplexPuzzleDialog(false)
                          setIsComplexPuzzle(false)
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

            {/* Puzzle Grid */}
            <div className="flex justify-center">
              <div className="relative w-full border border-gray-300" style={{ maxWidth: boardSize + 2 }}>
                <svg
                  viewBox={`0 0 ${boardSize} ${boardSize}`}
                  width={boardSize}
                  height={boardSize}
                  className="block h-auto w-full"
                >
                  {/* Grid dots */}
                  {Array.from({ length: gridSize + 1 }).map((_, row) =>
                    Array.from({ length: gridSize + 1 }).map((_, col) => (
                      <circle key={`dot-${row}-${col}`} cx={10 + col * 60} cy={10 + row * 60} r="3" fill="#666" />
                    )),
                  )}

                  {/* Horizontal edges */}
                  {horizontalEdges.map((row, rowIndex) =>
                    row.map((edge, colIndex) => (
                      <g key={`h-${rowIndex}-${colIndex}`}>
                        <line
                          x1={16 + colIndex * 60}
                          y1={10 + rowIndex * 60}
                          x2={4 + (colIndex + 1) * 60}
                          y2={10 + rowIndex * 60}
                          stroke={edge === "line" ? "#000" : "transparent"}
                          strokeWidth="3"
                          className="cursor-pointer"
                          onClick={() => toggleHorizontalEdge(rowIndex, colIndex)}
                        />
                        {edge === "cross" && (
                          <>
                            <line
                              x1={25 + colIndex * 60}
                              y1={5 + rowIndex * 60}
                              x2={35 + colIndex * 60}
                              y2={15 + rowIndex * 60}
                              stroke="#999"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onClick={() => toggleHorizontalEdge(rowIndex, colIndex)}
                            />
                            <line
                              x1={35 + colIndex * 60}
                              y1={5 + rowIndex * 60}
                              x2={25 + colIndex * 60}
                              y2={15 + rowIndex * 60}
                              stroke="#999"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onClick={() => toggleHorizontalEdge(rowIndex, colIndex)}
                            />
                          </>
                        )}
                        {/* Invisible clickable area */}
                        <rect
                          x={16 + colIndex * 60}
                          y={5 + rowIndex * 60}
                          width={44}
                          height={10}
                          fill="transparent"
                          className="cursor-pointer"
                          onClick={() => toggleHorizontalEdge(rowIndex, colIndex)}
                        />
                      </g>
                    )),
                  )}

                  {/* Vertical edges */}
                  {verticalEdges.map((row, rowIndex) =>
                    row.map((edge, colIndex) => (
                      <g key={`v-${rowIndex}-${colIndex}`}>
                        <line
                          x1={10 + colIndex * 60}
                          y1={16 + rowIndex * 60}
                          x2={10 + colIndex * 60}
                          y2={4 + (rowIndex + 1) * 60}
                          stroke={edge === "line" ? "#000" : "transparent"}
                          strokeWidth="3"
                          className="cursor-pointer"
                          onClick={() => toggleVerticalEdge(rowIndex, colIndex)}
                        />
                        {edge === "cross" && (
                          <>
                            <line
                              x1={5 + colIndex * 60}
                              y1={25 + rowIndex * 60}
                              x2={15 + colIndex * 60}
                              y2={35 + rowIndex * 60}
                              stroke="#999"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onClick={() => toggleVerticalEdge(rowIndex, colIndex)}
                            />
                            <line
                              x1={15 + colIndex * 60}
                              y1={25 + rowIndex * 60}
                              x2={5 + colIndex * 60}
                              y2={35 + rowIndex * 60}
                              stroke="#999"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onClick={() => toggleVerticalEdge(rowIndex, colIndex)}
                            />
                          </>
                        )}
                        {/* Invisible clickable area */}
                        <rect
                          x={5 + colIndex * 60}
                          y={16 + rowIndex * 60}
                          width={10}
                          height={44}
                          fill="transparent"
                          className="cursor-pointer"
                          onClick={() => toggleVerticalEdge(rowIndex, colIndex)}
                        />
                      </g>
                    )),
                  )}

                  {/* Cell clues */}
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <g key={`cell-${rowIndex}-${colIndex}`}>
                        <rect
                          x={16 + colIndex * 60}
                          y={16 + rowIndex * 60}
                          width={44}
                          height={44}
                          fill="white"
                          stroke="none"
                        />
                        {cell !== null && (
                          <text
                            x={38 + colIndex * 60}
                            y={42 + rowIndex * 60}
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
                </svg>

                {/* Clue inputs, laid over the cells */}
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <Input
                      key={`in-${rowIndex}-${colIndex}`}
                      type="text"
                      aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1} clue`}
                      value={cell ?? ""}
                      onChange={(e) => updateGridCell(rowIndex, colIndex, e.target.value)}
                      className="absolute rounded-none p-0 text-center font-bold border-0 bg-transparent text-transparent focus:text-black focus:bg-white"
                      maxLength={1}
                      style={{
                        left: pct(16 + colIndex * 60),
                        top: pct(16 + rowIndex * 60),
                        width: pct(44),
                        height: pct(44),
                        caretColor: "black",
                      }}
                    />
                  )),
                )}
              </div>
            </div>

            {/* All Solutions Display */}
            {showAllSolutions && allSolutions.length >= 13 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <h2 className="text-lg font-semibold tracking-tight text-blue-800 flex items-center gap-2">
                    🔢 All {solutionCount} Solutions
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
                  <p>• Click &quot;Solve Puzzle&quot; to fill in the edges that follow directly from the clues</p>
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
