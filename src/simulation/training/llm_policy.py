"""
NLT LLM Policy Bridge
======================
Replaces PyTorch policy network inference with LLM API calls.

Connects to UE5's Learning Agents via shared-memory communicator.
The LLM receives formatted observations and returns actions.

Usage:
    python3 train_nlt.py --llm --model claude-sonnet-4-20250514 --agents 20 --iterations 1000
"""

import os
import re
import json
import time
import logging
import numpy as np
from typing import Tuple, Optional

log = logging.getLogger("NLT-LLM")

# ---------------------------------------------------------------------------
# Observation → Text Formatter
# ---------------------------------------------------------------------------

# Cognitive dimension indices (must match LTCognitiveStateComponent.h)
FOCUS_IDX = 0
LOAD_IDX = 1
STRESS_IDX = 2
BURNOUT_IDX = 3
INDEPENDENCE_IDX = 4
FUSION_IDX = 5
SUCCESS_IDX = 6

# Avatar interaction actions (must match NLTAvatarInteractor.cpp)
INTERACTION_NAMES = ["Idle", "StartTask", "RequestHelp", "CompleteTask"]

# Aide strategy names (must match LTCognitiveStateComponent::ApplyCoachingEffect)
STRATEGY_NAMES = [
    "Pomodoro",
    "LadderStep",
    "BodyDouble",
    "ImplementationIntent",
    "TwoMinuteStart",
    "TaskChunking",
    "MindfulRefocus",
    "DistractionImmune",
    "AttentionAnchor",
    "ShrinkTheTask",
]


def format_avatar_observation(obs: np.ndarray, agent_id: int) -> str:
    """Format a 13-dim observation vector into a text prompt for the Avatar LLM."""
    px, py, pz = obs[0], obs[1], obs[2]
    vx, vy, vz = obs[3], obs[4], obs[5]
    focus = obs[FOCUS_IDX]
    load = obs[LOAD_IDX]
    stress = obs[STRESS_IDX]
    burnout = obs[BURNOUT_IDX]
    independence = obs[INDEPENDENCE_IDX]
    fusion = obs[FUSION_IDX]
    success = obs[SUCCESS_IDX]

    # Build a narrative description
    stress_desc = "high" if stress > 0.6 else "moderate" if stress > 0.3 else "low"
    focus_desc = "very focused" if focus > 0.7 else "somewhat focused" if focus > 0.4 else "distracted"
    burnout_desc = "burned out" if burnout > 0.7 else "tired" if burnout > 0.4 else "energetic"
    independence_desc = "independent" if independence > 0.7 else "learning" if independence > 0.4 else "needing help"

    prompt = f"""You are an Avatar with ADHD traits in a workplace simulation. Your goal is to become more independent at completing tasks while managing your cognitive state.

Your current state:
- Position: ({px:.1f}, {py:.1f}, {pz:.1f})
- Velocity: ({vx:.1f}, {vy:.1f}, {vz:.1f})
- Focus: {focus:.2f}/1.0 ({focus_desc})
- Cognitive Load: {load:.2f}/1.0
- Stress: {stress:.2f}/1.0 ({stress_desc})
- Burnout: {burnout:.2f}/1.0 ({burnout_desc})
- Independence: {independence:.2f}/1.0 ({independence_desc})
- Task Success Rate: {success:.2f}/1.0

Available interactions: {', '.join(INTERACTION_NAMES)}

Respond with your chosen action in this exact format:
MOVE: <x> <y> <z>
INTERACT: <action>

Where MOVE is a direction vector (each component -1.0 to 1.0) and INTERACT is one of: {', '.join(INTERACTION_NAMES)}."""
    return prompt


def format_aide_observation(obs: np.ndarray, agent_id: int) -> str:
    """Format a 13-dim observation vector into a text prompt for the Aide LLM."""
    focus = obs[FOCUS_IDX]
    load = obs[LOAD_IDX]
    stress = obs[STRESS_IDX]
    burnout = obs[BURNOUT_IDX]
    independence = obs[INDEPENDENCE_IDX]
    success = obs[SUCCESS_IDX]

    prompt = f"""You are an Aide (coach) for an Avatar with ADHD in a workplace simulation. Your goal is to help the Avatar become more independent by choosing the right coaching strategy.

The Avatar's current state:
- Focus: {focus:.2f}/1.0
- Cognitive Load: {load:.2f}/1.0
- Stress: {stress:.2f}/1.0
- Burnout: {burnout:.2f}/1.0
- Independence: {independence:.2f}/1.0
- Task Success Rate: {success:.2f}/1.0

Available coaching strategies:
0: Pomodoro (reduces stress, boosts focus)
1: LadderStep (reduces load, modest focus boost)
2: BodyDouble (reduces stress, boosts independence)
3: ImplementationIntent (reduces load, boosts focus)
4: TwoMinuteStart (quick focus boost)
5: TaskChunking (reduces load, modest focus boost)
6: MindfulRefocus (big stress reduction, big focus boost)
7: DistractionImmune (big focus boost)
8: AttentionAnchor (big focus boost, stress reduction)
9: ShrinkTheTask (big load reduction, stress reduction)

Respond with your chosen strategy in this exact format:
STRATEGY: <number>"""
    return prompt


