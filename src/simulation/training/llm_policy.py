"""
NLT LLM Policy Bridge — Ollama Backend
=======================================
Local LLM inference for avatar control via Ollama.

Optimized for qwen2.5:1.5B — uses "game engine" role prompting
to get structured action output without safety filter issues.

Usage:
    python3 train_nlt.py --llm --ollama-model qwen2.5:1.5b --agents 20 --iterations 1000
"""

import os
import re
import json
import time
import logging
import requests
import numpy as np
from typing import Tuple, Optional

log = logging.getLogger("NLT-LLM")

# ---------------------------------------------------------------------------
# Constants (must match UE5 codebase)
# ---------------------------------------------------------------------------

OBS_DIM = 13
AVATAR_CONTINUOUS_DIM = 3
AVATAR_DISCRETE_DIM = 4
AIDE_DISCRETE_DIM = 10

FOCUS_IDX = 0
LOAD_IDX = 1
STRESS_IDX = 2
BURNOUT_IDX = 3
INDEPENDENCE_IDX = 4
FUSION_IDX = 5
SUCCESS_IDX = 6

INTERACTION_NAMES = ["Idle", "StartTask", "RequestHelp", "CompleteTask"]
STRATEGY_NAMES = [
    "Pomodoro", "LadderStep", "BodyDouble", "ImplementationIntent",
    "TwoMinuteStart", "TaskChunking", "MindfulRefocus",
    "DistractionImmune", "AttentionAnchor", "ShrinkTheTask",
]

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

def format_avatar_prompt(obs: np.ndarray) -> str:
    """Game-engine style prompt for avatar action selection."""
    return (
        f"You are a game engine AI controlling an avatar.\n"
        f"State: focus={obs[FOCUS_IDX]:.1f}, stress={obs[STRESS_IDX]:.1f}, "
        f"burnout={obs[BURNOUT_IDX]:.1f}, independence={obs[INDEPENDENCE_IDX]:.1f}\n"
        f"Choose movement direction (x,y,z from -1 to 1) and action "
        f"(0=Idle,1=StartTask,2=Help,3=CompleteTask)\n"
        f"Reply in format: MOVE x y z INTERACT i"
    )


def format_aide_prompt(obs: np.ndarray) -> str:
    """Game-engine style prompt for aide strategy selection."""
    return (
        f"You are a game engine AI controlling an aide coach.\n"
        f"Avatar state: focus={obs[FOCUS_IDX]:.1f}, stress={obs[STRESS_IDX]:.1f}, "
        f"burnout={obs[BURNOUT_IDX]:.1f}, independence={obs[INDEPENDENCE_IDX]:.1f}\n"
        f"Choose strategy: 0=Pomodoro,1=LadderStep,2=BodyDouble,3=Intent,4=TwoMin,"
        f"5=Chunk,6=Refocus,7=DistractImmune,8=Anchor,9=ShrinkTask\n"
        f"Reply in format: STRATEGY i"
    )


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def parse_avatar_response(response: str) -> Tuple[np.ndarray, int]:
    """Parse: MOVE x y z INTERACT i"""
    move = np.zeros(3, dtype=np.float32)
    interaction = 0

    m = re.search(r'MOVE\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)', response)
    if m:
        move = np.clip(np.array([float(m.group(1)), float(m.group(2)), float(m.group(3))]), -1.0, 1.0).astype(np.float32)

    i = re.search(r'INTERACT\s+(\d+)', response)
    if i:
        interaction = int(i.group(1)) % len(INTERACTION_NAMES)

    return move, interaction


def parse_aide_response(response: str) -> int:
    """Parse: STRATEGY i"""
    m = re.search(r'STRATEGY\s+(\d+)', response)
    if m:
        return int(m.group(1)) % len(STRATEGY_NAMES)
    return 0


# ---------------------------------------------------------------------------
# Ollama Client
# ---------------------------------------------------------------------------

class OllamaClient:
    """Local LLM inference via Ollama."""

    def __init__(self, model: str = "qwen2.5:1.5b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self._session = requests.Session()
        self._verify_model()

    def _verify_model(self):
        try:
            resp = self._session.get(f"{self.base_url}/api/tags", timeout=5)
            resp.raise_for_status()
            models = [m['name'] for m in resp.json().get('models', [])]
            if self.model not in models:
                log.warning(f"Model '{self.model}' not in Ollama. Run: ollama pull {self.model}")
        except Exception as e:
            log.error(f"Cannot reach Ollama at {self.base_url}: {e}")

    def complete(self, prompt: str, max_tokens: int = 32) -> str:
        try:
            resp = self._session.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": 0.3,
                        "top_k": 10,
                        "repeat_penalty": 1.1,
                    }
                },
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
        except Exception as e:
            log.error(f"Ollama inference failed: {e}")
            return ""


# ---------------------------------------------------------------------------
# Policy Classes
# ---------------------------------------------------------------------------

class AvatarLLMPolicy:
    """LLM-based policy for Avatar (replaces PyTorch AvatarPolicy)."""

    def __init__(self, client: OllamaClient):
        self.client = client

    def __call__(self, obs: np.ndarray) -> Tuple[np.ndarray, int]:
        prompt = format_avatar_prompt(obs)
        response = self.client.complete(prompt, max_tokens=32)
        if not response:
            return np.zeros(3, dtype=np.float32), 0
        log.debug(f"Avatar LLM: {response.strip()}")
        return parse_avatar_response(response)


class AideLLMPolicy:
    """LLM-based policy for Aide (replaces PyTorch AidePolicy)."""

    def __init__(self, client: OllamaClient):
        self.client = client

    def __call__(self, obs: np.ndarray) -> int:
        prompt = format_aide_prompt(obs)
        response = self.client.complete(prompt, max_tokens=16)
        if not response:
            return 0
        log.debug(f"Aide LLM: {response.strip()}")
        return parse_aide_response(response)
