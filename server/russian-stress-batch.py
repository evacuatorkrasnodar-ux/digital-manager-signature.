"""SEYVEO · optional offline Russian stress analyzer (NOT part of voice synthesis).

Run from repository root:
    py -3.11 -m pip install ruaccent
    py -3.11 server/russian-stress-batch.py
    py -3.11 server/russian-stress-batch.py --input my-phrases.txt --output stress-report.jsonl

The optional RUAccent model/dictionary can download at first run; thereafter it
runs locally on CPU. This file never invokes voice_worker.py, TTS or cloud chat.
License of third-party weights/data must be verified separately before bundling.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
import importlib.util

REVIEW_PATH = Path(__file__).with_name('russian-stress-review.py')
REVIEW_SPEC = importlib.util.spec_from_file_location('seyveo_stress_review', REVIEW_PATH)
assert REVIEW_SPEC and REVIEW_SPEC.loader
REVIEW_MODULE = importlib.util.module_from_spec(REVIEW_SPEC)
REVIEW_SPEC.loader.exec_module(REVIEW_MODULE)
suggest_stress = REVIEW_MODULE.suggest_stress

SAMPLES = [
    "Дверной замок сломался.",
    "На входной двери установлен запор. Дверной замок сломался.",
    "Старинный замок стоял на холме.",
    "На двери висит замок.",
    "Я купил замок для входной двери.",
    "Рыцарь увидел замок на горе.",
    "Пшеничная мука закончилась.",
    "Его мучила сильная мука.",
    "Географический атлас лежал на столе.",
    "Красивый атлас был сделан из шёлка.",
    "Он звонит и читает каталог.",
    "Подпиши договор и открой каталог.",
    "Я плачу за покупку картой.",
    "Я плачу от радости.",
    "Эта дорога ведёт к дому.",
    "Ты мне очень дорога.",
    "Нужно вести переговоры.",
    "Вести сообщили прогноз погоды.",
    "Он стоит возле магазина.",
    "Этот товар стоит недорого.",
    "Завтра можно передохнуть после работы.",
    "Без воды растения могут передохнуть.",
    "Это хороший квартал для жизни.",
    "Завтра начинается новый квартал.",
    "Она снова звонит по телефону.",
    "Открой каталог продукции.",
    "Мы подписали договор аренды.",
    "Купили торты к празднику.",
    "Она выглядит красивее сегодня.",
    "На окне новые жалюзи.",
    "У меня закончилась свёкла.",
    "У нас достаточно средств для работы.",
    "На складе лежит мука для выпечки.",
    "Его душевная мука не отпускала.",
    "Путешественник осмотрел старинный замок.",
    "Ключ не подходит к дверному замку.",
]
EXPECTED = {
    "Дверной замок сломался.": ("замок", "зам+ок"),
    "На входной двери установлен запор. Дверной замок сломался.": ("замок", "зам+ок"),
    "Старинный замок стоял на холме.": ("замок", "з+амок"),
    "На двери висит замок.": ("замок", "зам+ок"),
    "Я купил замок для входной двери.": ("замок", "зам+ок"),
    "Рыцарь увидел замок на горе.": ("замок", "з+амок"),
    "Пшеничная мука закончилась.": ("мука", "мук+а"),
    "Его мучила сильная мука.": ("мука", "м+ука"),
    "Географический атлас лежал на столе.": ("атлас", "+атлас"),
    "Красивый атлас был сделан из шёлка.": ("атлас", "атл+ас"),
    "Он звонит и читает каталог.": ("каталог", "катал+ог"),
    "Подпиши договор и открой каталог.": ("каталог", "катал+ог"),
    "Я плачу за покупку картой.": ("плачу", "плач+у"),
    "Я плачу от радости.": ("плачу", "пл+ачу"),
    "Эта дорога ведёт к дому.": ("дорога", "дор+ога"),
    "Ты мне очень дорога.": ("дорога", "дорог+а"),
    "Нужно вести переговоры.": ("вести", "вест+и"),
    "Вести сообщили прогноз погоды.": ("вести", "в+ести"),
    "Он стоит возле магазина.": ("стоит", "сто+ит"),
    "Этот товар стоит недорого.": ("стоит", "ст+оит"),
    "Завтра можно передохнуть после работы.": ("передохнуть", "передохн+уть"),
    "Без воды растения могут передохнуть.": ("передохнуть", "перед+охнуть"),
    "Это хороший квартал для жизни.": ("квартал", "кварт+ал"),
    "Завтра начинается новый квартал.": ("квартал", "кварт+ал"),
    "Она снова звонит по телефону.": ("звонит", "звон+ит"),
    "Открой каталог продукции.": ("каталог", "катал+ог"),
    "Мы подписали договор аренды.": ("договор", "догов+ор"),
    "Купили торты к празднику.": ("торты", "т+орты"),
    "Она выглядит красивее сегодня.": ("красивее", "крас+ивее"),
    "На окне новые жалюзи.": ("жалюзи", "жалюз+и"),
    "У меня закончилась свёкла.": ("свёкла", "св+ёкла"),
    "У нас достаточно средств для работы.": ("средств", "ср+едств"),
    "На складе лежит мука для выпечки.": ("мука", "мук+а"),
    "Его душевная мука не отпускала.": ("мука", "м+ука"),
    "Путешественник осмотрел старинный замок.": ("замок", "з+амок"),
    "Ключ не подходит к дверному замку.": ("замку", "замк+у"),
}

# RUAccent writes "+" BEFORE the stressed vowel: зам+ок, з+амок.
# Keep this representation out of the approved Qwen3-TTS text path.
STRESS_MARK = "+"
ACUTE = "\u0301"
VOWELS = set("аеёиоуыэюяАЕЁИОУЫЭЮЯ")


def normalise_marks(value: str) -> str:
    """Turn combining acute notation into RUAccent's leading-plus notation."""
    result = []
    for char in value:
        if char == ACUTE and result and result[-1] in VOWELS:
            vowel = result.pop()
            result.extend((STRESS_MARK, vowel))
        else:
            result.append(char)
    return "".join(result)


