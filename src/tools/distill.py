"""Distill's deterministic validators: checks referential integrity and scores coverage."""

import re
from typing import Any

from strands import tool

from core.validation.spec import COVERAGE_GAP_PHRASES, COVERAGE_NOUNS

# Two real UA FSD template families observed in the fsds/ reference bucket, keyed by the
# section header text that appears verbatim (case-insensitive) in extracted PDF text.
# Anchor list order doesn't matter for detection - sections are sliced in the order the
# anchors actually appear in the document.
_EDM_FSD_ANCHORS = [
    "EDM Request Roles",
    "User Story",
    "Success Criteria",
    "Functional Area",
    "Value Add",
    "The Ask",
    "Measures & Dimensions",
    "Security Access",
    "Level of Effort",
]
_SERVICENOW_IDEA_ANCHORS = [
    "SECTION 1: HIGH LEVEL REQUIREMENTS",
    "SECTION 2: SMALL REQUESTS",
    "SECTION 3: LARGE REQUESTS",
    "Data Mapping",
]
_TEMPLATES: dict[str, list[str]] = {
    "edm_fsd": _EDM_FSD_ANCHORS,
    "servicenow_idea": _SERVICENOW_IDEA_ANCHORS,
}
# Below this many matched anchors, don't guess a template - treat the FSD as free-form
# prose instead (today's LLM-driven extraction path).
_MIN_ANCHOR_MATCHES = 3
# Literal scaffolding text the UA FSD Word template leaves in an unanswered field - not
# a real answer, even though the section technically "has content".
_PLACEHOLDER_TEXT = [
    "click here to enter text",
    "click or tap here to enter text",
    "choose an item",
]
# Field-constraint phrasing observed in real "Error Handling Fields" sections, e.g.
# "POS Promo - should never exceed 1", "Effective Date - should be the MM-DD-YYYY date
# format", "First/Further Flag - should be 1 or 2".
_FIELD_PATTERN = r"(?P<field>[A-Za-z][\w/ %]*?)\s*[\u2013-]\s*should\s+"
_MAX_VALUE_PATTERN = re.compile(_FIELD_PATTERN + r"never\s+exceed\s+(?P<max>[\d.]+)", re.MULTILINE)
_DATE_FORMAT_PATTERN = re.compile(
    _FIELD_PATTERN + r"be\s+the\s+(?P<format>[A-Z0-9/\-]+)\s+date\s+format", re.MULTILINE
)
_ENUM_PATTERN = re.compile(_FIELD_PATTERN + r"be\s+(?P<enum>\d+(?:\s+or\s+\d+)+)\b", re.MULTILINE)


@tool
def detect_fsd_template(text: str) -> dict[str, Any]:
    """Deterministically detect a known UA FSD template in `text` and split it into sections.

    Recognizes the "edm_fsd" template (EDM Request Roles / User Story / Success
    Criteria / The Ask / Measures & Dimensions / ...) and the older "servicenow_idea"
    template (SECTION 1/2/3 / Data Mapping). Call this first on any raw FSD text, before
    extracting requirements - if it returns a known template, read requirements, gate
    criteria and evidence from the returned `sections` instead of the raw text, since
    they are already correctly bounded and named. Returns `{"template": "unknown",
    "sections": {}}` if `text` doesn't match either template closely enough - in that
    case, extract from the raw text yourself as before.
    """
    best_template = "unknown"
    best_anchors: list[str] = []
    for name, anchors in _TEMPLATES.items():
        matches = [a for a in anchors if a.lower() in text.lower()]
        if len(matches) > len(best_anchors):
            best_template, best_anchors = name, matches

    if len(best_anchors) < _MIN_ANCHOR_MATCHES:
        return {"template": "unknown", "sections": {}}

    lower_text = text.lower()
    positions = sorted((lower_text.index(a.lower()), a) for a in best_anchors)
    sections: dict[str, str] = {}
    for i, (start, anchor) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        sections[anchor] = text[start + len(anchor) : end].strip()
    return {"template": best_template, "sections": sections}


