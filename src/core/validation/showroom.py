"""G4 gate: scores a persisted DemoPackage against the spec it demonstrates."""

from collections import Counter

from core.domain.project import CompletenessScore
from core.domain.showroom import DemoPackage
from core.domain.spec import StructuredSpec

_NO_SPEC_GAP = (
    "no approved spec was available to check this demo against - ask for the spec that "
    "cleared Review before assembling a demo"
)
_EMPTY_SPEC_GAP = "the approved spec has no requirements to narrate a demo against"
_NO_DEMO_DATA_GAP = (
    "the demo has no seed data, so it would show an empty shell - add realistic "
    "`demo_data` entries for the entities the talk track walks through"
)


def evaluate_showroom(spec: StructuredSpec | None, package: DemoPackage) -> CompletenessScore:
    """Score a DemoPackage on the fraction of requirements its talk track narrates.

    Review's own verdict is deliberately not re-litigated here: a blocker Review raised
    is not something Showroom can close by redrafting, and a gap it cannot close would
    hold the project at this station forever. The G3 sign-off is where that call is made.
    """
    if spec is None:
        return CompletenessScore(score=0.0, gaps=[_NO_SPEC_GAP])

    known_requirements = {r.id for r in spec.requirements}
    section_counts = Counter(s.requirement_id for s in package.talk_track)

    gaps = [
        f"talk track narrates unknown requirement {rid}"
        for rid in sorted(section_counts.keys() - known_requirements)
    ]
    narrated = section_counts.keys() & known_requirements
    gaps += [
        f"requirement {rid} has no talk track narration"
        for rid in sorted(known_requirements - narrated)
    ]
    if known_requirements and not package.demo_data:
        gaps.append(_NO_DEMO_DATA_GAP)

    if not known_requirements:
        return CompletenessScore(score=0.0, gaps=[_EMPTY_SPEC_GAP])
    return CompletenessScore(score=round(len(narrated) / len(known_requirements), 2), gaps=gaps)
