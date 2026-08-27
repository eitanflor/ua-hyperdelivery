#!/usr/bin/env bash
# Starts every agent's dev server, the console API, and the console UI concurrently,
# killing them all on exit. Add a new agent by adding its directory name to `agents` below.
set -euo pipefail
set -m # job control: each `&` job gets its own process group, so cleanup can kill the
       # whole group (uv/pnpm wrapper + the actual python/vite process it spawns) instead
       # of just the wrapper, which would otherwise leave orphaned listeners on these ports.
script_dir="$(cd "$(dirname "$0")" && pwd)"
"${script_dir}/ensure_aws_login.sh"
repo_root="$(cd "${script_dir}/.." && pwd)" # absolute - the script cd's around below,
                                            # which would break relative-path resolution

agents=(distill blueprint review showroom)
base_port="${BASE_PORT:-8080}"
console_api_port="${CONSOLE_API_PORT:-8090}"
pids=()

cleanup() {
	for pid in "${pids[@]}"; do
		kill -- "-${pid}" 2>/dev/null || true
	done
}
trap cleanup EXIT INT TERM

cd "${repo_root}/src"
for i in "${!agents[@]}"; do
	agent="${agents[$i]}"
	port=$((base_port + i))
	echo "${agent} -> http://127.0.0.1:${port}"
	PORT="${port}" uv run python -m "agent_runtime.${agent}.main" &
	pids+=($!)
done

echo "console-api -> http://127.0.0.1:${console_api_port}"
uv run uvicorn api.main:app --reload --port "${console_api_port}" &
pids+=($!)

cd "${repo_root}/ui/console"
echo "console-ui -> http://127.0.0.1:5173"
pnpm dev &
pids+=($!)

wait
