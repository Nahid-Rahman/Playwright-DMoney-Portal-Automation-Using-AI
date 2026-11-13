# TODO (delete this file before submitting)

Deadline: **Nov 14, 2026, 11:59 PM**. Submit the repo URL:
https://github.com/Nahid-Rahman/Playwright-DMoney-Portal-Automation-Using-AI

## Already done (2026-11-12)
- [x] All 20 workflow steps and 20 required validations are covered (`tests/journey/agent-flow.spec.ts`)
- [x] `npm run typecheck` passes
- [x] `npm run regression`: 24 passed. `npm run smoke`: 21 passed (positive tests only)
- [x] `.gitignore` covers `node_modules/` and `.env`; README has the Environment and "What is git-ignored" sections
- [x] `.claude/`, `.gitignore`, `.env.example` pushed (the GitHub web upload had skipped hidden files)
- [x] `output/self_statement_2026-11-12.csv` pushed
- [x] Decision: keep the `.env.example` name. Do not rename it to `.env` (assignment point 5 says `.env` must be git-ignored)

## Done 2026-11-14 (00:30 Dhaka)
- [x] Fixed TC09/TC14/TC19 failing between 00:00 and 06:00: the statement date filter defaults to the UTC date. `StatementScreen.open()` now sets the local date.
- [x] Screenshots generated from real run output (regression 24 passed, smoke 21 passed), headed video copied to `docs/videos/`.

## Still to do
- [ ] **Check `.env.example` on GitHub for a real `API_SECRET_KEY` or real passwords.** The repo is public. Replace any real value with a placeholder and push. Claude cannot read this file because `.claude/settings.json` blocks it.
- [x] New machine setup: `npm install`, `npx playwright install chromium`, `cp .env.example .env`
- [x] Regression screenshots. Run in the VS Code terminal, not through Claude's `!`:
  - `npm run regression`, then save `docs/screenshots/regression-terminal.png`
  - `npx playwright show-report reports/regression`, then save `docs/screenshots/regression-report.png`
- [x] Smoke screenshots:
  - `npm run smoke`, then save `docs/screenshots/smoke-terminal.png`
  - `npx playwright show-report reports/smoke`, then save `docs/screenshots/smoke-report.png`
- [x] CSV screenshot: `docs/screenshots/csv-output.png`
- [x] Headed video: set `SLOW_MO=350` in `.env`, then run `npm run regression:headed`. The video is saved to `recordings/agent-flow.webm`. For inline playback, drag and drop the video into README while editing it on GitHub.
- [x] README: uncomment the screenshot lines under "Regression Test Result", "SmokeTest Result" and "CSV output", remove the "*Add after running...*" lines, and add the video under "Headed run video"
- [ ] Commit and push, then open the repo on GitHub and check that the images and video show
- [ ] Delete this `TODO.md`, push, and submit the repo URL
