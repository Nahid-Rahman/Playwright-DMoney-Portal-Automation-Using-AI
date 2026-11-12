# dmoney-agent-e2e

Playwright + TypeScript suite for the DMoney Agent workflow on `https://dmoneyportal.roadtocareer.net`
(backend `https://dmoney.roadtocareer.net`).

## Run
| Goal | Command |
|---|---|
| Full regression (positive + negative) | `npm run regression` -> `reports/regression/` |
| Smoke (positive only, `@smoke`) | `npm run smoke` -> `reports/smoke/` |
| Watch it | add `:headed`; set `SLOW_MO` in `.env` to slow it down |
| Types | `npm run typecheck` (must pass before a commit) |
| What would run | `npm run list` (does not touch the portal) |

## Where things are
- `src/core/` – `settings.ts` (validated `.env`), `models.ts` (types + statement columns), `business.ts` (amounts, 2.5 % commission, money formatting)
- `src/screens/` – one class per screen; shared header behaviour lives in the `TopBar` component that each screen **holds** (no base-class inheritance)
- `src/support/` – `backoffice.ts` (API: data setup + e-mailed OTP/reset token only), `factory.ts` (unique accounts, dates), `csvFile.ts`
- `src/fixtures.ts` – `test` extended with `auth`, `signUp`, `topBar` for independent specs
- `tests/journey/agent-flow.spec.ts` – TC01–TC20, serial, one shared browser session, grouped in 6 stages
- `tests/journey/session-restore.spec.ts` – reuses the Admin/System sessions saved by `tests/setup/global.setup.ts`
- `tests/validation/` – negative checks
- `output/self_statement_YYYY-MM-DD.csv` – written by TC20

## Rules
- Positive test -> `{ tag: '@smoke' }`. Negative test -> `{ tag: '@negative' }`, never smoke.
- Verify through the UI. The API is for test data and for values the portal e-mails, nothing else.
- Locators: role / label / placeholder first. The sidebar exists twice in the DOM: use `.first()` or scope to `header`.
- No credentials in code; they come from `.env` (template `.env.example`). Claude may not read `.env`.
- Shared live portal: only act on accounts this run created.
- Before changing selectors or expected values, read `.claude/skills/dmoney-portal/SKILL.md`.
