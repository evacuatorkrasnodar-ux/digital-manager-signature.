"""SEYVEO: local text-to-speech using owner's consented voice reference.
Manual text; no uploads, no remote voice APIs, no model training.
Runs on CPU; each invocation loads Qwen3-TTS Base and may be slow.
"""
from __future__ import annotations
import argparse
from pathlib import Path
from clone_wife_voice import default_output, MODEL

def main(argv=None):
    parser = argparse.ArgumentParser(description="Read text with the private SEYVEO voice")
    parser.add_argument("--text", required=True, help="A short phrase for local synthesis")
    parser.add_argument("--out", type=Path, default=default_output() / "seyveo-spoken.wav")
    args = parser.parse_args(argv)
    phrase = args.text.strip()
    if not 2 <= len(phrase) <= 500:
        parser.error("Текст должен содержать от 2 до 500 символов.")
    if any(ch in phrase for ch in "\x00\r"):
        parser.error("Недопустимые символы в тексте.")
    reference = default_output() / "wife-reference.wav"
    if not reference.is_file():
        parser.error("Не найден личный образец wife-reference.wav. Сначала подготовь его.")
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel
    print("SEYVEO Voice Engine · создаём речь локально на CPU.")
    model = Qwen3TTSModel.from_pretrained(
        MODEL, device_map="cpu", dtype=torch.float32, attn_implementation="sdpa"
    )
    sounds, rate = model.generate_voice_clone(
        text=phrase, language="Russian", ref_audio=str(reference),
        x_vector_only_mode=True
    )
    destination = args.out.resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(destination), sounds[0], rate, subtype="PCM_16")
    print("Создано:", destination)
    print("Личный голос остаётся на этом компьютере. Модель не обучалась.")


if __name__ == "__main__":
    main()
