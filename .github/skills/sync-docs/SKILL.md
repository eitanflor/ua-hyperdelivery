---
name: sync-docs
description: 'Check whether a code change has made the repository documentation wrong, and fix it in the same change. Use after adding or changing a feature, setting, dependency, endpoint, agent or infrastructure resource; before opening a PR; or when someone asks "are the docs still right?" / "did I miss any docs?".'
argument-hint: 'optional: what changed, e.g. "added a Snowflake tool to Distill"'
---

# Review the docs against a change

Documentation in this repo has drifted before - the README claimed there was no control
plane long after Step Functions, the console API and the SDK had shipped. The point of this
skill is to make the review a step, not a habit.

## When to use

- Immediately after a code change, before opening a PR. Step 5 of the Definition of Done in
  [AGENTS.md](../../../AGENTS.md).
- When picking up someone else's branch and you want to know what they missed.
- Do NOT use for pure refactors that change no behavior, no configuration and no
  dependency - there is nothing to describe differently.

## Procedure

1. Establish what actually changed: `git diff main...HEAD --stat`, then read the diff for
   anything that alters behavior, configuration, dependencies or structure.

2. Work through each surface below. For each one, decide **wrong / incomplete / fine**, and
   say which. Do not skip one because it "probably didn't change".

   | Surface | Check it against the diff |
   | --- | --- |
   | `README.md` | The `src/` tree, the Getting started commands, and above all the **Status** section - does it still describe what exists? |
   | `docs/architecture.md` | New or moved components, integrations, data flows; the per-agent tool matrix. |
   | `.env.example` | Any field added to or removed from `Settings`. `tests/unit/test_docs_consistency.py` enforces the pair - if it passes, this is fine. |
   | `AGENTS.md` | A new convention, a new "how to make a common change" recipe, or a rule that is now wrong. |
   | `CHANGELOG.md` | An entry under `Unreleased`, in the right category. |
   | `.github/instructions/*` | A rule that now applies to a path it did not before. |
   | `docs/decisions.md` | Was a real alternative considered and rejected? |

3. Fix what is wrong, in this change. Do not open a follow-up ticket for documentation -
   that is how it drifts.

4. If the diff contains an architectural choice, invoke the
   [`log-decision`](../log-decision/SKILL.md) skill rather than writing the entry by hand.

5. If you cannot tell whether something is still accurate - particularly the README Status
   section - ask rather than guessing. A confidently wrong doc is worse than a stale one.

## Output

Report the table from step 2 with a verdict per surface and a one-line note on each edit
you made. If everything was already accurate, say so explicitly - that is a useful result,
not a non-answer.
