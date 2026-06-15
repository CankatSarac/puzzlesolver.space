export interface BattleshipPuzzle {
  rows: number
  cols: number
  clues: {
    left: (number | null)[]
    top: (number | null)[]
    cells: { [key: string]: string }
  }
}

export interface BattleshipSolution {
  valid: boolean
  grid?: number[][]
  ships?: Ship[]
  message?: string
}

interface Ship {
  id: number
  length: number
  positions: [number, number][]
  orientation: "horizontal" | "vertical"
}

// Standard battleship fleet
const BATTLESHIPS = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]

export function solveBattleshipPuzzle(puzzle: BattleshipPuzzle): BattleshipSolution {
  const { rows, cols, clues } = puzzle
  const maxId = BATTLESHIPS.length // Water is represented by maxId

  try {
    // Initialize grid with water (maxId)
    const grid: number[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(maxId))

    // Validate and apply cell clues first
    for (const [key, value] of Object.entries(clues.cells)) {
      const [r, c] = key.split(",").map(Number)
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue

      if (!validateCellClue(grid, r, c, value, rows, cols, maxId)) {
        return { valid: false, message: `Invalid cell clue at (${r}, ${c})` }
      }
    }

    // Try to solve using backtracking
    const solution = solveWithBacktracking(grid, rows, cols, clues, maxId)

    if (solution) {
      const ships = extractShips(solution, maxId)
      return {
        valid: true,
        grid: solution,
        ships: ships,
      }
    }

    return { valid: false, message: "No solution found" }
  } catch (error) {
    return { valid: false, message: `Solver error: ${error}` }
  }
}

function validateCellClue(
  grid: number[][],
  r: number,
  c: number,
  value: string,
  rows: number,
  cols: number,
  maxId: number,
): boolean {
  switch (value) {
    case "w": // Water
      grid[r][c] = maxId
      return true
    case "o": // Single ship
      // Mark as ship (we'll assign proper ID later)
      grid[r][c] = -1 // Temporary marker for ship
      return true
    case "d": // Ship top
    case "u": // Ship bottom
    case "l": // Ship left
    case "r": // Ship right
    case "m": // Ship middle
      grid[r][c] = -1 // Temporary marker for ship
      return true
    default:
      return true
  }
}

function solveWithBacktracking(
  grid: number[][],
  rows: number,
  cols: number,
  clues: BattleshipPuzzle["clues"],
  maxId: number,
): number[][] | null {
  // Create a working copy
  const workingGrid = grid.map((row) => [...row])

  // Try to place ships using constraint satisfaction
  if (placeShipsWithConstraints(workingGrid, rows, cols, clues, maxId)) {
    return workingGrid
  }

  return null
}

function placeShipsWithConstraints(
  grid: number[][],
  rows: number,
  cols: number,
  clues: BattleshipPuzzle["clues"],
  maxId: number,
): boolean {
  // Simple heuristic approach - try to satisfy row/column constraints

  // First, mark all definite water cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === maxId) continue // Already water

      // Check if this cell should be water based on clues
      const cellKey = `${r},${c}`
      if (clues.cells[cellKey] === "w") {
        grid[r][c] = maxId
      }
    }
  }

  // Try to place ships to satisfy constraints
  let shipId = 0
  for (const shipLength of BATTLESHIPS) {
    if (!placeShip(grid, rows, cols, shipId, shipLength, clues, maxId)) {
      return false
    }
    shipId++
  }

  // Validate final solution
  return validateSolution(grid, rows, cols, clues, maxId)
}

function placeShip(
  grid: number[][],
  rows: number,
  cols: number,
  shipId: number,
  length: number,
  clues: BattleshipPuzzle["clues"],
  maxId: number,
): boolean {
  // Try horizontal placements
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - length; c++) {
      if (canPlaceShipHorizontal(grid, r, c, length, rows, cols, maxId)) {
        // Place ship
        for (let i = 0; i < length; i++) {
          grid[r][c + i] = shipId
        }

        if (isValidPlacement(grid, rows, cols, clues, maxId)) {
          return true
        }

        // Backtrack
        for (let i = 0; i < length; i++) {
          grid[r][c + i] = maxId
        }
      }
    }
  }

  // Try vertical placements
  for (let r = 0; r <= rows - length; r++) {
    for (let c = 0; c < cols; c++) {
      if (canPlaceShipVertical(grid, r, c, length, rows, cols, maxId)) {
        // Place ship
        for (let i = 0; i < length; i++) {
          grid[r + i][c] = shipId
        }

        if (isValidPlacement(grid, rows, cols, clues, maxId)) {
          return true
        }

        // Backtrack
        for (let i = 0; i < length; i++) {
          grid[r + i][c] = maxId
        }
      }
    }
  }

  return false
}

function canPlaceShipHorizontal(
  grid: number[][],
  r: number,
  c: number,
  length: number,
  rows: number,
  cols: number,
  maxId: number,
): boolean {
  // Check if ship can be placed horizontally
  for (let i = 0; i < length; i++) {
    if (grid[r][c + i] !== maxId && grid[r][c + i] !== -1) {
      return false
    }
  }

  // Check surrounding cells for no touching rule
  for (let i = 0; i < length; i++) {
    const surroundings = getSurroundings(r, c + i, rows, cols)
    for (const [sr, sc] of surroundings) {
      if (grid[sr][sc] !== maxId && grid[sr][sc] !== -1) {
        // Don't allow touching other ships
        if (!(sr === r && sc >= c && sc < c + length)) {
          return false
        }
      }
    }
  }

  return true
}

