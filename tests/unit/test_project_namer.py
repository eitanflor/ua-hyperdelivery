import time
from concurrent.futures import ThreadPoolExecutor
from typing import Never

import pytest
from strands.models import BedrockModel

from orchestration import project_namer as namer_module
from orchestration.project_namer import ProjectNamer, heuristic_name


class _FakeAgentResult:
    def __init__(self, text: str) -> None:
        self._text = text

    def __str__(self) -> str:
        return self._text


class _FakeAgent:
    def __init__(
        self, model: BedrockModel, system_prompt: str, callback_handler: object = None
    ) -> None:
        # A real Strands Agent accumulates history here across calls on the same instance.
        self.messages: list[str] = []
        self.seen: list[list[str]] = []

    def __call__(self, message: str) -> _FakeAgentResult:
        self.seen.append(list(self.messages))
        self.messages.append(message)
        return _FakeAgentResult('"Feedback Portal"')


def test_generate_returns_the_models_reply_stripped_of_quotes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(namer_module, "Agent", _FakeAgent)
    namer = ProjectNamer(region_name="us-east-1")

    assert namer.generate("We want a feedback portal.") == "Feedback Portal"


def test_generate_falls_back_to_a_heuristic_when_the_model_call_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _raise(*args: object, **kwargs: object) -> Never:
        raise RuntimeError("boom")

    monkeypatch.setattr(namer_module, "Agent", _raise)
    namer = ProjectNamer(region_name="us-east-1")

    assert namer.generate("We want a feedback portal for users") == "We want a feedback portal for"


def test_fallback_name_uses_the_first_six_words() -> None:
    message = "one two three four five six seven eight"
    assert heuristic_name(message) == "one two three four five six"


def test_fallback_name_defaults_when_the_message_is_blank() -> None:
    assert heuristic_name("   ") == "Untitled Project"


def test_generate_reuses_the_agent_across_calls(monkeypatch: pytest.MonkeyPatch) -> None:
    built = 0

    class _CountingAgent(_FakeAgent):
        def __init__(
            self, model: BedrockModel, system_prompt: str, callback_handler: object = None
        ) -> None:
            nonlocal built
            built += 1
            super().__init__(model, system_prompt, callback_handler)

    monkeypatch.setattr(namer_module, "Agent", _CountingAgent)
    namer = ProjectNamer(region_name="us-east-1")

    namer.generate("first message")
    namer.generate("second message")

    assert built == 1


def test_generate_does_not_let_one_project_see_the_ones_named_before_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # The agent outlives every project the process names, so without a reset each naming
    # call carries every previous project's message into the next one's context.
    agents: list[_FakeAgent] = []

    class _RecordingAgent(_FakeAgent):
        def __init__(
            self, model: BedrockModel, system_prompt: str, callback_handler: object = None
        ) -> None:
            super().__init__(model, system_prompt, callback_handler)
            agents.append(self)

    monkeypatch.setattr(namer_module, "Agent", _RecordingAgent)
    namer = ProjectNamer(region_name="us-east-1")

    namer.generate("a feedback portal")
    namer.generate("a returns dashboard")

    assert agents[0].seen == [[], []]


def test_generate_serializes_concurrent_calls_onto_the_shared_agent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Strands raises ConcurrencyException on a second concurrent call to one instance,
    # which the heuristic fallback would hide as a silently worse project name.
    overlaps = 0
    active = 0

    class _OverlapDetectingAgent(_FakeAgent):
        def __call__(self, message: str) -> _FakeAgentResult:
            nonlocal overlaps, active
            active += 1
            if active > 1:
                overlaps += 1
            time.sleep(0.01)
            active -= 1
            return super().__call__(message)

    monkeypatch.setattr(namer_module, "Agent", _OverlapDetectingAgent)
    namer = ProjectNamer(region_name="us-east-1")

    with ThreadPoolExecutor(max_workers=4) as pool:
        names = list(pool.map(namer.generate, [f"project {i}" for i in range(4)]))

    assert overlaps == 0
    assert names == ["Feedback Portal"] * 4
