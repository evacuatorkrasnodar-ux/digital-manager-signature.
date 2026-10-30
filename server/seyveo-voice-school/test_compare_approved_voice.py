"""Offline tests of SEYVEO master-file discovery; no private sound or model needed."""
import tempfile
import unittest
from pathlib import Path
import runpy

# The utility filename is compare-approved-voice.py, with hyphens.
find_recording = runpy.run_path(str(Path(__file__).with_name("compare-approved-voice.py")))["find_recording"]


class CompareVoiceDiscoveryTests(unittest.TestCase):
    def test_gold_master_in_downloads_is_recognized(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            master = folder / "SEYVEO-VOICE-GOLD-MASTER.wav"
            master.write_bytes(b"test")
            self.assertEqual(find_recording([folder]), master)

    def test_previously_approved_short_candidate_has_priority(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            master = folder / "SEYVEO-VOICE-GOLD-MASTER.wav"
            candidate = folder / "SEYVEO-reference-candidate (1).wav"
            master.write_bytes(b"test")
            candidate.write_bytes(b"test")
            self.assertEqual(find_recording([folder]), candidate)

    def test_unrelated_wav_is_never_selected_automatically(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "unknown.wav").write_bytes(b"test")
            self.assertIsNone(find_recording([folder]))


if __name__ == "__main__":
    unittest.main()
