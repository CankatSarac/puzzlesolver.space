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

export class AdvancedSkyscraperSolver {
  private readonly size: number
  private readonly clues: Clues
  private readonly givenNumbers: { [key: string]: number }
  private solutions: number[][][]
  private maxSolutions: number

  constructor(puzzle: PuzzleInput, maxSolutions: number = 10) {
    this.size = puzzle.size
    this.clues = puzzle.clues
    this.givenNumbers = puzzle.givenNumbers || {}
    this.solutions = []
    this.maxSolutions = maxSolutions
  }

  solve(): Solution[] {
    this.solutions = []
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
    if (this.solutions.length >= this.maxSolutions) {
      return true // Stop searching after finding enough solutions
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
            if (this.solutions.length >= this.maxSolutions) {
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
    // Check if partial row can still satisfy constraints
    const rowValues = grid[row]
    const emptyInRow = rowValues.filter(v => v === 0).length
    
    if (emptyInRow === 0) {
      // Row is complete, already checked above
      return true
    }

    // Early pruning for visibility constraints
    if (this.clues.left[row] !== null) {
      const currentVisible = this.countVisiblePartial(rowValues)
      const maxPossible = currentVisible + emptyInRow
      if (maxPossible < this.clues.left[row] || currentVisible > this.clues.left[row]) {
        return false
      }
    }

    // Similar check for column
    const colValues = []
    for (let r = 0; r < this.size; r++) {
      colValues.push(grid[r][col])
    }
    const emptyInCol = colValues.filter(v => v === 0).length
    
    if (emptyInCol === 0) {
      // Column is complete, already checked above
      return true
    }

    if (this.clues.top[col] !== null) {
      const currentVisible = this.countVisiblePartial(colValues)
      const maxPossible = currentVisible + emptyInCol
      if (maxPossible < this.clues.top[col] || currentVisible > this.clues.top[col]) {
        return false
      }
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
  const puzzle: PuzzleInput = { size, clues, givenNumbers }
  const solver = new AdvancedSkyscraperSolver(puzzle)
  return solver.solve()
}
