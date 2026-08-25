.PHONY: dev-distill dev-blueprint dev-review dev-showroom dev-all test lint check-aws ui

check-aws:
	./scripts/ensure_aws_login.sh

dev-distill: check-aws
	cd src && uv run python -m agent_runtime.distill.main

dev-blueprint: check-aws
	cd src && HYPERDELIVERY_PORT=8081 uv run python -m agent_runtime.blueprint.main

dev-review: check-aws
	cd src && HYPERDELIVERY_PORT=8082 uv run python -m agent_runtime.review.main

dev-showroom: check-aws
	cd src && HYPERDELIVERY_PORT=8083 uv run python -m agent_runtime.showroom.main

dev-all: check-aws
	./scripts/dev_all.sh

ui:
	uv run streamlit run ui/streamlit_app.py

test:
	uv run pytest

lint:
	uv run ruff check .
