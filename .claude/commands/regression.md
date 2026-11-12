---
description: Typecheck, run the full regression suite and summarise
allowed-tools: Bash(npm run typecheck), Bash(npm run regression*), Read, Glob
---

1. `npm run typecheck` – stop and report on errors.
2. `npm run regression$ARGUMENTS` (use `:headed` to watch).
3. Report passed / failed / skipped, each failure with its error, and the CSV written to `output/`.
4. On failures, offer the `e2e-debugger` agent. Never relax an assertion just to get green.
