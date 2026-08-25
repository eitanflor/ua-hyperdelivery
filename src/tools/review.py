from strands import tool

_VALID_SEVERITIES = {"blocker", "major", "minor"}


@tool
def validate_review_report(
    requirement_ids: list[str],
    finding_requirement_ids: list[str],
    finding_severities: list[str],
    coverage_requirement_ids: list[str],
) -> dict:
    """Deterministically validate a ReviewReport draft: every finding that references a
    requirement must reference a known id with a valid severity ("blocker", "major", or
    "minor"), and the coverage view must have exactly one entry per known requirement -
    no fewer, no extras. Call this with the ids/severities you drafted before finalizing
    the report - do not eyeball it."""
    known = set(requirement_ids)
    issues = [
        f"finding references unknown requirement {rid}"
        for rid in finding_requirement_ids
        if rid not in known
    ]
    issues += [
        f"finding has invalid severity {sev!r}"
        for sev in finding_severities
        if sev not in _VALID_SEVERITIES
    ]
    missing = sorted(known - set(coverage_requirement_ids))
    extra = sorted(set(coverage_requirement_ids) - known)
    issues += [f"requirement {r} missing from coverage view" for r in missing]
    issues += [f"coverage view references unknown requirement {r}" for r in extra]
    return {"valid": not issues, "issues": issues}
