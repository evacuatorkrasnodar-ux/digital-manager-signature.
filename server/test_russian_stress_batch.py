"""Run: py -3.11 -m unittest discover -s server -p 'test_russian_stress_batch.py'
No RUAccent, downloaded models, TTS or network required.
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SOURCE = Path(__file__).with_name("russian-stress-batch.py")
SPEC = importlib.util.spec_from_file_location("russian_stress_batch", SOURCE)
assert SPEC and SPEC.loader
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class FakeAccentizer:
    def process_all(self, text):
        return {
            "Дверной замок сломался.": "Дверно+й зам+ок слома+лся.",
            "Старинный замок стоял на холме.": "Стари+нный з+амок стоя+л на холме+.",
            "На входной двери установлен запор. Дверной замок сломался.":
                "На входно+й две+ри установле+н запо+р. Дверно+й з+амок слома+лся.",
        }.get(text, text)


class RussianStressBatchTests(unittest.TestCase):
    def test_stress_tokens(self):
        self.assertEqual(mod.stress_on_word("Дверно+й зам+ок.", "замок"), ["зам+ок"])
        self.assertEqual(mod.stress_on_word("Стари+нный з+амок.", "замок"), ["з+амок"])
        self.assertEqual(mod.stress_on_word("Старинный за\u0301мок.", "замок"), ["з+амок"])

    def test_expected_vs_wrong_homograph(self):
        report = mod.run([
            "Дверной замок сломался.",
            "Старинный замок стоял на холме.",
            "На входной двери установлен запор. Дверной замок сломался.",
        ], FakeAccentizer())
        self.assertEqual([row["status"] for row in report],
                         ["pass", "pass", "needs_review"])

    def test_large_benchmark_has_complete_expected_labels(self):
        self.assertGreaterEqual(len(mod.SAMPLES), 36)
        self.assertEqual(len(mod.SAMPLES), len(set(mod.SAMPLES)))
        self.assertEqual(set(mod.SAMPLES), set(mod.EXPECTED))
        for sentence, (word, marked) in mod.EXPECTED.items():
            self.assertEqual(marked.replace("+", ""), word, sentence)
            self.assertEqual(marked.count("+"), 1, sentence)

    def test_unaccented_word_does_not_pass_by_accident(self):
        text = "Дверной замок сломался."
        report = mod.run([text], FakeAccentizer())
        self.assertEqual(report[0]["status"], "pass")
        class NoAccent:
            def process_all(self, phrase):
                return phrase
        report = mod.run([text], NoAccent())
        self.assertEqual(report[0]["status"], "needs_review")

    def test_yo_is_stressed_without_plus(self):
        self.assertTrue(mod.run(["У меня закончилась свёкла."], type("A", (), {"process_all": lambda self, x: x})())[0]["matches_expected"])

    def test_context_review_of_five_known_error_patterns(self):
        examples = [
            ("Пшеничная мука закончилась.", "мука", "мук+а"),
            ("Красивый атлас был сделан из шёлка.", "атлас", "атл+ас"),
            ("Ты мне очень дорога.", "дорога", "дорог+а"),
            ("Вести сообщили прогноз погоды.", "вести", "в+ести"),
            ("Без воды растения могут передохнуть.", "передохнуть", "перед+охнуть"),
        ]
        for phrase, word, marked in examples:
            with self.subTest(phrase=phrase):
                result = mod.suggest_stress(phrase, word)
                self.assertIsNotNone(result)
                self.assertEqual(result["marked"], marked)

    def test_uncertain_sense_gets_no_suggestion(self):
        ambiguous = [
            ("Мука лежит на столе.", "мука"),
            ("Дорога сегодня.", "дорога"),
            ("Вести домой.", "вести"),
            ("Замок на столе.", "замок"),
            ("Атлас на полке.", "атлас"),
        ]
        for phrase, word in ambiguous:
            with self.subTest(phrase=phrase):
                self.assertIsNone(mod.suggest_stress(phrase, word))

    def test_review_suggestion_kept_separate_from_model_result(self):
        phrase = "Пшеничная мука закончилась."
        class WrongAccentizer:
            def process_all(self, text):
                return "Пшен+ичная м+ука зак+ончилась."
        item = mod.run([phrase], WrongAccentizer())[0]
        self.assertEqual(item["status"], "needs_review")
        self.assertEqual(item["stressed"], "Пшен+ичная м+ука зак+ончилась.")
        self.assertTrue(item["suggestion_matches_expected"])
        self.assertEqual(item["review_suggestion"]["marked"], "мук+а")

    def test_unknown_phrase_needs_review(self):
        result = mod.run(["Это тест без эталона."], FakeAccentizer())
        self.assertEqual(result[0]["status"], "review")
        self.assertIsNone(result[0]["matches_expected"])


if __name__ == "__main__":
    unittest.main()
