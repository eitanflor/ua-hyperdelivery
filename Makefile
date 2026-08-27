.PHONY: dev-distill dev-blueprint dev-review dev-showroom dev-all dev-console test lint check-aws ui deploy

ifneq (,$(wildcard .env))
include .env
export
endif

check-aws:
	./scripts/ensure_aws_login.sh

dev-distill: check-aws
	cd src && uv run python -m agent_runtime.distill.main

dev-blueprint: check-aws
	cd src && PORT=8081 uv run python -m agent_runtime.blueprint.main

dev-review: check-aws
	cd src && PORT=8082 uv run python -m agent_runtime.review.main

dev-showroom: check-aws
	cd src && PORT=8083 uv run python -m agent_runtime.showroom.main

dev-all: check-aws
	./scripts/dev_all.sh

dev-console: check-aws
	cd src && uv run uvicorn api.main:app --reload --port $${PORT:-8090}

ui:
	uv run streamlit run ui/streamlit_app.py

deploy: check-aws
	./scripts/deploy_agent.sh $(AGENT)

test:
	uv run pytest

lint:
	uv run ruff check .
