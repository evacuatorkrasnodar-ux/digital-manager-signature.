"""Offline safety checks for SEYVEO approved voice activation (no neural model)."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import approved_voice as voice


class ApprovedVoiceTests(unittest.TestCase):
    def test_fingerprint_matches_exact_approved_candidate(self):
        self.assertEqual(voice.APPROVED_SHA256,
                         "223466c8cbb0d681fbf2bd2d6c3722470576bfbfa6afa110dbdf86dcfa2e9e5f")

    def test_rejects_unapproved_audio_without_writing_anything(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            source = folder / "random.wav"
            source.write_bytes(b"not an approved reference")
            with patch.object(voice, "default_output", return_value=folder / "private"):
                with self.assertRaises(ValueError):
                    voice.install_reference(source)
                self.assertFalse((folder / "private").exists())

    def test_installs_only_separate_copy_and_preserves_source_and_legacy(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            old = folder / "wife-reference.wav"
            old.write_bytes(b"old private voice")
            candidate = folder / "SEYVEO-reference-candidate (2).wav"
            candidate.write_bytes(b"approved private voice")
            with (patch.object(voice, "default_output", return_value=folder),
                  patch.object(voice, "is_approved",
                               side_effect=lambda path: Path(path).read_bytes() == b"approved private voice")):
                dst = voice.install_reference(candidate)
                self.assertEqual(dst, folder / "seyveo-approved-reference.wav")
                self.assertEqual(dst.read_bytes(), candidate.read_bytes())
                self.assertEqual(candidate.read_bytes(), b"approved private voice")
                self.assertEqual(old.read_bytes(), b"old private voice")
                self.assertEqual(voice.app_reference(), dst)
                self.assertEqual(voice.install_reference(candidate), dst)

    def test_app_reference_falls_back_only_when_no_approved_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            with patch.object(voice, "default_output", return_value=folder):
                self.assertEqual(voice.app_reference(), folder / "wife-reference.wav")
                (folder / voice.APPROVED_NAME).write_bytes(b"wrong")
                with self.assertRaisesRegex(ValueError, "повреждён"):
                    voice.app_reference()

    def test_unrelated_audio_is_never_selected(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "unknown.wav").write_bytes(b"some audio")
            with patch.object(voice, "source_folders", return_value=[folder]):
                self.assertIsNone(voice.find_candidate())


if __name__ == "__main__":
    unittest.main()
