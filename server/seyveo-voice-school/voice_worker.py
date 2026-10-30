"""Long-lived, local-only SEYVEO voice worker.

Reads bounded JSONL commands from stdin, writes JSONL status to stdout.
All neural library stdout is routed to stderr so protocol stays clean.
Keeps the same approved reference and Qwen3-TTS Base model in memory.
Does not receive HTTP requests, open sockets or upload the voice.
"""
from __future__ import annotations

import contextlib
import json
import sys
from pathlib import Path

from clone_wife_voice import MODEL, default_output

MAX_TEXT = 450
MAX_LINE = 4096


def reply(payload):
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main():
    reference = default_output() / "wife-reference.wav"
    if not reference.is_file():
        reply({"type": "fatal", "error": "Не найден локальный голос Сэйви."})
        return 1

    # Third-party libraries may print progress; never pollute JSONL stdout.
    try:
        with contextlib.redirect_stdout(sys.stderr):
            import torch
            import soundfile as sf
            from qwen_tts import Qwen3TTSModel

            torch.set_num_threads(min(max(torch.get_num_threads(), 1), 10))
            model = Qwen3TTSModel.from_pretrained(
                MODEL, device_map="cpu", dtype=torch.float32,
                attn_implementation="sdpa"
            )
    except Exception as error:
        reply({"type": "fatal", "error": "Ошибка запуска голосового движка: " + str(error)[:300]})
        return 1

    reply({"type": "ready"})
    for raw in sys.stdin:
        if len(raw) > MAX_LINE:
            reply({"type": "error", "id": 0, "error": "Слишком длинная команда."})
            continue
        try:
            item = json.loads(raw)
            if not isinstance(item, dict):
                raise ValueError("Некорректная команда.")
            task_id = item.get("id")
            phrase = item.get("text")
            output = item.get("output")
            if not isinstance(task_id, int) or task_id <= 0:
                raise ValueError("Некорректный номер запроса.")
            if not isinstance(phrase, str) or not 2 <= len(phrase.strip()) <= MAX_TEXT:
                raise ValueError("Слишком длинный или пустой текст.")
            if not isinstance(output, str) or not output:
                raise ValueError("Не задан выходной WAV.")
            destination = Path(output).resolve()
            if destination.suffix.lower() != ".wav":
                raise ValueError("Ожидается WAV.")
            # The output path originates from the localhost-only server's
            # own freshly created temporary directory, never from the page.
            with contextlib.redirect_stdout(sys.stderr):
                sounds, rate = model.generate_voice_clone(
                    text=phrase.strip(), language="Russian",
                    ref_audio=str(reference), x_vector_only_mode=True
                )
                sf.write(str(destination), sounds[0], rate, subtype="PCM_16")
            reply({"type": "result", "id": task_id})
        except Exception as error:
            task_id = item.get("id") if isinstance(locals().get("item"), dict) else 0
            reply({"type": "error", "id": task_id, "error": str(error)[:300]})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
