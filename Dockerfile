FROM --platform=linux/arm64 ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY src ./src

ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app/src

# AgentCore Runtime deploys one container per agent - pick which at build time,
# e.g. `docker build --build-arg AGENT=blueprint .`
ARG AGENT=distill
ENV AGENT=${AGENT}

EXPOSE 8080
CMD ["sh", "-c", "python -m agent_runtime.${AGENT}.main"]
