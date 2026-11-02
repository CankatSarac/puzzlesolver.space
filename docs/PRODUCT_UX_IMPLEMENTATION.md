# PuzzleSolver product implementation

Local branch `feat/product-ux-growth-20261023`; no deployment, commit or push. Original review/course are unchanged.

## Implemented
All four live solvers keep their original full-solve controls above the optional teaching panel. The panel requests one supported rule, highlights its target and supporting cells/edge in an accessible diagram, and waits for Apply. A short placement cue uses reduced-motion-aware CSS. Unsupported positions return a clear no-supported-deduction message rather than a guessed answer. Local contradictions block the teaching step; local inference is explicitly not a global solvability proof.

- Tango: known =/× neighbours, no three identical symbols, and half-count balance on even boards. Odd legacy mode skips half-count inference.
- Battleship: water from a completed row/column count or diagonal ship exclusion. Known diagonal ships and impossible counts are rejected. No unsupported generic-ship shape is invented.
- Skyscraper: edge clue 1 forces N, edge clue N forces ascending heights. Applied learning marks reset with changed clues; the full solver is retained.
- Slitherlink: numbered-cell completed/remaining line counts, with basic vertex/count contradiction checks. This does not claim to establish a single global loop.

The user can choose a local saved board and automatic further saving, explicitly resume it, or confirm reset/forget. Initial unreadable data is preserved; another tab’s newer bytes cannot be overwritten by a stale snapshot. Full-solution displays are excluded from this save/share flow. A versioned bounded code contains only validated numbers, marks and constraints; canonical decoding strips unrelated fields. Share copying requires review of the exact current code and becomes disabled after a board change. Import validates type/dimensions/values, previews structured data and requires Apply. All four adapters preserve restored data across size-initialization effects. Saved boards contain any manually placed answers; this is stated before sharing.

`/learn` has original EN/TR rule explanations and interactive worked examples for all four live types. New solver controls have an EN/TR toggle; legacy solver controls remain English. Header and sitemap expose the library. `/updates.xml` is a voluntary Atom feed with no fabricated release entries; populate it only after an actual public launch. No notification permission, signup, mailing list or streak was added.

## Validation
- 12 Node logic tests pass, including Tango checks against compatible valid completions, Skyscraper checks across all 576 4×4 Latin grids, Slitherlink checks across compatible local edge completions, state bounds/code/schema, stale hints, write failure and another-tab protection.
- jsdom/React interaction checks pass: explanation/apply, exact clipboard preview and consent reset, local save/restart/resume, corrupt-data preservation, and all four solver integrations including different-size imports.
- TypeScript and Next production build pass (including library and feed). New feature, test and navigation files pass ESLint.
- The old FlatCompat configuration crashed with installed Next 16. It now uses official flat configs and the direct ESLint command. Full-repo lint reports 15 existing errors / 6 warnings in legacy solver/config files. Running the original four solver files through the same config confirmed their prior errors (17 errors / 4 warnings); this feature adds none. The remaining unrelated source files were not rewritten to satisfy new React compiler lint rules.
- jsdom 26.1.0 is a dev-only test dependency. Existing dependency versions/nodes are preserved. Run `npm run test:learning`, `npm run test:ui` (Bun available for bundling), `npx tsc --noEmit`, and `npm run build`.

Targeted iOS Safari checks additionally exercised the mobile rule library, Turkish diagram accessibility label, worked deduction, and Tango local save, restart, resume and confirmed removal. Evidence: docs/qa/mobile-browser-checks.json. This is partial browser acceptance; full layout, keyboard, VoiceOver traversal, real clipboard and storage quota checks remain release gates. The webpack production build also passed after the Turkish-label adjustment; separate type checking, lint and interaction checks passed. New global puzzle strategies, more teaching rules and actual release announcements remain follow-up work. No existing coming-soon solver was presented as live.

Mobile follow-up: the narrow-screen header now keeps the home icon and navigation from overlapping, while preserving an accessible home link. iOS Safari frame assertions and screenshot passed. Skyscraper (empty board) and Slitherlink (example) reported no supported deduction, then saved, resumed and removed synthetic boards in-session. Battleship produced a diagonal-water hint and saved, but WebKit exited after resume, so that flow remains inconclusive; its synthetic board was subsequently removed. The webpack production build, type checking and targeted lint passed after this header adjustment. See docs/qa/mobile-browser-checks.json.

Crash investigation: the task-owned simulator’s WebKit diagnostic reports an EXC_BAD_ACCESS/SIGBUS in JavaScriptCore during the Battleship test. It confirms a browser-process crash but does not identify its trigger. Retest the resume scenario against a production build when sufficient disk space is available.

28 October production retest: Battleship hint/save/resume/removal passed in-session and after Safari process restart; the restored board generated the expected diagonal-water hint. Earlier development-build WebKit crash remains unexplained. See docs/qa/mobile-browser-checks.json.

29 October: reviewed-code consent now remains cleared when an edited board returns to its earlier state. The regression failed on the prior implementation and passes with the fix; 12 logic checks, all UI integrations, TypeScript, changed-file lint and isolated webpack production build pass. One fictional-board iOS Safari test confirms fresh consent after change and restore. See docs/qa/review-consent-checks.json.
