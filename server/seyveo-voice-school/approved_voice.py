"""SEYVEO approved local voice: verified small reference, never the master.

This file contains only the expected SHA-256 fingerprint of the approved
11.4-second WAV. The private recording stays on the owner's computer.
"""
from __future__ import annotations

import hashlib
import os
import shutil
import tempfile
import wave
from pathlib import Path

from clone_wife_voice import default_output

APPROVED_NAME = "seyveo-approved-reference.wav"
APPROVED_SHA256 = "223466c8cbb0d681fbf2bd2d6c3722470576bfbfa6afa110dbdf86dcfa2e9e5f"


def digest(file: Path) -> str:
    sha = hashlib.sha256()
    with file.open("rb") as reader:
        for part in iter(lambda: reader.read(65536), b""):
            sha.update(part)
    return sha.hexdigest()


def is_approved(file: Path) -> bool:
    if not file.is_file() or file.stat().st_size > 3000000:
        return False
    if digest(file) != APPROVED_SHA256:
        return False
    try:
        with wave.open(str(file), "rb") as wav:
            return (wav.getnchannels() == 1
                    and wav.getsampwidth() == 2
                    and wav.getframerate() == 24000
                    and 10 <= wav.getnframes() / wav.getframerate() <= 13)
    except (OSError, EOFError, wave.Error):
        return False


def active_path() -> Path:
    return default_output() / APPROVED_NAME


def app_reference() -> Path:
    """Prefer verified approved voice; preserve legacy if not yet installed.

    If an active file is present but invalid, fail explicitly: never silently
    use a different speaker after the owner approved this voice.
    """
    active = active_path()
    if active.exists():
        if not is_approved(active):
            raise ValueError("Файл утверждённого голоса Сэйви повреждён. Повтори активацию.")
        return active
    return default_output() / "wife-reference.wav"


def source_folders():
    home = Path(os.environ.get("USERPROFILE", str(Path.home())))
    one_drive = Path(os.environ.get("OneDrive", str(home / "OneDrive")))
    seen = set()
    for folder in (default_output(), home / "Downloads", home / "Загрузки",
                   home / "Desktop", home / "Рабочий стол",
                   one_drive / "Downloads", one_drive / "Desktop"):
        key = str(folder).casefold()
        if key not in seen and folder.is_dir():
            seen.add(key)
            yield folder


def find_candidate():
    for folder in source_folders():
        for file in sorted(folder.glob("SEYVEO-reference-candidate*.wav")):
            if is_approved(file):
                return file
    return None


def install_reference(source: Path) -> Path:
    """Atomically copy a known approved clip; never overwrite a master or legacy ref."""
    source = source.expanduser().resolve()
    if not is_approved(source):
        raise ValueError("Выбран не тот образец. Нужен одобренный SEYVEO-reference-candidate.wav.")
    destination = active_path()
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and is_approved(destination):
        return destination
    if destination.exists():
        raise ValueError("Другой файл уже занимает место утверждённого образца. Не заменяем его автоматически.")
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(mode="wb", dir=destination.parent,
                                         prefix=".seyveo-approved-", suffix=".tmp",
                                         delete=False) as writer:
            tmp = Path(writer.name)
            with source.open("rb") as reader:
                shutil.copyfileobj(reader, writer)
        if not is_approved(tmp):
            raise ValueError("Ошибка проверки копии голоса.")
        os.replace(tmp, destination)
        return destination
    finally:
        if tmp is not None and tmp.exists():
            tmp.unlink()


def choose_source():
    print("Ищу точный одобренный образец Сэйви в Загрузках и папке голоса…", flush=True)
    source = find_candidate()
    if source:
        return source
    print("Автоматически не нашёл. Выбери короткий файл SEYVEO-reference-candidate.wav.", flush=True)
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        selected = filedialog.askopenfilename(
            parent=root, title="Выбери утверждённый короткий образец Сэйви",
            initialdir=str(Path.home() / "Downloads"),
            filetypes=[("Образец Сэйви", "*.wav")],
        )
        root.destroy()
        return Path(selected) if selected else None
    except Exception as error:
        print("Окно выбора недоступно:", error, flush=True)
        return None


def main():
    source = choose_source()
    if source is None:
        print("ОБРАЗЕЦ НЕ НАЙДЕН. Скачай SEYVEO-reference-candidate.wav и запусти ещё раз.")
        return 1
    try:
        destination = install_reference(source)
    except (OSError, ValueError) as error:
        print("ОШИБКА:", error)
        return 1
    print("ГОТОВО. Утверждённый голос Сэйви подключён:", destination, flush=True)
    print("Эталон и тестовая запись не менялись. Перезапусти локальный сервер SEYVEO.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
