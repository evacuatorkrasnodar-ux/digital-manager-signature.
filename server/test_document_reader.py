"""Offline parser smoke tests with tiny synthetic documents. No models or network."""
import importlib.util
import io
import json
import unittest
import zipfile
from pathlib import Path

SOURCE = Path(__file__).with_name("document-reader.py")
SPEC = importlib.util.spec_from_file_location("document_reader", SOURCE)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


def archive(files):
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        for name, value in files.items():
            z.writestr(name, value)
    return out.getvalue()


class DocumentReaderTests(unittest.TestCase):
    def test_word_russian_paragraphs(self):
        doc = archive({"word/document.xml": (
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body><w:p><w:r><w:t>Привет, Роман!</w:t></w:r></w:p>'
            '<w:p><w:r><w:t>SEYVEO работает.</w:t></w:r></w:p></w:body></w:document>')})
        result = mod.extract(doc, ".docx")
        self.assertIn("Привет, Роман!", result["text"])
        self.assertIn("SEYVEO работает.", result["text"])

    def test_excel_shared_strings(self):
        doc = archive({
            "xl/sharedStrings.xml": (
                '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<si><t>Продажи</t></si></sst>'),
            "xl/worksheets/sheet1.xml": (
                '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<sheetData><row r="1"><c r="A1" t="s"><v>0</v></c>'
                '<c r="B1"><v>123</v></c></row></sheetData></worksheet>')
        })
        result = mod.extract(doc, ".xlsx")
        self.assertIn("A1: Продажи", result["text"])
        self.assertIn("B1: 123", result["text"])

    def test_powerpoint_shape_text(self):
        doc = archive({"ppt/slides/slide1.xml": (
            '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
            'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
            '<p:sp><p:txBody><a:p><a:r><a:t>Отчёт компании</a:t></a:r></a:p>'
            '</p:txBody></p:sp></p:sld>')})
        self.assertIn("Отчёт компании", mod.extract(doc, ".pptx")["text"])

    def test_corrupt_document_is_rejected(self):
        with self.assertRaises(mod.InvalidDocument):
            mod.extract(b"not a zip", ".docx")

    def test_unsupported_format_is_rejected(self):
        with self.assertRaises(mod.InvalidDocument):
            mod.extract(b"anything", ".doc")

    def test_pdf_signature_is_validated(self):
        with self.assertRaises(mod.InvalidDocument):
            mod.extract(b"not a pdf", ".pdf")


if __name__ == "__main__":
    unittest.main()