# ---------------------------------------------------------------------------
# Action Parsers
# ---------------------------------------------------------------------------

def parse_avatar_response(response: str) -> Tuple[np.ndarray, int]:
    """Parse LLM text response into (move_direction, interaction_index).

    Expected format:
        MOVE: <x> <y> <z>
        INTERACT: <action_name>
    """
    # Default: stay still, Idle
    move = np.zeros(3, dtype=np.float32)
    interaction = 0

    # Parse MOVE line
    move_match = re.search(r'MOVE:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)', response)
    if move_match:
        move = np.array([
            float(move_match.group(1)),
            float(move_match.group(2)),
            float(move_match.group(3))
        ], dtype=np.float32)
        # Clamp to [-1, 1]
        move = np.clip(move, -1.0, 1.0)

    # Parse INTERACT line
    interact_match = re.search(r'INTERACT:\s*(\w+)', response)
    if interact_match:
        action_name = interact_match.group(1)
        # Match against known interaction names (case-insensitive)
        for i, name in enumerate(INTERACTION_NAMES):
            if name.lower() == action_name.lower():
                interaction = i
                break

    return move, interaction


def parse_aide_response(response: str) -> int:
    """Parse LLM text response into strategy index.

    Expected format:
        STRATEGY: <number>
    """
    strategy_match = re.search(r'STRATEGY:\s*(\d+)', response)
    if strategy_match:
        strategy = int(strategy_match.group(1))
        return np.clip(strategy, 0, len(STRATEGY_NAMES) - 1)
    return 0  # Default: Pomodoro


# ---------------------------------------------------------------------------
# LLM Client
# ---------------------------------------------------------------------------

class LLMClient:
    """Minimal LLM client that supports Anthropic Claude API.

    Can be extended to support OpenAI, local models, etc.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514", api_key: Optional[str] = None):
        self.model = model
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self._client = None

        # Lazy import to avoid dependency when not using LLM mode
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self.api_key)
        except ImportError:
            raise RuntimeError(
                "anthropic package not installed. Run: pip install anthropic"
            )

    def complete(self, prompt: str, max_tokens: int = 256) -> str:
        """Send a prompt to the LLM and return the text response."""
        response = self._client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text


# ---------------------------------------------------------------------------
# LLM Policy Classes
# ---------------------------------------------------------------------------

class AvatarLLMPolicy:
    """Replaces AvatarPolicy nn.Module with LLM inference."""

    def __init__(self, llm_client: LLMClient, agent_id: int = 0):
        self.llm = llm_client
        self.agent_id = agent_id

    def __call__(self, obs: np.ndarray) -> Tuple[np.ndarray, int]:
        """Forward pass: format observation → LLM → parse action."""
        prompt = format_avatar_observation(obs, self.agent_id)
        try:
            response = self.llm.complete(prompt, max_tokens=128)
            log.debug(f"Avatar {self.agent_id} LLM response: {response.strip()}")
            return parse_avatar_response(response)
        except Exception as e:
            log.error(f"Avatar {self.agent_id} LLM call failed: {e}")
            # Fallback: stay still, Idle
            return np.zeros(3, dtype=np.float32), 0


class AideLLMPolicy:
    """Replaces AidePolicy nn.Module with LLM inference."""

    def __init__(self, llm_client: LLMClient, agent_id: int = 0):
        self.llm = llm_client
        self.agent_id = agent_id

    def __call__(self, obs: np.ndarray) -> int:
        """Forward pass: format observation → LLM → parse strategy."""
        prompt = format_aide_observation(obs, self.agent_id)
        try:
            response = self.llm.complete(prompt, max_tokens=64)
            log.debug(f"Aide {self.agent_id} LLM response: {response.strip()}")
            return parse_aide_response(response)
        except Exception as e:
            log.error(f"Aide {self.agent_id} LLM call failed: {e}")
            return 0  # Fallback: Pomodoro
