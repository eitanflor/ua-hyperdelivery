"""The deterministic gate: completeness computed from artifacts, not from the model's word."""

from typing import Any

from core.constants import AgentName
from core.domain.blueprint import (
    ApiContract,
    Blueprint,
    Component,
    DataEntity,
    EntityField,
    FileTouchpoint,
    IntegrationPoint,
    UnitOfWork,
)
from core.domain.project import CompletenessScore
from core.domain.review import Finding, RequirementCoverage, ReviewReport
from core.domain.showroom import DemoDataSeed, DemoPackage, TalkTrackSection
from core.domain.spec import (
    AcceptanceCriterion,
    BusinessValue,
    EvidenceLink,
    GateCriterion,
    MachineReadableRule,
    Requirement,
    RequirementIntent,
    RuleCorrelation,
    StructuredSpec,
)
from core.validation import evaluate_artifact
from core.validation.blueprint import evaluate_blueprint
from core.validation.review import evaluate_review
from core.validation.showroom import evaluate_showroom
from core.validation.spec import evaluate_spec


def _spec(requirement_ids: list[str] | None = None) -> StructuredSpec:
    requirement_ids = requirement_ids if requirement_ids is not None else ["R1"]
    return StructuredSpec(
        title="Spec",
        objective="Ship the requested workflow",
        scope="Backend and console flow",
        actors=["Requester", "Reviewer"],
        requirements=[Requirement(id=rid, description=f"do {rid}") for rid in requirement_ids],
        business_rules=[],
        data_requirements=[],
        data_connectors=[],
        snowflake_connectors=[],
        workflows=[],
        non_functional_requirements=[],
        open_questions=[],
        gate_criteria=[GateCriterion(id="G1", description="is testable")],
        rules=[MachineReadableRule(id="M1", criterion_id="G1", rule="x must be set")],
        rule_correlations=[],
        evidence=[EvidenceLink(requirement_id=rid, evidence="page 1") for rid in requirement_ids],
        acceptance_criteria=[
            AcceptanceCriterion(id=f"A{i}", requirement_id=rid, description="works")
            for i, rid in enumerate(requirement_ids, start=1)
        ],
        business_value=[
            BusinessValue(requirement_id=rid, use_case="analyst", roi="saves an hour")
            for rid in requirement_ids
        ],
        intents=[
            RequirementIntent(requirement_id=rid, intent="functional") for rid in requirement_ids
        ],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )


def _blueprint(
    units: list[UnitOfWork],
    contracts: list[ApiContract] | None = None,
    components: list[Component] | None = None,
) -> Blueprint:
    return Blueprint(
        title="Blueprint",
        architecture_summary="a summary",
        components=components if components is not None else [_COMPONENT],
        units_of_work=units,
        api_contracts=contracts if contracts is not None else [],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )


_COMPONENT = Component(id="CMP1", name="Validator", responsibility="applies the tier rules")


def _unit(**overrides: object) -> UnitOfWork:
    """A unit that satisfies every structural check, so a test can break exactly one."""
    fields: dict[str, object] = {
        "id": "U1",
        "title": "t",
        "description": "d",
        "requirement_ids": ["R1"],
        "component_ids": ["CMP1"],
        "files": _files(),
    }
    return UnitOfWork.model_validate(fields | overrides)


def _files() -> list[FileTouchpoint]:
    return [FileTouchpoint(path="src/app.py", change="add", purpose="the handler")]


def test_spec_scores_full_coverage_as_one() -> None:
    assert evaluate_spec(_spec()) == CompletenessScore(score=1.0, gaps=[])


def test_spec_flags_a_requirement_missing_business_value() -> None:
    spec = _spec()
    spec.business_value = []

    result = evaluate_spec(spec)

    assert result.score < 1.0
    assert "requirement R1 has no business value (use case/ROI)" in result.gaps


def test_spec_flags_a_rule_citing_an_undeclared_criterion() -> None:
    spec = _spec()
    spec.rules = [MachineReadableRule(id="M1", criterion_id="NOPE", rule="x")]

    assert "rule M1 references unknown gate criterion NOPE" in evaluate_spec(spec).gaps


