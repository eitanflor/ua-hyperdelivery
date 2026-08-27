# Security

This is a private Under Armour repository. It is not open source and carries no license
for external use.

## Reporting a vulnerability

Do not open a public issue. Report it to the Data and AI team through internal channels,
with enough detail to reproduce it and an assessment of what it exposes.

## What this repository must never contain

- Credentials of any kind: API tokens, passwords, private keys, session tokens, connection
  strings. Configuration comes from environment variables via `Settings`, or from the boto3
  default credential chain.
- Real customer, employee or commercially sensitive data - including in test fixtures and
  example prompts. Use synthetic data.
- Production data pulled into a fixture "just to reproduce something".

`gitleaks` runs as a pre-commit hook and as part of `make check`. It is a backstop, not
permission to be careless. If a secret is committed, treat it as compromised: rotate it
first, then clean the history.

## Practices in force

- Ruff's `flake8-bandit` (`S`) rules run over the whole repository, so common insecure
  patterns fail the build.
- `detect-private-key` and `check-added-large-files` run as pre-commit hooks.
- IAM policies are scoped to resource ARN patterns. Where a wildcard is unavoidable because
  the AWS API has no resource-level control, the reason is stated in a comment next to it.
- The console API Lambda's role reaches the project table only - never Bedrock.
- Agent tools are gated per agent in `src/tools/`: Distill gets read-only Confluence,
  Blueprint gets Jira issue-lifecycle, from the same underlying client. Widening a tool
  filter is a security change and needs a decision entry.
- The S3 document tool takes an object key, never a bucket, so the model cannot reach
  outside the configured bucket.

## Known gaps

Tracked deliberately, not forgotten:

- No AgentCore Identity, Gateway or Memory yet - Atlassian access uses a static API token.
- No dependency vulnerability scanning in CI.
- No stage separation (dev/staging/prod) in the infrastructure.
- DynamoDB point-in-time recovery, log retention and Step Functions logging are not yet
  configured.
