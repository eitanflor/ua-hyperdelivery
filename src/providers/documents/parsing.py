"""Byte-based document extraction, shared by local-file and S3 sources.

Format-specific parsing lives here once. `providers/documents/local.py` (a path on
disk) and `providers/storage/s3.py` (bytes fetched from a bucket) differ only in where
the bytes come from and what they do with the extracted text - the extraction itself
does not care which.
"""

from __future__ import annotations

import io
from collections.abc import Callable
from typing import cast

import openpyxl
import pytesseract  # pyright: ignore[reportMissingTypeStubs]  # package has no type stubs
from docx import Document as DocxDocument
from docx.text.paragraph import Paragraph
from PIL import Image
from pptx import Presentation
from pptx.shapes.autoshape import Shape
from pptx.shapes.graphfrm import GraphicFrame
from pypdf import PdfReader

#: Every extension `parse_document_bytes` can turn into text.
SUPPORTED_EXTENSIONS = (".txt", ".md", ".pdf", ".docx", ".pptx", ".xlsx", ".png", ".jpg", ".jpeg")


def _escape_table_cell(value: str) -> str:
    return value.strip().replace("|", "\\|").replace("\n", "<br>")


def _markdown_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    width = max(len(row) for row in rows)
    padded = [row + [""] * (width - len(row)) for row in rows]

    def render(row: list[str]) -> str:
        return "| " + " | ".join(_escape_table_cell(cell) for cell in row) + " |"

    return "\n".join([render(padded[0]), render(["---"] * width), *map(render, padded[1:])])


def _extract_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    pages: list[str] = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(f"## Page {i}\n\n{text}")
    return "\n\n".join(pages)


def _extract_docx(data: bytes) -> str:
    doc = DocxDocument(io.BytesIO(data))
    blocks: list[str] = []
    for block in doc.iter_inner_content():
        if isinstance(block, Paragraph):
            text = block.text.strip()
            if not text:
                continue
            style_name = block.style.name or "" if block.style is not None else ""
            if style_name.startswith("Heading ") and style_name.removeprefix("Heading ").isdigit():
                level = min(int(style_name.removeprefix("Heading ")), 6)
                blocks.append(f"{'#' * level} {text}")
            elif style_name.startswith("List Bullet"):
                blocks.append(f"- {text}")
            elif style_name.startswith("List Number"):
                blocks.append(f"1. {text}")
            else:
                blocks.append(text)
        else:
            rows = [[cell.text for cell in row.cells] for row in block.rows]
            if table := _markdown_table(rows):
                blocks.append(table)
    return "\n\n".join(blocks)


def _extract_pptx(data: bytes) -> str:
    presentation = Presentation(io.BytesIO(data))
    chunks: list[str] = []
    for i, slide in enumerate(presentation.slides, start=1):
        slide_lines = [f"## Slide {i}"]
        for shape in slide.shapes:
            if shape.has_table:
                table_shape = cast("GraphicFrame", shape)
                rows = [[cell.text for cell in row.cells] for row in table_shape.table.rows]
                if table := _markdown_table(rows):
                    slide_lines.append(table)
            elif shape.has_text_frame and (text := cast("Shape", shape).text_frame.text.strip()):
                prefix = "### " if shape == slide.shapes.title else ""
                slide_lines.append(f"{prefix}{text}")
        if slide.has_notes_slide:
            notes_frame = slide.notes_slide.notes_text_frame
            notes = notes_frame.text.strip() if notes_frame is not None else ""
            if notes:
                slide_lines.append(f"### Notes\n\n{notes}")
        chunks.append("\n\n".join(slide_lines))
    return "\n\n".join(chunks)


def _extract_xlsx(data: bytes) -> str:
    workbook = openpyxl.load_workbook(io.BytesIO(data), data_only=True)
    sections: list[str] = []
    for sheet in workbook.worksheets:
        rows: list[list[str]] = []
        for row in sheet.iter_rows(values_only=True):
            values = ["" if value is None else str(value) for value in row]
            if any(values):
                rows.append(values)
        if rows:
            sections.append(f"## Sheet: {sheet.title}\n\n{_markdown_table(rows)}")
    return "\n\n".join(sections)


def _extract_image(data: bytes) -> str:
    image = Image.open(io.BytesIO(data))
    text = cast("str", pytesseract.image_to_string(image)).strip()
    return f"## OCR text\n\n{text}" if text else ""


def _read_text(data: bytes, filename: str) -> str:
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as e:
        msg = f"Unsupported encoding for {filename}; expected UTF-8"
        raise ValueError(msg) from e


def missing_dependency_error(ext: str, exc: ModuleNotFoundError) -> ValueError:
    """Build the error `parse_document_bytes` raises when an optional parser is absent."""
    package_by_ext = {
        ".docx": "python-docx",
        ".pptx": "python-pptx",
        ".xlsx": "openpyxl",
        ".png": "pillow + pytesseract",
        ".jpg": "pillow + pytesseract",
        ".jpeg": "pillow + pytesseract",
    }
    package_hint = package_by_ext.get(ext, "required parser dependency")
    msg = (
        f"Missing dependency while parsing '{ext}' files. Install {package_hint}. "
        f"Original error: {exc}"
    )
    return ValueError(msg)


def parse_document_bytes(filename: str, data: bytes) -> str:
    """Extract text or structured Markdown from a document's raw bytes.

    Dispatches on `filename`'s extension. Preserves pages, headings, lists, tables,
    slides, notes and sheets where the source format exposes them; images are run
    through OCR. Supported extensions: `SUPPORTED_EXTENSIONS`.
    """
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    handlers: dict[str, Callable[[bytes], str]] = {
        ".txt": lambda d: _read_text(d, filename),
        ".md": lambda d: _read_text(d, filename),
        ".pdf": _extract_pdf,
        ".docx": _extract_docx,
        ".pptx": _extract_pptx,
        ".xlsx": _extract_xlsx,
        ".png": _extract_image,
        ".jpg": _extract_image,
        ".jpeg": _extract_image,
    }

    if suffix not in handlers:
        supported = ", ".join(SUPPORTED_EXTENSIONS)
        msg = f"Unsupported document type for {filename}; expected one of: {supported}"
        raise ValueError(msg)

    try:
        return handlers[suffix](data).strip()
    except ModuleNotFoundError as exc:
        raise missing_dependency_error(suffix, exc) from exc