def test_spec_flags_a_correlation_citing_an_undeclared_rule() -> None:
    spec = _spec()
    spec.rule_correlations = [
        RuleCorrelation(id="C1", rule_ids=["M1", "GHOST"], description="paired")
    ]

    assert "rule correlation C1 references unknown rule GHOST" in evaluate_spec(spec).gaps


def test_spec_flags_a_requirement_resting_only_on_another_projects_document() -> None:
    spec = _spec()
    spec.evidence = [
        EvidenceLink(requirement_id="R1", evidence="ADVA-2011's FSD", source="reference_material")
    ]

    gaps = evaluate_spec(spec).gaps

    assert (
        "requirement R1 is cited only to reference material - cite the ask it came from, "
        "or ask whoever requested it" in gaps
    )


def test_spec_accepts_a_requirement_a_stakeholder_answered_for() -> None:
    # Answering in the console is a real citation - weaker than a document, not absent.
    spec = _spec()
    spec.evidence = [
        EvidenceLink(
            requirement_id="R1", evidence="Dana said seven years", source="stakeholder_answer"
        )
    ]

    assert evaluate_spec(spec) == CompletenessScore(score=1.0, gaps=[])


def test_spec_accepts_reference_material_alongside_a_real_citation() -> None:
    spec = _spec()
    spec.evidence = [
        EvidenceLink(requirement_id="R1", evidence="page 1", source="source_document"),
        EvidenceLink(requirement_id="R1", evidence="ADVA-2011", source="reference_material"),
    ]

    assert evaluate_spec(spec).gaps == []


def test_blueprint_ignores_coverage_the_units_do_not_actually_record() -> None:
    """The regression this gate exists for: a plausible blueprint with no traceability."""
    blueprint = _blueprint(
        [UnitOfWork(id="U1", title="Build it", description="addresses R1 fully")]
    )

    result = evaluate_blueprint(_spec(), blueprint)

    assert result.score == 0.0
    assert "requirement R1 has no unit of work addressing it" in result.gaps
    assert "unit U1 addresses no requirement - set its `requirement_ids`" in result.gaps


def test_blueprint_scores_recorded_coverage() -> None:
    blueprint = _blueprint([_unit(acceptance_criterion_ids=["A1"])])

    assert evaluate_blueprint(_spec(), blueprint) == CompletenessScore(score=1.0, gaps=[])


def test_blueprint_flags_a_unit_a_coding_agent_could_not_act_on() -> None:
    blueprint = _blueprint([_unit(files=[])])

    gaps = evaluate_blueprint(_spec(), blueprint).gaps

    assert "unit U1 names no files to change - a coding agent cannot act on it as written" in gaps


def test_blueprint_flags_a_design_that_names_no_components() -> None:
    """The blandness regression: units of work with no architecture behind them."""
    blueprint = _blueprint([_unit(component_ids=[])], components=[])

    gaps = evaluate_blueprint(_spec(), blueprint).gaps

    assert any("the blueprint names no components" in gap for gap in gaps)
    assert "unit U1 builds no component - set its `component_ids`" in gaps


def test_blueprint_flags_a_component_nothing_builds() -> None:
    orphan = Component(id="CMP2", name="Reporter", responsibility="emits the weekly view")
    blueprint = _blueprint([_unit()], components=[_COMPONENT, orphan])

    result = evaluate_blueprint(_spec(), blueprint)

    assert result.score < 1.0
    assert "component CMP2 has no unit of work building it" in result.gaps


def test_blueprint_flags_an_integration_requirement_with_no_integration_point() -> None:
    spec = _spec(["R1", "R2"])
    spec.intents = [
        RequirementIntent(requirement_id="R1", intent="functional"),
        RequirementIntent(requirement_id="R2", intent="integration"),
    ]
    blueprint = _blueprint([_unit(requirement_ids=["R1", "R2"])])

    result = evaluate_blueprint(spec, blueprint)

    assert (
        "requirement R2 is classified as an integration but no integration point covers it"
        in result.gaps
    )


