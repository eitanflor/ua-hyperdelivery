"""What a station may ask a human, and how much of it the gate will carry through.

`score` and `gaps` are computed from the artifact precisely so the agent cannot talk its
way past a gate. Questions are the opposite: only the agent knows what it could not work
out, so these are passed through rather than derived - bounded here so "ask the human"
cannot become a way to avoid doing the work.
"""

from core.domain.project import OpenQuestion

# A wall of questions is how every clarification UI dies - nobody answers twenty.
MAX_QUESTIONS = 4


def accepted_questions(questions: list[OpenQuestion]) -> tuple[list[OpenQuestion], list[str]]:
    """Take the questions worth asking, and report what was wrong with the rest.

    Drops duplicates by id and anything past `MAX_QUESTIONS`, keeping the agent's own
    ordering - it asked the most important one first.

    Returns:
        The questions to show the human, and one gap per problem found.
    """
    gaps: list[str] = []
    seen: set[str] = set()
    accepted: list[OpenQuestion] = []
    for question in questions:
        if question.id in seen:
            gaps.append(f"question id {question.id} is used more than once")
            continue
        seen.add(question.id)
        if not question.question.strip():
            gaps.append(f"question {question.id} has no text")
            continue
        if question.multi_select and not question.options:
            gaps.append(
                f"question {question.id} allows multiple answers but offers no options to pick"
            )
            continue
        accepted.append(question)

    if len(accepted) > MAX_QUESTIONS:
        gaps.append(
            f"{len(accepted)} questions were asked at once - ask the {MAX_QUESTIONS} that "
            "unblock the most and come back for the rest"
        )
        accepted = accepted[:MAX_QUESTIONS]
    return accepted, gaps


def unasked_gap(score: float, accepted: list[OpenQuestion]) -> list[str]:
    """Flag a station that produced nothing and asked for nothing.

    An empty artifact is a fine first turn - stakeholders open with a sentence, not a
    spec. Staying silent about what would unblock it is not.
    """
    if score == 0.0 and not accepted:
        return [
            (
                "nothing could be drafted and nothing was asked - put the questions that "
                "would unblock this to the person who requested it"
            )
        ]
    return []
