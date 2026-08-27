"""G1 artifact: the normalized, cited spec Distill produces from raw FSD input."""

from pydantic import BaseModel


class Requirement(BaseModel):
    """One numbered thing the deliverable must do."""

    id: str
    description: str


class GateCriterion(BaseModel):
    """An acceptance condition the spec is scored against before it can pass G1."""

    id: str
    description: str


class MachineReadableRule(BaseModel):
    """A gate criterion restated so it can be checked automatically downstream."""

    criterion_id: str
    rule: str


class EvidenceLink(BaseModel):
    """The citation backing a requirement - the reason a reviewer can trust it."""

    requirement_id: str
    evidence: str


class CompletenessScore(BaseModel):
    """How much of the spec is evidenced and rule-covered, plus what is still missing."""

    score: float
    gaps: list[str] = []


class StructuredSpec(BaseModel):
    """G1 output contract: a normalized FSD scored against gate criteria."""

    title: str
    requirements: list[Requirement]
    gate_criteria: list[GateCriterion]
    rules: list[MachineReadableRule]
    evidence: list[EvidenceLink]
    completeness: CompletenessScore