def test_blueprint_scores_an_integration_requirement_that_is_covered() -> None:
    spec = _spec()
    spec.intents = [RequirementIntent(requirement_id="R1", intent="integration")]
    blueprint = _blueprint([_unit(acceptance_criterion_ids=["A1"])])
    blueprint.integration_points = [
        IntegrationPoint(
            id="I1",
            system="Snowflake",
            direction="inbound",
            description="nightly promo tier pull",
            requirement_ids=["R1"],
        )
    ]

    assert evaluate_blueprint(spec, blueprint) == CompletenessScore(score=1.0, gaps=[])


def test_blueprint_flags_a_data_entity_with_no_fields() -> None:
    blueprint = _blueprint([_unit()])
    blueprint.data_entities = [
        DataEntity(id="E1", name="AuditRecord", description="one decision", component_id="CMP1")
    ]

    gaps = evaluate_blueprint(_spec(), blueprint).gaps

    assert "data entity E1 has no fields - a coding agent cannot generate a model from it" in gaps


def test_blueprint_flags_a_data_entity_owned_by_an_undeclared_component() -> None:
    blueprint = _blueprint([_unit()])
    blueprint.data_entities = [
        DataEntity(
            id="E1",
            name="AuditRecord",
            description="one decision",
            component_id="GHOST",
            fields=[EntityField(name="id", type="str", description="the key")],
        )
    ]

    assert (
        "data entity E1 is owned by unknown component GHOST"
        in evaluate_blueprint(_spec(), blueprint).gaps
    )


def test_blueprint_scores_an_unimplemented_contract_as_uncovered() -> None:
    contract = ApiContract(id="C1", method="POST", path="/orders", summary="create an order")
    blueprint = _blueprint([_unit(acceptance_criterion_ids=["A1"])], [contract])

    result = evaluate_blueprint(_spec(), blueprint)

    assert result.score < 1.0
    assert "API contract C1 has no unit of work implementing it" in result.gaps


def test_blueprint_flags_a_contract_path_without_a_leading_slash() -> None:
    contract = ApiContract(id="C1", method="GET", path="orders", summary="list orders")
    blueprint = _blueprint([_unit(contract_ids=["C1"])], [contract])

    gaps = evaluate_blueprint(_spec(), blueprint).gaps

    assert "API contract C1 has path 'orders', which does not start with '/'" in gaps


def test_blueprint_flags_two_contracts_on_the_same_method_and_path() -> None:
    contracts = [
        ApiContract(id="C1", method="GET", path="/orders", summary="list"),
        ApiContract(id="C2", method="GET", path="/orders", summary="also list"),
    ]
    blueprint = _blueprint([_unit(contract_ids=["C1", "C2"])], contracts)

    assert (
        "GET /orders is declared by more than one API contract"
        in evaluate_blueprint(_spec(), blueprint).gaps
    )


def test_blueprint_without_an_api_surface_is_not_penalized() -> None:
    blueprint = _blueprint([_unit(acceptance_criterion_ids=["A1"])])

    assert evaluate_blueprint(_spec(), blueprint).score == 1.0


def test_blueprint_flags_an_acceptance_criterion_on_an_unrelated_unit() -> None:
    spec = _spec(["R1", "R2"])
    blueprint = _blueprint(
        [
            UnitOfWork(
                id="U1",
                title="t",
                description="d",
                requirement_ids=["R1"],
                acceptance_criterion_ids=["A1", "A2"],
                files=_files(),
            ),
            UnitOfWork(id="U2", title="t", description="d", requirement_ids=["R2"], files=_files()),
        ]
    )

    gaps = evaluate_blueprint(spec, blueprint).gaps

    assert (
        "unit U1 claims acceptance criterion A2, whose requirement R2 it does not address" in gaps
    )


