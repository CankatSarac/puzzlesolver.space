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
  /** Ship id per cell; water is FLEET.length. */
  grid?: number[][]
  ships?: Ship[]
  /** True when a second arrangement also fits the clues (the first one is returned). */
  multiple?: boolean
  /** True when the search hit its time budget before it could finish. */
  stopped?: boolean
  message?: string
}

interface Ship {
  id: number
  length: number
  positions: [number, number][]
  orientation: "horizontal" | "vertical"
}

/** Standard fleet: one battleship, two cruisers, three destroyers, four submarines. */
export const FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]

/** The search gives up after this long so a hard or contradictory puzzle cannot freeze the tab. */
const TIME_BUDGET_MS = 2500

const SHIP_HINTS = new Set(["o", "d", "u", "l", "r", "m"])

interface Placement {
  cells: number[]
  /** Ship-part code for each cell: o single, d top, u bottom, l left end, r right end, m middle. */
  parts: string[]
  /** Cells touching the ship (including diagonally) that must stay water. */
  halo: number[]
  rows: number[]
  cols: number[]
}

const FREE = 0
const SHIP = 1
const BLOCKED = 2

function buildPlacements(rows: number, cols: number, length: number): Placement[] {
  const out: Placement[] = []
  const orientations: [number, number][] = length === 1 ? [[0, 1]] : [[0, 1], [1, 0]]
  for (const [dr, dc] of orientations) {
    for (let r = 0; r + dr * (length - 1) < rows; r++) {
      for (let c = 0; c + dc * (length - 1) < cols; c++) {
        const cells: number[] = []
        const parts: string[] = []
        const shipRows: number[] = []
        const shipCols: number[] = []
        for (let i = 0; i < length; i++) {
          const rr = r + dr * i
          const cc = c + dc * i
          cells.push(rr * cols + cc)
          shipRows.push(rr)
          shipCols.push(cc)
          if (length === 1) parts.push("o")
          else if (i === 0) parts.push(dr ? "d" : "l")
          else if (i === length - 1) parts.push(dr ? "u" : "r")
          else parts.push("m")
        }
        const own = new Set(cells)
        const halo = new Set<number>()
        for (let i = 0; i < length; i++) {
          for (let nr = shipRows[i] - 1; nr <= shipRows[i] + 1; nr++) {
            for (let nc = shipCols[i] - 1; nc <= shipCols[i] + 1; nc++) {
              if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
              const k = nr * cols + nc
              if (!own.has(k)) halo.add(k)
            }
          }
        }
        out.push({ cells, parts, halo: [...halo], rows: shipRows, cols: shipCols })
      }
    }
  }
  return out
}

/**
 * Backtracking search over ship placements, longest ship first. Each ship is tried in every
 * horizontal and vertical position; a placement is kept only if it does not touch another ship,
 * does not cover water, matches any ship-part hint it covers, and keeps every row and column
 * within its count. The search stops at the second solution so it can tell the user whether the
 * clues pin down a single arrangement.
 */
