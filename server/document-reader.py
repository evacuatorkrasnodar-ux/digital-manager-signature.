"""Offline SEYVEO document text extractor. Never executes document contents.

Usage: python document-reader.py .docx < input.docx
Only bounded plaintext leaves stdout; images, macros and active content ignored.
PDF requires optional pypdf in a separate document-reader Python environment.
"""
import io
import json
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

LIMIT = 8 * 1024 * 1024
OUTPUT_LIMIT = 5200
ARCHIVE_LIMIT = 28 * 1024 * 1024
MAX_PARTS = 350
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


class InvalidDocument(Exception):
    pass


def clean(value):
    return re.sub(r"\s+", " ", value).strip()


def read_zip(data):
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
        entries = archive.infolist()
        if len(entries) > MAX_PARTS or sum(x.file_size for x in entries) > ARCHIVE_LIMIT:
            raise InvalidDocument("Слишком большой или сложный документ.")
        if any(x.flag_bits & 1 for x in entries):
            raise InvalidDocument("Зашифрованные документы пока не поддерживаются.")
        return archive
    except (zipfile.BadZipFile, OSError) as exc:
        raise InvalidDocument("Не удалось открыть документ Office.") from exc


def xml_root(archive, path):
    try:
        raw = archive.read(path)
    except KeyError:
        return None
    if len(raw) > 4 * 1024 * 1024:
        raise InvalidDocument("Раздел документа слишком большой.")
    try:
        return ET.fromstring(raw)
    except ET.ParseError as exc:
        raise InvalidDocument("Повреждена структура документа.") from exc


def office_text(data, ext):
    archive = read_zip(data)
    names = archive.namelist()
    paragraphs = []
    if ext == ".docx":
        # Only main document body; macros and embedded files are never read.
        root = xml_root(archive, "word/document.xml")
        if root is None:
            raise InvalidDocument("В Word-документе отсутствует основной текст.")
        for p in root.findall(".//w:p", NS):
            value = clean("".join(t.text or "" for t in p.findall(".//w:t", NS)))
            if value:
                paragraphs.append(value)
    elif ext == ".pptx":
        slides = sorted((name for name in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)),
                        key=lambda x: int(re.search(r"slide(\d+)", x).group(1)))
        if not slides:
            raise InvalidDocument("Слайды не найдены.")
        for idx, name in enumerate(slides, 1):
            root = xml_root(archive, name)
            if root is None:
                continue
            text = [clean("".join(t.text or "" for t in p.findall(".//a:t", NS)))
                    for p in root.findall(".//a:p", NS)]
            text = [x for x in text if x]
            if text:
                paragraphs.append("Слайд " + str(idx) + ": " + "; ".join(text))
    elif ext == ".xlsx":
        shared = []
        shared_root = xml_root(archive, "xl/sharedStrings.xml")
        if shared_root is not None:
            for si in shared_root.findall(".//x:si", NS):
                shared.append("".join(t.text or "" for t in si.findall(".//x:t", NS)))
        sheets = sorted((name for name in names if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", name)),
                        key=lambda x: int(re.search(r"sheet(\d+)", x).group(1)))
        if not sheets:
            raise InvalidDocument("Листы Excel не найдены.")
        for index, name in enumerate(sheets, 1):
            root = xml_root(archive, name)
            if root is None:
                continue
            paragraphs.append("Лист " + str(index) + ":")
            for row in root.findall(".//x:sheetData/x:row", NS):
                values = []
                for cell in row.findall("x:c", NS):
                    kind = cell.attrib.get("t", "")
                    val = cell.findtext("x:v", default="", namespaces=NS)
                    if kind == "s":
                        try:
                            val = shared[int(val)]
                        except (ValueError, IndexError):
                            val = ""
                    elif kind == "inlineStr":
                        val = "".join(node.text or "" for node in cell.findall(".//x:t", NS))
                    val = clean(val)
                    if val:
                        values.append(cell.attrib.get("r", "?") + ": " + val)
                if values:
                    paragraphs.append(" | ".join(values))
                if sum(map(len, paragraphs)) >= OUTPUT_LIMIT + 1000:
                    break
    else:
        raise InvalidDocument("Неподдерживаемый формат.")
    return "\n".join(paragraphs)


def pdf_text(data):
    if not data.startswith(b"%PDF-"):
        raise InvalidDocument("Это не PDF-файл.")
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise InvalidDocument("Для PDF требуется библиотека pypdf в отдельном окружении документов.") from exc
    try:
        reader = PdfReader(io.BytesIO(data), strict=False)
        if reader.is_encrypted:
            raise InvalidDocument("PDF с паролем пока не поддерживается.")
        out = []
        for index, page in enumerate(reader.pages):
            if index >= 25 or sum(map(len, out)) >= OUTPUT_LIMIT + 1000:
                break
            text = clean(page.extract_text() or "")
            if text:
                out.append("Страница " + str(index + 1) + ": " + text)
        return "\n".join(out)
    except InvalidDocument:
        raise
    except Exception as exc:
        raise InvalidDocument("Не удалось прочитать PDF. Сканированные страницы могут не содержать текста.") from exc


def extract(data, ext):
    if not data or len(data) > LIMIT:
        raise InvalidDocument("Максимальный размер файла — 8 МБ.")
    if ext not in {".docx", ".xlsx", ".pptx", ".pdf"}:
        raise InvalidDocument("Поддерживаются PDF, DOCX, XLSX и PPTX.")
    raw = pdf_text(data) if ext == ".pdf" else office_text(data, ext)
    raw = raw.strip()
    if not raw:
        raise InvalidDocument("Текст не найден. Возможно, документ состоит из изображений.")
    truncated = len(raw) > OUTPUT_LIMIT
    return {"text": raw[:OUTPUT_LIMIT], "truncated": truncated, "format": ext[1:],
            "chars": len(raw)}


def main():
    try:
        ext = sys.argv[1].lower()
        data = sys.stdin.buffer.read(LIMIT + 1)
        print(json.dumps(extract(data, ext), ensure_ascii=False))
    except (InvalidDocument, IndexError) as exc:
        print(json.dumps({"error": str(exc) or "Неизвестная ошибка."}, ensure_ascii=False))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
