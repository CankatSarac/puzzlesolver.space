"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

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

export default function TangoSolver() {
  const t = useTranslations("tango")
  const tc = useTranslations("solverCommon")
  const [isHydrated, setIsHydrated] = useState(false)
  const [gridSize, setGridSize] = useState(6)
  const [board, setBoard] = useState<TangoBoard>({
    grid: [],
    horizontalConstraints: [],
    verticalConstraints: []
  })
  const [solved, setSolved] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentExample] = useState(0)
  const [allSolutions, setAllSolutions] = useState<TangoBoard[]>([])
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0)
  const [showAllSolutions, setShowAllSolutions] = useState(false)
  const [solutionCount, setSolutionCount] = useState(0)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  } | null>(null)

  // Handle hydration - wait for client-side mounting
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Initialize board
  const initializeBoard = useCallback(() => {
    try {
      const newGrid: Grid = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill(null))
      
      const newHorizontalConstraints: HorizontalConstraints = Array(gridSize)
        .fill(null)
        .map(() => Array(Math.max(0, gridSize - 1)).fill(null))
      
      const newVerticalConstraints: VerticalConstraints = Array(Math.max(0, gridSize - 1))
        .fill(null)
        .map(() => Array(gridSize).fill(null))

      setBoard({
        grid: newGrid,
        horizontalConstraints: newHorizontalConstraints,
        verticalConstraints: newVerticalConstraints
      })
      setSolved(false)
    } catch (error) {
      console.error('Error initializing board:', error)
      // Fallback to a simple 4x4 board
      const fallbackGrid: Grid = Array(4).fill(null).map(() => Array(4).fill(null))
      const fallbackHorizontal: HorizontalConstraints = Array(4).fill(null).map(() => Array(3).fill(null))
      const fallbackVertical: VerticalConstraints = Array(3).fill(null).map(() => Array(4).fill(null))
      
      setBoard({
        grid: fallbackGrid,
        horizontalConstraints: fallbackHorizontal,
        verticalConstraints: fallbackVertical
      })
      setSolved(false)
    }
  }, [gridSize])

  // Initialize board only after hydration
  useEffect(() => {
    if (isHydrated) {
      initializeBoard()
    }
  }, [isHydrated, initializeBoard])

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
      
      setAllSolutions(solutions)
      setSolutionCount(solutions.length)
      
      if (solutions.length > 0) {
        setBoard(solutions[0])
        setSolved(true)
        if (solutions.length === 1) {
          showNotification('success', t('notif_solved_title'), t('notif_unique_msg'))
        } else {
          showNotification('success', t('notif_multiple_title'), t('notif_multiple_msg', { count: solutions.length }))
          setShowAllSolutions(true)
        }
      } else {
        showNotification('error', t('notif_no_solution_title'), t('notif_no_solution_msg'))
      }
      
      setIsLoading(false)
      return solutions.length > 0
    } catch (error) {
      console.error('Error solving puzzle:', error)
      showNotification('error', t('notif_error_title'), t('notif_error_msg'))
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
    
    return true
  }

  // Reset puzzle
  const resetPuzzle = () => {
    initializeBoard()
    setAllSolutions([])
    setSolutionCount(0)
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
    setTimeout(() => setNotification(null), 5000)
  }

  // Example puzzles for different grid sizes
  const getExamplePuzzles = () => {
    const examples = {
      4: [
        {
          name: "Easy 4x4",
          grid: [
            [null, "sun", null, null],
            [null, null, "moon", null],
            [null, null, null, null],
            ["moon", null, null, null]
          ] as Grid,
          horizontalConstraints: [
            [null, "equals", null],
            [null, null, null],
            ["different", null, null],
            [null, null, null]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
          ] as VerticalConstraints
        }
      ],
      5: [
        {
          name: "Easy 5x5",
          grid: [
            [null, "sun", null, null, null],
            [null, null, null, "moon", null],
            [null, null, null, null, null],
            [null, null, "sun", null, null],
            [null, null, null, null, null]
          ] as Grid,
          horizontalConstraints: [
            [null, null, "equals", null],
            [null, null, null, null],
            [null, "different", null, null],
            [null, null, null, null],
            [null, null, null, null]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
          ] as VerticalConstraints
        }
      ],
      6: [
        {
          name: "Easy 6x6",
          grid: [
            [null, "sun", null, null, null, null],
            [null, null, null, "moon", null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, "sun", null, null, null],
            [null, null, null, null, null, null]
          ] as Grid,
          horizontalConstraints: [
            [null, null, "equals", null, null],
            [null, null, null, null, null],
            [null, "different", null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
          ] as HorizontalConstraints,
          verticalConstraints: [
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
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
      showNotification('success', t('notif_example_title'), t('notif_example_msg', { name: tc('example_easy', { size: gridSize }) }))
    }
  }

  // Symbol component
  const SymbolDisplay = ({ symbol }: { symbol: Symbol }) => {
    if (symbol === "sun") {
      return <span className="text-3xl leading-none flex items-center justify-center">☀️</span>
    } else if (symbol === "moon") {
      return <span className="text-3xl leading-none flex items-center justify-center">🌙</span>
    }
    return <span className="text-gray-400 text-xs text-center">{t("cell_click_to_select")}</span>
  }

  // Constraint component
  const ConstraintDisplay = ({ constraint }: { constraint: Constraint }) => {
    if (constraint === "equals") {
      return <span className="text-lg font-bold text-blue-600">=</span>
    } else if (constraint === "different") {
      return <span className="text-lg font-bold text-red-600">≠</span>
    }
    return <span className="text-gray-400 text-xs">{t("cell_click")}</span>
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto">
        <Card suppressHydrationWarning>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-black">{t("title")}</CardTitle>
            <p className="text-black">{t("description")}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="grid-size" className="text-black">{tc("grid_size_label")}</Label>
                <Select 
                  value={gridSize.toString()} 
                  onValueChange={(value) => {
                    const newSize = Number.parseInt(value)
                    if (newSize >= 4 && newSize <= 6) {
                      setGridSize(newSize)
                      setSolved(false)
                      setAllSolutions([])
                      setSolutionCount(0)
                      setCurrentSolutionIndex(0)
                      setShowAllSolutions(false)
                      setNotification(null)
                    }
                  }}
                >
                  <SelectTrigger className="w-20 bg-white text-black border-gray-300">
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
                {isLoading ? t("solving") : t("solve")}
              </Button>

              <Button onClick={resetPuzzle} variant="outline" className="text-black">
                {t("reset")}
              </Button>

              <Button onClick={() => setShowControls(!showControls)} variant="outline" className="text-black">
                {showControls ? t("controls_hide") : t("controls_show")}
              </Button>

              <Button
                onClick={loadExample}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 border-red-300 text-black"
              >
                {t("load_example")}
              </Button>
            </div>

            {/* Notification Toast */}
            {notification && (
              <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 ${(() => {
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
                    <h3 className="text-sm font-medium">{notification.title}</h3>
                    <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                  </div>
                  <button
                    onClick={() => setNotification(null)}
                    className="ml-4 flex-shrink-0 text-lg hover:opacity-70"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Status */}
            {solved && (
              <div className="text-center space-y-4">
                <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                  {t("solved_badge")}
                </Badge>
                
                {solutionCount > 1 && (
                  <div className="space-y-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-black border border-gray-300">
                      {t("solutions_found", { count: solutionCount })}
                    </Badge>
                    
                    <div className="flex justify-center gap-2 items-center">
                      <Button
                        onClick={previousSolution}
                        variant="outline"
                        size="sm"
                        disabled={allSolutions.length <= 1}
                        className="text-black"
                      >
                        {t("previous")}
                      </Button>
                      <span className="text-sm px-3 py-1 bg-gray-100 rounded text-black">
                        {tc("solution_x_of_y", { current: currentSolutionIndex + 1, total: solutionCount })}
                      </span>
                      <Button
                        onClick={nextSolution}
                        variant="outline"
                        size="sm"
                        disabled={allSolutions.length <= 1}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-black"
                      >
                        {t("next_solution")}
                      </Button>
                    </div>
                    
                    {solutionCount > 10 && (
                      <Button
                        onClick={toggleAllSolutions}
                        variant="outline"
                        className="bg-orange-50 hover:bg-orange-100 border-orange-300 text-black"
                      >
                        {showAllSolutions ? t("hide_all") : t("view_all")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Puzzle Grid */}
            <div className="flex justify-center">
              <div className="inline-block space-y-1">
                {board.grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="space-y-1">
                    {/* Main row with cells and horizontal constraints */}
                    <div className="flex items-center space-x-1">
                      {row.map((cell, colIndex) => (
                        <div key={colIndex} className="flex items-center space-x-1">
                          {/* Cell */}
                          <div className="w-20 h-20 flex items-center justify-center border-2 border-gray-400 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <Select 
                              value={cell ?? "empty"} 
                              onValueChange={(value) => updateGridCell(rowIndex, colIndex, value === "empty" ? null : value as Symbol)}
                            >
                              <SelectTrigger className="w-full h-full border-0 bg-transparent text-black hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 flex items-center justify-center">
                                <SelectValue className="flex items-center justify-center w-full h-full">
                                  <SymbolDisplay symbol={cell} />
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 border-gray-300 shadow-lg z-50" style={{backgroundColor: 'white', color: 'black'}}>
                                <SelectItem value="empty" className="text-gray-600 hover:bg-gray-100 focus:bg-gray-100" style={{backgroundColor: 'white', color: '#6b7280'}}>
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">∅</span>
                                    <span>{t("opt_empty")}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="sun" className="text-black hover:bg-yellow-50 focus:bg-yellow-50" style={{backgroundColor: 'white', color: 'black'}}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-3xl leading-none">☀️</span>
                                    <span>{t("opt_sun")}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="moon" className="text-black hover:bg-blue-50 focus:bg-blue-50" style={{backgroundColor: 'white', color: 'black'}}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-3xl leading-none">🌙</span>
                                    <span>{t("opt_moon")}</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Horizontal constraint */}
                          {colIndex < gridSize - 1 && (
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors">
                              <Select 
                                value={board.horizontalConstraints[rowIndex][colIndex] ?? "empty"} 
                                onValueChange={(value) => updateHorizontalConstraint(rowIndex, colIndex, value === "empty" ? null : value as Constraint)}
                              >
                                <SelectTrigger className="w-full h-full border-0 bg-transparent text-black">
                                  <SelectValue className="flex items-center justify-center">
                                    <ConstraintDisplay constraint={board.horizontalConstraints[rowIndex][colIndex]} />
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-2 border-gray-300 shadow-lg z-50" style={{backgroundColor: 'white', color: 'black'}}>
                                  <SelectItem value="empty" className="text-gray-600 hover:bg-gray-100 focus:bg-gray-100" style={{backgroundColor: 'white', color: '#6b7280'}}>
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">∅</span>
                                      <span>{t("opt_no_constraint")}</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="equals" className="text-blue-600 hover:bg-blue-50 focus:bg-blue-50" style={{backgroundColor: 'white', color: '#2563eb'}}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold">=</span>
                                      <span>{t("opt_must_equal")}</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="different" className="text-red-600 hover:bg-red-50 focus:bg-red-50" style={{backgroundColor: 'white', color: '#dc2626'}}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold">≠</span>
                                      <span>{t("opt_must_differ")}</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Vertical constraints row */}
                    {rowIndex < gridSize - 1 && (
                      <div className="flex items-center space-x-1">
                        {board.verticalConstraints[rowIndex].map((constraint, colIndex) => (
                          <div key={colIndex} className="flex items-center space-x-1">
                            {/* Vertical constraint */}
                            <div className="w-20 h-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors">
                              <Select 
                                value={constraint ?? "empty"} 
                                onValueChange={(value) => updateVerticalConstraint(rowIndex, colIndex, value === "empty" ? null : value as Constraint)}
                              >
                                <SelectTrigger className="w-full h-full border-0 bg-transparent text-black">
                                  <SelectValue className="flex items-center justify-center">
                                    <ConstraintDisplay constraint={constraint} />
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-2 border-gray-300 shadow-lg z-50" style={{backgroundColor: 'white', color: 'black'}}>
                                  <SelectItem value="empty" className="text-gray-600 hover:bg-gray-100 focus:bg-gray-100" style={{backgroundColor: 'white', color: '#6b7280'}}>
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">∅</span>
                                      <span>{t("opt_no_constraint")}</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="equals" className="text-blue-600 hover:bg-blue-50 focus:bg-blue-50" style={{backgroundColor: 'white', color: '#2563eb'}}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold">=</span>
                                      <span>{t("opt_must_equal")}</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="different" className="text-red-600 hover:bg-red-50 focus:bg-red-50" style={{backgroundColor: 'white', color: '#dc2626'}}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold">≠</span>
                                      <span>{t("opt_must_differ")}</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Spacer for horizontal constraint */}
                            {colIndex < gridSize - 1 && (
                              <div className="w-10 h-8"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* All Solutions Display */}
            {showAllSolutions && allSolutions.length > 10 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                    {t("all_solutions_title", { count: solutionCount })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {allSolutions.map((solution, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {tc("solution_n", { n: index + 1 })}
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
                            {t("use_this")}
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
                  <CardTitle className="text-lg text-blue-800">{t("howto_title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold">{t("howto_goal_label")}</p>
                      <p>• {t("howto_goal_fill", { size: gridSize })}</p>
                      <p>• {gridSize % 2 === 0 ? t("howto_goal_balance_even", { half: Math.floor(gridSize / 2) }) : t("howto_goal_balance_odd", { floor: Math.floor(gridSize / 2), ceil: Math.ceil(gridSize / 2) })}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">{t("howto_rules_label")}</p>
                      <p>• {t("howto_rule_adjacent")}</p>
                      <p>• {t.rich("howto_rule_equal", { eq: (chunks) => <span className="text-blue-600 font-bold">{chunks}</span> })}</p>
                      <p>• {t.rich("howto_rule_different", { neq: (chunks) => <span className="text-red-600 font-bold">{chunks}</span> })}</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold mb-2">{t("howto_use_label")}</p>
                    <p>• {t("howto_use_click_cell")}</p>
                    <p>• {t("howto_use_click_between")}</p>
                    <p>• {t("howto_use_click_solve")}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Developer Contact Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl text-center text-gray-800 flex items-center justify-center gap-2">
                  <span className="text-2xl">👨‍💻</span>
                  {t("contact_title")}
                </CardTitle>
                <p className="text-center text-gray-600">{t("contact_subtitle")}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{t("contact_linkedin_label")}</h4>
                      <Button
                        variant="link"
                        onClick={() => window.open("https://www.linkedin.com/in/cankatsarac/", "_blank")}
                        className="p-0 h-auto text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {t("contact_linkedin_cta")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-.766-1.613a4.44 4.44 0 0 0-1.364-1.04c-.476-.275-1.039-.428-1.612-.428-.297 0-.583.034-.863.1-.274.065-.54.159-.795.275-.255.117-.49.256-.713.416-.222.16-.425.344-.61.548a2.8 2.8 0 0 0-.438.65 18.84 18.84 0 0 0-.401.968c-.074.204-.12.417-.138.632-.018.218-.006.438.038.649.044.21.123.413.232.598.109.185.249.35.417.49.17.14.363.25.577.327.214.077.448.118.683.118.235 0 .469-.041.683-.118.214-.077.407-.187.577-.327.168-.14.308-.305.417-.49.109-.185.188-.388.232-.598.044-.211.056-.431.038-.649-.018-.215-.064-.428-.138-.632a18.84 18.84 0 0 0-.401-.968 2.8 2.8 0 0 0-.438-.65c-.185-.204-.388-.388-.61-.548-.223-.16-.458-.299-.713-.416a4.364 4.364 0 0 0-.795-.275 3.674 3.674 0 0 0-.863-.1c-.573 0-1.136.153-1.612.428a4.44 4.44 0 0 0-1.364 1.04c-.378.45-.647 1.015-.766 1.613l-.132.666c-.09.453-.106.922-.049 1.379.057.456.191.896.389 1.298.199.402.464.764.783 1.062.319.298.693.531 1.103.687.41.156.85.234 1.292.229.441-.005.878-.09 1.283-.25.405-.161.773-.4 1.084-.707.311-.307.563-.679.742-1.096.179-.417.284-.87.308-1.329.024-.458-.026-.918-.147-1.36z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{t("contact_support_label")}</h4>
                      <Button
                        variant="link"
                        onClick={() => window.open("https://buymeacoffee.com/cankatsarac", "_blank")}
                        className="p-0 h-auto text-orange-600 hover:text-orange-800 text-sm"
                      >
                        {t("contact_coffee_cta")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">{t("contact_note1")}</p>
                  <p className="text-xs text-gray-500 mt-3">{t("contact_note2")}</p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
