from pydantic import BaseModel


class Requirement(BaseModel):
    id: str
    description: str


class GateCriterion(BaseModel):
    id: str
    description: str


class MachineReadableRule(BaseModel):
    criterion_id: str
    rule: str


class EvidenceLink(BaseModel):
    requirement_id: str
    evidence: str


class CompletenessScore(BaseModel):
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