function canPlaceShipVertical(
  grid: number[][],
  r: number,
  c: number,
  length: number,
  rows: number,
  cols: number,
  maxId: number,
): boolean {
  // Check if ship can be placed vertically
  for (let i = 0; i < length; i++) {
    if (grid[r + i][c] !== maxId && grid[r + i][c] !== -1) {
      return false
    }
  }

  // Check surrounding cells for no touching rule
  for (let i = 0; i < length; i++) {
    const surroundings = getSurroundings(r + i, c, rows, cols)
    for (const [sr, sc] of surroundings) {
      if (grid[sr][sc] !== maxId && grid[sr][sc] !== -1) {
        // Don't allow touching other ships
        if (!(sc === c && sr >= r && sr < r + length)) {
          return false
        }
      }
    }
  }

  return true
}

function getSurroundings(r: number, c: number, rows: number, cols: number): [number, number][] {
  const surroundings: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        surroundings.push([nr, nc])
      }
    }
  }
  return surroundings
}

function isValidPlacement(
  grid: number[][],
  rows: number,
  cols: number,
  clues: BattleshipPuzzle["clues"],
  maxId: number,
): boolean {
  // Check row constraints
  for (let r = 0; r < rows; r++) {
    if (clues.left[r] !== null) {
      const shipCount = grid[r].filter((cell) => cell !== maxId).length
      if (shipCount > clues.left[r]!) {
        return false
      }
    }
  }

  // Check column constraints
  for (let c = 0; c < cols; c++) {
    if (clues.top[c] !== null) {
      const shipCount = grid.map((row) => row[c]).filter((cell) => cell !== maxId).length
      if (shipCount > clues.top[c]!) {
        return false
      }
    }
  }

  return true
}

function validateSolution(
  grid: number[][],
  rows: number,
  cols: number,
  clues: BattleshipPuzzle["clues"],
  maxId: number,
): boolean {
  // Check row constraints
  for (let r = 0; r < rows; r++) {
    if (clues.left[r] !== null) {
      const shipCount = grid[r].filter((cell) => cell !== maxId).length
      if (shipCount !== clues.left[r]) {
        return false
      }
    }
  }

  // Check column constraints
  for (let c = 0; c < cols; c++) {
    if (clues.top[c] !== null) {
      const shipCount = grid.map((row) => row[c]).filter((cell) => cell !== maxId).length
      if (shipCount !== clues.top[c]) {
        return false
      }
    }
  }

  return true
}

function extractShips(grid: number[][], maxId: number): Ship[] {
  const ships: Ship[] = []
  const visited = new Set<string>()

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const shipId = grid[r][c]
      if (shipId !== maxId && !visited.has(`${r},${c}`)) {
        const ship = traceShip(grid, r, c, shipId, maxId, visited)
        if (ship) {
          ships.push(ship)
        }
      }
    }
  }

  return ships
}

function traceShip(
  grid: number[][],
  startR: number,
  startC: number,
  shipId: number,
  maxId: number,
  visited: Set<string>,
): Ship | null {
  const positions: [number, number][] = []
  const queue: [number, number][] = [[startR, startC]]

  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    const key = `${r},${c}`

    if (visited.has(key) || grid[r][c] !== shipId) continue

    visited.add(key)
    positions.push([r, c])

    // Check adjacent cells (not diagonal)
    const adjacent = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ]

    for (const [nr, nc] of adjacent) {
      if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
        if (grid[nr][nc] === shipId && !visited.has(`${nr},${nc}`)) {
          queue.push([nr, nc])
        }
      }
    }
  }

  if (positions.length === 0) return null

  // Determine orientation
  let orientation: "horizontal" | "vertical" = "horizontal"
  if (positions.length > 1) {
    positions.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]))
    orientation = positions[0][0] === positions[1][0] ? "horizontal" : "vertical"
  }

  return {
    id: shipId,
    length: positions.length,
    positions,
    orientation,
  }
}

export function formatBattleshipSolution(solution: BattleshipSolution): string[][] {
  if (!solution.valid || !solution.grid) {
    return []
  }

  const { grid } = solution
  const maxId = BATTLESHIPS.length

  return grid.map((row, r) =>
    row.map((cell, c) => {
      if (cell === maxId) return "" // Water

      // Determine ship part type based on neighbors
      const hasTop = r > 0 && grid[r - 1][c] === cell
      const hasBottom = r < grid.length - 1 && grid[r + 1][c] === cell
      const hasLeft = c > 0 && grid[r][c - 1] === cell
      const hasRight = c < row.length - 1 && grid[r][c + 1] === cell

      // Single ship
      if (!hasTop && !hasBottom && !hasLeft && !hasRight) {
        return "o"
      }

      // Vertical ship parts
      if ((hasTop || hasBottom) && !hasLeft && !hasRight) {
        if (!hasTop) return "d" // Top end
        if (!hasBottom) return "u" // Bottom end
        return "m" // Middle
      }

      // Horizontal ship parts
      if ((hasLeft || hasRight) && !hasTop && !hasBottom) {
        if (!hasLeft) return "r" // Right end (start of ship)
        if (!hasRight) return "l" // Left end (end of ship)
        return "m" // Middle
      }

      return "m" // Default to middle
    }),
  )
}
