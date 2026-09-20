from core.prompting import context_section, prepend_context


def test_prepend_context_leaves_prompt_unchanged_when_context_is_empty() -> None:
    assert prepend_context("Build it", "  ") == "Build it"


def test_context_section_keeps_a_useful_preview_without_word_boundaries() -> None:
    context = "x" * 600

    section = context_section(context)

    assert section is not None
    assert "x" * 500 in section
    assert "600 characters total" in section
    assert prepend_context("Build it", context).endswith("\n\nBuild it")
