"""G2 artifact: the implementation plan Blueprint derives from an approved spec."""

from typing import Literal

from pydantic import BaseModel, Field

from core.domain.project import CompletenessScore

HttpMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
FileChange = Literal["add", "modify", "delete"]


class ApiContract(BaseModel):
    """One endpoint the build must expose, in enough detail to emit OpenAPI from.

    Deliberately not a raw OpenAPI document: an endpoint list is checkable with plain
    Pydantic and still generates a spec, where embedding one would need a parser
    dependency to be worth more than free text.
    """

    id: str
    method: HttpMethod
    path: str
    summary: str
    requirement_ids: list[str] = []
    request_schema: str | None = None
    response_schema: str | None = None


class FileTouchpoint(BaseModel):
    """A file one unit of work is expected to touch, and why."""

    path: str
    change: FileChange
    purpose: str


class Component(BaseModel):
    """One named part of the system, with the single thing it is responsible for."""

    id: str
    name: str
    responsibility: str


class EntityField(BaseModel):
    """One attribute of a data entity, typed well enough to generate a model from."""

    name: str
    type: str
    description: str


class DataEntity(BaseModel):
    """One thing the system stores, owned by exactly one component."""

    id: str
    name: str
    description: str
    component_id: str
    fields: list[EntityField] = []


class IntegrationPoint(BaseModel):
    """One system this build talks to, and which requirements need that conversation."""

    id: str
    system: str
    direction: Literal["inbound", "outbound", "bidirectional"]
    description: str
    requirement_ids: list[str] = []


class UnitOfWork(BaseModel):
    """One task sized for a single coding-agent run, with its upstream dependencies.

    Carries everything an external coding agent needs to act on it standalone - the
    traceability edges back to the approved spec (`requirement_ids`,
    `acceptance_criterion_ids`), the components it builds, the contracts it implements,
    and the files it touches. Without those stored on the artifact, G2 coverage is only
    whatever the model asserted when it called its own scoring tool - see core.validation.
    """

    id: str
    title: str
    description: str
    depends_on: list[str] = []
    requirement_ids: list[str] = []
    acceptance_criterion_ids: list[str] = []
    component_ids: list[str] = []
    contract_ids: list[str] = []
    files: list[FileTouchpoint] = []


class Blueprint(BaseModel):
    """G2 output contract: an approved spec turned into an implementation plan."""

    title: str
    architecture_summary: str
    # The design proper - a narrative summary alone is not something a build can be
    # derived from, and is not something a gate can check.
    components: list[Component] = []
    data_entities: list[DataEntity] = []
    integration_points: list[IntegrationPoint] = []
    units_of_work: list[UnitOfWork]
    # Empty for a project with no HTTP surface (a pipeline, a batch job) - absence is
    # not a gap, only a contract nothing implements is.
    api_contracts: list[ApiContract] = []
    # Defaulted, not required: score and gaps are always recomputed server-side from the
    # stored artifact (see core.validation.blueprint.evaluate_blueprint).
    completeness: CompletenessScore = Field(default_factory=lambda: CompletenessScore(score=0.0))
