"""G1 artifact: the normalized, cited spec Distill produces from raw FSD input."""

from typing import Literal

from pydantic import BaseModel

from core.domain.project import CompletenessScore


class Requirement(BaseModel):
    """One numbered thing the deliverable must do."""

    id: str
    description: str


class GateCriterion(BaseModel):
    """A condition the spec itself (not the built deliverable) is scored against for G1."""

    id: str
    description: str


class MachineReadableRule(BaseModel):
    """A gate criterion restated so it can be checked automatically downstream."""

    id: str
    criterion_id: str
    rule: str


class RuleCorrelation(BaseModel):
    """How two or more machine-readable rules depend on or constrain each other."""

    id: str
    rule_ids: list[str]
    description: str


EvidenceSource = Literal["source_document", "stakeholder_answer", "reference_material"]


class EvidenceLink(BaseModel):
    """The citation backing a requirement - the reason a reviewer can trust it.

    `source` is what kind of thing was cited, because at G1 sign-off they are not
    interchangeable: a line in the submitted document can be re-read, an answer given in
    the console is only as good as who gave it, and reference material is a *different*
    project's document and never specifies this one.
    """

    requirement_id: str
    evidence: str
    # Defaulted, not required: specs written before this field existed carry evidence that
    # was, by definition, read out of the source document.
    source: EvidenceSource = "source_document"


class AcceptanceCriterion(BaseModel):
    """A testable condition one requirement must satisfy - Blueprint's definition of done."""

    id: str
    requirement_id: str
    description: str


class BusinessValue(BaseModel):
    """The use case and expected ROI one step up from a requirement - why it exists."""

    requirement_id: str
    use_case: str
    roi: str


class RequirementIntent(BaseModel):
    """What kind of change a requirement is, for Blueprint's unit-of-work sizing."""

    requirement_id: str
    intent: Literal[
        "functional", "non_functional", "integration", "reporting", "compliance", "data_migration"
    ]


class StructuredSpec(BaseModel):
    """G1 output contract: a normalized FSD scored against gate criteria."""

    title: str
    requirements: list[Requirement]
    gate_criteria: list[GateCriterion]
    rules: list[MachineReadableRule]
    rule_correlations: list[RuleCorrelation]
    evidence: list[EvidenceLink]
    acceptance_criteria: list[AcceptanceCriterion]
    business_value: list[BusinessValue]
    intents: list[RequirementIntent]
    completeness: CompletenessScore
