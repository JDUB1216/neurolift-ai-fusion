"""
NLT LLM Policy Bridge — HTTP Backend for UE5
==============================================
Local LLM inference via Ollama, sends actions to UE5 via HTTP.
"""

import re
import requests
import numpy as np
from typing import Tuple, List, Dict, Optional

import logging
log = logging.getLogger("NLT-LLM")

# Constants
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


def format_avatar_prompt(obs: np.ndarray) -> str:
    return (
        f"Focus:{obs[FOCUS_IDX]:.1f} Stress:{obs[STRESS_IDX]:.1f} "
        f"Burnout:{obs[BURNOUT_IDX]:.1f} Independence:{obs[INDEPENDENCE_IDX]:.1f} "
        f"Success:{obs[SUCCESS_IDX]:.1f}\n"
        f"Move [-1..1] x,y,z. Action: 0=Idle,1=Start,2=Help,3=Complete\n"
        f"MOVE x y z INTERACT i"
    )


def format_aide_prompt(obs: np.ndarray) -> str:
    return (
        f"Focus:{obs[FOCUS_IDX]:.1f} Stress:{obs[STRESS_IDX]:.1f} "
        f"Burnout:{obs[BURNOUT_IDX]:.1f} Independence:{obs[INDEPENDENCE_IDX]:.1f}\n"
        f"0=Pomodoro 1=Ladder 2=Body 3=Intent 4=TwoMin 5=Chunk 6=Refocus 7=Dist 8=Anchor 9=Shrink\n"
        f"STRATEGY i"
    )


def parse_avatar_response(response: str) -> Tuple[np.ndarray, int]:
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
    m = re.search(r'STRATEGY\s+(\d+)', response)
    if m:
        return int(m.group(1)) % len(STRATEGY_NAMES)
    return 0


class UE5HTTPClient:
    def __init__(self, base_url: str = "http://localhost:8765"):
        self.base_url = base_url
        self._session = requests.Session()

    def send_action(self, move_x: float, move_y: float, move_z: float,
                     interact: int, avatar_id: str = "") -> Dict:
        try:
            resp = self._session.post(
                f"{self.base_url}/api/avatar/action",
                json={
                    "avatar_id": avatar_id,
                    "move_x": float(move_x),
                    "move_y": float(move_y),
                    "move_z": float(move_z),
                    "interact": int(interact),
                },
                timeout=5,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            log.error(f"Failed to send action to UE5: {e}")
            return {"ok": False, "error": str(e)}


class OllamaClient:
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
                log.warning(f"Model '{self.model}' not in Ollama.")
        except Exception as e:
            log.error(f"Cannot reach Ollama: {e}")

    def complete(self, prompt: str, max_tokens: int = 32) -> str:
        try:
            resp = self._session.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"num_predict": max_tokens, "temperature": 0.3, "top_k": 10}
                },
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
        except Exception as e:
            log.error(f"Ollama inference failed: {e}")
            return ""


class AvatarLLMPolicy:
    def __init__(self, client: OllamaClient):
        self.client = client

    def __call__(self, obs: np.ndarray) -> Tuple[np.ndarray, int]:
        prompt = format_avatar_prompt(obs)
        response = self.client.complete(prompt, max_tokens=32)
        if not response:
            return np.zeros(3, dtype=np.float32), 0
        return parse_avatar_response(response)


class AideLLMPolicy:
    def __init__(self, client: OllamaClient):
        self.client = client

    def __call__(self, obs: np.ndarray) -> int:
        prompt = format_aide_prompt(obs)
        response = self.client.complete(prompt, max_tokens=16)
        if not response:
            return 0
        return parse_aide_response(response)
