"""The one global standing context endpoint - system-wide, not per-project."""

from fastapi import APIRouter, Depends, Request

from api.auth import CurrentUser, get_current_user
from api.schemas.context import ContextResponse, SetContextRequest
from core.domain.context import GlobalContext

router = APIRouter(prefix="/context", tags=["context"], dependencies=[Depends(get_current_user)])


def _to_response(context: GlobalContext) -> ContextResponse:
    return ContextResponse(
        context=context.context,
        updated_by=context.updated_by,
        updated_at=context.updated_at.isoformat() if context.updated_at else None,
    )


@router.get("", response_model=ContextResponse)
def get_context(request: Request) -> ContextResponse:
    """Return the system's standing context - repo, database, design system, conventions."""
    repo = request.app.state.context_repository
    return _to_response(repo.get_context())


@router.patch("", response_model=ContextResponse)
def set_context(
    payload: SetContextRequest,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
) -> ContextResponse:
    """Replace the system's standing context.

    Shared by every squad, project and station - not scoped to whoever is editing it.
    `updated_by` is stamped from the caller's validated sign-in, never a client-supplied
    name.
    """
    repo = request.app.state.context_repository
    updated_by = current_user.email or current_user.name or current_user.oid
    updated = repo.set_context(payload.context, updated_by)
    return _to_response(updated)
