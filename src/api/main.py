from fastapi import FastAPI

from api.routers import projects
from config.settings import get_settings
from infrastructure.messaging.step_functions import StateMachineClient
from infrastructure.observability.logging import configure_logging
from infrastructure.repositories.project_repository import ProjectRepository


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="Hyperdelivery Console API", version="0.1.0")
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
    app.include_router(projects.router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=get_settings().port)
