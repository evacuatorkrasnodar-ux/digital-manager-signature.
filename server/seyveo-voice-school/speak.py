"""SEYVEO Voice School — make new speech with the owner's chosen synthetic voice.

No recording of other people and no ChatGPT voice samples. Uses ONLY a
synthetic reference produced by voice_school.py and selected by its owner.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from voice_school import MODEL, PHRASES, default_dir

BASE_MODEL = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
DEMO_TEXT = "Сэйви на связи. Я могу помочь тебе спокойно разобраться с делами."


def reference_from(folder: Path):
    info = json.loads((folder / "selected-reference.json").read_text(encoding="utf-8"))
    if (info.get("model") != MODEL or
            info.get("voice") != "SEYVEO" or
            info.get("source") not in ("voice_1", "voice_2", "voice_3") or
            info.get("human_reviewed") is not True or
            info.get("reference_text") != PHRASES[0][1]):
        raise ValueError("No valid owner-selected synthetic SEYVEO voice")
    wave = folder / "selected-reference.wav"
    if not wave.is_file():
        raise ValueError("Missing owner-selected synthetic reference")
    return wave, info["reference_text"]


def main():
    parser = argparse.ArgumentParser(description="SEYVEO stable synthetic voice test")
    parser.add_argument("--out", type=Path, default=default_dir())
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--text", type=str, default=DEMO_TEXT, help="Local synthetic preview; avoid personal information")
    args = parser.parse_args()
    if not 5 <= len(args.text) <= 450:
        parser.error("Use 5–450 characters")
    ref, ref_text = reference_from(args.out)
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel
    use_cpu = args.cpu or not torch.cuda.is_available()
    device = "cpu" if use_cpu else "cuda:0"
    dtype = torch.float32 if use_cpu else (
        torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    )
    model = Qwen3TTSModel.from_pretrained(
        BASE_MODEL, device_map=device, dtype=dtype, attn_implementation="sdpa"
    )
    wavs, sr = model.generate_voice_clone(
        text=args.text, language="Russian", ref_audio=str(ref), ref_text=ref_text
    )
    path = args.out / "seyveo-test.wav"
    sf.write(str(path), wavs[0], sr, subtype="PCM_16")
    print("One selected synthetic SEYVEO voice:", path)
    print("No app integration or model-weight training was performed.")


if __name__ == "__main__":
    main()
