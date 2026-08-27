# GitHub Copilot instructions

**Read [../AGENTS.md](../AGENTS.md) first.** It is the single source of truth for this
repository's conventions - layout, typing, docstrings, testing, and the Definition of Done.
This file only adds what is specific to Copilot.

## Before you finish any task

Run `make check`. It is the same gate CI runs. Do not report a task complete on a red gate.

If a check fails, fix the cause. Do not add `# noqa`, `# pyright: ignore`, or loosen a rule
in `pyproject.toml` to get past it - if an exception really is warranted, scope it to the
line and put the reason on the same line.

## Documentation review is part of the task, not a follow-up

Step 5 of the Definition of Done applies to you too. After changing code, check whether
`README.md`, `docs/architecture.md`, `.env.example`, `CHANGELOG.md` or `AGENTS.md` are now
wrong, and update them in the same change. The `sync-docs` skill walks this for you.

If you made an architectural choice - picked a library, added a service, chose a default,
rejected an alternative - log it with the `log-decision` skill. Do not invent a rationale;
ask instead.

## Working in this repo

- Match the surrounding style. Read a neighboring module before adding a new one.
- Prefer editing an existing file over creating a new one.
- Do not create summary markdown files describing what you changed - the PR description
  and `CHANGELOG.md` are where that goes.
- When something is ambiguous, ask. A wrong assumption baked into the factory line is
  expensive to unpick later.

## Coding agent (PR) runs

- One unit of work per PR, matching the issue's acceptance criteria.
- The PR description should state what changed, why, and which docs you checked.
- Leave the human approval gates alone - they are the product, not friction to optimize.
