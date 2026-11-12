---
description: Typecheck and run the smoke suite (@smoke only)
allowed-tools: Bash(npm run typecheck), Bash(npm run smoke*), Read
---

1. `npm run typecheck`.
2. `npm run smoke$ARGUMENTS` (`:headed` to watch).
3. Report counts and any failure message. HTML report: `reports/smoke/`.
