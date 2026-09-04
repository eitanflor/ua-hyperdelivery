"""Dispatch: turn one station's persisted artifact into the completeness a gate acts on."""

import logging
from collections.abc import Mapping
from typing import Any, TypeVar, cast

from pydantic import BaseModel, ValidationError

from core.constants import AgentName
from core.domain.blueprint import Blueprint
from core.domain.project import CompletenessScore
from core.domain.review import ReviewReport
from core.domain.showroom import DemoPackage
from core.domain.spec import StructuredSpec
from core.validation.blueprint import evaluate_blueprint
from core.validation.questions import accepted_questions, unasked_gap
from core.validation.review import evaluate_review
from core.validation.showroom import evaluate_showroom
from core.validation.spec import evaluate_spec

logger = logging.getLogger(__name__)

ModelT = TypeVar("ModelT", bound=BaseModel)


def evaluate_artifact(
    agent: str, content: Mapping[str, Any], predecessors: Mapping[str, Mapping[str, Any]]
) -> CompletenessScore:
    """Compute the authoritative completeness for one agent's artifact.

    Args:
        agent: The `AgentName` value that produced `content`.
        content: The artifact as persisted, before its `completeness` is overwritten.
        predecessors: Each upstream agent's latest artifact, keyed by `AgentName` value.
            A missing or unparseable entry is treated as absent, which the per-station
            evaluators report as a gap rather than silently scoring around.

    Returns:
        The deterministic verdict, or the model's own self-reported score untouched for
        an agent with no evaluator - a new station is not silently graded as complete.
        The agent's own `questions` are carried through onto it, bounded by
        `core.validation.questions`, unless the artifact is already complete.
    """
    verdict = _score(agent, content, predecessors)
    # Nothing an answer could change: a station that asked and then finished anyway would
    # otherwise leave the human staring at a prompt that no longer has anything to unblock.
    if verdict.score == 1.0 and not verdict.gaps:
        return verdict
    accepted, question_gaps = accepted_questions(_self_reported(content).questions)
    verdict.questions = accepted
    verdict.gaps += question_gaps + unasked_gap(verdict.score, accepted)
    return verdict


def _score(
    agent: str, content: Mapping[str, Any], predecessors: Mapping[str, Mapping[str, Any]]
) -> CompletenessScore:
    """Dispatch to the station's evaluator, without touching questions."""
    spec = _parse(StructuredSpec, predecessors.get(AgentName.DISTILL.value))
    blueprint = _parse(Blueprint, predecessors.get(AgentName.BLUEPRINT.value))

    if agent == AgentName.DISTILL.value:
        own_spec = _parse(StructuredSpec, content)
        return _contract_failure(agent) if own_spec is None else evaluate_spec(own_spec)
    if agent == AgentName.BLUEPRINT.value:
        own_blueprint = _parse(Blueprint, content)
        return (
            _contract_failure(agent)
            if own_blueprint is None
            else evaluate_blueprint(spec, own_blueprint)
        )
    if agent == AgentName.REVIEW.value:
        report = _parse(ReviewReport, content)
        return (
            _contract_failure(agent) if report is None else evaluate_review(spec, blueprint, report)
        )
    if agent == AgentName.SHOWROOM.value:
        package = _parse(DemoPackage, content)
        return _contract_failure(agent) if package is None else evaluate_showroom(spec, package)

    logger.warning(
        "no deterministic evaluator for agent %s - keeping its self-reported score", agent
    )
    return _self_reported(content)


def _parse(model: type[ModelT], content: Mapping[str, Any] | None) -> ModelT | None:
    """Read a persisted artifact back into its domain model, or `None` if it no longer fits.

    An artifact written before its contract gained a field is the expected reason this
    returns `None` - the caller treats that as a missing predecessor, not as a crash.
    """
    if content is None:
        return None
    try:
        return model.model_validate(dict(content))
    except ValidationError:
        logger.warning("stored artifact does not match %s - treating it as absent", model.__name__)
        return None


def _contract_failure(agent: str) -> CompletenessScore:
    return CompletenessScore(
        score=0.0, gaps=[f"{agent} produced an artifact that does not match its output contract"]
    )


def _self_reported(content: Mapping[str, Any]) -> CompletenessScore:
    completeness: object = content.get("completeness")
    if isinstance(completeness, Mapping):
        try:
            return CompletenessScore.model_validate(dict(cast(Mapping[str, Any], completeness)))
        except ValidationError:
            pass
    return CompletenessScore(score=0.0, gaps=[])
