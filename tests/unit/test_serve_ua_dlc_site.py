# URL-encoded braces (%7B) glue onto the next word: cspell:ignore Blogos Bnot
import importlib.util
from collections.abc import Callable
from pathlib import Path

import pytest

_SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "serve_ua_dlc_site.py"
_spec = importlib.util.spec_from_file_location("serve_ua_dlc_site", _SCRIPT)
assert _spec is not None
assert _spec.loader is not None
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

is_unresolved_placeholder: Callable[[str], bool] = _module.is_unresolved_placeholder
is_quiet: Callable[[str], bool] = _module.is_quiet


@pytest.mark.parametrize(
    "path",
    [
        "/concepts/project/%7B%7Blogos.microsoftteams%7D%7D",
        "/concepts/project/%7B%7Bc.logo%7D%7D",
        "/concepts/project/{{det.srcLogo}}",
        "/concepts/project/%7B%7Bg.img%7D%7D?v=2",
    ],
)
def test_a_board_template_binding_is_an_unresolved_placeholder(path: str) -> None:
    assert is_unresolved_placeholder(path)
    assert is_quiet(path)


@pytest.mark.parametrize(
    "path",
    [
        "/concepts/project/logos/microsoftteams.svg",
        "/concepts/project/logos/missing.svg",
        "/concepts/project/canvas.json",
        "/plan/index.html",
        "/concepts/project/%7Bnot-a-binding%7D",
    ],
)
def test_a_real_path_is_served_and_logged_normally(path: str) -> None:
    assert not is_unresolved_placeholder(path)
    assert not is_quiet(path)


def test_the_favicon_is_quiet_but_not_a_placeholder() -> None:
    assert is_quiet("/favicon.ico")
    assert not is_unresolved_placeholder("/favicon.ico")
