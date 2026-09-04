"""Deterministic checks that run against persisted artifacts, not the model's claims.

The `@tool` validators under `tools/` let an agent check its own draft mid-flight, but
their arguments are authored by the same model they are checking - a cooperative model
can always hand them a passing set of ids and then emit something else. These functions
take the real artifacts instead, so the completeness a gate acts on is computed, never
self-reported.
"""

from core.validation.artifacts import evaluate_artifact

__all__ = ["evaluate_artifact"]
