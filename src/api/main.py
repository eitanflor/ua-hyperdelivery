"""Console API composition root: wires repositories and the state machine onto FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import context, projects
from config.settings import get_settings
from core.constants import Environment
from infrastructure.messaging.step_functions import StateMachineClient
from infrastructure.observability.logging import configure_logging
from infrastructure.repositories.connections_repository import ConnectionsRepository
from infrastructure.repositories.context_repository import ContextRepository
from infrastructure.repositories.project_repository import ProjectRepository
from orchestration.local_agent_client import LocalAgentClient
from orchestration.project_namer import ProjectNamer


def create_app() -> FastAPI:
    """Build the console API with its dependencies attached to `app.state`."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="Hyperdelivery Console API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.project_repository = ProjectRepository(
        table_name=settings.projects_table, region=settings.aws_region
    )
    # Same table, different partition namespace (see docs/decisions.md) - one system-wide
    # standing context, not one per project.
    app.state.context_repository = ContextRepository(
        table_name=settings.projects_table, region=settings.aws_region
    )
    app.state.connections_repository = (
        ConnectionsRepository(table_name=settings.connections_table, region=settings.aws_region)
        if settings.connections_table
        else None
    )
    # ENVIRONMENT is authoritative, not STATE_MACHINE_ARN's mere presence: LOCAL always
    # uses LocalAgentClient below, even if an ARN happens to be set; DEV/PROD always
    # require a real ARN, and fail fast at startup rather than silently falling back to
    # the local-only path if one is missing (see docs/decisions.md).
    if settings.environment is Environment.LOCAL:
        app.state.state_machine_client = None
    else:
        if not settings.state_machine_arn:
            msg = f"STATE_MACHINE_ARN is required when ENVIRONMENT={settings.environment!r}"
            raise RuntimeError(msg)
        app.state.state_machine_client = StateMachineClient(
            state_machine_arn=settings.state_machine_arn, region=settings.aws_region
        )
    # Local-dev-only stand-in for Step Functions/AgentCore Runtime - see
    # orchestration.local_agent_client and routers/projects.py:advance_project. Cheap to
    # construct (no I/O), so it's always built even though only the LOCAL path uses it.
    app.state.local_agent_client = LocalAgentClient()
    app.state.project_namer = ProjectNamer(region_name=settings.aws_region)
    app.include_router(projects.router)
    app.include_router(context.router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    # Binds all interfaces because this runs inside a container behind API Gateway.
    uvicorn.run(app, host="0.0.0.0", port=get_settings().port)  # noqa: S104
