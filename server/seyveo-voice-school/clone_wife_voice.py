"""Local, consented voice preview from a long WAV recording.
No upload, no repository storage, no training and no automatic app installation.
The Qwen3-TTS Base model supports speaker-embedding-only cloning without transcript.
"""
from __future__ import annotations
import argparse
import json
import math
import os
import sys
from pathlib import Path

MODEL = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
PREVIEW_TEXT = "Привет! Я Сэйви. Рада тебя слышать. Чем займёмся сегодня?"
MAX_SOURCE_SECONDS = 15 * 60
CLIP_SECONDS = 12


def default_output() -> Path:
    return Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local"))) / "SEYVEO" / "voice-school"


def clean_segment(source, sample_rate, *, seconds=CLIP_SECONDS):
    """Find a consistent, non-silent 12-second window; do not alter pitch or timbre."""
    import numpy as np
    x = np.asarray(source, dtype=np.float32)
    if x.ndim == 2:
        x = x.mean(axis=1)
    if x.ndim != 1 or not len(x) or sample_rate < 16000 or sample_rate > 192000:
        raise ValueError("Неподдерживаемый формат звука.")
    duration = len(x) / sample_rate
    if duration < 5 or duration > MAX_SOURCE_SECONDS:
        raise ValueError("Длительность записи должна быть от 5 секунд до 15 минут.")
    if not np.isfinite(x).all():
        raise ValueError("Найдены повреждённые отсчёты.")
    size = min(len(x), round(sample_rate * seconds))
    # Subsample long recordings on a grid; all sound remains on the local machine.
    stride = max(1, round(sample_rate * 2))
    starts = list(range(0, max(1, len(x)-size+1), stride))
    starts.append(len(x)-size)
    best = None
    best_score = -1
    for start in starts:
        part = x[start:start+size]
        rms = float(np.sqrt(np.mean(part.astype(np.float64)**2)))
        clip = float(np.mean(np.abs(part) >= .985))
        # Eliminate windows dominated by silence, distortion or excessive level.
        if not .007 <= rms <= .45 or clip >= .0005:
            continue
        # Prefer moderate, audible sound rather than simply the loudest burst.
        score = -abs(math.log(max(rms,1e-9)/.075))
        if score > best_score or best is None:
            best, best_score = (start, part.copy(), rms, clip), score
    if best is None:
        raise ValueError("Нет достаточно чистого фрагмента: запись слишком тихая или перегружена.")
    start, part, rms, clip = best
    # Small fade prevents clicks; avoid normalization/denoising that changes voice.
    fade = min(round(sample_rate * .025),len(part)//10)
    if fade:
        part[:fade] *= np.linspace(0,1,fade,dtype=np.float32)
        part[-fade:] *= np.linspace(1,0,fade,dtype=np.float32)
    return part, {"start_seconds":round(start/sample_rate,2),
                  "duration_seconds":round(len(part)/sample_rate,2),
                  "rms":round(rms,4),"clipped_fraction":round(clip,6)}


def prepare(input_path: Path, output: Path):
    import soundfile as sf
    if not input_path.is_file():
        raise FileNotFoundError("Не найден WAV-файл: "+str(input_path))
    info = sf.info(str(input_path))
    if info.duration > MAX_SOURCE_SECONDS or info.duration < 5:
        raise ValueError("Нужна запись от 5 секунд до 15 минут.")
    if info.samplerate < 16000 or info.samplerate > 192000 or info.channels not in (1,2):
        raise ValueError("Неподдерживаемая частота или число каналов.")
    if input_path.suffix.lower() not in (".wav",".flac"):
        raise ValueError("Используй WAV или FLAC; данные не отправляются в интернет.")
    samples, rate = sf.read(str(input_path),dtype="float32",always_2d=False)
    clip, stats = clean_segment(samples,rate)
    output.mkdir(parents=True,exist_ok=True)
    reference = output / "wife-reference.wav"
    sf.write(str(reference),clip,rate,subtype="PCM_16")
    return reference,stats


def synthesize(reference: Path, output: Path, *, text: str):
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel
    print("Загружаем Qwen3-TTS Base в CPU. При первом запуске будут скачаны большие веса.")
    model = Qwen3TTSModel.from_pretrained(
        MODEL, device_map="cpu", dtype=torch.float32, attn_implementation="sdpa"
    )
    print("Создаём короткое пробное приветствие...")
    waves, rate = model.generate_voice_clone(
        text=text, language="Russian", ref_audio=str(reference),
        x_vector_only_mode=True
    )
    destination = output / "seyveo-wife-preview.wav"
    sf.write(str(destination), waves[0], rate, subtype="PCM_16")
    return destination


def main(argv=None):
    parser=argparse.ArgumentParser(description="SEYVEO: private consented voice clone preview on local CPU")
    parser.add_argument("recording",type=Path,help="WAV/FLAC recording supplied by the consenting speaker")
    parser.add_argument("--prepare-only",action="store_true",help="Select 12-second clip; no neural model/download")
    parser.add_argument("--out",type=Path,default=default_output())
    parser.add_argument("--text",default=PREVIEW_TEXT)
    args=parser.parse_args(argv)
    if len(args.text)>250 or len(args.text)<5:
        parser.error("Текст должен содержать от 5 до 250 символов.")
    out=args.out.resolve()
    if out==Path.cwd().resolve():
        parser.error("Не сохраняй приватные записи в корне GitHub-проекта.")
    print("Голос жены: используется только с её добровольного согласия.")
    print("Оригинал остаётся на твоём компьютере. Запись не попадёт в GitHub.")
    reference,stats=prepare(args.recording,out)
    print("Выбран фрагмент:",stats,"→",reference)
    if args.prepare_only:
        print("Готово: это только подготовка, модель ещё не запускалась.")
        return 0
    result=synthesize(reference,out,text=args.text)
    (out/"wife-voice-preview.json").write_text(json.dumps({
        "model":MODEL,"mode":"x_vector_only","reference":str(reference),
        "preview":str(result),"text":args.text,"weights_trained":False,
        "app_modified":False,"recording_uploaded":False
    },ensure_ascii=False,indent=2),encoding="utf-8")
    print("Готовое пробное приветствие:",result)
    print("Нейросеть не дообучалась; голос не встроен в приложение.")
    return 0


if __name__=="__main__":
    try:
        raise SystemExit(main())
    except (OSError,ValueError,RuntimeError,ImportError) as exc:
        print("SEYVEO Voice: ошибка —",exc,file=sys.stderr)
        raise SystemExit(1)
