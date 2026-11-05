"""Conservative context-specific stress suggestions for offline review ONLY.

Never rewrites the TTS input and never claims full Russian disambiguation.
A suggestion is not evidence that the speech synthesizer obeys stress marks.
"""
from __future__ import annotations

import re

# Rule: (target word, marked stress, required lexical cues).
# The cues are narrow on purpose; ambiguous examples return no suggestion.
RULES = [
    ("мука", "мук+а", (r"\bпшеничн\w*\b", r"\b(?:для|при)\s+выпечк\w*\b")),
    ("атлас", "атл+ас", (r"\bшелк\w*\b", r"\bш[её]лк\w*\b", r"\bткан\w*\b")),
    ("дорога", "дорог+а", (r"\bты\s+мне\s+очень\s+дорога\b",)),
    ("вести", "в+ести", (r"\bвести\s+сообщил\w*\b", r"\bновост\w*\b")),
    ("передохнуть", "перед+охнуть", (r"\b(?:растени\w*|животн\w*|рыб\w*)\s+могут\s+передохнуть\b",)),
]


def suggest_stress(text: str, word: str):
    """Return review-only {word, marked, basis}, or None when uncertain."""
    if not isinstance(text, str) or not isinstance(word, str):
        return None
    if len(text) > 2000:
        return None
    for target, marked, cues in RULES:
        if target != word.lower():
            continue
        if not re.search(r"(?<![а-яё])" + re.escape(target) + r"(?![а-яё])", text, re.I):
            continue
        for cue in cues:
            if re.search(cue, text, re.I):
                return {"word": target, "marked": marked, "basis": "narrow-context-rule"}
    return None
