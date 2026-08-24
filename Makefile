.PHONY: dev test lint

dev:
	cd src && uv run python -m agent_runtime.main

test:
	uv run pytest

lint:
	uv run ruff check .
