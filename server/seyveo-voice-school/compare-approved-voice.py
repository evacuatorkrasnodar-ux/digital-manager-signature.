"""One-click, non-destructive SEYVEO voice comparison using the approved recording.

Find the audio in Downloads/Desktop or offer a Windows file chooser. If the
gold-master recording is long, create an independent 12-second reference clip.
Never overwrite the gold master, the previously approved reference, or the
running application's private voice files. Never upload recordings to GitHub.
"""
from __future__ import annotations

import argparse
import os
from datetime import datetime
from pathlib import Path

from clone_wife_voice import MODEL, clean_segment, default_output

TEST_TEXT = (
    "Роман, привет, мой дорогой! Это Сэйви. "
    "Как приятно снова тебя слышать. "
    "Сегодня у нас замечательный день."
)
GOLD_NAME = "seyveo-voice-gold-master"
CLIP_NAME = "seyveo-reference-candidate"


def search_folders():
    home = Path(os.environ.get("USERPROFILE", str(Path.home())))
    folders = [
        default_output(),
        home / "Downloads",
        home / "Desktop",
        home / "Загрузки",
        home / "Рабочий стол",
        Path(os.environ.get("OneDrive", str(home / "OneDrive"))) / "Downloads",
        Path(os.environ.get("OneDrive", str(home / "OneDrive"))) / "Desktop",
    ]
    # Preserve order but avoid checking the same folder twice.
    seen = set()
    for folder in folders:
        key = str(folder).casefold()
        if key not in seen and folder.is_dir():
            seen.add(key)
            yield folder


def find_recording(folders):
    # Prefer the short reference the owner already approved, when available.
    # Otherwise use the master recording, trimmed to a new test-only file.
    matches = []
    for folder in folders:
        for path in folder.iterdir():
            name = path.name.casefold()
            if path.is_file() and path.suffix.casefold() == ".wav":
                if name.startswith(CLIP_NAME) or name.startswith(GOLD_NAME):
                    rank = 0 if name.startswith(CLIP_NAME) else 1
                    matches.append((rank, -path.stat().st_mtime, path))
    matches.sort(key=lambda row: (row[0], row[1]))
    return matches[0][2] if matches else None


def ask_for_file():
    print("Запись не найдена автоматически. Выбери скачанный WAV в открывшемся окне.", flush=True)
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        home = Path(os.environ.get("USERPROFILE", str(Path.home())))
        downloads = home / "Downloads"
        selected = filedialog.askopenfilename(
            parent=root,
            title="Выбери SEYVEO-VOICE-GOLD-MASTER.wav",
            initialdir=str(downloads if downloads.is_dir() else home),
            filetypes=[("Голос Сэйви (WAV)", "*.wav")],
        )
        root.destroy()
        return Path(selected).resolve() if selected else None
    except Exception as error:
        print("Не удалось показать окно выбора:", error, flush=True)
        return None


def test_reference(source, outdir, stamp):
    """Only a separate test clip is written. Never modify source or app ref."""
    import soundfile as sf

    info = sf.info(str(source))
    if not 5 <= info.duration <= 900:
        raise ValueError("Запись должна длиться от 5 секунд до 15 минут.")
    if not 16000 <= info.samplerate <= 192000 or info.channels not in (1, 2):
        raise ValueError("Неподдерживаемый формат WAV.")

    if info.duration <= 20:
        return source  # The user's already approved short candidate.
    print("Выбираю чистый короткий фрагмент из длинного эталона…", flush=True)
    audio, rate = sf.read(str(source), dtype="float32")
    clip, stats = clean_segment(audio, rate, seconds=12)
    candidate = outdir / ("seyveo-reference-test-" + stamp + ".wav")
    # Unique filename: the gold master and the app's reference stay untouched.
    sf.write(str(candidate), clip, rate, subtype="PCM_16")
    print("Тестовый образец:", candidate.name, "| начало:", stats["start_seconds"], "с", flush=True)
    return candidate


def main(argv=None):
    parser = argparse.ArgumentParser(description="SEYVEO — проверка любимого голоса")
    parser.add_argument("--reference", type=Path, help="Путь к WAV. По умолчанию ищем в Загрузках.")
    parser.add_argument("--text", default=TEST_TEXT, help="Короткая фраза для сравнения.")
    args = parser.parse_args(argv)
    text = args.text.strip()
    if not 2 <= len(text) <= 240:
        parser.error("Нужна фраза от 2 до 240 символов.")

    recording = args.reference.expanduser().resolve() if args.reference else find_recording(search_folders())
    if recording is None:
        recording = ask_for_file()
    if recording is None or not recording.is_file():
        parser.error("WAV не найден. Сохрани SEYVEO-VOICE-GOLD-MASTER.wav в Загрузках.")

    outdir = default_output()
    outdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    print("Исходная запись:", recording, flush=True)
    print("Оригинал не изменяем. Приложение не изменяем.", flush=True)
    reference = test_reference(recording, outdir, stamp)

    # The Qwen3-TTS Base model is the same as in the user's original
    # successful say.py test; the private recordings stay on this PC.
    print("Загружаю голосовой движок Qwen3-TTS на процессоре…", flush=True)
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel

    model = Qwen3TTSModel.from_pretrained(
        MODEL, device_map="cpu", dtype=torch.float32, attn_implementation="sdpa"
    )
    print("Создаю новую тестовую фразу…", flush=True)
    with torch.inference_mode():
        audio, rate = model.generate_voice_clone(
            text=text, language="Russian", ref_audio=str(reference),
            x_vector_only_mode=True
        )

    output = outdir / ("seyveo-voice-comparison-" + stamp + ".wav")
    sf.write(str(output), audio[0], rate, subtype="PCM_16")
    print("ГОТОВО! Новая запись:", output, flush=True)
    if os.name == "nt":
        try:
            os.startfile(str(output))
        except OSError:
            print("Открой WAV вручную по пути выше.", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print("ОШИБКА:", type(error).__name__ + ":", str(error), flush=True)
        raise SystemExit(1)
