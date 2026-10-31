"use client"

import { Fragment, useRef, useState } from "react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SITE } from "@/data/site"

import { PuzzleTools } from '@/learning/PuzzleTools';

type Symbol = "sun" | "moon" | null
type Constraint = "equals" | "different" | null
type Grid = Symbol[][]
type HorizontalConstraints = Constraint[][]
type VerticalConstraints = Constraint[][]

interface TangoBoard {
  grid: Grid
  horizontalConstraints: HorizontalConstraints
  verticalConstraints: VerticalConstraints
}

const DEFAULT_GRID_SIZE = 6

/** An empty board, built synchronously so the server-rendered HTML already shows the grid. */
function createEmptyBoard(size: number): TangoBoard {
  return {
    grid: Array.from({ length: size }, () => Array<Symbol>(size).fill(null)),
    horizontalConstraints: Array.from({ length: size }, () => Array<Constraint>(Math.max(0, size - 1)).fill(null)),
    verticalConstraints: Array.from({ length: Math.max(0, size - 1) }, () => Array<Constraint>(size).fill(null)),
  }
}

const CONSTRAINT_NAMES = { equals: "must be equal", different: "must be different" } as const

export default function TangoSolver() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE)
  const [board, setBoard] = useState<TangoBoard>(() => createEmptyBoard(DEFAULT_GRID_SIZE))
  const [solved, setSolved] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentExample] = useState(0)
  const [allSolutions, setAllSolutions] = useState<TangoBoard[]>([])
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0)
  const [showAllSolutions, setShowAllSolutions] = useState(false)
  const [solutionCount, setSolutionCount] = useState(0)
  // True when the search stopped at its limit, so more solutions than listed may exist.
  const [solutionsCapped, setSolutionsCapped] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  } | null>(null)
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset to an empty board of the current size
  const initializeBoard = () => {
    setBoard(createEmptyBoard(gridSize))
    setSolved(false)
  }

  // Update grid cell
  const updateGridCell = (row: number, col: number, symbol: Symbol) => {
    const newBoard = { ...board }
    newBoard.grid[row][col] = symbol
    setBoard(newBoard)
    setSolved(false)
  }

  // Update horizontal constraint
  const updateHorizontalConstraint = (row: number, col: number, constraint: Constraint) => {
    const newBoard = { ...board }
    newBoard.horizontalConstraints[row][col] = constraint
    setBoard(newBoard)
    setSolved(false)
  }

  // Update vertical constraint
  const updateVerticalConstraint = (row: number, col: number, constraint: Constraint) => {
    const newBoard = { ...board }
    newBoard.verticalConstraints[row][col] = constraint
    setBoard(newBoard)
    setSolved(false)
  }

  // Check if current state is valid
  const isValidState = (testBoard: TangoBoard): boolean => {
    // Check for no more than 2 identical symbols in a row/column
    for (let i = 0; i < gridSize; i++) {
      // Check rows
      for (let j = 0; j < gridSize - 2; j++) {
        if (testBoard.grid[i][j] && testBoard.grid[i][j + 1] && testBoard.grid[i][j + 2]) {
          if (testBoard.grid[i][j] === testBoard.grid[i][j + 1] && testBoard.grid[i][j + 1] === testBoard.grid[i][j + 2]) {
            return false
          }
        }
      }
      
      // Check columns
      for (let j = 0; j < gridSize - 2; j++) {
        if (testBoard.grid[j][i] && testBoard.grid[j + 1][i] && testBoard.grid[j + 2][i]) {
          if (testBoard.grid[j][i] === testBoard.grid[j + 1][i] && testBoard.grid[j + 1][i] === testBoard.grid[j + 2][i]) {
            return false
          }
        }
      }
    }

    // Check row/column balance (equal suns and moons for even sizes, allow difference of 1 for odd sizes)
    const expectedCount = Math.floor(gridSize / 2)
    const isOddSize = gridSize % 2 === 1
    
    for (let i = 0; i < gridSize; i++) {
      const rowSymbols = testBoard.grid[i].filter(s => s !== null)
      const colSymbols = testBoard.grid.map(row => row[i]).filter(s => s !== null)
      
      if (rowSymbols.length === gridSize) {
        const sunCount = rowSymbols.filter(s => s === "sun").length
        const moonCount = rowSymbols.filter(s => s === "moon").length
        
        if (isOddSize) {
          // For odd sizes, allow difference of 1
          const diff = Math.abs(sunCount - moonCount)
          if (diff > 1) return false
        } else {
          // For even sizes, must be exactly equal
          if (sunCount !== expectedCount || moonCount !== expectedCount) return false
        }
      }
      
      if (colSymbols.length === gridSize) {
        const sunCount = colSymbols.filter(s => s === "sun").length
        const moonCount = colSymbols.filter(s => s === "moon").length
        
        if (isOddSize) {
          // For odd sizes, allow difference of 1
          const diff = Math.abs(sunCount - moonCount)
          if (diff > 1) return false
        } else {
          // For even sizes, must be exactly equal
          if (sunCount !== expectedCount || moonCount !== expectedCount) return false
        }
      }
    }

    // Check horizontal constraints
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const constraint = testBoard.horizontalConstraints[i][j]
        const left = testBoard.grid[i][j]
        const right = testBoard.grid[i][j + 1]
        
        if (constraint && left && right) {
          if (constraint === "equals" && left !== right) return false
          if (constraint === "different" && left === right) return false
        }
      }
    }

    // Check vertical constraints
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize; j++) {
        const constraint = testBoard.verticalConstraints[i][j]
        const top = testBoard.grid[i][j]
        const bottom = testBoard.grid[i + 1][j]
        
        if (constraint && top && bottom) {
          if (constraint === "equals" && top !== bottom) return false
          if (constraint === "different" && top === bottom) return false
        }
      }
    }

    return true
  }

  // Enhanced backtracking solver with multiple solutions
  const solvePuzzle = async (): Promise<boolean> => {
    setIsLoading(true)
    setAllSolutions([])
    setSolutionCount(0)
    setSolutionsCapped(false)
    setShowAllSolutions(false)
    
    try {
      const solutions: TangoBoard[] = []
      const maxSolutions = gridSize >= 7 ? 10 : 100 // Limit solutions for larger grids
      const maxIterations = gridSize >= 7 ? 100000 : 1000000 // Prevent infinite loops
      let iterations = 0
      
      // Create a copy of the board to work with
      const workingBoard = JSON.parse(JSON.stringify(board)) as TangoBoard
      
      const solve = (row: number, col: number): void => {
        iterations++
        
        // Safety check to prevent infinite loops
        if (iterations > maxIterations) {
          return
        }
        
        // If we've filled all cells, check if solution is valid
        if (row === gridSize) {
          if (isValidState(workingBoard)) {
            solutions.push(JSON.parse(JSON.stringify(workingBoard)))
          }
          return
        }
        
        // Stop if we have enough solutions
        if (solutions.length >= maxSolutions) {
          return
        }
        
        // Calculate next position
        const nextRow = col === gridSize - 1 ? row + 1 : row
        const nextCol = col === gridSize - 1 ? 0 : col + 1
        
        // If cell is already filled, move to next
        if (workingBoard.grid[row][col] !== null) {
          solve(nextRow, nextCol)
          return
        }
        
        // Try both symbols
        for (const symbol of ["sun", "moon"] as Symbol[]) {
          workingBoard.grid[row][col] = symbol
          
          // Check if this placement is valid so far
          if (isPartiallyValid(workingBoard, row, col)) {
            solve(nextRow, nextCol)
          }
          
          // Backtrack
          workingBoard.grid[row][col] = null
        }
      }
      
      solve(0, 0)

      // The search stops at maxSolutions or maxIterations, so it may not have seen every solution.
      const capped = solutions.length >= maxSolutions || iterations > maxIterations

      setAllSolutions(solutions)
      setSolutionCount(solutions.length)
      setSolutionsCapped(capped)
      
      if (solutions.length > 0) {
        setBoard(solutions[0])
        setCurrentSolutionIndex(0)
        setSolved(true)
        if (solutions.length === 1 && !capped) {
          showNotification('success', 'Puzzle Solved!', 'Found a unique solution!')
        } else {
          showNotification(
            'success',
            'Multiple Solutions Found!',
            capped
              ? `Found ${solutions.length}+ solutions (showing the first ${solutions.length}). Add more clues to narrow it down.`
              : `Found ${solutions.length} possible solutions.`,
          )
          setShowAllSolutions(true)
        }
      } else if (capped) {
        showNotification('warning', 'Stopped Searching', 'The search hit its limit before finding a solution. Add more clues or check the ones you entered.')
      } else {
        showNotification('error', 'No Solution', 'This puzzle appears to be unsolvable with the given constraints.')
      }
      
      setIsLoading(false)
      return solutions.length > 0
    } catch (error) {
      console.error('Error solving puzzle:', error)
      showNotification('error', 'Solver Error', 'An error occurred while solving the puzzle. Please try again.')
      setIsLoading(false)
      return false
    }
  }

  // Check if partial state is valid (for constraint propagation)
  const isPartiallyValid = (testBoard: TangoBoard, row: number, col: number): boolean => {
    // Check immediate constraints
    const symbol = testBoard.grid[row][col]
    
    // Check horizontal constraints
    if (col > 0) {
      const constraint = testBoard.horizontalConstraints[row][col - 1]
      const leftSymbol = testBoard.grid[row][col - 1]
      if (constraint && leftSymbol) {
        if (constraint === "equals" && symbol !== leftSymbol) return false
        if (constraint === "different" && symbol === leftSymbol) return false
      }
    }
    
    if (col < gridSize - 1) {
      const constraint = testBoard.horizontalConstraints[row][col]
      const rightSymbol = testBoard.grid[row][col + 1]
      if (constraint && rightSymbol) {
        if (constraint === "equals" && symbol !== rightSymbol) return false
        if (constraint === "different" && symbol === rightSymbol) return false
      }
    }
    
    // Check vertical constraints
    if (row > 0) {
      const constraint = testBoard.verticalConstraints[row - 1][col]
      const topSymbol = testBoard.grid[row - 1][col]
      if (constraint && topSymbol) {
        if (constraint === "equals" && symbol !== topSymbol) return false
        if (constraint === "different" && symbol === topSymbol) return false
      }
    }
    
    if (row < gridSize - 1) {
      const constraint = testBoard.verticalConstraints[row][col]
      const bottomSymbol = testBoard.grid[row + 1][col]
      if (constraint && bottomSymbol) {
        if (constraint === "equals" && symbol !== bottomSymbol) return false
        if (constraint === "different" && symbol === bottomSymbol) return false
      }
    }
    
    // Check for 3-in-a-row
    // Check horizontal
    if (col >= 2) {
      if (testBoard.grid[row][col - 2] === symbol && testBoard.grid[row][col - 1] === symbol) {
        return false
      }
    }
    if (col >= 1 && col < gridSize - 1) {
      if (testBoard.grid[row][col - 1] === symbol && testBoard.grid[row][col + 1] === symbol) {
        return false
      }
    }
    if (col <= gridSize - 3) {
      if (testBoard.grid[row][col + 1] === symbol && testBoard.grid[row][col + 2] === symbol) {
        return false
      }
    }
    
    // Check vertical
    if (row >= 2) {
      if (testBoard.grid[row - 2][col] === symbol && testBoard.grid[row - 1][col] === symbol) {
        return false
      }
    }
    if (row >= 1 && row < gridSize - 1) {
      if (testBoard.grid[row - 1][col] === symbol && testBoard.grid[row + 1][col] === symbol) {
        return false
      }
    }
    if (row <= gridSize - 3) {
      if (testBoard.grid[row + 1][col] === symbol && testBoard.grid[row + 2][col] === symbol) {
        return false
      }
    }

    // Balance: a row or column never holds more than half its cells (rounded up) of one symbol.
    // Without this the search can spend its whole budget under an unbalanced first row.
    const maxPerLine = Math.ceil(gridSize / 2)
    let inRow = 0
    let inCol = 0
    for (let i = 0; i < gridSize; i++) {
      if (testBoard.grid[row][i] === symbol) inRow++
      if (testBoard.grid[i][col] === symbol) inCol++
    }
    if (inRow > maxPerLine || inCol > maxPerLine) return false

    return true
  }

  // Reset puzzle
  const resetPuzzle = () => {
    initializeBoard()
    setAllSolutions([])
    setSolutionCount(0)
    setSolutionsCapped(false)
    setCurrentSolutionIndex(0)
    setShowAllSolutions(false)
    setNotification(null)
  }

  // Navigate between solutions
  const nextSolution = () => {
    if (allSolutions.length > 1) {
      const nextIndex = (currentSolutionIndex + 1) % allSolutions.length
      setCurrentSolutionIndex(nextIndex)
      setBoard(allSolutions[nextIndex])
    }
  }

  const previousSolution = () => {
    if (allSolutions.length > 1) {
      const prevIndex = currentSolutionIndex === 0 ? allSolutions.length - 1 : currentSolutionIndex - 1
      setCurrentSolutionIndex(prevIndex)
      setBoard(allSolutions[prevIndex])
    }
  }

  // Toggle all solutions display
  const toggleAllSolutions = () => {
    setShowAllSolutions(!showAllSolutions)
  }

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ type, title, message })
    // One timer at a time, so an older toast's timer cannot hide a newer toast early.
    if (notificationTimer.current) clearTimeout(notificationTimer.current)
    notificationTimer.current = setTimeout(() => setNotification(null), 5000)
  }

  // Example puzzles for different grid sizes
  const getExamplePuzzles = () => {
    const examples = {
      // 4×4 to 6×6 examples each have exactly one solution.
      4: [
        {
          name: "Easy 4x4",
          grid: [
            [null, null, null, "moon"],
            [null, null, null, null],
            ["moon", null, null, null],
            [null, null, null, null]
          ] as Grid,
          horizontalConstraints: [
            [null, null, null],
            [null, null, null],
            [null, "equals", null],
            [null, null, null]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, null],
            [null, null, "equals", null],
            [null, null, null, null]
          ] as VerticalConstraints
        }
      ],
      5: [
        {
          name: "Easy 5x5",
          grid: [
            [null, "sun", "sun", null, null],
            [null, null, null, null, null],
            [null, null, null, null, "moon"],
            [null, null, null, null, null],
            [null, "moon", null, null, null]
          ] as Grid,
          horizontalConstraints: [
            [null, null, null, null],
            [null, "different", null, null],
            ["equals", null, null, null],
            [null, null, null, null],
            ["different", null, "equals", null]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, "different", null],
            [null, null, null, null, null],
            ["different", "different", null, null, null],
            [null, null, null, null, null]
          ] as VerticalConstraints
        }
      ],
      6: [
        {
          name: "Easy 6x6",
          grid: [
            [null, null, null, null, "moon", null],
            ["sun", null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, "sun", "moon", null, null],
            [null, null, null, null, null, null],
            [null, "moon", null, null, null, null]
          ] as Grid,
          horizontalConstraints: [
            ["equals", null, null, null, null],
            [null, null, null, "different", null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, "equals"]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, null, null, null],
            [null, "different", null, null, null, null],
            [null, null, "different", "different", null, null],
            [null, null, null, null, null, null],
            [null, "different", null, null, null, "equals"]
          ] as VerticalConstraints
        }
      ],
      7: [
        {
          name: "Easy 7x7",
          grid: [
            [null, "sun", null, null, null, null, null],
            [null, null, null, "moon", null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, "sun", null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null]
          ] as Grid,
          horizontalConstraints: [
            [null, null, "equals", null, null, null],
            [null, null, null, null, null, null],
            [null, "different", null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null]
          ] as VerticalConstraints
        }
      ]
    }
    return examples[gridSize as keyof typeof examples] || []
  }

  const loadExample = () => {
    const examples = getExamplePuzzles()
    if (examples.length > 0) {
      const example = examples[currentExample % examples.length]
      setBoard({
        grid: example.grid,
        horizontalConstraints: example.horizontalConstraints,
        verticalConstraints: example.verticalConstraints
      })
      setSolved(false)
      setAllSolutions([])
      setSolutionCount(0)
      setSolutionsCapped(false)
      setCurrentSolutionIndex(0)
      setShowAllSolutions(false)
      showNotification('success', 'Example Loaded', `Successfully loaded: ${example.name}`)
    }
  }

  // Symbol component
  const SymbolDisplay = ({ symbol }: { symbol: Symbol }) => {
    if (symbol === "sun") {
      return <span className="text-xl sm:text-3xl leading-none flex items-center justify-center">☀️</span>
    } else if (symbol === "moon") {
      return <span className="text-xl sm:text-3xl leading-none flex items-center justify-center">🌙</span>
    }
    // Empty cell: a quiet "+" hint. The trigger's aria-label carries the real name.
    return <span aria-hidden="true" className="text-lg leading-none text-gray-500">+</span>
  }

  // Constraint component
  const ConstraintDisplay = ({ constraint }: { constraint: Constraint }) => {
    if (constraint === "equals") {
      return <span className="text-base sm:text-lg font-bold text-blue-600">=</span>
    } else if (constraint === "different") {
      return <span className="text-base sm:text-lg font-bold text-red-600">≠</span>
    }
    return <span aria-hidden="true" className="text-base font-bold leading-none text-gray-600">·</span>
  }

  const constraintName = (constraint: Constraint) => (constraint ? CONSTRAINT_NAMES[constraint] : "none")

  const constraintOptions = (
    <SelectContent className="bg-white border-2 border-gray-300 shadow-lg z-50" style={{backgroundColor: 'white', color: 'black'}}>
      <SelectItem value="empty" className="text-gray-600 hover:bg-gray-100 focus:bg-gray-100" style={{backgroundColor: 'white', color: '#4b5563'}}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">∅</span>
          <span>No constraint</span>
        </div>
      </SelectItem>
      <SelectItem value="equals" className="text-blue-600 hover:bg-blue-50 focus:bg-blue-50" style={{backgroundColor: 'white', color: '#2563eb'}}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">=</span>
          <span>Must be equal</span>
        </div>
      </SelectItem>
      <SelectItem value="different" className="text-red-600 hover:bg-red-50 focus:bg-red-50" style={{backgroundColor: 'white', color: '#dc2626'}}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">≠</span>
          <span>Must be different</span>
        </div>
      </SelectItem>
    </SelectContent>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4 sm:p-4" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto">
        <Card suppressHydrationWarning>
          <CardHeader className="text-center px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-black">LinkedIn Tango Puzzle Solver</h1>
            <p className="text-black">
              Free online Tango puzzle solver inspired by LinkedIn&apos;s daily puzzle game. 
              Fill the grid with suns ☀️ and moons 🌙 following the rules. Supports multiple grid sizes!
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-3 sm:px-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="grid-size" className="text-black">Grid Size:</Label>
                <Select 
                  value={gridSize.toString()} 
                  onValueChange={(value) => {
                    const newSize = Number.parseInt(value)
                    if (newSize >= 4 && newSize <= 6) {
                      setGridSize(newSize)
                      setBoard(createEmptyBoard(newSize))
                      setSolved(false)
                      setAllSolutions([])
                      setSolutionCount(0)
                      setCurrentSolutionIndex(0)
                      setShowAllSolutions(false)
                      setNotification(null)
                    }
                  }}
                >
                  <SelectTrigger id="grid-size" aria-label={`Grid size: ${gridSize} by ${gridSize}`} className="w-20 bg-white text-black border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 z-50" style={{backgroundColor: 'white', color: 'black'}}>
                    <SelectItem value="4" className="text-black hover:bg-gray-100" style={{backgroundColor: 'white', color: 'black'}}>4×4</SelectItem>
                    <SelectItem value="5" className="text-black hover:bg-gray-100" style={{backgroundColor: 'white', color: 'black'}}>5×5</SelectItem>
                    <SelectItem value="6" className="text-black hover:bg-gray-100" style={{backgroundColor: 'white', color: 'black'}}>6×6</SelectItem>
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

              <Button onClick={resetPuzzle} variant="outline" className="text-black">
                🔄 Reset
              </Button>

              <Button onClick={() => setShowControls(!showControls)} variant="outline" className="text-black">
                {showControls ? "👁️ Hide" : "👁️ Show"} Controls
              </Button>

              <Button
                onClick={loadExample}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 border-red-300 text-black"
              >
                📝 Load Example
              </Button>
            </div>

            {/* Notification Toast. The wrapper is always mounted so screen readers announce each result. */}
            <div role="status" aria-live="polite" className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:max-w-md">
            {notification && (
              <div className={`p-4 rounded-lg shadow-lg border-l-4 ${(() => {
                switch (notification.type) {
                  case 'success': return 'bg-green-50 border-green-400 text-green-800'
                  case 'error': return 'bg-red-50 border-red-400 text-red-800'
                  case 'warning': return 'bg-yellow-50 border-yellow-400 text-yellow-800'
                  default: return 'bg-blue-50 border-blue-400 text-blue-800'
                }
              })()}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' && <span className="text-xl">✅</span>}
                    {notification.type === 'error' && <span className="text-xl">❌</span>}
                    {notification.type === 'warning' && <span className="text-xl">⚠️</span>}
                    {notification.type === 'info' && <span className="text-xl">ℹ️</span>}
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

            {/* Status */}
            {solved && (
              <div className="text-center space-y-4">
                <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                  ✅ Puzzle Solved!
                </Badge>
                
                {solutionCount > 1 && (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-black border border-gray-300">
                      🔢 {solutionCount}
                      {solutionsCapped ? "+" : ""} solution{solutionCount > 1 ? "s" : ""} found
                    </Badge>
                    
                    <div className="flex justify-center gap-2 items-center">
                      <Button
                        onClick={previousSolution}
                        variant="outline"
                        size="sm"
                        disabled={allSolutions.length <= 1}
                        className="text-black"
                      >
                        ⬅️ Previous
                      </Button>
                      <span className="text-sm px-3 py-1 bg-gray-100 rounded text-black">
                        Solution {currentSolutionIndex + 1} of {solutionCount}
                        {solutionsCapped ? "+" : ""}
                      </span>
                      <Button
                        onClick={nextSolution}
                        variant="outline"
                        size="sm"
                        disabled={allSolutions.length <= 1}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-black"
                      >
                        ➡️ Next Solution
                      </Button>
                    </div>
                    
                    {solutionCount > 10 && (
                      <Button
                        onClick={toggleAllSolutions}
                        variant="outline"
                        className="bg-orange-50 hover:bg-orange-100 border-orange-300 text-black"
                      >
                        {showAllSolutions ? "🔽 Hide All Solutions" : "🔼 View All Solutions"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />
            <PuzzleTools type="tango" value={{type:'tango',size:gridSize,board}} active={!solved && !isLoading} onReset={resetPuzzle} onRestore={saved=>{if(saved.type!=='tango')return;setGridSize(saved.size);setBoard(saved.board);setAllSolutions([]);setSolutionCount(0);setShowAllSolutions(false);setSolutionsCapped(false);setNotification(null);setSolved(false);}} />

            {/* Puzzle Grid. One CSS grid (cells + constraint tracks) whose cell tracks shrink
                on phones; if a screen is still too narrow it scrolls inside this box from column 1. */}
            <div className="-mx-1 overflow-x-auto px-1 py-1">
              <div
                className="mx-auto grid w-full max-w-max gap-0.5 [--tango-k:26px] sm:gap-1 sm:[--tango-k:2.5rem]"
                style={{
                  gridTemplateColumns: `repeat(${gridSize - 1}, minmax(1.75rem, 5rem) var(--tango-k)) minmax(1.75rem, 5rem)`,
                }}
              >
                {board.grid.map((row, rowIndex) => (
                  <Fragment key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <Fragment key={colIndex}>
                        {/* Cell */}
                        <div
                          style={{ gridRow: rowIndex * 2 + 1, gridColumn: colIndex * 2 + 1 }}
                          className="aspect-square w-full flex items-center justify-center border-2 border-gray-400 bg-white rounded-md sm:rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Select 
                            value={cell ?? "empty"} 
                            onValueChange={(value) => updateGridCell(rowIndex, colIndex, value === "empty" ? null : value as Symbol)}
                          >
                            <SelectTrigger
                              aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}: ${cell ?? "empty"}`}
                              className="w-full h-full border-0 bg-transparent px-0 sm:px-3 text-black hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 flex items-center justify-center max-sm:[&>svg]:hidden"
                            >
                              <SelectValue className="flex items-center justify-center w-full h-full">
                                <SymbolDisplay symbol={cell} />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-gray-300 shadow-lg z-50" style={{backgroundColor: 'white', color: 'black'}}>
                              <SelectItem value="empty" className="text-gray-600 hover:bg-gray-100 focus:bg-gray-100" style={{backgroundColor: 'white', color: '#4b5563'}}>
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">∅</span>
                                  <span>Empty</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="sun" className="text-black hover:bg-yellow-50 focus:bg-yellow-50" style={{backgroundColor: 'white', color: 'black'}}>
                                <div className="flex items-center gap-2">
                                  <span className="text-3xl leading-none">☀️</span>
                                  <span>Sun</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="moon" className="text-black hover:bg-blue-50 focus:bg-blue-50" style={{backgroundColor: 'white', color: 'black'}}>
                                <div className="flex items-center gap-2">
                                  <span className="text-3xl leading-none">🌙</span>
                                  <span>Moon</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Horizontal constraint (between this cell and the next one in the row) */}
                        {colIndex < gridSize - 1 && (
                          <div
                            style={{ gridRow: rowIndex * 2 + 1, gridColumn: colIndex * 2 + 2 }}
                            className="self-center w-[26px] h-[26px] sm:w-10 sm:h-10 flex items-center justify-center bg-gray-100 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors"
                          >
                            <Select 
                              value={board.horizontalConstraints[rowIndex][colIndex] ?? "empty"} 
                              onValueChange={(value) => updateHorizontalConstraint(rowIndex, colIndex, value === "empty" ? null : value as Constraint)}
                            >
                              <SelectTrigger
                                aria-label={`Constraint between row ${rowIndex + 1}, columns ${colIndex + 1} and ${colIndex + 2}: ${constraintName(board.horizontalConstraints[rowIndex][colIndex])}`}
                                className="w-full h-full border-0 bg-transparent px-0 sm:px-1 justify-center gap-0.5 text-black max-sm:[&>svg]:hidden"
                              >
                                <SelectValue className="flex items-center justify-center">
                                  <ConstraintDisplay constraint={board.horizontalConstraints[rowIndex][colIndex]} />
                                </SelectValue>
                              </SelectTrigger>
                              {constraintOptions}
                            </Select>
                          </div>
                        )}
                      </Fragment>
                    ))}

                    {/* Vertical constraints (between this row and the next one) */}
                    {rowIndex < gridSize - 1 &&
                      board.verticalConstraints[rowIndex].map((constraint, colIndex) => (
                        <div
                          key={`v-${colIndex}`}
                          style={{ gridRow: rowIndex * 2 + 2, gridColumn: colIndex * 2 + 1 }}
                          className="w-full h-[26px] sm:h-8 flex items-center justify-center bg-gray-100 rounded-md sm:rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                        >
                          <Select 
                            value={constraint ?? "empty"} 
                            onValueChange={(value) => updateVerticalConstraint(rowIndex, colIndex, value === "empty" ? null : value as Constraint)}
                          >
                            <SelectTrigger
                              aria-label={`Constraint between column ${colIndex + 1}, rows ${rowIndex + 1} and ${rowIndex + 2}: ${constraintName(constraint)}`}
                              className="w-full h-full border-0 bg-transparent px-0 sm:px-3 justify-center sm:justify-between text-black max-sm:[&>svg]:hidden"
                            >
                              <SelectValue className="flex items-center justify-center">
                                <ConstraintDisplay constraint={constraint} />
                              </SelectValue>
                            </SelectTrigger>
                            {constraintOptions}
                          </Select>
                        </div>
                      ))}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* All Solutions Display */}
            {showAllSolutions && allSolutions.length > 10 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <h2 className="text-lg font-semibold tracking-tight text-blue-800 flex items-center gap-2">
                    🔢 {solutionsCapped ? `First ${solutionCount}` : `All ${solutionCount}`} Solutions
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {allSolutions.map((solution, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            Solution {index + 1}
                          </Badge>
                        </div>
                        <div className="inline-block border-2 border-gray-300 rounded p-2 bg-white">
                          {solution.grid.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex">
                              {row.map((cell, colIndex) => (
                                <div
                                  key={colIndex}
                                  className="w-4 h-4 border border-gray-400 flex items-center justify-center text-xs"
                                >
                                  {cell === "sun" ? "☀️" : cell === "moon" ? "🌙" : ""}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <Button
                            onClick={() => {
                              setBoard(solution)
                              setCurrentSolutionIndex(index)
                              setShowAllSolutions(false)
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Use This
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
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <h2 className="text-lg font-semibold tracking-tight text-blue-800">How to Play Tango</h2>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold">🎯 Goal:</p>
                      <p>• Fill the {gridSize}×{gridSize} grid with suns ☀️ and moons 🌙</p>
                      <p>• Each row and column must contain {gridSize % 2 === 0 ? `exactly ${Math.floor(gridSize / 2)} suns and ${Math.floor(gridSize / 2)} moons` : `${Math.floor(gridSize / 2)} or ${Math.ceil(gridSize / 2)} of each symbol (difference of at most 1)`}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">📏 Rules:</p>
                      <p>• No more than two identical symbols may be adjacent</p>
                      <p>• Cells with <span className="text-blue-600 font-bold">=</span> between them must contain the same symbol</p>
                      <p>• Cells with <span className="text-red-600 font-bold">≠</span> between them must contain different symbols</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold mb-2">🖱️ How to use:</p>
                    <p>• Click on any cell to place suns ☀️ or moons 🌙</p>
                    <p>• Click between cells to add constraints (= or ≠)</p>
                    <p>• Click &quot;🧩 Solve Puzzle&quot; to automatically solve the current puzzle</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Developer Contact Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <h2 className="text-xl font-semibold tracking-tight text-center text-gray-800 flex items-center justify-center gap-2">
                  <span className="text-2xl" aria-hidden="true">👨‍💻</span>
                  Get In Touch
                </h2>
                <p className="text-center text-gray-600">
                  Have a puzzle type you&apos;d like us to add? Found a bug? We&apos;d love to hear from you!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">LinkedIn</h3>
                      <Button asChild variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 text-sm">
                        <a href={SITE.links.linkedin} target="_blank" rel="noopener noreferrer">
                          Connect with the Developer
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Coffee className="w-6 h-6 text-orange-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">Support Development</h3>
                      <Button asChild variant="link" className="p-0 h-auto text-orange-700 hover:text-orange-900 text-sm">
                        <a href={SITE.links.buyMeACoffee} target="_blank" rel="noopener noreferrer">
                          Buy me a coffee ☕
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    This Tango puzzle solver was created with passion for puzzle games and web development.
                  </p>
                  <p className="text-xs text-gray-600 mt-3">
                    If you enjoy this puzzle solver, consider connecting or supporting future development!
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-gray-600">
              Not affiliated with or endorsed by LinkedIn. &ldquo;Tango&rdquo; is used only to describe the puzzle this tool solves.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
