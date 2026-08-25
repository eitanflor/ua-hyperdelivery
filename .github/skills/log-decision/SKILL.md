---
name: log-decision
description: 'Record an architecture or tradeoff decision (e.g. picking a library, hosting a new function/service, choosing a config default, rejecting an alternative) into docs/decisions.md. Use when a teammate or agent makes/changes an architectural choice, says "let''s go with X instead of Y", adds a new integration/service, or asks "why did we do it this way" for something not yet logged.'
argument-hint: 'optional: the decision to log, e.g. "log that we chose polling over webhooks for X"'
---

# Log an architecture decision

## When to use

- Someone just made or changed an architectural/tradeoff choice in this repo (a library,
  a pattern, a default, a rejected alternative, a new hosted function/service).
- Someone asks why an existing undocumented choice was made and it should be captured
  going forward.
- Do NOT use for routine bug fixes, typo fixes, or anything with no real alternative that
  was considered and rejected.

## Procedure

1. Read [../../../docs/decisions.md](../../../docs/decisions.md) (create it with the
   template header from this file if it doesn't exist yet) to see existing entries and
   avoid duplicating one.
2. Extract from the conversation/diff:
   - **Title**: short, specific (e.g. "S3 document access as an agentic tool, not a
     separate API", not "S3 stuff").
   - **Context**: the problem or constraint that forced a choice.
   - **Decision**: exactly what was chosen.
   - **Alternatives considered**: what else was on the table and why it lost. If none
     were genuinely considered, say so rather than inventing strawmen.
   - **Consequences**: what this makes easier/harder, and when to revisit.
3. If any field can't be inferred from context, ask the user directly rather than
   guessing - a decision log with fabricated rationale is worse than no log.
4. Append (never rewrite or delete prior entries) a new section at the top of the log,
   right after the template block, in this exact format:

```markdown
## YYYY-MM-DD - <short title>
- **Status**: Accepted
- **Context**: ...
- **Decision**: ...
- **Alternatives considered**: ...
- **Consequences**: ...
```

Use the current date. Keep each bullet to 1-3 sentences - this is a log, not a design doc.

## Output

Confirm back to the user with just the title and date of the entry added, not the full
text (they can read the file).
