"""Single-table key layout for the projects table.

Owned jointly with infra/stacks/storage_stack.py, which provisions the table and its
GSIs - change both together. Centralized here because the orchestration Lambda tasks
write the same items the repository reads.
"""

PENDING_BY_STATION_INDEX = "gsi1-pending-by-station"
ALL_PROJECTS_INDEX = "gsi2-all-projects-by-updated"
ALL_PROJECTS_GSI2PK = "PROJECT"  # constant partition value - every STATE item carries it

STATE_SK = "STATE"
ARTIFACT_PREFIX = "ARTIFACT#"  # latest-only items; distinct from ARTIFACT_VERSION# below

GLOBAL_PK = "GLOBAL"  # partition for system-wide, not-per-project items
CONTEXT_SK = "CONTEXT"


def project_pk(project_id: str) -> str:
    """Partition key for every item belonging to one project."""
    return f"PROJECT#{project_id}"


def decision_sk(decided_at_iso: str) -> str:
    """Sort key for an append-only decision audit record."""
    return f"DECISION#{decided_at_iso}"


def pending_gsi1pk(station: str) -> str:
    """GSI partition key listing the projects awaiting a decision at `station`."""
    return f"STATION#{station}#PENDING"


def artifact_sk(agent: str) -> str:
    """Sort key for an agent's latest artifact - overwritten on every rerun."""
    return f"{ARTIFACT_PREFIX}{agent}"


def artifact_version_sk(agent: str, version: int) -> str:
    """Sort key for one immutable historical version of an agent's artifact.

    Deliberately a different top-level prefix (`ARTIFACT_VERSION#`, not `ARTIFACT#`) so
    `begins_with(sk, "ARTIFACT#")` (used to list latest artifacts) never matches history
    items - no attribute-based filtering needed to tell the two apart.
    """
    return f"{artifact_version_prefix(agent)}{version:04d}"


def artifact_version_prefix(agent: str) -> str:
    """`begins_with` prefix matching every historical version of one agent's artifact."""
    return f"ARTIFACT_VERSION#{agent}#v"
