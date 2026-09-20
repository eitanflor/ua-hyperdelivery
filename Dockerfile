FROM --platform=linux/arm64 ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

# Optional corporate TLS-inspection CAs (e.g. Zscaler). certs/*.crt is gitignored, so this
# is empty on networks that don't intercept TLS; update-ca-certificates ignores non-cert files.
COPY certs/ /usr/local/share/ca-certificates/
RUN update-ca-certificates
# SSL_CERT_FILE works on every uv version, unlike UV_NATIVE_TLS (deprecated) /
# UV_SYSTEM_CERTS (needs uv >= 0.11; base image ships 0.9.x).
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

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
