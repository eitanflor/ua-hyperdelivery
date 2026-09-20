"""Shared prompt construction helpers for local and deployed agent invocations."""

_INLINE_CONTEXT_CHARS = 500


def context_section(context: str) -> str | None:
    """Return a bounded standing-context prompt section when context is configured."""
    text = context.strip()
    if not text:
        return None
    if len(text) <= _INLINE_CONTEXT_CHARS:
        return f"# standing context\n{text}"
    preview = text[:_INLINE_CONTEXT_CHARS].rsplit(" ", 1)[0] or text[:_INLINE_CONTEXT_CHARS]
    return (
        f"# standing context (preview - {len(text)} characters total)\n{preview}...\n\n"
        "Call `get_context` for the full note before relying on it."
    )


def prepend_context(prompt: str, context: str) -> str:
    """Prepend standing context to a prompt when context is configured."""
    section = context_section(context)
    return f"{section}\n\n{prompt}" if section is not None else prompt