def test_blueprint_flags_a_dependency_cycle() -> None:
    blueprint = _blueprint(
        [
            UnitOfWork(
                id="U1", title="t", description="d", requirement_ids=["R1"], depends_on=["U2"]
            ),
            UnitOfWork(
                id="U2", title="t", description="d", requirement_ids=["R1"], depends_on=["U1"]
            ),
        ]
    )

    assert any("dependency cycle" in gap for gap in evaluate_blueprint(_spec(), blueprint).gaps)


def test_blueprint_without_a_spec_reports_what_it_needs() -> None:
    result = evaluate_blueprint(None, _blueprint([]))

    assert result.score == 0.0
    assert any("no approved spec" in gap for gap in result.gaps)


def test_review_counts_an_unmet_requirement_as_reviewed() -> None:
    report = ReviewReport(
        title="Review",
        findings=[Finding(id="F1", severity="blocker", description="missing", requirement_id="R1")],
        coverage=[RequirementCoverage(requirement_id="R1", met=False)],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert evaluate_review(_spec(), None, report) == CompletenessScore(score=1.0, gaps=[])


def test_review_flags_a_requirement_it_never_returned_a_verdict_on() -> None:
    report = ReviewReport(
        title="Review",
        findings=[],
        coverage=[RequirementCoverage(requirement_id="R1", met=True)],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    result = evaluate_review(_spec(["R1", "R2"]), None, report)

    assert result.score == 0.5
    assert "requirement R2 has no coverage entry saying whether the build meets it" in result.gaps


def test_review_flags_a_finding_citing_an_undeclared_requirement() -> None:
    report = ReviewReport(
        title="Review",
        findings=[Finding(id="F1", severity="minor", description="d", requirement_id="GHOST")],
        coverage=[RequirementCoverage(requirement_id="R1", met=True)],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert (
        "finding F1 references unknown requirement GHOST"
        in evaluate_review(_spec(), None, report).gaps
    )


def test_showroom_scores_narration_coverage() -> None:
    package = DemoPackage(
        title="Demo",
        summary="s",
        demo_data=[DemoDataSeed(entity="Order", description="ten orders")],
        talk_track=[TalkTrackSection(requirement_id="R1", narration="here it is")],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    result = evaluate_showroom(_spec(["R1", "R2"]), package)

    assert result.score == 0.5
    assert "requirement R2 has no talk track narration" in result.gaps


def test_showroom_flags_a_demo_with_no_seed_data() -> None:
    package = DemoPackage(
        title="Demo",
        summary="s",
        demo_data=[],
        talk_track=[TalkTrackSection(requirement_id="R1", narration="here it is")],
        completeness=CompletenessScore(score=1.0, gaps=[]),
    )

    assert any("no seed data" in gap for gap in evaluate_showroom(_spec(), package).gaps)


def test_evaluate_artifact_overrules_a_self_reported_perfect_score() -> None:
    content: dict[str, Any] = _blueprint(
        [UnitOfWork(id="U1", title="t", description="d")]
    ).model_dump()
    content["completeness"] = {"score": 1.0, "gaps": []}

    result = evaluate_artifact(
        AgentName.BLUEPRINT.value, content, {AgentName.DISTILL.value: _spec().model_dump()}
    )

    assert result.score == 0.0
    assert result.gaps


def test_evaluate_artifact_treats_an_off_contract_predecessor_as_absent() -> None:
    blueprint = _blueprint(
        [UnitOfWork(id="U1", title="t", description="d", requirement_ids=["R1"], files=_files())]
    )

    result = evaluate_artifact(
        AgentName.BLUEPRINT.value,
        blueprint.model_dump(),
        {AgentName.DISTILL.value: {"title": "not a spec"}},
    )

    assert result.score == 0.0
    assert any("no approved spec" in gap for gap in result.gaps)


def test_evaluate_artifact_flags_output_that_misses_its_own_contract() -> None:
    result = evaluate_artifact(AgentName.SHOWROOM.value, {"title": "nope"}, {})

    assert result.score == 0.0
    assert any("does not match its output contract" in gap for gap in result.gaps)