@tool
def score_template_coverage(template: str, sections: dict[str, str]) -> dict[str, Any]:
    """Deterministically score how many of a known FSD template's sections were answered.

    Call this with the `template` and `sections` `detect_fsd_template` returned, when it
    recognized a known template. A section counts as answered only if present and not
    just the Word template's own unfilled placeholder text (e.g. "Click here to enter
    text.", "Choose an item."). If `template` is "unknown", deterministic template
    scoring does not apply - fall back to `score_completeness` instead of calling this.
    """
    anchors = _TEMPLATES.get(template, [])
    missing = [a for a in anchors if a not in sections]
    placeholder = [
        a
        for a, body in sections.items()
        if a in anchors and any(p in body.lower() for p in _PLACEHOLDER_TEXT)
    ]
    if not anchors:
        return {"coverage": 0.0, "missing_sections": [], "placeholder_sections": []}
    answered = len(anchors) - len(missing) - len(placeholder)
    return {
        "coverage": round(answered / len(anchors), 2),
        "missing_sections": missing,
        "placeholder_sections": placeholder,
    }


@tool
def extract_field_rules(text: str) -> list[dict[str, str]]:
    """Deterministically parse field-level constraints out of an FSD's prose.

    Recognizes three phrasings seen in real UA FSDs' "Error Handling Fields"-style
    sections: "<field> - should never exceed <n>", "<field> - should be the <FORMAT>
    date format", and "<field> - should be <n> or <n>". Call this on the raw FSD text
    (or just an "Error Handling Fields" subsection, if one exists) to get candidate
    machine-readable rules - turn each into a `GateCriterion` plus a
    `MachineReadableRule` using the returned `rule` string verbatim, instead of inventing
    rule wording yourself. An empty result does not mean the FSD has no business rules,
    only that none were phrased this way - still look for others in the prose yourself.
    """
    rules: list[dict[str, str]] = []
    for match in _MAX_VALUE_PATTERN.finditer(text):
        field = match["field"].strip()
        rules.append({"field": field, "rule": f"{field} must not exceed {match['max']}"})
    for match in _DATE_FORMAT_PATTERN.finditer(text):
        field = match["field"].strip()
        fmt = match["format"]
        rules.append({"field": field, "rule": f"{field} must match date format {fmt}"})
    for match in _ENUM_PATTERN.finditer(text):
        field = match["field"].strip()
        values = re.split(r"\s+or\s+", match["enum"])
        rules.append({"field": field, "rule": f"{field} must be one of: {', '.join(values)}"})
    return rules


# Keys `validate_structured_spec` and `score_completeness` expect on their
# `requirement_coverage` dict. The wording lives in core.validation.spec so this in-loop
# tool and the artifact gate that overrules it cannot drift apart.
_COVERAGE_NOUNS = COVERAGE_NOUNS
_COVERAGE_GAP_PHRASES = COVERAGE_GAP_PHRASES


@tool
def validate_structured_spec(
    requirement_ids: list[str],
    gate_criteria_ids: list[str],
    rule_ids: list[str],
    rule_criteria_ids: list[str],
    requirement_coverage: dict[str, list[str]],
) -> dict[str, Any]:
    """Deterministically validate a StructuredSpec draft's referential integrity.

    Flags a duplicate requirement, gate criterion or rule id, and any rule whose
    `criterion_id` isn't one of the drafted gate criteria. `requirement_coverage` maps
    each of "evidence_requirement_ids", "acceptance_criterion_requirement_ids",
    "business_value_requirement_ids" and "intent_requirement_ids" to the requirement
    ids that have one - a dangling requirement_id in any of those, or a requirement
    missing from "intent_requirement_ids" (each requirement needs exactly one intent
    classification), is flagged too. Call this with the ids you drafted before
    finalizing - if it reports any issues, fix them and call it again until it reports
    none.
    """
    issues: list[str] = []
    seen_requirements: set[str] = set()
    for rid in requirement_ids:
        if rid in seen_requirements:
            issues.append(f"duplicate requirement id {rid}")
        seen_requirements.add(rid)

    seen_criteria: set[str] = set()
    for cid in gate_criteria_ids:
        if cid in seen_criteria:
            issues.append(f"duplicate gate criterion id {cid}")
        seen_criteria.add(cid)

    seen_rules: set[str] = set()
    for rule_id in rule_ids:
        if rule_id in seen_rules:
            issues.append(f"duplicate rule id {rule_id}")
        seen_rules.add(rule_id)

    issues += [
        f"rule references unknown gate criterion {cid}"
        for cid in rule_criteria_ids
        if cid not in seen_criteria
    ]
    for key, noun in _COVERAGE_NOUNS.items():
        issues += [
            f"{noun} references unknown requirement {rid}"
            for rid in requirement_coverage.get(key, [])
            if rid not in seen_requirements
        ]
    issues += [
        f"requirement {rid} has no intent classification"
        for rid in sorted(
            seen_requirements - set(requirement_coverage.get("intent_requirement_ids", []))
        )
    ]
    return {"valid": not issues, "issues": issues}


