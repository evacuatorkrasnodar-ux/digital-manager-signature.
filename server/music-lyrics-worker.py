"""Local draft lyric transcription. No catalog, no uploads, no model downloads."""
import json
import os
import sys
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

def respond(**data):
    print(json.dumps(data, ensure_ascii=False), flush=True)

def progress(phase, percent=None):
    print(json.dumps({"phase": phase, "percent": percent}), file=sys.stderr, flush=True)

def separate_vocals(path, decode_audio):
    """Use only the locally installed checkpoint. No network or audio export."""
    checkpoint = Path(__file__).resolve().parent / ".venv-seyveo-asr" / "seyveo-vocals.pt"
    if not checkpoint.is_file():
        return None
    import numpy as np
    import torch
    import torchaudio
    from torchaudio.models import hdemucs_high
    torch.set_num_threads(3)
    model = hdemucs_high(sources=["drums", "bass", "other", "vocals"])
    model.load_state_dict(torch.load(checkpoint, map_location="cpu", weights_only=True))
    model.eval()
    left, right = decode_audio(path, sampling_rate=44100, split_stereo=True)
    stereo = torch.from_numpy(np.stack((left, right))).float()
    if stereo.shape[-1] == 0:
        return None
    # Short chunks with context keep memory bounded and preserve exact timing.
    rate = 44100
    core = 8 * rate
    context = rate
    ref = stereo.mean(0)
    mean, std = ref.mean(), ref.std().clamp_min(1e-5)
    stereo = (stereo - mean) / std
    output = torch.empty(stereo.shape[-1], dtype=torch.float32)
    vocal_index = model.sources.index("vocals")
    with torch.inference_mode():
        for start in range(0, stereo.shape[-1], core):
            end = min(start + core, stereo.shape[-1])
            lo, hi = max(0, start - context), min(stereo.shape[-1], end + context)
            chunk = stereo[:, lo:hi].unsqueeze(0)
            pred = model(chunk)[0, vocal_index].mean(0)
            output[start:end] = pred[start-lo:end-lo] * std
            progress("separating", min(35, int(end / stereo.shape[-1] * 35)))
        output = torchaudio.functional.resample(output, rate, 16000)
        peak = output.abs().max().item()
        if peak < 1e-4 or not torch.isfinite(output).all():
            return None
        return (output / max(peak, .1)).numpy()

def main():
    if len(sys.argv) != 3 or sys.argv[2] not in {"tiny", "base", "small", "medium"}:
        respond(error="bad-audio")
        return 2
    path, model_name = sys.argv[1:]
    progress("checking")
    try:
        import av
        from faster_whisper import WhisperModel
        from faster_whisper.audio import decode_audio
    except ImportError:
        respond(error="dependency-missing")
        return 3
    try:
        with av.open(path) as container:
            if container.duration is None or not 0 < container.duration <= 600_000_000:
                respond(error="too-long")
                return 4
            duration = container.duration / 1_000_000
    except Exception:
        respond(error="bad-audio")
        return 4
    progress("loading")
    try:
        # Keep CPU resources free for the UI and audio playback.
        model = WhisperModel(model_name, device="cpu", compute_type="int8",
                             cpu_threads=3, num_workers=1, local_files_only=True)
    except Exception:
        respond(error="model-unavailable")
        return 5
    try:
        mix = decode_audio(path, sampling_rate=16000)
        audio = mix
        separated = False
        attempted = False
        if (Path(__file__).resolve().parent / ".venv-seyveo-asr" / "seyveo-vocals.pt").is_file():
            progress("separating", 0)
            attempted = True
            try:
                vocals = separate_vocals(path, decode_audio)
                if vocals is not None and abs(len(vocals) - len(mix)) <= 1600:
                    audio = vocals
                    separated = True
            except Exception:
                # The standard engine stays usable if the optional model fails.
                pass
        progress("decoding", 35 if attempted else 0)
        duration = min(duration, len(mix) / 16000)
        lines = []
        last_percent = 0

        def decode_part(samples, offset, language=None, report=False):
            nonlocal last_percent
            segments, info = model.transcribe(samples, language=language,
                beam_size=3, vad_filter=False, condition_on_previous_text=False,
                temperature=0.0, word_timestamps=True,
                no_speech_threshold=0.8, log_prob_threshold=-1.5)
            found = []
            for segment in segments:
                if report:
                    base = 35 if attempted else 0
                    percent = min(74, max(base, base + int((offset + segment.end) / duration * (75 - base))))
                    if percent > last_percent:
                        last_percent = percent
                        progress("decoding", percent)
                text = segment.text.strip()
                # Music can mask voices: don't discard solely on a speech probability.
                if not text or segment.avg_logprob < -1.65 or (
                    segment.no_speech_prob > .9 and segment.avg_logprob < -1.0):
                    continue
                start = round(max(0, offset + segment.start), 3)
                end = round(min(duration, offset + segment.end), 3)
                if end <= start or start >= 600:
                    continue
                words = []
                for word in (segment.words or [])[:160]:
                    if word.start is None or word.end is None or not word.word.strip():
                        continue
                    ws = round(max(0, offset + word.start), 3)
                    we = round(min(duration, offset + word.end), 3)
                    if we > ws:
                        words.append({"text": word.word.strip()[:120], "start": ws, "end": we})
                found.append({"time": start, "end": end, "text": text[:500], "words": words})
                if len(found) >= 500:
                    break
            return found, getattr(info, "language", None)

        lines, language = decode_part(audio, 0, report=True)
        if separated and not lines:
            audio = mix
            separated = False
            lines, language = decode_part(audio, 0, report=True)
        # Re-decode uncovered intervals independently, rather than assuming
        # that a long instrumental passage means all remaining vocals are absent.
        gaps = []
        cursor = 0.0
        for line in sorted(lines, key=lambda x: x["time"]):
            if line["time"] - cursor >= 14:
                gaps.append((cursor, line["time"]))
            cursor = max(cursor, line["end"])
        if duration - cursor >= 14:
            gaps.append((cursor, duration))
        windows = []
        for left, right in gaps:
            pos = left
            while right - pos >= 7:
                stop = min(right, pos + 25)
                windows.append((pos, stop))
                if stop >= right:
                    break
                pos = stop
        # Bound the repair pass on long tracks; leave remaining gaps explicit.
        windows = windows[:10]
        for i, (left, right) in enumerate(windows):
            # Recover words missed by separation from the original mix.
            samples = mix if separated else audio
            found, _ = decode_part(samples[int(left * 16000):int(right * 16000)], left, language)
            for line in found:
                if not any(min(line["end"], old["end"]) - max(line["time"], old["time"]) > .35
                           for old in lines):
                    lines.append(line)
            progress("decoding", min(98, 75 + int(23 * (i + 1) / max(1, len(windows)))))
        lines = sorted(lines, key=lambda x: x["time"])[:500]
        if not lines:
            respond(error="no-speech")
            return 7
        progress("finishing", 99)
        respond(timed=True, lines=lines, draft=True, recognitionVersion=3 if separated else 2,
                vocalAttempted=attempted, vocalMode='separated' if separated else 'mix', duration=round(duration, 3))
        return 0
    except Exception:
        respond(error="bad-audio")
        return 6

if __name__ == "__main__":
    sys.exit(main())
