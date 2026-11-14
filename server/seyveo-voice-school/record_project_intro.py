"""Record the approved SEYVEO project introduction on the owner's PC.

No cloud voice API or uploads. Loads the exact approved Sayvi voice locally.
The introduction is rendered in short, expressive sections, then joined into
one PCM WAV for easy transfer to a phone. Existing WAVs are never overwritten.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from approved_voice import active_path, is_approved
from clone_wife_voice import MODEL, default_output


PARTS = (
    "Привет! Меня зовут Сэйви. Можешь звать меня просто Сэй.",
    "Меня создала компания SEYVEO — студия технологий, искусственного интеллекта и автоматизации.",
    "Я здесь, чтобы помогать тебе с делами, находить решения и делать сложное простым.",
    "Я могла бы долго рассказывать о том, что умею… Но знаешь что?",
    "Лучше я тебе покажу. Ну что, начнём?",
)

PAUSES = (0.45, 0.65, 0.55, 0.75)
FILENAME = "SEYVEO-Sayvi-project-intro.wav"


def destination() -> Path:
    user_profile = Path(os.environ.get("USERPROFILE", str(Path.home())))
    downloads = user_profile / "Downloads"
    folder = downloads if downloads.is_dir() else default_output()
    folder.mkdir(parents=True, exist_ok=True)
    candidate = folder / FILENAME
    suffix = 2
    while candidate.exists():
        candidate = folder / f"SEYVEO-Sayvi-project-intro-{suffix}.wav"
        suffix += 1
    return candidate


def main() -> int:
    reference = active_path()
    if not is_approved(reference):
        print("Не найден утверждённый голос Сэйви.", flush=True)
        print("Сначала запусти server\\seyveo-voice-school\\activate-approved-voice.cmd.", flush=True)
        return 1

    print("SEYVEO · Запись полного представления Сэйви", flush=True)
    print("Голос остаётся на этом компьютере. Подготовка на CPU может занять несколько минут.", flush=True)

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
        pieces = []
        expected_rate = None
        for position, part in enumerate(PARTS, start=1):
            print(f"Записываю часть {position} из {len(PARTS)}…", flush=True)
            waves, rate = model.generate_voice_clone(
                text=part, language="Russian", ref_audio=str(reference),
                x_vector_only_mode=True
            )
            if expected_rate is None:
                expected_rate = rate
            if rate != expected_rate:
                raise ValueError("Изменилась частота дискретизации между частями.")
            wave = np.asarray(waves[0], dtype=np.float32).reshape(-1)
            if not len(wave) or not np.isfinite(wave).all():
                raise ValueError("Голосовая модель вернула повреждённую запись.")

            # A small fade suppresses clicks at the joins without changing
            # Sayvi's pitch, timbre, articulation or natural speaking speed.
            fade = min(round(rate * 0.015), len(wave) // 10)
            if fade:
                wave[:fade] *= np.linspace(0.0, 1.0, fade, dtype=np.float32)
                wave[-fade:] *= np.linspace(1.0, 0.0, fade, dtype=np.float32)
            pieces.append(wave)
            if position <= len(PAUSES):
                pieces.append(np.zeros(round(rate * PAUSES[position - 1]), dtype=np.float32))

        output = destination()
        sf.write(str(output), np.concatenate(pieces), expected_rate, subtype="PCM_16")
    except Exception as error:
        print("Не удалось создать запись:", error, file=sys.stderr, flush=True)
        return 1

    print("\nГОТОВО!", flush=True)
    print("Полный голосовой файл:", output, flush=True)
    print("Эту запись можно отправить на телефон или прикрепить к нашему чату.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
