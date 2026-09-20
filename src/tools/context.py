"""Every station's on-demand access to the system's standing context.

`_build_prompt` (api.routers.projects) inlines only a short preview of the global
context - a note can run to a full page of repo/database/design-system detail, and
inlining all of it on every retry of every station would burn a slice of every agent's
context budget on text most turns never need. This is how an agent gets the rest, the
same on-demand shape as `s3_get_document_text` for an uploaded document.
"""

from strands import tool

from config.settings import get_settings
from infrastructure.repositories.context_repository import ContextRepository


@tool
def get_context() -> str:
    """Fetch the full standing context a human recorded for the system.

    Call this when the preview you were given in the prompt says context is set and the
    work at hand could depend on it - an existing repository, a database, a design
    system, a coding convention. The preview is a title, not the whole note; do not
    assume it is complete. Returns an empty string if no context has been recorded.
    """
    settings = get_settings()
    repo = ContextRepository(settings.projects_table, settings.aws_region)
    return repo.get_context().context
