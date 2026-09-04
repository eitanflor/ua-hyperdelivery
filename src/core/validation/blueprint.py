"""G2 gate: scores a persisted Blueprint against the spec it was actually built from."""

from collections import Counter

from core.domain.blueprint import Blueprint
from core.domain.project import CompletenessScore
from core.domain.spec import StructuredSpec
from core.validation.graph import dependency_issues, duplicate_id_issues

_NO_SPEC_GAP = (
    "no approved spec was available to check this blueprint against - ask for the "
    "spec's requirements, or a Jira issue key to pull them from, before drafting"
)
_EMPTY_SPEC_GAP = "the approved spec has no requirements to build units of work from"


def evaluate_blueprint(spec: StructuredSpec | None, blueprint: Blueprint) -> CompletenessScore:
    """Score a Blueprint on the traceability edges it stored, not the ones it claimed.

    Coverage is read off each unit's `requirement_ids`/`acceptance_criterion_ids`, so a
    unit only counts towards the score if the persisted artifact says which requirement
    it addresses. Coverable units are every requirement, acceptance criterion, declared
    API contract, declared component, and every requirement the spec classified as an
    integration. A unit also has to name the component it builds and the files it
    touches, since the artifact is meant to be handed to a coding agent that has nothing
    else to go on.
    """
    if spec is None:
        return CompletenessScore(score=0.0, gaps=[_NO_SPEC_GAP])

    units = blueprint.units_of_work
    known_requirements = {r.id for r in spec.requirements}
    criterion_requirement = {a.id: a.requirement_id for a in spec.acceptance_criteria}
    known_contracts = {c.id for c in blueprint.api_contracts}
    known_components = {c.id for c in blueprint.components}
    integration_requirements = {
        i.requirement_id for i in spec.intents if i.intent == "integration"
    } & known_requirements

    gaps = duplicate_id_issues("unit of work", [u.id for u in units])
    gaps += dependency_issues([u.id for u in units], {u.id: u.depends_on for u in units})
    gaps += [
        f"unit {u.id} references unknown requirement {rid}"
        for u in units
        for rid in u.requirement_ids
        if rid not in known_requirements
    ]
    gaps += [
        f"unit {u.id} references unknown acceptance criterion {cid}"
        for u in units
        for cid in u.acceptance_criterion_ids
        if cid not in criterion_requirement
    ]
    # A unit cannot own the definition of done for a requirement it does not address.
    gaps += [
        f"unit {u.id} claims acceptance criterion {cid}, whose requirement "
        f"{criterion_requirement[cid]} it does not address"
        for u in units
        for cid in u.acceptance_criterion_ids
        if cid in criterion_requirement and criterion_requirement[cid] not in u.requirement_ids
    ]
    gaps += [
        f"unit {u.id} addresses no requirement - set its `requirement_ids`"
        for u in units
        if not u.requirement_ids
    ]
    gaps += _contract_gaps(blueprint, known_requirements, known_contracts)
    gaps += _file_gaps(blueprint)
    gaps += _design_gaps(blueprint, known_requirements, known_components)

    covered_requirements = {rid for u in units for rid in u.requirement_ids} & known_requirements
    claimed_criteria = {
        cid for u in units for cid in u.acceptance_criterion_ids
    } & criterion_requirement.keys()
    implemented_contracts = {cid for u in units for cid in u.contract_ids} & known_contracts
    built_components = {cid for u in units for cid in u.component_ids} & known_components
    integrated = {
        rid for p in blueprint.integration_points for rid in p.requirement_ids
    } & integration_requirements
    gaps += [
        f"requirement {rid} has no unit of work addressing it"
        for rid in sorted(known_requirements - covered_requirements)
    ]
    gaps += [
        f"acceptance criterion {cid} is not folded into any unit of work"
        for cid in sorted(criterion_requirement.keys() - claimed_criteria)
    ]
    gaps += [
        f"API contract {cid} has no unit of work implementing it"
        for cid in sorted(known_contracts - implemented_contracts)
    ]
    gaps += [
        f"component {cid} has no unit of work building it"
        for cid in sorted(known_components - built_components)
    ]
    gaps += [
        f"requirement {rid} is classified as an integration but no integration point covers it"
        for rid in sorted(integration_requirements - integrated)
    ]

    total = (
        len(known_requirements)
        + len(criterion_requirement)
        + len(known_contracts)
        + len(known_components)
        + len(integration_requirements)
    )
    if total == 0:
        return CompletenessScore(score=0.0, gaps=[_EMPTY_SPEC_GAP])
    covered = (
        len(covered_requirements)
        + len(claimed_criteria)
        + len(implemented_contracts)
        + len(built_components)
        + len(integrated)
    )
    return CompletenessScore(score=round(covered / total, 2), gaps=gaps)


