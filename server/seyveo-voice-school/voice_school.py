"""SEYVEO Voice School: create and test a NEW synthetic Russian female voice.

No ChatGPT voice copying, no external-user voice samples, no app modifications.
Default --plan is pure stdlib and never downloads or invokes models.
--generate explicitly opts in to Qwen3-TTS VoiceDesign and offline ASR evaluation;
a model may download on FIRST run. Runs on CPU with 32 GB but may be slow.
"""
from __future__ import annotations

import argparse
import audioop
import difflib
import json
import math
import os
import re
import shutil
import sys
import wave
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

MODEL = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"
ASR_MODEL = "small"
VOICE_NAME = "SEYVEO"
VOICE_PROFILE = (
    "A single original adult feminine voice for an intelligent Russian-language assistant. "
    "Gentle, warm and subtly velvety timbre, medium-low comfortable pitch, soft clear consonants, "
    "especially a slightly softened but still intelligible Russian 'р'. "
    "Natural conversational intonation with gentle meaningful pauses and a quiet smile. "
    "Calm, close and present without exaggerated emotion, robotic flatness, imitation of any known voice "
    "or theatrical narration. Standard fluent native Russian pronunciation."
)
VOICE_STYLES = (
    "Warmth: calm, intimate and unhurried. ",
    "Warmth: lively natural conversational flow, very soft smile. ",
    "Warmth: composed and reassuring, soft expressive pauses. ",
)
PHRASES = (
    ("hello", "Привет. Я Сэйви. Рада, что ты здесь. Расскажи, чем я могу помочь."),
    ("business", "Пришло письмо от клиента. Я подготовила ответ, но отправлю его только после твоего подтверждения."),
    ("care", "Похоже, день был непростой. Хочешь немного отдохнуть? Я рядом."),
    ("numbers", "Завтра, тридцать первого октября, в десять тридцать запланирована встреча. Я могу помочь её проверить."),
    ("r_sound", "Роман, проверь, пожалуйста, договор. Прежде чем отправлять, нужно уточнить реквизиты."),
    ("interrupt", "Конечно. Я слушаю. Продолжай."),
)
MAX_GENERATIONS = 3


def default_dir() -> Path:
    base = (Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local")))
            if os.name == "nt" else Path.home() / ".local/state")
    return base / "SEYVEO" / "voice-school"


def normalize(text: str) -> list[str]:
    return re.findall(r"[а-яёa-z0-9]+", text.lower().replace("ё", "е"))


def word_error_rate(reference: str, hypothesis: str) -> float:
    ref, hyp = normalize(reference), normalize(hypothesis)
    if not ref:
        raise ValueError("empty-reference")
    previous = list(range(len(hyp) + 1))
    for index, word in enumerate(ref, 1):
        current = [index]
        for column, other in enumerate(hyp, 1):
            current.append(min(
                current[-1] + 1, previous[column] + 1,
                previous[column - 1] + (word != other)
            ))
        previous = current
    return previous[-1] / len(ref)


def wav_quality(path: Path) -> dict:
    """Technical audio-only hygiene: silence, clipping, duration. Not voice beauty."""
    with wave.open(str(path), "rb") as wav:
        channels, rate, width, frames = (
            wav.getnchannels(), wav.getframerate(), wav.getsampwidth(), wav.getnframes()
        )
        if channels not in (1, 2) or width != 2 or rate < 16000 or frames <= 0:
            raise ValueError("unsupported-wave-format")
        if frames > rate * 90:
            raise ValueError("audio-too-long")
        pcm = wav.readframes(frames)
    duration = frames / rate
    amplitude = audioop.max(pcm, width) / 32767
    rms = audioop.rms(pcm, width) / 32767
    if not math.isfinite(amplitude) or not math.isfinite(rms):
        raise ValueError("invalid-wave")
    return {
        "seconds": round(duration, 2),
        "rms": round(rms, 4),
        "peak": round(amplitude, 4),
        "valid": 0.7 <= duration <= 35 and 0.007 <= rms <= 0.85 and amplitude < 0.999,
    }


def assess(reference: str, transcript: str, audio: dict) -> dict:
    error_rate = word_error_rate(reference, transcript)
    valid = bool(audio["valid"]) and error_rate <= 0.12
    return {
        "wer": round(error_rate, 4),
        "transcript": transcript,
        "audio": audio,
        "pass": valid,
        "note": (
            "Техническая проверка пройдена. Красота тембра и естественность НЕ доказаны."
            if valid else "Возможная ошибка произношения, ASR или качества записи."
        )
    }


def available_cases() -> list[dict]:
    return [{"id": name, "text": text} for name, text in PHRASES]


def safe_candidate(candidate: str) -> str:
    if not re.fullmatch(r"voice_[1-3]", candidate):
        raise ValueError("Unknown candidate")
    return candidate


