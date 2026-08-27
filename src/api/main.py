"""Console API composition root: wires repositories and the state machine onto FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import projects
from config.settings import get_settings
from infrastructure.messaging.step_functions import StateMachineClient
from infrastructure.observability.logging import configure_logging
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
        table_name=settings.projects_table, region=settings.orchestration_region
    )
    # None until the state machine is deployed - routers must treat this as optional.
    app.state.state_machine_client = (
        StateMachineClient(
            state_machine_arn=settings.state_machine_arn, region=settings.orchestration_region
        )
        if settings.state_machine_arn
        else None
    )
    # Local-dev-only stand-in for Step Functions/AgentCore Runtime - see
    # orchestration.local_agent_client and routers/projects.py:advance_project.
    app.state.local_agent_client = LocalAgentClient()
    # Bedrock/AgentCore Runtime live in aws_region, not orchestration_region (DynamoDB).
    app.state.project_namer = ProjectNamer(region_name=settings.aws_region)
    app.include_router(projects.router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    # Binds all interfaces because this runs inside a container behind API Gateway.
    uvicorn.run(app, host="0.0.0.0", port=get_settings().port)  # noqa: S104
