#!/usr/bin/env bash
# Ensures local AWS credentials are live before starting an agent; if the cached
# `aws login` session has expired, opens the browser to refresh it automatically.
set -euo pipefail

if ! aws sts get-caller-identity >/dev/null 2>&1; then
	echo "AWS credentials expired or missing - opening browser for 'aws login'..."
	aws login
fi
