"""Private SEYVEO notebook transcription. Local file in, JSON text out.

The Node server validates input and immediately removes the temporary audio
after this worker exits. No audio or transcript is written by this worker.
"""
import json
import os
import sys

os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("DO_NOT_TRACK", "1")


def respond(**data):
    print(json.dumps(data, ensure_ascii=False), flush=True)


def main():
    if len(sys.argv) != 3:
        respond(error="bad-audio")
        return 2
    audio_path, model_name = sys.argv[1:]
    if model_name not in {"tiny", "base", "small", "medium"}:
        respond(error="model-unavailable")
        return 2
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        respond(error="dependency-missing")
        return 3

    # A five-minute note should never spawn an hours-long background job.
    # PyAV ships as a dependency of faster-whisper; no ffmpeg.exe needed.
    try:
        import av
        with av.open(audio_path) as container:
            if container.duration is not None:
                duration = container.duration / 1_000_000
                if duration > 315:
                    respond(error="too-long")
                    return 4
    except Exception:
        respond(error="bad-audio")
        return 4

    try:
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
    except Exception:
        respond(error="model-unavailable")
        return 5
    try:
        segments, _ = model.transcribe(
            audio_path, language="ru", beam_size=3, vad_filter=True,
            condition_on_previous_text=False,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
    except Exception:
        respond(error="bad-audio")
        return 6
    if not text:
        respond(error="no-speech")
        return 7
    respond(text=text[:16000])
    return 0


if __name__ == "__main__":
    sys.exit(main())
