#!/usr/bin/env bash
# Builds an agent's ARM64 image, pushes it to ECR, and creates (or updates) its
# Bedrock AgentCore Runtime. Usage: ./scripts/deploy_agent.sh <distill|blueprint|review|showroom>
set -euo pipefail

agent="${1:?usage: deploy_agent.sh <distill|blueprint|review|showroom>}"
region="${AWS_REGION:-us-east-1}"
repo="hyperdelivery-${agent}"
runtime_name="hyperdelivery_${agent}"

if [[ -z "${AGENTCORE_ROLE_ARN:-}" ]]; then
	echo "AGENTCORE_ROLE_ARN must be set - the IAM role AgentCore Runtime assumes to run this agent." >&2
	exit 1
fi

account_id="$(aws sts get-caller-identity --query Account --output text)"
ecr_uri="${account_id}.dkr.ecr.${region}.amazonaws.com/${repo}"

aws ecr describe-repositories --repository-names "$repo" --region "$region" >/dev/null 2>&1 \
	|| aws ecr create-repository --repository-name "$repo" --region "$region" >/dev/null

aws ecr get-login-password --region "$region" \
	| docker login --username AWS --password-stdin "${account_id}.dkr.ecr.${region}.amazonaws.com"

docker buildx build --platform linux/arm64 \
	--build-arg AGENT="$agent" \
	-t "${ecr_uri}:latest" \
	--push .

existing_arn="$(aws bedrock-agentcore-control list-agent-runtimes --region "$region" \
	--query "agentRuntimes[?agentRuntimeName=='${runtime_name}'].agentRuntimeArn | [0]" \
	--output text 2>/dev/null || true)"

artifact="{\"containerConfiguration\":{\"containerUri\":\"${ecr_uri}:latest\"}}"
environment_variables=""

if [[ "$agent" == "distill" ]]; then
	if [[ -n "${SNOWFLAKE_ACCOUNT:-}" && -z "${SNOWFLAKE_PAT:-}" ]] \
		|| [[ -z "${SNOWFLAKE_ACCOUNT:-}" && -n "${SNOWFLAKE_PAT:-}" ]]; then
		echo "SNOWFLAKE_ACCOUNT and SNOWFLAKE_PAT must be set together." >&2
		exit 1
	fi
	if [[ -n "${SNOWFLAKE_ACCOUNT:-}" ]]; then
		environment_variables="$(python3 -c 'import json, os; print(json.dumps({key: os.environ[key] for key in ("SNOWFLAKE_ACCOUNT", "SNOWFLAKE_PAT", "SNOWFLAKE_DATABASE", "SNOWFLAKE_SCHEMA") if os.environ.get(key)}))')"
	fi
fi

update_runtime() {
	local runtime_id="$1"
	local args=(
		--agent-runtime-id "$runtime_id"
		--agent-runtime-artifact "$artifact"
		--role-arn "$AGENTCORE_ROLE_ARN"
		--network-configuration '{"networkMode":"PUBLIC"}'
		--region "$region"
	)
	if [[ -n "$environment_variables" ]]; then
		args+=(--environment-variables "$environment_variables")
	fi
	aws bedrock-agentcore-control update-agent-runtime "${args[@]}"
}

create_runtime() {
	local args=(
		--agent-runtime-name "$runtime_name"
		--agent-runtime-artifact "$artifact"
		--role-arn "$AGENTCORE_ROLE_ARN"
		--network-configuration '{"networkMode":"PUBLIC"}'
		--region "$region"
	)
	if [[ -n "$environment_variables" ]]; then
		args+=(--environment-variables "$environment_variables")
	fi
	aws bedrock-agentcore-control create-agent-runtime "${args[@]}"
}

if [[ -n "$existing_arn" && "$existing_arn" != "None" ]]; then
	agent_runtime_id="${existing_arn##*/}"
	echo "Updating existing agent runtime ${existing_arn}..."
	update_runtime "$agent_runtime_id"
else
	echo "Creating new agent runtime ${runtime_name}..."
	create_runtime
fi
