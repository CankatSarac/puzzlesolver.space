# PuzzleSolver product implementation spec
Approved by the user’s portfolio implementation request, 2026-10-24.

Keep full solve. Add an optional one-step explanation on each of four live solvers, using a real local rule instead of revealing a guessed solution. Preview relevant cells/edges in a small highlighted diagram and apply only after a deliberate action. Label limited rule coverage and contradictions; a local deduction is not a global solvability proof. A brief placement cue respects reduced motion.

Provide validated versioned local board snapshots, explicit save/restore/reset and a reviewed portable puzzle code without personal information. Never overwrite unreadable data silently. Sharing copies only the shown code; importing validates type, dimensions and values before replacing a current board, with explicit review/apply. A saved board excludes full-solution state where appropriate.

Create an English/Turkish learning library with original rules and worked deductions for Tango, Battleship, Skyscraper and Slitherlink. Offer a voluntary release feed subscription link backed by real release records; no notification permissions, mailing signup, daily streak or invented upcoming event. Preserve existing solvers and coming-soon catalog statuses. No deployment, commit, push, store operation or original report edit. Validate inference soundness, state decoding, persistence failures, client interactions, TypeScript and build.