def _design_gaps(
    blueprint: Blueprint, known_requirements: set[str], known_components: set[str]
) -> list[str]:
    """Check the design is actually present and internally consistent, not just narrated."""
    gaps = duplicate_id_issues("component", [c.id for c in blueprint.components])
    gaps += duplicate_id_issues("data entity", [e.id for e in blueprint.data_entities])
    gaps += duplicate_id_issues("integration point", [p.id for p in blueprint.integration_points])
    if blueprint.units_of_work and not blueprint.components:
        gaps.append(
            "the blueprint names no components - break the architecture summary into named "
            "parts with a single responsibility each before sizing units of work"
        )
    gaps += [
        f"unit {u.id} builds no component - set its `component_ids`"
        for u in blueprint.units_of_work
        if not u.component_ids
    ]
    gaps += [
        f"unit {u.id} references unknown component {cid}"
        for u in blueprint.units_of_work
        for cid in u.component_ids
        if cid not in known_components
    ]
    gaps += [
        f"data entity {e.id} is owned by unknown component {e.component_id}"
        for e in blueprint.data_entities
        if e.component_id not in known_components
    ]
    gaps += [
        f"data entity {e.id} has no fields - a coding agent cannot generate a model from it"
        for e in blueprint.data_entities
        if not e.fields
    ]
    gaps += [
        f"integration point {p.id} references unknown requirement {rid}"
        for p in blueprint.integration_points
        for rid in p.requirement_ids
        if rid not in known_requirements
    ]
    gaps += [
        f"integration point {p.id} serves no requirement - set its `requirement_ids`"
        for p in blueprint.integration_points
        if not p.requirement_ids
    ]
    return gaps


def _contract_gaps(
    blueprint: Blueprint, known_requirements: set[str], known_contracts: set[str]
) -> list[str]:
    """Check the API surface is well-formed and traced back to the spec."""
    gaps = duplicate_id_issues("API contract", [c.id for c in blueprint.api_contracts])
    gaps += [
        f"API contract {c.id} has path {c.path!r}, which does not start with '/'"
        for c in blueprint.api_contracts
        if not c.path.startswith("/")
    ]
    gaps += [
        f"API contract {c.id} references unknown requirement {rid}"
        for c in blueprint.api_contracts
        for rid in c.requirement_ids
        if rid not in known_requirements
    ]
    gaps += [
        f"{method} {path} is declared by more than one API contract"
        for (method, path), count in sorted(
            Counter((c.method, c.path) for c in blueprint.api_contracts).items()
        )
        if count > 1
    ]
    gaps += [
        f"unit {u.id} implements unknown API contract {cid}"
        for u in blueprint.units_of_work
        for cid in u.contract_ids
        if cid not in known_contracts
    ]
    return gaps


def _file_gaps(blueprint: Blueprint) -> list[str]:
    """Check each unit names the files a coding agent should touch, exactly once each."""
    gaps = [
        f"unit {u.id} names no files to change - a coding agent cannot act on it as written"
        for u in blueprint.units_of_work
        if not u.files
    ]
    gaps += [
        f"unit {u.id} lists file {path} more than once"
        for u in blueprint.units_of_work
        for path, count in sorted(Counter(f.path for f in u.files).items())
        if count > 1
    ]
    return gaps
