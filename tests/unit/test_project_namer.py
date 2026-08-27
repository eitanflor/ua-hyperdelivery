from typing import Never

import pytest
from strands.models import BedrockModel

from orchestration import project_namer as namer_module
from orchestration.project_namer import ProjectNamer, _fallback_name


class _FakeAgentResult:
    def __init__(self, text: str) -> None:
        self._text = text

    def __str__(self) -> str:
        return self._text


class _FakeAgent:
    def __init__(
        self, model: BedrockModel, system_prompt: str, callback_handler: object = None
    ) -> None:
        pass

    def __call__(self, message: str) -> _FakeAgentResult:
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
    assert _fallback_name(message) == "one two three four five six"


def test_fallback_name_defaults_when_the_message_is_blank() -> None:
    assert _fallback_name("   ") == "Untitled Project"