@tool
def validate_rule_correlations(
    rule_ids: list[str], rule_correlation_rule_ids: list[list[str]]
) -> dict[str, Any]:
    """Deterministically validate a StructuredSpec draft's rule correlations.

    Flags any `RuleCorrelation` whose `rule_ids` reference a rule id you didn't draft.
    Call this with the rule ids you drafted and each correlation's `rule_ids` list
    before finalizing - if it reports any issues, fix them and call it again until it
    reports none.
    """
    seen_rules = set(rule_ids)
    issues = [
        f"rule correlation references unknown rule {rule_id}"
        for group in rule_correlation_rule_ids
        for rule_id in group
        if rule_id not in seen_rules
    ]
    return {"valid": not issues, "issues": issues}


@tool
def score_completeness(
    requirement_ids: list[str],
    criteria_ids: list[str],
    rule_criteria_ids: list[str],
    requirement_coverage: dict[str, list[str]],
) -> dict[str, Any]:
    """Deterministically score a StructuredSpec draft.

    Returns the fraction of "coverable" things that are covered: requirements with
    linked evidence, gate criteria with a machine-readable rule, and requirements with
    an acceptance criterion, a business value (use case/ROI), and an intent
    classification. `requirement_coverage` takes the same keys as
    `validate_structured_spec`'s argument of the same name. Any uncovered id is
    reported as a gap. Returns 0.0 with a gap naming what to ask for if no requirement
    or gate criteria ids were drafted at all - meaning the input was missing,
    unreadable, or empty. Call this with the ids you drafted before finalizing the
    `completeness` field - do not estimate the score yourself.
    """
    requirement_id_set = set(requirement_ids)
    criteria_id_set = set(criteria_ids)
    missing = {
        key: sorted(requirement_id_set - set(requirement_coverage.get(key, [])))
        for key in _COVERAGE_GAP_PHRASES
    }
    missing_rules = sorted(criteria_id_set - set(rule_criteria_ids))

    gaps = [
        f"requirement {r} has no {_COVERAGE_GAP_PHRASES[key]}"
        for key, ids in missing.items()
        for r in ids
    ]
    gaps += [f"gate criterion {c} has no machine-readable rule" for c in missing_rules]

    # deduplicated on both sides: coverage is set-based, so counting a repeated id twice
    # in the denominator alone would score the same spec lower here than at the gate
    total = len(requirement_id_set) * len(_COVERAGE_GAP_PHRASES) + len(criteria_id_set)
    if total == 0:
        gaps = [
            (
                "no requirements or gate criteria were extracted - the source document "
                "may be missing, unreadable, or empty; ask for the FSD content, a "
                "Confluence page id, a Jira issue key, or an S3 key"
            )
        ]
        return {"score": 0.0, "gaps": gaps}
    covered = sum(len(requirement_id_set) - len(ids) for ids in missing.values())
    covered += len(criteria_id_set) - len(missing_rules)
    return {"score": round(covered / total, 2), "gaps": gaps}