export function solveBattleshipPuzzle(puzzle: BattleshipPuzzle): BattleshipSolution {
  const { rows, cols, clues } = puzzle
  const water = FLEET.length
  const total = FLEET.reduce((a, b) => a + b, 0)

  const rowClue = Array.from({ length: rows }, (_, r) => clues.left[r] ?? null)
  const colClue = Array.from({ length: cols }, (_, c) => clues.top[c] ?? null)

  // Quick consistency checks with clear messages.
  const rowSum = rowClue.reduce<number>((a, b) => a + (b ?? 0), 0)
  const colSum = colClue.reduce<number>((a, b) => a + (b ?? 0), 0)
  const allRows = rowClue.every((v) => v !== null)
  const allCols = colClue.every((v) => v !== null)
  if ((allRows && rowSum !== total) || rowSum > total || (allCols && colSum !== total) || colSum > total) {
    return {
      valid: false,
      message: `The standard fleet has ${total} ship segments, so the row counts and the column counts must each add up to ${total}.`,
    }
  }

  // Ships are at most four cells long and never touch, so a line of L cells holds at most
  // L - floor(L / 5) ship segments (runs of four, each followed by water).
  const lineMax = (length: number) => length - Math.floor(length / 5)
  const tooFull = (clue: (number | null)[], length: number, name: string) => {
    const i = clue.findIndex((v) => v !== null && v > lineMax(length))
    return i < 0 ? null : `${name} ${i + 1} can hold at most ${lineMax(length)} ship segments.`
  }
  const overfull = tooFull(rowClue, cols, "Row") ?? tooFull(colClue, rows, "Column")
  if (overfull) return { valid: false, message: overfull }

  const hint: (string | undefined)[] = Array(rows * cols).fill(undefined)
  for (const [key, value] of Object.entries(clues.cells)) {
    const [r, c] = key.split(",").map(Number)
    if (r >= 0 && r < rows && c >= 0 && c < cols && value) hint[r * cols + c] = value
  }

  const state = new Uint8Array(rows * cols)
  hint.forEach((h, i) => {
    if (h === "w") state[i] = BLOCKED
  })
  const owner = new Int16Array(rows * cols).fill(water)
  const rowCount = new Int16Array(rows)
  const colCount = new Int16Array(cols)
  const shipHints = hint.map((h, i) => (h && SHIP_HINTS.has(h) ? i : -1)).filter((i) => i >= 0)

  const placementsByLength = new Map<number, Placement[]>()
  for (const len of new Set(FLEET)) placementsByLength.set(len, buildPlacements(rows, cols, len))

  const started = Date.now()
  let nodes = 0
  let stopped = false
  const solutions: number[][][] = []

  const fits = (p: Placement): boolean => {
    for (let i = 0; i < p.cells.length; i++) {
      const k = p.cells[i]
      if (state[k] !== FREE) return false
      const h = hint[k]
      if (h && h !== p.parts[i]) return false
    }
    for (const k of p.halo) {
      if (state[k] === SHIP) return false
      const h = hint[k]
      if (h && h !== "w" && owner[k] === water) return false // a ship hint would be forced to water
    }
    for (let i = 0; i < p.cells.length; i++) {
      const rc = rowClue[p.rows[i]]
      const cc = colClue[p.cols[i]]
      if (rc !== null && rowCount[p.rows[i]] + countIn(p.rows, p.rows[i]) > rc) return false
      if (cc !== null && colCount[p.cols[i]] + countIn(p.cols, p.cols[i]) > cc) return false
    }
    return true
  }

  // Can the remaining ships still satisfy every row, column and hint?
  const feasible = (shipIndex: number): boolean => {
    let remaining = 0
    for (let i = shipIndex; i < FLEET.length; i++) remaining += FLEET[i]
    const longest = shipIndex < FLEET.length ? FLEET[shipIndex] : 0
    let singlesLeft = 0
    for (let i = shipIndex; i < FLEET.length; i++) if (FLEET[i] === 1) singlesLeft++

    let rowNeed = 0
    for (let r = 0; r < rows; r++) {
      const clue = rowClue[r]
      if (clue === null) continue
      const need = clue - rowCount[r]
      if (need === 0) continue
      let free = 0
      for (let c = 0; c < cols; c++) if (state[r * cols + c] === FREE) free++
      if (need > free) return false
      rowNeed += need
    }
    let colNeed = 0
    for (let c = 0; c < cols; c++) {
      const clue = colClue[c]
      if (clue === null) continue
      const need = clue - colCount[c]
      if (need === 0) continue
      let free = 0
      for (let r = 0; r < rows; r++) if (state[r * cols + c] === FREE) free++
      if (need > free) return false
      colNeed += need
    }
    if (rowNeed > remaining || colNeed > remaining) return false
    if (allRows && rowNeed !== remaining) return false
    if (allCols && colNeed !== remaining) return false

    let singlesNeeded = 0
    for (const k of shipHints) {
      if (owner[k] !== water) continue
      const h = hint[k]!
      if (h === "o") singlesNeeded++
      else if (h === "m" && longest < 3) return false
      else if (h !== "o" && longest < 2) return false
    }
    return singlesNeeded <= singlesLeft
  }

  const place = (p: Placement, id: number, undo: number[]) => {
    for (let i = 0; i < p.cells.length; i++) {
      const k = p.cells[i]
      state[k] = SHIP
      owner[k] = id
      rowCount[p.rows[i]]++
      colCount[p.cols[i]]++
    }
    for (const k of p.halo) {
      if (state[k] === FREE) {
        state[k] = BLOCKED
        undo.push(k)
      }
    }
  }

  const remove = (p: Placement, undo: number[]) => {
    for (let i = 0; i < p.cells.length; i++) {
      const k = p.cells[i]
      state[k] = FREE
      owner[k] = water
      rowCount[p.rows[i]]--
      colCount[p.cols[i]]--
    }
    for (const k of undo) state[k] = FREE
  }

  const matchesAllClues = (): boolean => {
    for (let r = 0; r < rows; r++) if (rowClue[r] !== null && rowCount[r] !== rowClue[r]) return false
    for (let c = 0; c < cols; c++) if (colClue[c] !== null && colCount[c] !== colClue[c]) return false
    return shipHints.every((k) => owner[k] !== water)
  }

  const search = (shipIndex: number, minPlacement: number): void => {
    if (solutions.length >= 2 || stopped) return
    if ((++nodes & 1023) === 0 && Date.now() - started > TIME_BUDGET_MS) {
      stopped = true
      return
    }
    if (shipIndex === FLEET.length) {
      if (matchesAllClues()) {
        solutions.push(Array.from({ length: rows }, (_, r) => Array.from(owner.slice(r * cols, (r + 1) * cols))))
      }
      return
    }
    const length = FLEET[shipIndex]
    const placements = placementsByLength.get(length)!
    const nextSame = shipIndex + 1 < FLEET.length && FLEET[shipIndex + 1] === length
    for (let i = minPlacement; i < placements.length; i++) {
      const p = placements[i]
      if (!fits(p)) continue
      const undo: number[] = []
      place(p, shipIndex, undo)
      if (feasible(shipIndex + 1)) search(shipIndex + 1, nextSame ? i + 1 : 0) // same-length ships in order
      remove(p, undo)
      if (solutions.length >= 2 || stopped) return
    }
  }

  if (feasible(0)) search(0, 0)

  if (solutions.length === 0) {
    return stopped
      ? {
          valid: false,
          stopped: true,
          message: "The search took too long and was stopped. Add more clues or check the ones you entered.",
        }
      : { valid: false, message: "No arrangement of the standard fleet fits these clues. Please check them." }
  }

  const grid = solutions[0]
  return {
    valid: true,
    grid,
    ships: extractShips(grid, water),
    multiple: solutions.length > 1,
    stopped,
  }
}

function countIn(values: number[], v: number): number {
  let n = 0
  for (const x of values) if (x === v) n++
  return n
}

function extractShips(grid: number[][], water: number): Ship[] {
  const byId = new Map<number, [number, number][]>()
  grid.forEach((row, r) =>
    row.forEach((id, c) => {
      if (id === water) return
      if (!byId.has(id)) byId.set(id, [])
      byId.get(id)!.push([r, c])
    }),
  )
  return [...byId.entries()].map(([id, positions]) => ({
    id,
    length: positions.length,
    positions,
    orientation: positions.length > 1 && positions[0][0] !== positions[1][0] ? "vertical" : "horizontal",
  }))
}

export function formatBattleshipSolution(solution: BattleshipSolution): string[][] {
  if (!solution.valid || !solution.grid) {
    return []
  }

  const { grid } = solution
  const water = FLEET.length

  return grid.map((row, r) =>
    row.map((cell, c) => {
      if (cell === water) return "" // Water

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
        if (!hasLeft) return "l" // Left end (◄)
        if (!hasRight) return "r" // Right end (►)
        return "m" // Middle
      }

      return "m" // Default to middle
    }),
  )
}
