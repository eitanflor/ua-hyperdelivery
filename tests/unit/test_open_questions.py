"""Questions survive the gate that overwrites score and gaps - but only within bounds."""

from typing import Any

from core.constants import AgentName
from core.domain.project import CompletenessScore, OpenQuestion
from core.domain.spec import (
    AcceptanceCriterion,
    BusinessValue,
    EvidenceLink,
    GateCriterion,
    MachineReadableRule,
    Requirement,
    RequirementIntent,
    StructuredSpec,
)
from core.validation import evaluate_artifact
from core.validation.questions import MAX_QUESTIONS, accepted_questions, unasked_gap


def _question(qid: str, **overrides: Any) -> OpenQuestion:
    fields: dict[str, Any] = {"id": qid, "question": f"what about {qid}?"}
    return OpenQuestion.model_validate(fields | overrides)


def _spec_content(questions: list[OpenQuestion]) -> dict[str, Any]:
    """A Distill artifact with nothing drafted yet - the intake turn."""
    return {
        "title": "Promo tier validation",
        "requirements": [],
        "gate_criteria": [],
        "rules": [],
        "rule_correlations": [],
        "evidence": [],
        "acceptance_criteria": [],
        "business_value": [],
        "intents": [],
        "completeness": CompletenessScore(score=0.9, questions=questions).model_dump(),
    }


def _complete_spec_content(questions: list[OpenQuestion]) -> dict[str, Any]:
    """A Distill artifact the gate scores at 1.0, that asked anyway."""
    spec = StructuredSpec(
        title="Promo tier validation",
        objective="Validate promo tiers",
        scope="Promo tier rules",
        actors=["Merchandising analyst"],
        requirements=[Requirement(id="R1", description="do R1")],
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
        evidence=[EvidenceLink(requirement_id="R1", evidence="page 1")],
        acceptance_criteria=[
            AcceptanceCriterion(id="A1", requirement_id="R1", description="works")
        ],
        business_value=[BusinessValue(requirement_id="R1", use_case="analyst", roi="an hour")],
        intents=[RequirementIntent(requirement_id="R1", intent="functional")],
        completeness=CompletenessScore(score=1.0, questions=questions),
    )
    return spec.model_dump()


def test_the_gate_keeps_the_agents_questions_while_overruling_its_score() -> None:
    questions = [_question("Q1", options=["Snowflake", "SAP", "a spreadsheet"])]

    result = evaluate_artifact(AgentName.DISTILL.value, _spec_content(questions), {})

    assert result.score == 0.0
    assert [q.id for q in result.questions] == ["Q1"]
    assert result.questions[0].options == ["Snowflake", "SAP", "a spreadsheet"]


def test_an_intake_turn_that_asks_nothing_is_a_gap() -> None:
    result = evaluate_artifact(AgentName.DISTILL.value, _spec_content([]), {})

    assert result.score == 0.0
    assert any("nothing was asked" in gap for gap in result.gaps)


def test_an_intake_turn_that_asks_is_not_told_to_ask() -> None:
    result = evaluate_artifact(AgentName.DISTILL.value, _spec_content([_question("Q1")]), {})

    assert not any("nothing was asked" in gap for gap in result.gaps)


def test_a_complete_artifact_carries_no_questions() -> None:
    result = evaluate_artifact(
        AgentName.DISTILL.value, _complete_spec_content([_question("Q1")]), {}
    )

    assert result.score == 1.0
    assert result.questions == []


def test_more_questions_than_a_human_will_answer_are_trimmed() -> None:
    questions = [_question(f"Q{i}") for i in range(MAX_QUESTIONS + 3)]

    accepted, gaps = accepted_questions(questions)

    assert len(accepted) == MAX_QUESTIONS
    # the agent's own ordering is kept - it asked the most important one first
    assert [q.id for q in accepted] == [f"Q{i}" for i in range(MAX_QUESTIONS)]
    assert any("unblock the most" in gap for gap in gaps)


def test_duplicate_question_ids_are_dropped() -> None:
    accepted, gaps = accepted_questions([_question("Q1"), _question("Q1")])

    assert len(accepted) == 1
    assert "question id Q1 is used more than once" in gaps


def test_a_multi_select_question_with_no_options_is_dropped() -> None:
    accepted, gaps = accepted_questions([_question("Q1", multi_select=True)])

    assert accepted == []
    assert any("offers no options to pick" in gap for gap in gaps)


def test_a_free_text_question_needs_no_options() -> None:
    accepted, gaps = accepted_questions([_question("Q1")])

    assert len(accepted) == 1
    assert gaps == []


def test_a_scored_artifact_is_not_asked_to_ask() -> None:
    assert unasked_gap(0.5, []) == []
