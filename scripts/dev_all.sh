#!/usr/bin/env bash
# Starts every agent's dev server concurrently on sequential ports, killing them all on exit.
# Add a new agent by adding its directory name to `agents` below.
set -euo pipefail
script_dir="$(dirname "$0")"
"${script_dir}/ensure_aws_login.sh"
cd "${script_dir}/../src"

agents=(distill blueprint review showroom)
base_port="${BASE_PORT:-8080}"
pids=()

cleanup() {
	kill "${pids[@]}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for i in "${!agents[@]}"; do
	agent="${agents[$i]}"
	port=$((base_port + i))
	echo "${agent} -> http://127.0.0.1:${port}"
	PORT="${port}" uv run python -m "agent_runtime.${agent}.main" &
	pids+=($!)
done

wait
