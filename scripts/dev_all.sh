#!/usr/bin/env bash
# Starts every agent's dev server, the console API, and the console UI concurrently,
# killing them all on exit. Add a new agent by adding its directory name to `agents` below.
set -euo pipefail
set -m # job control: each `&` job gets its own process group, so cleanup can kill the
       # whole group (uv/pnpm wrapper + the actual python/vite process it spawns) instead
       # of just the wrapper, which would otherwise leave orphaned listeners on these ports.
script_dir="$(cd "$(dirname "$0")" && pwd)"

# Corporate TLS inspection breaks uv's bundled certificate bundle - see CONTRIBUTING.md.
export UV_SYSTEM_CERTS="${UV_SYSTEM_CERTS:-1}"

"${script_dir}/ensure_aws_login.sh"
repo_root="$(cd "${script_dir}/.." && pwd)" # absolute - the script cd's around below,
                                            # which would break relative-path resolution

agents=(distill blueprint review showroom)
base_port="${BASE_PORT:-8080}"
console_api_port="${CONSOLE_API_PORT:-8090}"
ui_port=5173
pids=()

all_ports=("${console_api_port}" "${ui_port}")
for i in "${!agents[@]}"; do
	all_ports+=($((base_port + i)))
done

# Signalling the process groups is the clean path; the port sweep afterwards is the one
# that actually holds, because `uv`/`pnpm` can leave a grandchild in a group of its own
# and uvicorn's --reload supervisor respawns its worker unless the supervisor is hit too.
cleanup() {
	trap - EXIT INT TERM # must not re-enter itself while it is killing things
	if ((${#pids[@]})); then
		for pid in "${pids[@]}"; do
			kill -- "-${pid}" 2>/dev/null || true
		done
		for _ in $(seq 1 15); do
			alive=0
			for pid in "${pids[@]}"; do
				kill -0 "${pid}" 2>/dev/null && alive=1
			done
			((alive)) || break
			sleep 0.2
		done
		for pid in "${pids[@]}"; do
			kill -9 -- "-${pid}" 2>/dev/null || true
		done
	fi
	"${script_dir}/free_dev_ports.sh" "${all_ports[@]}"
}
trap cleanup EXIT INT TERM

# A listener left from a previous run means the server below silently fails to bind and
# the console talks to whatever is already there - a previous checkout's prompts and schema.
"${script_dir}/free_dev_ports.sh" "${all_ports[@]}"

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
echo "console-ui -> http://127.0.0.1:${ui_port}"
pnpm dev &
pids+=($!)

wait
