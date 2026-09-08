"""G1 artifact: the normalized, cited spec Distill produces from raw FSD input."""

from typing import Literal, Self

from pydantic import BaseModel, Field, model_validator

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
    objective: str | None = None
    scope: str | None = None
    actors: list[str] | None = None
    requirements: list[Requirement]
    business_rules: list[str] | None = None
    data_requirements: list[str] | None = None
    data_connectors: list[str] | None = None
    snowflake_connectors: list[str] | None = None
    workflows: list[str] | None = None
    non_functional_requirements: list[str] | None = None
    constraints: list[str] | None = None
    open_questions: list[str] | None = None
    missing_required_sections: list[str] = Field(default_factory=list)
    gate_criteria: list[GateCriterion]
    rules: list[MachineReadableRule]
    rule_correlations: list[RuleCorrelation]
    evidence: list[EvidenceLink]
    acceptance_criteria: list[AcceptanceCriterion] = Field(default_factory=list)
    business_value: list[BusinessValue] = Field(default_factory=list)
    intents: list[RequirementIntent] = Field(default_factory=list)
    # Defaulted, not required: score and gaps are always recomputed server-side from the
    # stored artifact (see core.validation.spec.evaluate_spec), so a model that omits this
    # on a trivial turn shouldn't have to pay for a whole extra Bedrock round trip over a
    # field whose only agent-owned part (questions) is meaningless to ask about anyway.
    completeness: CompletenessScore = Field(default_factory=lambda: CompletenessScore(score=0.0))

    @model_validator(mode="after")
    def record_missing_required_sections(self) -> Self:
        """Surface omitted mandatory sections without rejecting an elicitation draft."""
        section_values = {
            "objective": self.objective,
            "scope": self.scope,
            "actors": self.actors,
            "functional_requirements": self.requirements or None,
            "business_rules": self.business_rules,
            "data_requirements": self.data_requirements,
            "data_connectors": self.data_connectors,
            "snowflake_connectors": self.snowflake_connectors,
            "workflows": self.workflows,
            "non_functional_requirements": self.non_functional_requirements,
            "open_questions": self.open_questions,
        }
        self.missing_required_sections = [
            name for name, value in section_values.items() if value is None
        ]
        return self
