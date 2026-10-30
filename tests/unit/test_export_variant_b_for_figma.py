import importlib.util
from collections.abc import Callable
from pathlib import Path

import pytest

_SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "export_variant_b_for_figma.py"
_spec = importlib.util.spec_from_file_location("export_variant_b_for_figma", _SCRIPT)
assert _spec is not None
assert _spec.loader is not None
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

inline_document: Callable[[str, Path], str] = _module.inline_document
SCREENS: tuple[str, ...] = _module.SCREENS
VARIANT_DIR: Path = _module.VARIANT_DIR

_PAGE = """<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo&amp;display=swap">
<link rel="stylesheet" href="screen.css">
</head><body><div class="app">
<img src="logos/teams.svg"><img src="data:image/png;base64,AA==">
</div>
<script src="figma-prep.js"></script>
</body></html>"""


@pytest.fixture
def page_dir(tmp_path: Path) -> Path:
    (tmp_path / "screen.css").write_text(".app { width: 1440px; }")
    (tmp_path / "logos").mkdir()
    (tmp_path / "logos" / "teams.svg").write_text("<svg/>")
    return tmp_path


def test_the_stylesheet_is_inlined_and_remote_links_are_dropped(page_dir: Path) -> None:
    html = inline_document(_PAGE, page_dir)

    assert "<style>\n.app { width: 1440px; }\n</style>" in html
    assert "https://" not in html
    assert "<link" not in html


def test_local_images_become_data_uris_and_existing_ones_are_kept(page_dir: Path) -> None:
    html = inline_document(_PAGE, page_dir)

    assert 'src="data:image/svg+xml;base64,PHN2Zy8+"' in html
    assert 'src="data:image/png;base64,AA=="' in html


def test_the_prep_script_is_removed_so_the_importer_never_sees_a_local_src(page_dir: Path) -> None:
    assert "figma-prep.js" not in inline_document(_PAGE, page_dir)


def test_a_missing_image_fails_instead_of_importing_as_a_blank_box(page_dir: Path) -> None:
    with pytest.raises(FileNotFoundError, match=r"missing\.svg"):
        inline_document('<img src="logos/missing.svg">', page_dir)


@pytest.mark.parametrize("screen", SCREENS)
def test_every_exported_screen_exists_and_loads_the_prep(screen: str) -> None:
    html = (VARIANT_DIR / screen).read_text()

    assert '<script src="figma-prep.js"></script>' in html
