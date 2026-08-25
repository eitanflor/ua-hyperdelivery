from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider


def configure_tracing() -> None:
    """Registers a real TracerProvider so AgentCore Runtime's automatic
    BaggageSpanProcessor registration doesn't silently no-op against the
    default ProxyTracerProvider (which has no add_span_processor)."""
    if isinstance(trace.get_tracer_provider(), TracerProvider):
        return  # already configured, e.g. by the managed Runtime environment
    trace.set_tracer_provider(TracerProvider())
