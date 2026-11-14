"""Generate one short, naturally paced Sayvi voice-style audition on the owner's PC.

Uses a known, lively three-second Sayvi WAV as a reference WITH its transcript
(Qwen3-TTS in-context voice cloning), rather than changing speed or equalizing
a poor recording afterwards. All audio and model inference stay on the PC.

Never uploads, replaces, or modifies the eight-minute master or the approved
11.4-second reference. A full narration is deliberately NOT produced here.
"""

from __future__ import annotations

import os
import sys
import wave
from pathlib import Path

from approved_voice import active_path, digest, is_approved, source_folders
from clone_wife_voice import MODEL, default_output


LIVELY_REFERENCE_NAME = "SEYVEO-Sayvi-welcome.wav"
LIVELY_REFERENCE_SHA256 = "84776078a50c3cda79aa977712bd593905f369d545f78c5f9b17a9ea1f004a7d"
LIVELY_REFERENCE_TRANSCRIPT = "Привет, Роман! Я Сэйви. Рада тебя видеть!"
TEST_TEXT = "Привет! Меня зовут Сэйви. Можешь звать меня просто Сэй."
TEST_OUTPUT_NAME = "SEYVEO-Sayvi-style-test.wav"


def find_lively_reference() -> Path | None:
    """Accept only the already-heard WAV, not arbitrary private voice files."""
    for folder in source_folders():
        for path in sorted(folder.glob("SEYVEO-Sayvi-welcome*.wav")):
            if not path.is_file() or path.stat().st_size > 500_000:
                continue
            if digest(path) != LIVELY_REFERENCE_SHA256:
                continue
            try:
                with wave.open(str(path), "rb") as audio:
                    if (audio.getnchannels() == 1 and
                            audio.getframerate() == 24_000 and
                            audio.getsampwidth() == 2 and
                            3 <= audio.getnframes() / audio.getframerate() <= 4):
                        return path
            except (OSError, EOFError, wave.Error):
                continue
    return None


def destination() -> Path:
    profile = Path(os.environ.get("USERPROFILE", str(Path.home())))
    downloads = profile / "Downloads"
    folder = downloads if downloads.is_dir() else default_output()
    folder.mkdir(parents=True, exist_ok=True)
    result = folder / TEST_OUTPUT_NAME
    suffix = 2
    while result.exists():
        result = folder / f"SEYVEO-Sayvi-style-test-{suffix}.wav"
        suffix += 1
    return result


def main() -> int:
    approved = active_path()
    if not is_approved(approved):
        print("Не найден утверждённый короткий образец голоса Сэйви.", flush=True)
        print("Сначала запусти activate-approved-voice.cmd в папке голоса.", flush=True)
        return 1

    lively = find_lively_reference()
    if lively is None:
        print("Не найден точный короткий файл SEYVEO-Sayvi-welcome.wav.", flush=True)
        print("Скачай наше первое удачное приветствие в папку Загрузки и повтори.", flush=True)
        print("Большой золотой эталон сюда класть не нужно — его не трогаем.", flush=True)
        return 1

    print("SEYVEO · Проба живой интонации Сэйви", flush=True)
    print("Генерирую только короткую фразу. Скорость записи не меняю.", flush=True)
    print("Подготовка модели на CPU может занять несколько минут.", flush=True)

    try:
        import numpy as np
        import soundfile as sf
        import torch
        from qwen_tts import Qwen3TTSModel

        torch.set_num_threads(min(max(torch.get_num_threads(), 1), 10))
        model = Qwen3TTSModel.from_pretrained(
            MODEL, device_map="cpu", dtype=torch.float32,
            attn_implementation="sdpa"
        )
        sounds, rate = model.generate_voice_clone(
            text=TEST_TEXT,
            language="Russian",
            ref_audio=str(lively),
            ref_text=LIVELY_REFERENCE_TRANSCRIPT,
            x_vector_only_mode=False,
        )
        audio = np.asarray(sounds[0], dtype=np.float32).reshape(-1)
        if not len(audio) or not np.isfinite(audio).all():
            raise ValueError("Генератор вернул повреждённый звук.")

        output = destination()
        sf.write(str(output), audio, rate, subtype="PCM_16")
    except Exception as error:
        print("Не удалось записать тест:", error, file=sys.stderr, flush=True)
        return 1

    print("\nГОТОВО!", flush=True)
    print("Прослушай этот файл:", output, flush=True)
    print("Если интонация понравится, запишем с ней полное представление.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
