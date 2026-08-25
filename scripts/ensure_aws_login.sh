#!/usr/bin/env bash
# Ensures local AWS credentials are live before starting an agent; if the cached
# session has expired, opens the browser to refresh it automatically. Uses
# `aws sso login` when AWS_PROFILE points at a classic SSO profile, otherwise
# falls back to the default `aws login` bearer-token flow.
set -euo pipefail

if ! aws sts get-caller-identity ${AWS_PROFILE:+--profile "$AWS_PROFILE"} >/dev/null 2>&1; then
	if [[ -n "${AWS_PROFILE:-}" ]]; then
		echo "AWS credentials expired or missing - opening browser for 'aws sso login --profile $AWS_PROFILE'..."
		aws sso login --profile "$AWS_PROFILE"
	else
		echo "AWS credentials expired or missing - opening browser for 'aws login'..."
		aws login
	fi
fi
