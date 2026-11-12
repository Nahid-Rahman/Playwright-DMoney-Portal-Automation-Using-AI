#!/usr/bin/env bash
# PostToolUse: when Claude writes or edits a .ts file, run the TypeScript compiler.
# Exit 2 = the errors are fed back to Claude so it corrects them before moving on.
payload="$(cat)"
target="$(node -e '
  let raw = "";
  process.stdin.on("data", c => raw += c).on("end", () => {
    try { const t = JSON.parse(raw).tool_input || {}; process.stdout.write(t.file_path || t.path || ""); }
    catch { /* not JSON: ignore */ }
  });' <<<"$payload")"

[[ "$target" == *.ts ]] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if ! result="$(npx --no-install tsc --noEmit 2>&1)"; then
  printf 'tsc reported errors after editing %s:\n%s\n' "$target" "$(head -n 40 <<<"$result")" >&2
  exit 2
fi
exit 0
