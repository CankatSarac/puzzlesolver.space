export type EdgeState = "empty" | "line" | "cross"

/** Board edges. Horizontal: (size + 1) rows × size columns; vertical: size rows × (size + 1) columns. */
export interface SlitherlinkEdges {
  horizontal: EdgeState[][]
  vertical: EdgeState[][]
}

export interface SlitherlinkInput extends SlitherlinkEdges {
  size: number
  /** Per cell: a number 0-4, "s" (inside the loop), "w" (outside the loop) or null. */
  clues: (number | string | null)[][]
}

export interface SlitherlinkResult {
  solutions: SlitherlinkEdges[]
  /** True when the search stopped at `maxSolutions`, so more solutions may exist. */
  capped: boolean
  /** True when the search hit its time budget before it could finish. */
  stopped: boolean
}

/** The search gives up after this long so a hard or contradictory puzzle cannot freeze the tab. */
const TIME_BUDGET_MS = 2500

const UNKNOWN = 0
const LINE = 1
const CROSS = 2
const INSIDE = 1
const OUTSIDE = 2

/**
 * Backtracking search with constraint propagation. Every dot must touch 0 or 2 lines, every
 * numbered cell must have exactly that many lines around it, and the lines must form one closed
 * loop. Lines and crosses already on the board are kept as givens.
 */
