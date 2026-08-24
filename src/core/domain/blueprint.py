from pydantic import BaseModel


class UnitOfWork(BaseModel):
    id: str
    title: str
    description: str
    depends_on: list[str] = []


class Blueprint(BaseModel):
    """G2 output contract: an approved spec turned into an implementation plan."""

    title: str
    architecture_summary: str
    units_of_work: list[UnitOfWork]
