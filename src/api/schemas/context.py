"""Wire-format DTOs for the global context endpoint."""

from pydantic import BaseModel


class ContextResponse(BaseModel):
    """The system's standing context, as returned to the console."""

    context: str = ""
    updated_by: str | None = None
    updated_at: str | None = None


class SetContextRequest(BaseModel):
    """Body for `PATCH /context`.

    Free text, deliberately unstructured - an existing repo, a database, a design
    system, a coding convention are all prose-shaped, and this applies system-wide, the
    same way a system prompt would.
    """

    context: str