export function solveSlitherlink(input: SlitherlinkInput, maxSolutions = 20): SlitherlinkResult {
  const n = input.size
  const hCount = (n + 1) * n
  const edgeCount = hCount + n * (n + 1)
  const hIndex = (r: number, c: number) => r * n + c
  const vIndex = (r: number, c: number) => hCount + r * (n + 1) + c

  // Incidence tables: dots (n + 1)², cells n².
  const dotEdges: number[][] = []
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c <= n; c++) {
      const list: number[] = []
      if (c > 0) list.push(hIndex(r, c - 1))
      if (c < n) list.push(hIndex(r, c))
      if (r > 0) list.push(vIndex(r - 1, c))
      if (r < n) list.push(vIndex(r, c))
      dotEdges.push(list)
    }
  }
  const cellEdges: number[][] = []
  const cellClue: number[] = []
  const inside: boolean[] = []
  const outside: boolean[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      cellEdges.push([hIndex(r, c), hIndex(r + 1, c), vIndex(r, c), vIndex(r, c + 1)])
      const clue = input.clues[r]?.[c]
      cellClue.push(typeof clue === "number" ? clue : -1)
      inside.push(clue === "s")
      outside.push(clue === "w")
    }
  }
  // Each edge's two dots and (up to) two cells.
  const edgeDots: [number, number][] = []
  const edgeCells: number[][] = []
  for (let e = 0; e < edgeCount; e++) {
    edgeDots.push([-1, -1])
    edgeCells.push([])
  }
  dotEdges.forEach((list, d) =>
    list.forEach((e) => {
      if (edgeDots[e][0] === -1) edgeDots[e][0] = d
      else edgeDots[e][1] = d
    }),
  )
  cellEdges.forEach((list, cell) => list.forEach((e) => edgeCells[e].push(cell)))
  // A closed loop crosses every row of cells an even number of times (and every column too), so
  // each row's vertical edges and each column's horizontal edges hold an even number of lines.
  const lanes: number[][] = []
  const edgeLane: number[] = Array(edgeCount).fill(-1)
  for (let r = 0; r < n; r++) lanes.push(Array.from({ length: n + 1 }, (_, c) => vIndex(r, c)))
  for (let c = 0; c < n; c++) lanes.push(Array.from({ length: n + 1 }, (_, r) => hIndex(r, c)))
  lanes.forEach((lane, i) => lane.forEach((e) => (edgeLane[e] = i)))
  // Inside/outside colouring: each edge separates two cells (or a cell and the area outside the
  // board). It is a line exactly when the two sides differ. Colours live after the edges in the
  // state array; index OUT is the area outside the board.
  const OUT = n * n
  const COLOR = edgeCount
  const edgeSides: [number, number][] = []
  for (let r = 0; r <= n; r++)
    for (let c = 0; c < n; c++) edgeSides[hIndex(r, c)] = [r > 0 ? (r - 1) * n + c : OUT, r < n ? r * n + c : OUT]
  for (let r = 0; r < n; r++)
    for (let c = 0; c <= n; c++) edgeSides[vIndex(r, c)] = [c > 0 ? r * n + c - 1 : OUT, c < n ? r * n + c : OUT]

  const initial = new Uint8Array(edgeCount + n * n + 1)
  initial[COLOR + OUT] = OUTSIDE
  for (let cell = 0; cell < n * n; cell++) {
    if (inside[cell]) initial[COLOR + cell] = INSIDE
    if (outside[cell]) initial[COLOR + cell] = OUTSIDE
  }
  for (let r = 0; r <= n; r++)
    for (let c = 0; c < n; c++) initial[hIndex(r, c)] = toCode(input.horizontal[r]?.[c])
  for (let r = 0; r < n; r++)
    for (let c = 0; c <= n; c++) initial[vIndex(r, c)] = toCode(input.vertical[r]?.[c])

  const started = Date.now()
  let nodes = 0
  let stopped = false
  const solutions: SlitherlinkEdges[] = []

  /** Applies the local rules until nothing changes. Returns false on a contradiction. */
  const propagate = (s: Uint8Array, queue: number[]): boolean => {
    // queue holds edge indices whose neighbourhood needs re-checking
    const set = (e: number, v: number): boolean => {
      if (s[e] === v) return true
      if (s[e] !== UNKNOWN) return false
      s[e] = v
      queue.push(e)
      return true
    }
    const checkDot = (d: number): boolean => {
      let lines = 0
      let unknown = 0
      for (const e of dotEdges[d]) {
        if (s[e] === LINE) lines++
        else if (s[e] === UNKNOWN) unknown++
      }
      if (lines > 2 || (lines === 1 && unknown === 0)) return false
      if (unknown === 0) return true
      if (lines === 2 || (lines === 0 && unknown === 1)) {
        for (const e of dotEdges[d]) if (s[e] === UNKNOWN && !set(e, CROSS)) return false
      } else if (lines === 1 && unknown === 1) {
        for (const e of dotEdges[d]) if (s[e] === UNKNOWN && !set(e, LINE)) return false
      }
      return true
    }
    const checkCell = (cell: number): boolean => {
      const clue = cellClue[cell]
      if (clue < 0) return true
      let lines = 0
      let unknown = 0
      for (const e of cellEdges[cell]) {
        if (s[e] === LINE) lines++
        else if (s[e] === UNKNOWN) unknown++
      }
      if (lines > clue || lines + unknown < clue) return false
      if (unknown === 0) return true
      if (lines === clue) {
        for (const e of cellEdges[cell]) if (s[e] === UNKNOWN && !set(e, CROSS)) return false
      } else if (lines + unknown === clue) {
        for (const e of cellEdges[cell]) if (s[e] === UNKNOWN && !set(e, LINE)) return false
      }
      return true
    }
    const setColor = (cell: number, color: number): boolean => {
      const k = COLOR + cell
      if (s[k] === color) return true
      if (s[k] !== UNKNOWN) return false
      s[k] = color
      if (cell !== OUT) for (const e of cellEdges[cell]) queue.push(e)
      return true
    }
    const checkColor = (e: number): boolean => {
      const [a, b] = edgeSides[e]
      const ca = s[COLOR + a]
      const cb = s[COLOR + b]
      if (ca && cb) return set(e, ca === cb ? CROSS : LINE)
      if (s[e] === UNKNOWN || (!ca && !cb)) return true
      const known = ca || cb
      const other = s[e] === CROSS ? known : known === INSIDE ? OUTSIDE : INSIDE
      return setColor(ca ? b : a, other)
    }
    const checkLane = (lane: number[]): boolean => {
      let lines = 0
      let last = -1
      let unknown = 0
      for (const e of lane) {
        if (s[e] === LINE) lines++
        else if (s[e] === UNKNOWN) {
          unknown++
          last = e
        }
      }
      if (unknown === 0) return lines % 2 === 0
      if (unknown === 1) return set(last, lines % 2 === 0 ? CROSS : LINE)
      return true
    }
    while (queue.length) {
      const e = queue.pop()!
      const [a, b] = edgeDots[e]
      if (!checkDot(a) || !checkDot(b)) return false
      for (const cell of edgeCells[e]) if (!checkCell(cell)) return false
      if (!checkLane(lanes[edgeLane[e]])) return false
      if (!checkColor(e)) return false
    }
    return true
  }

  /**
   * Loop rules on the current lines. Returns "fail", "solved" (one closed loop that uses every
   * line and satisfies every clue; remaining edges are set to cross) or "open".
   * Also crosses any edge that would close a path into a loop too early.
   */
  const loopCheck = (s: Uint8Array, queue: number[]): "fail" | "solved" | "open" => {
    const dotCount = (n + 1) * (n + 1)
    const seen = new Uint8Array(dotCount)
    let totalLines = 0
    for (let e = 0; e < edgeCount; e++) if (s[e] === LINE) totalLines++
    if (totalLines === 0) return "open"

    for (let d = 0; d < dotCount; d++) {
      if (seen[d] || lineDegree(s, d) === 0) continue
      // Walk this component.
      const stack = [d]
      seen[d] = 1
      const ends: number[] = []
      let edges = 0
      while (stack.length) {
        const x = stack.pop()!
        let deg = 0
        for (const e of dotEdges[x]) {
          if (s[e] !== LINE) continue
          deg++
          const [p, q] = edgeDots[e]
          const y = p === x ? q : p
          if (x < y) edges++
          if (!seen[y]) {
            seen[y] = 1
            stack.push(y)
          }
        }
        if (deg === 1) ends.push(x)
      }
      if (ends.length === 0) {
        // A closed loop: it must be the whole answer.
        if (edges !== totalLines) return "fail"
        for (let e = 0; e < edgeCount; e++) if (s[e] === UNKNOWN) s[e] = CROSS
        for (let cell = 0; cell < n * n; cell++) {
          const clue = cellClue[cell]
          if (clue < 0) continue
          let lines = 0
          for (const e of cellEdges[cell]) if (s[e] === LINE) lines++
          if (lines !== clue) return "fail"
        }
        return insideOutsideOk(s) ? "solved" : "fail"
      }
      // An open path: an unknown edge joining its two ends would close a loop. That is only
      // allowed when this path holds every line drawn so far.
      if (ends.length === 2 && edges !== totalLines) {
        const [x, y] = ends
        for (const e of dotEdges[x]) {
          if (s[e] !== UNKNOWN) continue
          const [p, q] = edgeDots[e]
          if ((p === x && q === y) || (p === y && q === x)) {
            s[e] = CROSS
            queue.push(e)
          }
        }
      }
    }
    return "open"
  }

  const lineDegree = (s: Uint8Array, d: number) => {
    let deg = 0
    for (const e of dotEdges[d]) if (s[e] === LINE) deg++
    return deg
  }

  /** Cells marked "s" must be inside the loop and "w" outside (ray cast to the left edge). */
  const insideOutsideOk = (s: Uint8Array): boolean => {
    for (let r = 0; r < n; r++) {
      let crossings = 0
      for (let c = 0; c < n; c++) {
        if (s[vIndex(r, c)] === LINE) crossings++
        const cell = r * n + c
        const isInside = crossings % 2 === 1
        if ((inside[cell] && !isInside) || (outside[cell] && isInside)) return false
      }
    }
    return true
  }

  /** Propagate to a fixpoint, including the loop rules. */
  const settle = (s: Uint8Array, queue: number[]): "fail" | "solved" | "open" => {
    for (;;) {
      if (!propagate(s, queue)) return "fail"
      const loop = loopCheck(s, queue)
      if (loop !== "open") return loop
      if (queue.length === 0) return "open"
    }
  }

  /** Walks a path from one end and returns the dot at its other end. */
  const otherEnd = (s: Uint8Array, start: number): number => {
    let prev = -1
    let cur = start
    for (;;) {
      let next = -1
      for (const e of dotEdges[cur]) {
        if (s[e] !== LINE) continue
        const [p, q] = edgeDots[e]
        const y = p === cur ? q : p
        if (y !== prev) {
          next = y
          break
        }
      }
      if (next === -1) return cur
      prev = cur
      cur = next
    }
  }

  /**
   * Next edge to branch on: first a numbered cell that still needs lines (fewest open edges), so
   * every clue joins the loop early; then a path end, heading towards the path's other end so
   * loops close early; then any open edge.
   */
  const pickEdge = (s: Uint8Array): number => {
    let best = -1
    let bestOpen = Infinity
    for (let cell = 0; cell < n * n; cell++) {
      const clue = cellClue[cell]
      if (clue <= 0) continue
      let lines = 0
      let open = 0
      let pick = -1
      for (const e of cellEdges[cell]) {
        if (s[e] === LINE) lines++
        else if (s[e] === UNKNOWN) {
          open++
          pick = e
        }
      }
      if (lines < clue && open > 0 && open < bestOpen) {
        bestOpen = open
        best = pick
      }
    }
    if (best >= 0) return best
    for (let d = 0; d < dotEdges.length; d++) {
      if (lineDegree(s, d) !== 1) continue
      const goal = otherEnd(s, d)
      const gr = Math.floor(goal / (n + 1))
      const gc = goal % (n + 1)
      let bestDistance = Infinity
      for (const e of dotEdges[d]) {
        if (s[e] !== UNKNOWN) continue
        const [p, q] = edgeDots[e]
        const y = p === d ? q : p
        const distance = Math.abs(Math.floor(y / (n + 1)) - gr) + Math.abs((y % (n + 1)) - gc)
        if (distance < bestDistance) {
          bestDistance = distance
          best = e
        }
      }
      if (best >= 0) return best
    }
    for (let e = 0; e < edgeCount; e++) if (s[e] === UNKNOWN) return e
    return -1
  }

  const record = (s: Uint8Array) => {
    const horizontal: EdgeState[][] = []
    const vertical: EdgeState[][] = []
    for (let r = 0; r <= n; r++) horizontal.push(Array.from({ length: n }, (_, c) => fromCode(s[hIndex(r, c)])))
    for (let r = 0; r < n; r++) vertical.push(Array.from({ length: n + 1 }, (_, c) => fromCode(s[vIndex(r, c)])))
    solutions.push({ horizontal, vertical })
  }

  const search = (s: Uint8Array, queue: number[]): void => {
    if (solutions.length >= maxSolutions || stopped) return
    if ((++nodes & 255) === 0 && Date.now() - started > TIME_BUDGET_MS) {
      stopped = true
      return
    }
    const state = settle(s, queue)
    if (state === "fail") return
    if (state === "solved") {
      record(s)
      return
    }
    const e = pickEdge(s)
    if (e < 0) return // every edge decided but no single loop
    for (const value of [LINE, CROSS]) {
      const next = s.slice()
      next[e] = value
      search(next, [e])
      if (solutions.length >= maxSolutions || stopped) return
    }
  }

  // Seed the queue with every decided edge, every numbered or coloured cell and the border.
  const seed: number[] = []
  for (let e = 0; e < edgeCount; e++) {
    const [a, b] = edgeSides[e]
    if (initial[e] !== UNKNOWN || a === OUT || b === OUT) seed.push(e)
  }
  cellEdges.forEach((list, cell) => {
    if (cellClue[cell] >= 0 || initial[COLOR + cell] !== UNKNOWN) seed.push(...list)
  })
  search(initial.slice(), seed)

  return { solutions, capped: solutions.length >= maxSolutions, stopped }
}

function toCode(state: EdgeState | undefined): number {
  return state === "line" ? LINE : state === "cross" ? CROSS : UNKNOWN
}

function fromCode(code: number): EdgeState {
  return code === LINE ? "line" : "cross"
}
