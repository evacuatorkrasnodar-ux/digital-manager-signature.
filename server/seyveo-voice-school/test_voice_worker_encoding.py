"""Verify that SEYVEO's Russian voice commands survive Windows codepages.

This test does not load a model or use the private voice recording.
"""
import json
import os
import subprocess
import sys
import unittest


class VoiceUtf8TransportTests(unittest.TestCase):
    def test_russian_text_round_trip_even_when_default_is_cp1251(self):
        message = "Привет, Роман! Сэйви говорит по-русски. " * 10
        command = (
            "import json,sys; "
            "from voice_worker import configure_stdio; "
            "configure_stdio(); "
            "item=json.loads(sys.stdin.readline()); "
            "print(json.dumps(item,ensure_ascii=True),flush=True)"
        )
        env = dict(os.environ, PYTHONIOENCODING="cp1251")
        result = subprocess.run(
            [sys.executable, "-c", command], input=json.dumps(
                {"id": 1, "text": message}, ensure_ascii=False
            ) + "\n", text=True, encoding="utf-8", capture_output=True,
            env=env, timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["text"], message)

    def test_voice_protocol_uses_utf8_and_ascii_safe_json(self):
        from voice_worker import reply
        import io
        from contextlib import redirect_stdout

        output = io.StringIO()
        with redirect_stdout(output):
            reply({"type": "error", "id": 2, "error": "Ошибка: русский текст"})
        raw = output.getvalue()
        self.assertTrue(raw.isascii())
        self.assertEqual(json.loads(raw)["error"], "Ошибка: русский текст")


if __name__ == "__main__":
    unittest.main()
