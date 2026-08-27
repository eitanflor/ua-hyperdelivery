---
applyTo: "tests/**/*.py"
---

# Tests

Conventions in full: [AGENTS.md](../../AGENTS.md).

- Unit tests only: no network, no real AWS, no sleeping.
- Inject a double at the seam rather than patching internals. Every AWS-touching class
  takes an optional client parameter for this.
- Shared doubles live in [tests/fakes.py](../../tests/fakes.py). Extend those instead of
  writing another fake table. `loaded()` narrows an `Optional[Project]` and fails clearly.
- Fakes may mirror a third-party call shape - boto3's PascalCase kwargs are expected here,
  and lint is configured to allow it in `tests/` only.
- Annotate every test function (`-> None`) and every double. Docstrings are not required:
  the test name is the documentation, so make the name a sentence about behavior.
- Assert on behavior and observable state, not on how many times a mock was called.
- `conftest.py` clears the `get_settings` cache around every test. Leave it there.
- A test with no failing case before your change is not a test for your change.
