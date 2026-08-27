---
applyTo: "infra/**"
---

# Infrastructure

Conventions in full: [AGENTS.md](../../AGENTS.md).

`infra/` is a **separate uv project** with its own lockfile, its own `pyproject.toml` and
its own dependencies. Run its checks from inside `infra/`; `make check` does this for you.

The IaC tool is **provisional** - this may move from CDK to Terraform. Keep resource
definitions declarative and avoid CDK-specific cleverness that would be expensive to port.
There is deliberately no `cdk synth` or CDK security scanner in CI for the same reason.

- Keep the lint configuration in step with the root `pyproject.toml`.
- `reportArgumentType` is a warning here, not an error: aws-cdk-lib's jsii-generated stubs
  are self-inconsistent (`Function` does not satisfy its own `IFunction` protocol). Do not
  paper over it with casts.
- The DynamoDB single-table schema is owned jointly with
  `src/infrastructure/repositories/keys.py`. Change both together.
- Least privilege on every role: scope to a resource ARN pattern, and use a wildcard only
  where the AWS API offers no resource-level control. Say which, in a comment.
- Assert new resources in `infra/tests/` - the stack tests are the only thing standing
  between a typo and a deploy.
- Known gaps, deliberately not yet addressed: no stage parameterization (dev/staging/prod),
  no DynamoDB PITR, no log retention, no Step Functions logging, and the Lambda code assets
  have no dependency bundling (TODO ADVA-3015). Do not treat their absence as a convention.
