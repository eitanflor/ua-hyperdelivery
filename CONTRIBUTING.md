# Contributing

Conventions live in [AGENTS.md](AGENTS.md) - read that first. This file covers the
mechanics: setup, the gate, and how a change gets from your machine to `main`.

## Setup

```bash
uv sync --all-groups
cp .env.example .env
make hooks
```

`make hooks` installs the pre-commit hooks. They are fast and mechanical; the real gate is
`make check`.

### Behind the corporate proxy

UA's network inspects TLS, which breaks `uv`'s bundled certificate store with
`invalid peer certificate: UnknownIssuer`. Tell it to use the system trust store:

```bash
export UV_SYSTEM_CERTS=1
```

Put that in your shell profile. `scripts/precheck.sh` sets it already. The `gitleaks`
pre-commit hook uses the `gitleaks-system` variant, which runs a `gitleaks` binary from
your `PATH` instead of building one with `go install` - that build needs
`proxy.golang.org` and `ghcr.io`, both blocked by the corporate proxy. Install the binary
with `brew install gitleaks` (falls back to `ghcr.io` for the bottle, which may also be
blocked) or by downloading a release tarball directly from
[github.com/gitleaks/gitleaks/releases](https://github.com/gitleaks/gitleaks/releases)
(that domain isn't blocked) and putting the binary on your `PATH`, e.g. `~/.local/bin`.

The same inspection breaks any HTTPS call Python makes with its bundled certificate store.
That is why `api/auth.py` fetches Entra's JWKS through a `truststore` SSL context: the
corporate root CA is in the OS keychain, never in certifi. If you add another outbound
HTTPS call and see `CERTIFICATE_VERIFY_FAILED: unable to get local issuer certificate`,
that is this - use the same context rather than disabling verification.

## The gate

```bash
make check       # format, lint, types, tests, secrets, spelling
make check-full  # include the slower AWS infrastructure checks
make check-fix   # auto-fix the mechanical failures, then run the fast gate
```

This is [scripts/precheck.sh](scripts/precheck.sh), and CI runs its full mode. Green
locally means green in CI. **If you add a check to CI, add it to that script instead.**

Individual gates, when you want a faster loop:

```bash
make format
make lint
make typecheck
make test
make coverage    # browsable HTML report, opens in your browser
```

### Spelling

`cspell.json` drives the spelling gate. Its `flagWords` list enforces US English: each
entry fails with the American form as the suggested fix. When a legitimate new term trips
it - a library, an AWS acronym, a domain word - add it to the `words` list rather than
rewording around it. Install with `npm i -g cspell`; the gate skips with a hint if it is
not present.

## Making a change

1. Branch from `main`.
2. Make the change. Match the surrounding style - read a neighboring module first.
3. Add a test that fails without your change.
4. Work the Definition of Done in [AGENTS.md](AGENTS.md), including the documentation
   review. The `sync-docs` skill walks it for you.
5. `make check` until green.
6. Open a PR describing what changed, why, and which docs you checked.

## Commit messages

Conventional Commits: `type(scope): summary`, imperative mood, lower case.

```
feat(distill): add Snowflake schema lookup tool
fix(api): return 409 when the project is not awaiting approval
refactor(core): derive station order from the Station enum
docs: correct the README status section
```

Body explains *why*, not what - the diff already says what.

## Things that will get a PR sent back

- A red gate.
- A `# noqa`, `# pyright: ignore` or loosened rule used to get past a check, without a
  reason on the same line.
- Documentation that contradicts the change.
- A new dependency with no rationale and no entry in `docs/decisions.md`.
- A human approval gate removed or bypassed.
