"""OpenTelemetry setup for agents running under AgentCore Runtime."""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider


def configure_tracing() -> None:
    """Register a real TracerProvider, idempotently.

    AgentCore Runtime registers a BaggageSpanProcessor automatically, which silently
    no-ops against the default ProxyTracerProvider (it has no `add_span_processor`).
    """
    if isinstance(trace.get_tracer_provider(), TracerProvider):
        return  # already configured, e.g. by the managed Runtime environment
    trace.set_tracer_provider(TracerProvider())
