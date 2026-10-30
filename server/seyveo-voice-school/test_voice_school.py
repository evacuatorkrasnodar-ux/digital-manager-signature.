"""Offline stdlib tests: no TTS, Whisper, GPU, downloads or microphones."""
import json
import math
import tempfile
import unittest
import wave
from pathlib import Path

from voice_school import PHRASES, VOICE_NAME, assess, available_cases, lock_reference, main, normalize, wav_quality, word_error_rate
from speak import reference_from


def make_wave(path, seconds=1, amplitude=4000, rate=24000):
    import struct
    import math
    samples = int(rate * seconds)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        buf = bytearray()
        for index in range(samples):
            value = int(amplitude * math.sin(index * 2 * math.pi * 200 / rate))
            buf.extend(struct.pack("<h", value))
        output.writeframes(bytes(buf))


class VoiceSchoolTest(unittest.TestCase):
    def test_profile_is_female_one_voice_and_russian(self):
        self.assertEqual(VOICE_NAME, "SEYVEO")
        self.assertTrue(any("Роман" in x[1] for x in PHRASES))
        self.assertEqual(len(available_cases()), 6)
        self.assertIn("feminine", __import__("voice_school").VOICE_PROFILE)
        self.assertEqual(normalize("Ёж, РОМАН!"), ["еж", "роман"])

    def test_word_recognition_and_audio_health(self):
        self.assertEqual(word_error_rate("Привет, Сэйви!", "Привет Сэйви"), 0.0)
        self.assertEqual(word_error_rate("Ты рядом", "Ты далеко"), 0.5)
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "test.wav"
            make_wave(path)
            info = wav_quality(path)
            self.assertTrue(info["valid"])
            self.assertEqual(assess("Привет Сэйви", "Привет Сэйви", info)["pass"], True)
            self.assertFalse(assess("Привет Сэйви", "Привет клиент", info)["pass"])
            silent = Path(temp) / "silent.wav"
            make_wave(silent, amplitude=0)
            self.assertFalse(wav_quality(silent)["valid"])

    def test_synthetic_lock_allows_only_generated_and_owner_selected_reference(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            make_wave(folder / "voice_1_hello.wav")
            (folder / "report.json").write_text(
                json.dumps({"candidates": [{"id": "voice_1", "synthetic": True}]}),
                encoding="utf-8"
            )
            with self.assertRaises(ValueError):
                lock_reference(folder, "../../another-file")
            info = lock_reference(folder, "voice_1")
            self.assertTrue(info["human_reviewed"])
            ref, text = reference_from(folder)
            self.assertEqual(ref.name, "selected-reference.wav")
            self.assertEqual(text, PHRASES[0][1])

    def test_plan_does_not_download_or_generate(self):
        with tempfile.TemporaryDirectory() as temp:
            self.assertEqual(main(["--plan", "--out", temp]), 0)
            self.assertFalse((Path(temp) / "report.json").exists())


if __name__ == "__main__":
    unittest.main()
