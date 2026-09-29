// Clean implementation of advanced Skyscraper solver with constraint programming

export type Grid = (number | null)[][]
export type Clues = {
  top: (number | null)[]
  bottom: (number | null)[]
  left: (number | null)[]
  right: (number | null)[]
}

export type PuzzleInput = {
  size: number
  clues: Clues
  givenNumbers?: { [key: string]: number }
}

export type Solution = {
  grid: number[][]
  valid: boolean
}

export type SolveResult = {
  solutions: Solution[]
  /** True when the search hit its time budget before it could finish. */
  stopped: boolean
}

/** The search gives up after this long so a hard or contradictory puzzle cannot freeze the tab. */
const TIME_BUDGET_MS = 2500

export class AdvancedSkyscraperSolver {
  private readonly size: number
  private readonly clues: Clues
  private readonly givenNumbers: { [key: string]: number }
  private solutions: number[][][]
  private maxSolutions: number
  private started = 0
  private nodes = 0
  stopped = false

  constructor(puzzle: PuzzleInput, maxSolutions: number = 10) {
    this.size = puzzle.size
    this.clues = puzzle.clues
    this.givenNumbers = puzzle.givenNumbers || {}
    this.solutions = []
    this.maxSolutions = maxSolutions
  }

  solve(): Solution[] {
    this.solutions = []
    this.started = Date.now()
    this.nodes = 0
    this.stopped = false
    const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0))
    
    // Apply given numbers
    for (const [key, value] of Object.entries(this.givenNumbers)) {
      const [row, col] = key.split(',').map(Number)
      if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
        grid[row][col] = value
      }
    }

    // Start constraint-based backtracking
    this.solveWithConstraints(grid, 0, 0)
    
    return this.solutions.map(sol => ({
      grid: sol.map(row => [...row]),
      valid: true
    }))
  }

  private solveWithConstraints(grid: number[][], row: number, col: number): boolean {
    if (this.solutions.length >= this.maxSolutions || this.stopped) {
      return true // Stop searching after finding enough solutions, or when out of time
    }
    if ((++this.nodes & 1023) === 0 && Date.now() - this.started > TIME_BUDGET_MS) {
      this.stopped = true
      return true
    }

    // Find next empty cell
    const nextCell = this.findNextEmptyCell(grid, row, col)
    if (!nextCell) {
      // All cells filled, check if solution is valid
      if (this.isCompleteSolutionValid(grid)) {
        this.solutions.push(grid.map(row => [...row]))
      }
      return this.solutions.length > 0
    }

    const [nextRow, nextCol] = nextCell

    // Try each possible value
    for (let value = 1; value <= this.size; value++) {
      if (this.isValidPlacement(grid, nextRow, nextCol, value)) {
        grid[nextRow][nextCol] = value
        
        // Check constraints after placement
        if (this.checkConstraintsAfterPlacement(grid, nextRow, nextCol)) {
          if (this.solveWithConstraints(grid, nextRow, nextCol)) {
            if (this.solutions.length >= this.maxSolutions || this.stopped) {
              grid[nextRow][nextCol] = 0
              return true
            }
          }
        }
        
        grid[nextRow][nextCol] = 0 // Backtrack
      }
    }

    return false
  }

  private findNextEmptyCell(grid: number[][], startRow: number, startCol: number): [number, number] | null {
    // Use Most Remaining Values (MRV) heuristic
    let bestCell: [number, number] | null = null
    let minRemainingValues = this.size + 1

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const remainingValues = this.countRemainingValues(grid, row, col)
          if (remainingValues < minRemainingValues) {
            minRemainingValues = remainingValues
            bestCell = [row, col]
          }
        }
      }
    }

    return bestCell
  }

  private countRemainingValues(grid: number[][], row: number, col: number): number {
    let count = 0
    for (let value = 1; value <= this.size; value++) {
      if (this.isValidPlacement(grid, row, col, value)) {
        count++
      }
    }
    return count
  }

  private isValidPlacement(grid: number[][], row: number, col: number, value: number): boolean {
    // A clue c allows at most n - c + 1 + d at distance d from its edge (and clue 1 means the
    // tallest building stands right at the edge).
    const n = this.size
    const edges: [number | null, number][] = [
      [this.clues.left[row], col],
      [this.clues.right[row], n - 1 - col],
      [this.clues.top[col], row],
      [this.clues.bottom[col], n - 1 - row],
    ]
    for (const [clue, distance] of edges) {
      if (clue === null || clue === undefined) continue
      if (value > n - clue + 1 + distance) return false
      if (clue === 1 && distance === 0 && value !== n) return false
    }

    // Check row constraint (no duplicates)
    for (let c = 0; c < this.size; c++) {
      if (c !== col && grid[row][c] === value) {
        return false
      }
    }    // Check column constraint (no duplicates)
    for (let r = 0; r < this.size; r++) {
      if (r !== row && grid[r][col] === value) {
        return false
      }
    }

    return true
  }

  private checkConstraintsAfterPlacement(grid: number[][], row: number, col: number): boolean {
    // Check row visibility constraints if row is complete
    const rowValues = grid[row]
    if (rowValues.every(v => v !== 0)) {
      if (!this.checkRowVisibility(rowValues, row)) {
        return false
      }
    }

    // Check column visibility constraints if column is complete
    const colValues = []
    for (let r = 0; r < this.size; r++) {
      colValues.push(grid[r][col])
    }
    if (colValues.every(v => v !== 0)) {
      if (!this.checkColumnVisibility(colValues, col)) {
        return false
      }
    }

    // Early pruning: check if partial constraints can still be satisfied
    return this.checkPartialConstraints(grid, row, col)
  }

  private checkRowVisibility(rowValues: number[], row: number): boolean {
    // Check left clue
    if (this.clues.left[row] !== null) {
      const leftVisible = this.countVisible(rowValues)
      if (leftVisible !== this.clues.left[row]) {
        return false
      }
    }

    // Check right clue
    if (this.clues.right[row] !== null) {
      const rightVisible = this.countVisible([...rowValues].reverse())
      if (rightVisible !== this.clues.right[row]) {
        return false
      }
    }

    return true
  }

  private checkColumnVisibility(colValues: number[], col: number): boolean {
    // Check top clue
    if (this.clues.top[col] !== null) {
      const topVisible = this.countVisible(colValues)
      if (topVisible !== this.clues.top[col]) {
        return false
      }
    }

    // Check bottom clue
    if (this.clues.bottom[col] !== null) {
      const bottomVisible = this.countVisible([...colValues].reverse())
      if (bottomVisible !== this.clues.bottom[col]) {
        return false
      }
    }

    return true
  }

  private checkPartialConstraints(grid: number[][], row: number, col: number): boolean {
    const colValues: number[] = []
    for (let r = 0; r < this.size; r++) {
      colValues.push(grid[r][col])
    }
    return (
      this.lineCanStillWork(grid[row], this.clues.left[row], this.clues.right[row]) &&
      this.lineCanStillWork(colValues, this.clues.top[col], this.clues.bottom[col])
    )
  }

  /**
   * Early pruning for a partly filled line. countVisiblePartial only counts the filled run next to
   * an edge (up to the first empty cell), so every cell from that first gap to the far edge, filled
   * or not, can still add one visible building. (Using only the number of empty cells here pruned
   * valid rows such as [1, _, _, 4] with clue 4, so correct puzzles reported "no solution".)
   */
  private lineCanStillWork(values: number[], fromStart: number | null, fromEnd: number | null): boolean {
    const firstGap = values.indexOf(0)
    if (firstGap === -1) return true // complete lines are checked exactly elsewhere
    if (fromStart !== null) {
      const visible = this.countVisiblePartial(values)
      if (visible > fromStart || visible + (this.size - firstGap) < fromStart) return false
    }
    if (fromEnd !== null) {
      const reversed = [...values].reverse()
      const visible = this.countVisiblePartial(reversed)
      if (visible > fromEnd || visible + (this.size - reversed.indexOf(0)) < fromEnd) return false
    }
    return true
  }

  private countVisible(sequence: number[]): number {
    let count = 0
    let maxHeight = 0
    for (const height of sequence) {
      if (height > maxHeight) {
        count++
        maxHeight = height
      }
    }
    return count
  }

  private countVisiblePartial(sequence: number[]): number {
    let count = 0
    let maxHeight = 0
    for (const height of sequence) {
      if (height === 0) break // Stop at first empty cell
      if (height > maxHeight) {
        count++
        maxHeight = height
      }
    }
    return count
  }

  private isCompleteSolutionValid(grid: number[][]): boolean {
    // Check all row constraints
    for (let row = 0; row < this.size; row++) {
      if (!this.checkRowVisibility(grid[row], row)) {
        return false
      }
    }

    // Check all column constraints
    for (let col = 0; col < this.size; col++) {
      const colValues = []
      for (let row = 0; row < this.size; row++) {
        colValues.push(grid[row][col])
      }
      if (!this.checkColumnVisibility(colValues, col)) {
        return false
      }
    }

    return true
  }
}

// Main solving function
export function solveSkyscraperPuzzle(
  size: number,
  clues: Clues,
  givenNumbers: { [key: string]: number } = {}
): Solution[] {
  return solveSkyscraper(size, clues, givenNumbers).solutions
}

/** Like solveSkyscraperPuzzle, and also reports whether the search ran out of time. */
export function solveSkyscraper(
  size: number,
  clues: Clues,
  givenNumbers: { [key: string]: number } = {}
): SolveResult {
  const puzzle: PuzzleInput = { size, clues, givenNumbers }
  const solver = new AdvancedSkyscraperSolver(puzzle)
  const solutions = solver.solve()
  return { solutions, stopped: solver.stopped }
}
