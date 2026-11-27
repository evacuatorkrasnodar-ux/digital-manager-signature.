"""Local draft lyric transcription. No catalog, no uploads, no model downloads."""
import json
import os
import sys

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

def respond(**data):
    print(json.dumps(data, ensure_ascii=False), flush=True)

def progress(phase, percent=None):
    print(json.dumps({"phase": phase, "percent": percent}), file=sys.stderr, flush=True)

def main():
    if len(sys.argv) != 3 or sys.argv[2] not in {"tiny", "base", "small", "medium"}:
        respond(error="bad-audio")
        return 2
    path, model_name = sys.argv[1:]
    progress("checking")
    try:
        import av
        from faster_whisper import WhisperModel
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
    progress("decoding", 0)
    try:
        segments, _ = model.transcribe(path, beam_size=3, vad_filter=False,
            condition_on_previous_text=False, temperature=0.0, word_timestamps=True)
        lines = []
        last_percent = 0
        for segment in segments:
            # Timeline coverage, not an estimate of remaining CPU time.
            percent = min(99, max(0, int(segment.end / duration * 100)))
            if percent > last_percent:
                last_percent = percent
                progress("decoding", percent)
            text = segment.text.strip()
            if not text or segment.no_speech_prob > .65 or segment.avg_logprob < -1.2:
                continue
            if len(lines) >= 500 or segment.start > 600:
                break
            words = []
            for word in (segment.words or [])[:160]:
                if word.start is None or word.end is None or not word.word.strip():
                    continue
                start = round(max(0, word.start), 3)
                end = round(min(duration, word.end), 3)
                if end > start:
                    words.append({"text": word.word.strip()[:120], "start": start, "end": end})
            lines.append({"time": round(max(0, segment.start), 3), "end": round(min(duration, segment.end), 3), "text": text[:500], "words": words})
        if not lines:
            respond(error="no-speech")
            return 7
        progress("finishing", 99)
        respond(timed=True, lines=lines, draft=True)
        return 0
    except Exception:
        respond(error="bad-audio")
        return 6

if __name__ == "__main__":
    sys.exit(main())
