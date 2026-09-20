#!/usr/bin/env bash
# Red light / green light gate. CI invokes this script with --ci, which also runs the
# slower AWS infrastructure checks skipped by the default local gate.
#
#   ./scripts/precheck.sh          # fast local checks, report, exit non-zero on failure
#   ./scripts/precheck.sh --infra  # include AWS infrastructure checks
#   ./scripts/precheck.sh --fix    # auto-fix what can be auto-fixed first, then check
#   ./scripts/precheck.sh --ci     # non-interactive full gate used by CI
set -uo pipefail

cd "$(dirname "$0")/.."

FIX=0
CI=0
RUN_INFRA=0
for arg in "$@"; do
  case "$arg" in
    --fix) FIX=1 ;;
    --infra) RUN_INFRA=1 ;;
    --ci) CI=1; RUN_INFRA=1 ;;
    -h | --help)
      sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown option: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

if [[ $CI -eq 1 || ! -t 1 ]]; then
  RED='' GREEN='' YELLOW='' BOLD='' RESET=''
else
  RED=$'\033[31m' GREEN=$'\033[32m' YELLOW=$'\033[33m' BOLD=$'\033[1m' RESET=$'\033[0m'
fi

# Corporate TLS inspection breaks uv's bundled certificate bundle - see CONTRIBUTING.md.
export UV_SYSTEM_CERTS="${UV_SYSTEM_CERTS:-1}"

names=()
results=()
failed=0

run_gate() {
  local name="$1"
  shift
  printf '%s==> %s%s\n' "$BOLD" "$name" "$RESET"
  if "$@"; then
    names+=("$name")
    results+=("pass")
  else
    names+=("$name")
    results+=("FAIL")
    failed=1
  fi
  echo
}

skip_gate() {
  names+=("$1")
  results+=("skip")
  printf '%s==> %s (skipped: %s)%s\n\n' "$YELLOW" "$1" "$2" "$RESET"
}

if [[ $FIX -eq 1 ]]; then
  printf '%s==> autofix%s\n' "$BOLD" "$RESET"
  uv run ruff check . --fix
  uv run ruff format .
  echo
fi

run_gate "format" uv run ruff format --check .
run_gate "lint" uv run ruff check .
# --level error: the configured warnings are known third-party typing gaps, documented in
# pyproject.toml. Pylance still surfaces them in the editor; they just aren't gate output.
run_gate "types" uv run pyright --level error
run_gate "tests" uv run pytest -q

# infra/ is a separate uv project with its own lockfile and CDK dependencies.
if [[ $RUN_INFRA -eq 1 ]]; then
  run_gate "infra" bash -c \
    'cd infra && uv run ruff check . && uv run pyright --level error && uv run pytest -q'
else
  skip_gate "infra" "run make check-full"
fi

# Secret scanning is a pre-commit hook, not a CI job - run it here when available so a
# local full check matches what the hook would have caught.
if command -v gitleaks >/dev/null 2>&1; then
  run_gate "secrets" gitleaks detect --no-banner --redact
else
  skip_gate "secrets" "gitleaks not installed - brew install gitleaks"
fi

# cspell is a Node tool; `npx --no-install` uses a local or global install and never
# silently downloads one mid-check.
if command -v cspell >/dev/null 2>&1; then
  run_gate "spelling" cspell lint --no-progress --dot "**"
elif command -v npx >/dev/null 2>&1 && npx --no-install cspell --version >/dev/null 2>&1; then
  run_gate "spelling" npx --no-install cspell lint --no-progress --dot "**"
else
  skip_gate "spelling" "cspell not installed - npm i -g cspell"
fi

printf '%s%-10s %s%s\n' "$BOLD" "GATE" "RESULT" "$RESET"
for i in "${!names[@]}"; do
  case "${results[$i]}" in
    pass) printf '%-10s %sPASS%s\n' "${names[$i]}" "$GREEN" "$RESET" ;;
    FAIL) printf '%-10s %sFAIL%s\n' "${names[$i]}" "$RED" "$RESET" ;;
    *) printf '%-10s %sSKIP%s\n' "${names[$i]}" "$YELLOW" "$RESET" ;;
  esac
done
echo

if [[ $failed -eq 1 ]]; then
  printf '%s%sRED%s - fix the gates above. `./scripts/precheck.sh --fix` handles the mechanical ones.\n' \
    "$BOLD" "$RED" "$RESET"
  exit 1
fi

printf '%s%sGREEN%s - safe to push.\n' "$BOLD" "$GREEN" "$RESET"
