.PHONY: dev-distill dev-blueprint dev-all test lint

dev-distill:
	cd src && uv run python -m agent_runtime.distill.main

dev-blueprint:
	cd src && HYPERDELIVERY_PORT=8081 uv run python -m agent_runtime.blueprint.main

dev-all:
	./scripts/dev_all.sh

test:
	uv run pytest

lint:
	uv run ruff check .
