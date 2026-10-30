#!/usr/bin/env python3
"""Experimental GPU LoRA trainer for auto-school data.

This file NEVER runs automatically as part of SEYVEO. Only --train starts
real optimization. Base weights are loaded from an explicit open-weight model.
No Hub upload, no user data collection, no production deployment.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


BASE_MODEL = "Qwen/Qwen3-4B-Instruct-2507"
MIN_EXAMPLES = 100


def default_data() -> Path:
    if os.name == "nt":
        base = Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local")))
    else:
        base = Path.home() / ".local/state"
    return base / "SEYVEO" / "auto-school" / "experimental-sft.jsonl"


def read_examples(path: Path) -> list[dict]:
    if not path.is_file():
        raise ValueError("Training data not found: " + str(path))
    if path.stat().st_size > 15_000_000:
        raise ValueError("Experimental data file is too large")
    examples = []
    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            sample = json.loads(line)
            prompt, completion = sample["prompt"], sample["completion"]
            if not isinstance(prompt, list) or not isinstance(completion, list):
                raise ValueError("Invalid message type")
            if len(prompt) != 1 or len(completion) != 1:
                raise ValueError("Unexpected number of messages")
            if prompt[0].get("role") != "user" or completion[0].get("role") != "assistant":
                raise ValueError("Invalid role")
            q, a = prompt[0]["content"], completion[0]["content"]
            if not isinstance(q, str) or not isinstance(a, str):
                raise ValueError("Invalid answer type")
            if not (25 <= len(q) <= 550 and 35 <= len(a) <= 1600):
                raise ValueError("Invalid answer length")
            examples.append({"prompt": prompt, "completion": completion})
        except (ValueError, KeyError, TypeError, IndexError) as error:
            raise ValueError(f"Invalid training row {index}: {error}") from error
    if len(examples) < MIN_EXAMPLES:
        raise ValueError(f"Need at least {MIN_EXAMPLES} candidate examples. Found {len(examples)}.")
    return examples


def main() -> None:
    parser = argparse.ArgumentParser(description="SEYVEO experimental GPU LoRA adapter trainer")
    parser.add_argument("--data", type=Path, default=default_data())
    parser.add_argument("--output", type=Path, default=Path("seyveo-experimental-adapter"))
    parser.add_argument("--train", action="store_true", help="Actually load GPU model and train")
    args = parser.parse_args()

    examples = read_examples(args.data)
    print(f"SEYVEO: {len(examples)} synthetic examples validated.")
    print(f"Base: {BASE_MODEL} (must match the deployed base before any adapter is used).")
    print("Dataset is experimental; teacher-generated labels may be wrong.")
    if not args.train:
        print("Dry check only. Use --train with supported NVIDIA CUDA GPU to train an adapter.")
        return

    # Imported only after explicit --train, never during a basic dataset check.
    import torch
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU required. This script does not train on an i5 CPU.")
    from datasets import Dataset
    from peft import LoraConfig
    from transformers import BitsAndBytesConfig
    from trl import SFTConfig, SFTTrainer

    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    dataset = Dataset.from_list(examples).train_test_split(test_size=0.1, seed=42)
    quant = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=dtype,
        bnb_4bit_use_double_quant=True,
    )
    config = SFTConfig(
        output_dir=str(args.output.resolve()),
        num_train_epochs=1,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=1e-4,
        max_length=1024,
        completion_only_loss=True,
        assistant_only_loss=True,
        model_init_kwargs={"dtype": dtype},
        fp16=dtype == torch.float16,
        bf16=dtype == torch.bfloat16,
        report_to="none",
        save_strategy="epoch",
        eval_strategy="epoch",
    )
    adapter = LoraConfig(
        r=8, lora_alpha=16, lora_dropout=0.05,
        bias="none", task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "up_proj", "down_proj", "gate_proj"],
    )
    trainer = SFTTrainer(
        model=BASE_MODEL, args=config,
        train_dataset=dataset["train"], eval_dataset=dataset["test"],
        quantization_config=quant, peft_config=adapter
    )
    trainer.train()
    trainer.save_model(str(args.output.resolve()))
    print("Experimental LoRA adapter saved. No deployment or Hub upload performed.")
    print("Before release: separate holdout evaluation, privacy and safety review, base-model compatibility.")


if __name__ == "__main__":
    main()
