"""The one standing note every agent reads, independent of any project."""

from datetime import datetime

from pydantic import BaseModel


class GlobalContext(BaseModel):
    """System-wide standing context - repo, database, design system, conventions.

    Persisted as a single 'GLOBAL'/'CONTEXT' item (see infrastructure.repositories.keys):
    there is exactly one of these across the whole system, not one per project - closer
    to a system prompt than to project state.
    """

    context: str = ""
    updated_by: str | None = None
    updated_at: datetime | None = None
