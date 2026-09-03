from pathlib import Path

import pytest
from docx import Document

from providers.documents.local import parse_local_document


def test_parse_local_document_reads_utf8_text(tmp_path: Path) -> None:
    file_path = tmp_path / "sample.txt"
    file_path.write_text("line one\nline two", encoding="utf-8")

    markdown = parse_local_document(str(file_path))

    assert markdown == "# Source: sample.txt\n\nline one\nline two\n"
    assert (tmp_path / "sample.normalized.md").read_text(encoding="utf-8") == markdown


def test_parse_local_document_preserves_docx_block_order(tmp_path: Path) -> None:
    file_path = tmp_path / "requirements.docx"
    document = Document()
    document.add_heading("Checkout", level=1)
    document.add_paragraph("Customers can pay by card.")
    table = document.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Method"
    table.cell(0, 1).text = "Required"
    table.cell(1, 0).text = "Card"
    table.cell(1, 1).text = "Yes"
    document.add_heading("Approval", level=2)
    document.save(str(file_path))

    markdown = parse_local_document(file_path)

    assert "# Checkout" in markdown
    assert "| Method | Required |\n| --- | --- |\n| Card | Yes |" in markdown
    assert "## Approval" in markdown
    assert markdown.index("# Checkout") < markdown.index("| Method") < markdown.index("## Approval")
    assert (tmp_path / "requirements.normalized.md").read_text(encoding="utf-8") == markdown


def test_parse_local_document_raises_for_missing_file(tmp_path: Path) -> None:
    file_path = tmp_path / "missing.txt"

    with pytest.raises(ValueError, match="Local file does not exist"):
        parse_local_document(str(file_path))


def test_parse_local_document_raises_for_unsupported_extension(tmp_path: Path) -> None:
    file_path = tmp_path / "unsupported.csv"
    file_path.write_text("a,b,c", encoding="utf-8")

    with pytest.raises(ValueError, match="Unsupported document type"):
        parse_local_document(str(file_path))
