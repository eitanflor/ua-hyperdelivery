#!/usr/bin/env bash
# Frees the local dev ports: SIGTERM, then SIGKILL for anything still holding on.
#
# Needed because a Ctrl-C out of `make dev-all` does not reliably take everything with it -
# `uv run` and `pnpm` each spawn the real process as a child, and uvicorn's `--reload`
# supervisor respawns its worker when only the worker is signalled. A leftover listener is
# worse than an obvious crash: the next `make dev-all` cannot bind, so the console keeps
# talking to an agent still running the previous checkout's prompts and schema.
set -uo pipefail

# Without lsof every lookup below comes back empty and the sweep silently succeeds while
# the ports stay held - the exact failure this script exists to make impossible.
if ! command -v lsof >/dev/null 2>&1; then
	echo "free_dev_ports.sh needs lsof to find listeners - install it (brew install lsof)" >&2
	exit 1
fi

ports=("$@")
if ((${#ports[@]} == 0)); then
	ports=(8080 8081 8082 8083 8090 5173)
fi

holders_of() {
	lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null || true
}

signalled=0
for port in "${ports[@]}"; do
	holders="$(holders_of "${port}")"
	[[ -z "${holders}" ]] && continue
	echo "port ${port} held by PID(s) ${holders//$'\n'/ } - stopping"
	# shellcheck disable=SC2086 # word splitting is the point: one PID per line
	kill ${holders} 2>/dev/null || true
	signalled=1
done
((signalled)) || exit 0

sleep 1
for port in "${ports[@]}"; do
	holders="$(holders_of "${port}")"
	[[ -z "${holders}" ]] && continue
	echo "port ${port} did not release on SIGTERM - killing ${holders//$'\n'/ }"
	# shellcheck disable=SC2086
	kill -9 ${holders} 2>/dev/null || true
done
