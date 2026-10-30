"""One-off SEYVEO reference A/B voice test. Never modifies the live app or master WAV."""
from __future__ import annotations
import argparse
from datetime import datetime
from pathlib import Path
import os
from clone_wife_voice import MODEL, default_output

TEST_TEXT = "Роман, привет, мой дорогой! Это Сэйви. Как приятно снова тебя слышать. Сегодня мы обязательно придумаем что-нибудь замечательное."

def main(argv=None):
    p=argparse.ArgumentParser(description="SEYVEO approved voice sample test")
    p.add_argument("--reference", type=Path, default=default_output() / "SEYVEO-reference-candidate.wav")
    p.add_argument("--text", default=TEST_TEXT)
    a=p.parse_args(argv)
    ref=a.reference.expanduser().resolve()
    if not ref.is_file():
        # Browsers may save copies as "(1)" or to a redirected Desktop/Downloads.
        home = Path.home()
        roots = [
            default_output(),
            home / "Downloads",
            home / "Desktop",
            Path(os.environ.get("USERPROFILE", str(home))) / "Downloads",
            Path(os.environ.get("USERPROFILE", str(home))) / "Desktop",
            home / "OneDrive" / "Desktop",
            home / "OneDrive" / "Downloads",
        ]
        candidates = []
        for folder in roots:
            if not folder.is_dir():
                continue
            for wav in folder.glob("SEYVEO-reference-candidate*.wav"):
                if wav.is_file():
                    candidates.append(wav)
        if candidates:
            ref = max(candidates, key=lambda path: path.stat().st_mtime).resolve()
            print("Найден образец:", ref, flush=True)
        else:
            print("Не удалось найти образец автоматически. Выбери его в открывшемся окне.", flush=True)
            try:
                import tkinter as tk
                from tkinter import filedialog
                root = tk.Tk()
                root.withdraw()
                root.attributes("-topmost", True)
                selection = filedialog.askopenfilename(
                    parent=root, title="Выбери SEYVEO-reference-candidate.wav",
                    initialdir=str(home / "Downloads" if (home / "Downloads").is_dir() else home),
                    filetypes=[("Звуковые файлы WAV", "*.wav")],
                )
                root.destroy()
                if selection:
                    ref = Path(selection).resolve()
            except Exception as error:
                print("Окно выбора недоступно:", error, flush=True)
    if not ref.is_file():
        p.error("Образец не выбран. Скачай SEYVEO-reference-candidate.wav и повтори запуск.")
    phrase=a.text.strip()
    if not 2 <= len(phrase) <= 240:
        p.error("Тестовая фраза должна содержать 2–240 символов.")
    outdir=default_output()
    outdir.mkdir(parents=True,exist_ok=True)
    output=outdir / ("seyveo-voice-comparison-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f") + ".wav")
    print("SEYVEO: тест нового образца, оригинальные файлы не изменяются.",flush=True)
    print("Образец:",ref,flush=True)
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel
    model=Qwen3TTSModel.from_pretrained(MODEL,device_map="cpu",dtype=torch.float32,attn_implementation="sdpa")
    with torch.inference_mode():
        audio,rate=model.generate_voice_clone(text=phrase,language="Russian",ref_audio=str(ref),x_vector_only_mode=True)
    sf.write(str(output),audio[0],rate,subtype="PCM_16")
    print("Готово! Открой запись:",output,flush=True)

if __name__=="__main__":
    main()
