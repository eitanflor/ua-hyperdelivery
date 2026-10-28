"""Print the HyperDelivery roadmap as the mermaid gantt block used in enterprise-plan.md.

The rows below are the canonical schedule: the three phases (Current State, Final MVP and
Enterprise), the work in each, the milestones and the long-lead requests. Edit them here and
paste the output into ``docs/ua-dlc/enterprise-plan.md`` under the roadmap marker, rather
than retyping dates in the markdown.

Weeks count from the day the borrowed engineers start. Mermaid needs real dates, so week 1 is
pinned to 2027-01-04 (ISO week 1 of 2027) and the axis label ``W%-V`` then reads W1, W2, ...

Usage:
    uv run python scripts/ua_dlc_gantt.py
"""

from __future__ import annotations

import datetime as dt
import sys

WEEK_ONE = dt.date(2027, 1, 4)
_FRIDAY = 4  # days after Monday; milestones land at the end of their week

Row = tuple[str, int, int]
"""A gantt task: its label, first week and last week (inclusive)."""

SECTIONS: tuple[tuple[str, tuple[Row, ...]], ...] = (
    (
        "Phases",
        (
            ("Current State, baseline and requests", 1, 2),
            ("Final MVP build", 1, 14),
            ("Final MVP pilot with users", 15, 22),
            ("Enterprise hardening", 23, 36),
            ("Enterprise rollout and scale", 37, 52),
        ),
    ),
    (
        "Final MVP, the line and agents",
        (
            ("Do-no-harm floor", 1, 2),
            ("Fix today's workflow breaks", 1, 4),
            ("Orchestrator owns the main chat", 1, 4),
            ("Delegation broker and contracts", 2, 5),
            ("Cortex Code data specialist", 2, 6),
            ("Coding harness in the sandbox (AgentCore)", 2, 6),
            ("Resource reader and project index", 3, 7),
            ("Mockup with the Brief (UA app kit)", 4, 8),
            ("Previews in the sandbox", 5, 8),
            ("Reviewers and evidence agent", 7, 12),
            ("Handoff package and AI-DLC context files", 10, 14),
        ),
    ),
    (
        "Final MVP, the experience",
        (
            ("Concept test", 2, 3),
            ("Console look, logos, tool chips", 2, 6),
            ("Start from scratch, Jira or resources", 3, 6),
            ("Modern data tables", 4, 7),
            ("Trace and decision timeline", 5, 8),
            ("Project architecture tab", 8, 11),
            ("Teams cards and Inbox", 9, 14),
            ("Confirm what we heard, Confluence page", 9, 14),
            ("Friendly users and feedback in product", 8, 14),
        ),
    ),
    (
        "Final MVP, pilot",
        (
            ("Pilot onboarding, 8 to 12 users", 15, 16),
            ("Four two-week pilot rounds", 15, 22),
            ("Use-case coverage and readout", 21, 22),
        ),
    ),
    (
        "Enterprise",
        (
            ("Identity, roles, on-behalf-of, External OAuth", 23, 30),
            ("GitHub App replaces individual tokens", 23, 27),
            ("Logging, audit, SIEM", 23, 31),
            ("Cost and budget enforcement", 24, 31),
            ("Evals in CI, build conformance gate", 24, 32),
            ("Policy and approval rules", 26, 34),
            ("HyperDelivery production environment, SLO, on-call", 27, 35),
            ("InfoSec and AI governance sign-off", 31, 36),
            ("Second engine behind the Builder port", 27, 32),
            ("Streamlit prototypes in a Snowflake sandbox", 29, 34),
            ("Library and Construction intake", 29, 36),
            ("Rovo and Work IQ read specialists", 33, 38),
            ("More departments", 37, 52),
        ),
    ),
    (
        "Long-lead track",
        (
            ("Prototype GitHub org", 1, 3),
            ("Snowflake service user, read-only role", 1, 2),
            ("Dev data for prototypes", 1, 5),
            ("Interim privacy scope for transcripts", 1, 3),
            ("Entra app and Graph consents", 1, 6),
            ("Sandbox AWS account", 1, 8),
            ("Teams app", 1, 10),
            ("Brand review", 2, 10),
            ("Handoff format agreed with engineering", 2, 12),
            ("InfoSec heads-up, threat model draft", 1, 12),
            ("Snowflake reference design", 4, 12),
            ("Privacy and Legal, meeting capture", 8, 20),
            ("FSD owner, access and labels (north star)", 1, 12),
            ("Pilot consents and Teams setup (north star)", 1, 10),
            ("Notice, HR, DPDP, retention (north star)", 2, 15),
            ("Handoff outcome agreement", 2, 15),
        ),
    ),
)

MILESTONES: tuple[tuple[str, int], ...] = (
    ("Baseline measured", 2),
    ("Friendly users", 8),
    ("MVP ready", 14),
    ("Pilot readout", 22),
    ("Enterprise ready", 36),
    ("Scale decision", 52),
)

# Mermaid task tags: phase bars read as active, long-lead requests as done (owned outside the team).
_SECTION_TAGS = {"Phases": "active, ", "Long-lead track": "done, "}


def week_start(week: int) -> str:
    """Return the ISO date of the Monday that starts ``week``."""
    return (WEEK_ONE + dt.timedelta(weeks=week - 1)).isoformat()


def week_friday(week: int) -> str:
    """Return the ISO date of the Friday that ends ``week``."""
    return (WEEK_ONE + dt.timedelta(weeks=week - 1, days=_FRIDAY)).isoformat()


def gantt_lines() -> list[str]:
    """Build the fenced mermaid gantt block, one list item per line."""
    lines = [
        "```mermaid",
        "gantt",
        "  title HyperDelivery roadmap in weeks",
        (
            "  %% 2027-01-04 stands in for W1 so the axis reads W1 to W52;"
            " shift to the real start date."
        ),
        "  dateFormat YYYY-MM-DD",
        "  axisFormat W%-V",
        "  tickInterval 4week",
        "  section Milestones",
    ]
    lines.extend(
        f"  {name} :milestone, g{index}, {week_friday(week)}, 0d"
        for index, (name, week) in enumerate(MILESTONES)
    )
    task = 0
    for section, rows in SECTIONS:
        lines.append(f"  section {section}")
        tag = _SECTION_TAGS.get(section, "")
        for name, first, last in rows:
            lines.append(f"  {name} :{tag}t{task}, {week_start(first)}, {(last - first + 1) * 7}d")
            task += 1
    lines.append("```")
    return lines


def main() -> None:
    """Write the gantt block to standard output."""
    sys.stdout.write("\n".join(gantt_lines()) + "\n")


if __name__ == "__main__":
    main()