def stress_on_word(text: str, word: str) -> list[str]:
    """Return exact word tokens containing the expected base spelling."""
    fragments = re.findall(r"[А-Яа-яЁё+\u0301]+", normalise_marks(text))
    return [token.lower() for token in fragments
            if token.lower().replace(STRESS_MARK, "").replace(ACUTE, "") == word.lower()]


def load_accentizer(model_size: str):
    try:
        from ruaccent import RUAccent
    except ImportError as error:
        raise RuntimeError(
            "RUAccent не установлен. Установи отдельно: py -3.11 -m pip install ruaccent"
        ) from error
    engine = RUAccent()
    engine.load(omograph_model_size=model_size, use_dictionary=True, device="CPU")
    return engine


def run(inputs: list[str], engine) -> list[dict]:
    report = []
    for phrase in inputs:
        if not phrase.strip():
            continue
        try:
            stressed = engine.process_all(phrase)
            if not isinstance(stressed, str):
                raise TypeError("Ожидался текст ударений")
            expected = EXPECTED.get(phrase)
            tokens = stress_on_word(stressed, expected[0]) if expected else []
            correct = (expected[1] in tokens or ("+ё" in expected[1] and expected[1].replace("+", "") in tokens)) if expected else None
            suggestion = suggest_stress(phrase, expected[0]) if expected and not correct else None
            report.append({
                "text": phrase,
                "stressed": stressed,
                "expected_word": expected[0] if expected else None,
                "expected_marked": expected[1] if expected else None,
                "matches_expected": correct,
                "review_suggestion": suggestion,
                "suggestion_matches_expected": (suggestion["marked"] == expected[1]) if suggestion and expected else None,
                "status": "review" if not expected else ("pass" if correct else "needs_review"),
            })
        except Exception as error:
            report.append({"text": phrase, "status": "error",
                           "error": type(error).__name__ + ": " + str(error)[:180]})
    return report


def main():
    parser = argparse.ArgumentParser(description="Offline Russian stress evaluation")
    parser.add_argument("--input", type=Path, help="UTF-8 text file, one phrase per line")
    parser.add_argument("--output", type=Path, default=Path("stress-report.jsonl"))
    parser.add_argument("--model-size", default="tiny", choices=["tiny", "tiny2", "turbo2", "turbo3.1"])
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate dataset and write review report without RUAccent")
    args = parser.parse_args()
    phrases = (args.input.read_text(encoding="utf-8").splitlines()
               if args.input else SAMPLES)
    phrases = [x.strip() for x in phrases if x.strip()][:1000]
    if args.dry_run:
        report = [{"text": x, "status": "not_generated",
                   "expected_marked": EXPECTED.get(x, (None, None))[1]} for x in phrases]
    else:
        try:
            engine = load_accentizer(args.model_size)
        except Exception as error:
            print(str(error), file=sys.stderr)
            return 2
        report = run(phrases, engine)
    if args.output.is_symlink():
        print("Отказ: выходной путь является символической ссылкой.", file=sys.stderr)
        return 3
    args.output.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in report),
        encoding="utf-8",
    )
    matched = sum(row.get("status") == "pass" for row in report)
    wrong = sum(row.get("status") == "needs_review" for row in report)
    ungraded = sum(row.get("status") in {"review", "not_generated"} for row in report)
    errors = sum(row.get("status") == "error" for row in report)
    graded = matched + wrong
    print(f"Обработано: {len(report)}; эталонов: {graded}; верно: {matched}; "
          f"неверно: {wrong}; без оценки: {ungraded}; ошибок программы: {errors}.")
    if graded:
        print(f"Точность на выбранных целевых словах: {matched}/{graded} ({matched / graded:.1%}).")
    print(f"Отчёт: {args.output}")
    print("Это проверка расстановки ударений, НЕ проверка звучания Qwen3-TTS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
