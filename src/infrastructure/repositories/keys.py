"""Single-table key layout for the projects table.

Owned jointly with infra/stacks/orchestration_stack.py, which provisions the table and
the GSI - change both together. Centralized here because the orchestration Lambda tasks
write the same items the repository reads.
"""

PENDING_BY_STATION_INDEX = "gsi1-pending-by-station"

STATE_SK = "STATE"


def project_pk(project_id: str) -> str:
    """Partition key for every item belonging to one project."""
    return f"PROJECT#{project_id}"


def decision_sk(decided_at_iso: str) -> str:
    """Sort key for an append-only decision audit record."""
    return f"DECISION#{decided_at_iso}"


def pending_gsi1pk(station: str) -> str:
    """GSI partition key listing the projects awaiting a decision at `station`."""
    return f"STATION#{station}#PENDING"
