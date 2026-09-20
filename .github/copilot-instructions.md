# GitHub Copilot instructions

**Read [../AGENTS.md](../AGENTS.md) first.** It is the single source of truth for this
repository's conventions - layout, typing, docstrings, testing, and the Definition of Done.
This file only adds what is specific to Copilot.

## Before you finish any task

Run `make check`. For changes under `infra/`, run `make check-full` instead. Do not report
a task complete on a red gate.

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

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