def lock_reference(folder: Path, candidate: str) -> dict:
    """Only the model's own generated demo file can be selected."""
    candidate = safe_candidate(candidate)
    manifest = folder / "report.json"
    report = json.loads(manifest.read_text(encoding="utf-8"))
    record = next((x for x in report.get("candidates", []) if x["id"] == candidate), None)
    if record is None or record.get("synthetic") is not True:
        raise ValueError("Not a school-generated synthetic candidate")
    src = folder / (candidate + "_hello.wav")
    if not src.is_file():
        raise ValueError("Missing synthetic reference WAV")
    # Do not select unknown human audio via a path argument.
    destination = folder / "selected-reference.wav"
    shutil.copyfile(src, destination)
    info = {"voice": VOICE_NAME, "source": candidate, "reference_text": PHRASES[0][1],
            "model": MODEL, "human_reviewed": True,
            "note": "Selected by owner; only school-generated synthetic voice."}
    (folder / "selected-reference.json").write_text(
        json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return info


def generate(count: int, folder: Path, *, cpu: bool) -> dict:
    """Heavy on first use; requires user-approved model download and dependencies."""
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel

    try:
        from faster_whisper import WhisperModel
    except ImportError as error:
        raise RuntimeError("Install optional faster-whisper for automatic Russian pronunciation checks") from error

    device = "cpu" if cpu or not torch.cuda.is_available() else "cuda:0"
    dtype = torch.float32 if device == "cpu" else (
        torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    )
    print("Loading voice designer on", device, "(first run may download weights)")
    model = Qwen3TTSModel.from_pretrained(
        MODEL, device_map=device, dtype=dtype, attn_implementation="sdpa"
    )
    recognizer = WhisperModel(ASR_MODEL, device=("cpu" if device == "cpu" else "cuda"),
                              compute_type=("int8" if device == "cpu" else "float16"))
    folder.mkdir(parents=True, exist_ok=True)
    cases = available_cases()
    reports = []
    for idx in range(count):
        name = f"voice_{idx + 1}"
        tests = []
        instruction = VOICE_PROFILE + " " + VOICE_STYLES[idx]
        for case in cases:
            filename = folder / f"{name}_{case['id']}.wav"
            sounds, sample_rate = model.generate_voice_design(
                text=case["text"], language="Russian", instruct=instruction,
            )
            sf.write(str(filename), sounds[0], sample_rate, subtype="PCM_16")
            segments, _metadata = recognizer.transcribe(str(filename), language="ru", beam_size=3)
            hypothesis = " ".join(s.text.strip() for s in segments)
            rating = assess(case["text"], hypothesis, wav_quality(filename))
            tests.append({"case": case["id"], **rating})
            print(name, case["id"], "pass" if rating["pass"] else "CHECK",
                  "WER", rating["wer"])
        reports.append({
            "id": name, "synthetic": True,
            "technical_passes": sum(int(x["pass"]) for x in tests),
            "total_tests": len(tests),
            "tests": tests,
            "human_timbre_rating": None,
            "note": "These are synthetic voice sketches, NOT fine-tuned models."
        })
    result = {
        "project": "SEYVEO Voice School", "profile": VOICE_PROFILE,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "candidates": reports,
        "automatic_publishing": False,
        "weight_training": False,
        "voice_cloning": False,
        "note": "WER tests transcription, not voice character. Owner chooses one voice."
    }
    (folder / "report.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SEYVEO Voice School: original synthetic female voice")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--plan", action="store_true", help="Describe voice tests; no downloads or models")
    group.add_argument("--generate", action="store_true", help="Generate and evaluate voice WAVs")
    group.add_argument("--lock", metavar="voice_1", help="Select one generated candidate as reference")
    parser.add_argument("--count", type=int, default=2, help="How many variants (1 to 3)")
    parser.add_argument("--cpu", action="store_true", help="Use CPU mode explicitly")
    parser.add_argument("--out", type=Path, default=default_dir())
    args = parser.parse_args(argv)
    if not 1 <= args.count <= MAX_GENERATIONS:
        parser.error("Use --count between 1 and 3")
    if args.lock:
        info = lock_reference(args.out, args.lock)
        print("Selected synthetic reference:", info["source"])
        return 0
    if not args.generate:
        print("SEYVEO · один будущий женский голос")
        print("Профиль:", VOICE_PROFILE)
        print("Проверки:", ", ".join(x["id"] for x in available_cases()))
        print("Model:", MODEL, "\nNo models or downloads were started.")
        return 0
    if args.out.resolve() == Path.cwd().resolve():
        parser.error("Do not save generated WAVs in the repository root")
    result = generate(args.count, args.out, cpu=args.cpu)
    print("Generated:", len(result["candidates"]), "experimental candidates.")
    print("Check WAVs in:", args.out)
    print("Select ONE only after listening: --lock voice_1 (or voice_2, voice_3)")
    print("No weights updated; no app voice changed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, OSError, ValueError) as error:
        print("SEYVEO Voice School error:", error, file=sys.stderr)
        raise SystemExit(1)
