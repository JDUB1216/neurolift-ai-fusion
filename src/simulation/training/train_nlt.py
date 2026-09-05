"""
NLT World Engine — PPO Training Orchestrator

Connects to the Unreal Engine 5 LearningAgents shared-memory communicator
and runs dual-policy PPO training for Avatar/Aide pairs.

Usage:
    python3 train_nlt.py --port 5555 --agents 20 --iterations 1000

The script mirrors the training configuration in:
    WorldEngine/Source/WorldEngine/Private/Agents/NLTTrainingManager.cpp

It connects to UE5's LearningAgentsCommunicator shared-memory bridge (running
inside the UE5 process) and runs synchronized PPO iterations. Each pair gets
one Avatar policy + one Aide policy.

Dependencies:
    pip install torch numpy tensorboard
"""

import argparse
import json
import os
import sys
import time
import math
import struct
import logging
import threading
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any, Union

import numpy as np

# ---------------------------------------------------------------------------
# LLM Policy Bridge (optional)
# ---------------------------------------------------------------------------
try:
    from llm_policy import OllamaClient, AvatarLLMPolicy, AideLLMPolicy
    HAS_LLM_POLICY = True
except ImportError:
    HAS_LLM_POLICY = False

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.distributions import Categorical, Normal
    from torch.utils.tensorboard import SummaryWriter
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("NLT-PPO")

# ---------------------------------------------------------------------------
# Constants (must match NLTTrainingManager.cpp defaults)
# ---------------------------------------------------------------------------
TICK_INTERVAL = 0.1          # 0.1s per step
MAX_EPISODE_STEPS = 512      # 51.2 seconds of sim time
TRAINING_INTERVAL = 1.0      # Run PPO update every 1.0s of sim time
FIXED_TIMESTEP_FREQ = 60.0   # 60 Hz fixed timestep

# Observation dims: Position(3) + Velocity(3) + Cognitive(7) = 13
OBS_DIM = 13

# Avatar action dims: MoveDirection(3 continuous) + Interaction(4 discrete)
AVATAR_CONTINUOUS_DIM = 3
AVATAR_DISCRETE_DIM = 4

# Aide action dims: 10 discrete strategies
AIDE_DISCRETE_DIM = 10

# PPO hyperparameters (must match Tick() in NLTTrainingManager.cpp)
LR_POLICY = 1e-4
LR_CRITIC = 1e-3
DISCOUNT = 0.99
GAE_LAMBDA = 0.95
EPSILON_CLIP = 0.2
HIDDEN_SIZE = 128

# Episode termination thresholds (must match NLTEpisodeManager.cpp)
INDEPENDENCE_THRESHOLD = 0.8
BURNOUT_THRESHOLD = 0.9

# Reward function coefficients (must match NLTTrainingEnvironment.cpp)
REWARD_INDEPENDENCE = 1.0
REWARD_BURNOUT = -1.0
REWARD_STRESS = -0.5
REWARD_FOCUS = 0.3
REWARD_SUCCESS = 0.5

# Cognitive dimension indices (from LTCognitiveStateComponent.h)
# Order: Focus, CognitiveLoad, Stress, Burnout, Independence, FusionReady, SuccessRate
FOCUS_IDX = 0
LOAD_IDX = 1
STRESS_IDX = 2
BURNOUT_IDX = 3
INDEPENDENCE_IDX = 4
FUSION_IDX = 5
SUCCESS_IDX = 6

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

# Avatar interaction actions (must match NLTAvatarInteractor.cpp)
INTERACTION_NAMES = ["Idle", "StartTask", "RequestHelp", "CompleteTask"]


# ---------------------------------------------------------------------------
# Policy Network
# ---------------------------------------------------------------------------
class AvatarPolicy(nn.Module):
    """
    Dual-head policy for the Avatar:
    - Continuous head: 3-dim move direction (Normal distribution)
    - Discrete head: 4-dim interaction (Categorical distribution)
    """

    def __init__(self, obs_dim: int = OBS_DIM, hidden: int = HIDDEN_SIZE):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, hidden),
            nn.ELU(),
        )
        # Continuous action head (move direction)
        self.continuous_head = nn.Sequential(
            nn.Linear(hidden, hidden),
            nn.ELU(),
            nn.Linear(hidden, AVATAR_CONTINUOUS_DIM),
        )
        self.continuous_std = nn.Parameter(torch.zeros(AVATAR_CONTINUOUS_DIM))

        # Discrete action head (interaction)
        self.discrete_head = nn.Sequential(
            nn.Linear(hidden, hidden),
            nn.ELU(),
            nn.Linear(hidden, AVATAR_DISCRETE_DIM),
        )

    def forward(self, obs: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        features = self.shared(obs)
        mean = torch.tanh(self.continuous_head(features))
        std = torch.exp(self.continuous_std)
        logits = self.discrete_head(features)
        return mean, std, logits


class AvatarCritic(nn.Module):
    """State-value critic for the Avatar."""

    def __init__(self, obs_dim: int = OBS_DIM, hidden: int = HIDDEN_SIZE):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, hidden),
            nn.ELU(),
            nn.Linear(hidden, hidden),
            nn.ELU(),
            nn.Linear(hidden, 1),
        )

    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        return self.net(obs)


class AidePolicy(nn.Module):
    """
    Policy for the Aide: 10-dim discrete action (coaching strategy).
    """

    def __init__(self, obs_dim: int = OBS_DIM, hidden: int = HIDDEN_SIZE, num_actions: int = AIDE_DISCRETE_DIM):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, hidden),
            nn.ELU(),
            nn.Linear(hidden, hidden),
            nn.ELU(),
            nn.Linear(hidden, num_actions),
        )

    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        return self.net(obs)


class AideCritic(nn.Module):
    """State-value critic for the Aide."""

    def __init__(self, obs_dim: int = OBS_DIM, hidden: int = HIDDEN_SIZE):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, hidden),
            nn.ELU(),
            nn.Linear(hidden, hidden),
            nn.ELU(),
            nn.Linear(hidden, 1),
        )

    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        return self.net(obs)


# ---------------------------------------------------------------------------
# Shared Memory Communicator
# ---------------------------------------------------------------------------
class SharedMemoryCommunicator:
    """
    Connects to UE5's LearningAgents shared-memory communicator.

    The UE5 side creates a shared-memory segment with a known structure.
    This Python side reads observations and writes actions, synchronized
    via the fixed timestep.

    The shared memory layout is:
      - Header (metadata: num_agents, step_count, flags)
      - For each agent: observation buffer + action buffer + reward buffer

    NOTE: In the initial prototype, we use a file-based fallback for
    environments where shared memory is unavailable. When shared memory is
    available (UE5 + Python on the same host), set use_shm=True.
    """

    SHM_HEADER_SIZE = 64
    SHM_PER_AGENT_SIZE = 256  # 13 floats obs + 7 floats action + 1 float reward + padding

    def __init__(self, num_agents: int = 20, port: int = 5555, use_shm: bool = False):
        self.num_agents = num_agents
        self.port = port
        self.use_shm = use_shm
        self.shm = None
        self._connected = False

        # In-memory buffers for file-based fallback mode
        self.obs_buffer = np.zeros((num_agents, OBS_DIM), dtype=np.float32)
        self.action_buffer = np.zeros((num_agents, AVATAR_CONTINUOUS_DIM), dtype=np.float32)
        self.interaction_buffer = np.zeros(num_agents, dtype=np.int32)
        self.reward_buffer = np.zeros(num_agents, dtype=np.float32)
        self.done_buffer = np.zeros(num_agents, dtype=bool)

        # Episode tracking
        self.episode_rewards = np.zeros(num_agents, dtype=np.float32)
        self.episode_steps = np.zeros(num_agents, dtype=np.int32)
        self.steps_current = 0

        # Statistics
        self.total_steps = 0
        self.episode_count = 0

    def connect(self) -> bool:
        """Connect to the UE5 communicator."""
        if self.use_shm:
            try:
                import multiprocessing.shared_memory as shm
                # UE5 creates this — we attempt to attach
                # The name follows LearningAgents convention
                shm_name = f"nlt_training_shm_{self.port}"
                self.shm = shm.SharedMemory(name=shm_name, create=False)
                self._connected = True
                log.info(f"Connected to shared memory: {shm_name}")
                return True
            except FileNotFoundError:
                log.warning(f"Shared memory '{shm_name}' not found. UE5 may not be running.")
                self._connected = False
                return False
            except Exception as e:
                log.warning(f"Shared memory connect failed: {e}. Falling back to file mode.")
                self._connected = False
                return False
        else:
            # File-based fallback: write actions to a file UE5 reads,
            # read observations from a file UE5 writes.
            self._shm_file = f"/tmp/nlt_training_shm_{self.port}.json"
            self._action_file = f"/tmp/nlt_training_actions_{self.port}.json"
            self._connected = True
            log.info(f"Using file-based communicator: {self._shm_file}")
            return True

    def disconnect(self):
        """Disconnect from the UE5 communicator."""
        if self.shm:
            self.shm.close()
            self.shm = None
        self._connected = False

    def read_observations(self) -> np.ndarray:
        """Read the latest observations from UE5 for all agents."""
        if self.use_shm and self.shm:
            # Read from shared memory
            raw = np.frombuffer(self.shm.buf[:self.num_agents * OBS_DIM * 4], dtype=np.float32)
            return raw.reshape(self.num_agents, OBS_DIM)
        else:
            # File-based fallback: read observations file written by UE5
            # In prototype mode, we generate synthetic observations
            # that match the cognitive state dynamics
            return self.obs_buffer.copy()

    def write_actions(self, avatar_actions: np.ndarray, avatar_interactions: np.ndarray,
                       aide_actions: np.ndarray):
        """Write actions back to UE5 for all agents."""
        if not self._connected:
            return

        if self.use_shm and self.shm:
            # Write to shared memory (simplified — would need proper offsets)
            pass
        else:
            # File-based: write actions for UE5 to read
            action_data = {
                "timestamp": datetime.now().isoformat(),
                "avatar_move": avatar_actions.tolist(),
                "avatar_interaction": avatar_interactions.tolist(),
                "aide_strategy": aide_actions.tolist(),
            }
            try:
                with open(self._action_file, "w") as f:
                    json.dump(action_data, f)
            except Exception as e:
                log.debug(f"Action write (non-critical in standalone mode): {e}")

    def compute_reward(self, obs: np.ndarray, prev_obs: np.ndarray) -> np.ndarray:
        """
        Compute reward from observation change.
        Mirrors NLTTrainingEnvironment::GatherAgentReward:

        reward = +1.0 * Independence
                 - 1.0 * Burnout
                 - 0.5 * Stress
                 + 0.3 * Focus
                 + 0.5 * SuccessRate
        """
        independence = obs[:, INDEPENDENCE_IDX]
        burnout = obs[:, BURNOUT_IDX]
        stress = obs[:, STRESS_IDX]
        focus = obs[:, FOCUS_IDX]
        success = obs[:, SUCCESS_IDX]

        reward = (REWARD_INDEPENDENCE * independence +
                  REWARD_BURNOUT * burnout +
                  REWARD_STRESS * stress +
                  REWARD_FOCUS * focus +
                  REWARD_SUCCESS * success)
        return reward.astype(np.float32)

    def update_cognitive_state(self, obs: np.ndarray, actions: np.ndarray,
                               aide_actions: np.ndarray, dt: float = TICK_INTERVAL):
        """
        Simulate cognitive state evolution between UE5 ticks.
        This is the Python-side mirror of LTCognitiveStateComponent::TickCognitiveDecay
        and ApplyCoachingEffect. In the real system, UE5 handles this; this is
        used when running in standalone mode (--standalone flag).
        """
        # Cognitive decay deltas per second (from LTCognitiveStateComponent.h)
        STRESS_DECAY = 0.01
        BURNOUT_DECAY = 0.005
        FOCUS_DECAY = 0.02
        INDEPENDENCE_DECAY = 0.001

        # Decay: stress/burnout increase, focus/independence decay
        obs[:, STRESS_IDX] = np.clip(obs[:, STRESS_IDX] + STRESS_DECAY * dt, 0.0, 1.0)
        obs[:, BURNOUT_IDX] = np.clip(obs[:, BURNOUT_IDX] + BURNOUT_DECAY * dt, 0.0, 1.0)
        obs[:, FOCUS_IDX] = np.clip(obs[:, FOCUS_IDX] - FOCUS_DECAY * dt, 0.0, 1.0)
        obs[:, INDEPENDENCE_IDX] = np.clip(obs[:, INDEPENDENCE_IDX] - INDEPENDENCE_DECAY * dt, 0.0, 1.0)

        # Apply coaching effects (mirrors LTCognitiveStateComponent::ApplyCoachingEffect)
        for i in range(obs.shape[0]):
            strategy = int(aide_actions[i])
            self._apply_coaching(obs[i], strategy)

    def _apply_coaching(self, obs: np.ndarray, strategy: int):
        """Apply a coaching strategy's effect to the cognitive observation."""
        # Strategy effects mirror LTCognitiveStateComponent.cpp exactly
        if strategy == 0:   # Pomodoro
            obs[STRESS_IDX] = max(0, obs[STRESS_IDX] - 0.1)
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.1)
        elif strategy == 1:  # LadderStep
            obs[LOAD_IDX] = max(0, obs[LOAD_IDX] - 0.1)
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.05)
        elif strategy == 2:  # BodyDouble
            obs[STRESS_IDX] = max(0, obs[STRESS_IDX] - 0.15)
            obs[INDEPENDENCE_IDX] = min(1, obs[INDEPENDENCE_IDX] + 0.05)
        elif strategy == 3:  # ImplementationIntent
            obs[LOAD_IDX] = max(0, obs[LOAD_IDX] - 0.05)
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.1)
        elif strategy == 4:  # TwoMinuteStart
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.15)
        elif strategy == 5:  # TaskChunking
            obs[LOAD_IDX] = max(0, obs[LOAD_IDX] - 0.15)
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.05)
        elif strategy == 6:  # MindfulRefocus
            obs[STRESS_IDX] = max(0, obs[STRESS_IDX] - 0.2)
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.1)
        elif strategy == 7:  # DistractionImmune
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.15)
        elif strategy == 8:  # AttentionAnchor
            obs[FOCUS_IDX] = min(1, obs[FOCUS_IDX] + 0.2)
            obs[STRESS_IDX] = max(0, obs[STRESS_IDX] - 0.1)
        elif strategy == 9:  # ShrinkTheTask
            obs[LOAD_IDX] = max(0, obs[LOAD_IDX] - 0.2)
            obs[STRESS_IDX] = max(0, obs[STRESS_IDX] - 0.05)


# ---------------------------------------------------------------------------
# PPO Agent Container
# ---------------------------------------------------------------------------
@dataclass
class Trajectory:
    """Stores a single step of experience for one agent."""
    obs: np.ndarray
    actions_cont: np.ndarray
    actions_disc: int
    logp: float
    value: float
    reward: float
    done: bool


@dataclass
class PPOAgent:
    """Holds policy, critic, optimizer, and training state for one agent pair."""

    agent_id: int
    avatar_policy: AvatarPolicy
    avatar_critic: AvatarCritic
    avatar_optimizer_policy: optim.Optimizer
    avatar_optimizer_critic: optim.Optimizer
    aide_policy: AidePolicy
    aide_critic: AideCritic
    aide_optimizer_policy: optim.Optimizer
    aide_optimizer_critic: optim.Optimizer

    # Episode buffers
    avatar_traj: List[Trajectory] = field(default_factory=list)
    aide_traj: List[Trajectory] = field(default_factory=list)

    # Episode stats
    episode_reward: float = 0.0
    episode_steps: int = 0

    def reset_episode(self):
        self.avatar_traj.clear()
        self.aide_traj.clear()
        self.episode_reward = 0.0
        self.episode_steps = 0


# ---------------------------------------------------------------------------
# Training Orchestrator
# ---------------------------------------------------------------------------
class NLTTrainer:
    """
    Orchestrates PPO training for all Avatar/Aide pairs.

    Mirrors the training loop in NLTTrainingManager::Tick():
    - Every 0.1s: inference step (both policies act)
    - Every 1.0s: PPO training step (1 iteration)
    - On episode end: reset agents, log metrics
    """

    def __init__(
        self,
        num_pairs: int = 20,
        device: str = "cuda" if HAS_TORCH and torch.cuda.is_available() else "cpu",
        port: int = 5555,
        standalone: bool = False,
        max_iter: int = 1000,
        scenario_id: str = "pers_4",  # Default: Morning Routine
    ):
        self.num_pairs = num_pairs
        self.device = device
        self.standalone = standalone
        self.max_iter = max_iter
        self.scenario_id = scenario_id
        self.agents: List[PPOAgent] = []
        self.writer: Optional[SummaryWriter] = None
        self.iteration = 0
        self.steps_current = 0
        self._stop = False

        log.info(f"NLT PPO Trainer — {num_pairs} pairs, device={device}, "
                 f"max_iter={max_iter}, scenario={scenario_id}")

        if not HAS_TORCH:
            log.error("PyTorch not installed. Install: pip install torch numpy tensorboard")
            sys.exit(1)

        # Setup TensorBoard
        tb_dir = os.environ.get(
            "NLT_TB_DIR",
            "/home/joshd/Desktop/nlt-repos/nlt-world-engine/WorldEngine/Saved/LearningAgents/TensorBoard/"
        )
        os.makedirs(tb_dir, exist_ok=True)
        self.writer = SummaryWriter(tb_dir)
        log.info(f"TensorBoard logs → {tb_dir}")

        # Setup communicator
        self.comm = SharedMemoryCommunicator(num_agents=num_pairs * 2, port=port,
                                             use_shm=not standalone)

        # Initialize agents
        self._init_agents()

    def _init_agents(self):
        """Create policy/critic networks and optimizers for each pair."""
        import torch

        for i in range(self.num_pairs):
            agent_id = i * 2  # Avatar IDs are even

            avatar_policy = AvatarPolicy().to(self.device)
            avatar_critic = AvatarCritic().to(self.device)
            aide_policy = AidePolicy().to(self.device)
            aide_critic = AideCritic().to(self.device)

            pair = PPOAgent(
                agent_id=agent_id,
                avatar_policy=avatar_policy,
                avatar_critic=avatar_critic,
                avatar_optimizer_policy=optim.Adam(avatar_policy.parameters(), lr=LR_POLICY),
                avatar_optimizer_critic=optim.Adam(avatar_critic.parameters(), lr=LR_CRITIC),
                aide_policy=aide_policy,
                aide_critic=aide_critic,
                aide_optimizer_policy=optim.Adam(aide_policy.parameters(), lr=LR_POLICY),
                aide_optimizer_critic=optim.Adam(aide_critic.parameters(), lr=LR_CRITIC),
            )
            self.agents.append(pair)

        log.info(f"Initialized {len(self.agents)} Avatar/Aide pairs with dual PPO policies")

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------
    def run_inference_step(self, obs: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Run inference for all agents. Returns:
        - avatar_move: (num_agents, 3) continuous actions
        - avatar_interaction: (num_agents,) discrete actions (0-3)
        - aide_strategy: (num_agents,) discrete actions (0-9)
        """
        avatar_move = np.zeros((self.num_pairs * 2, AVATAR_CONTINUOUS_DIM), dtype=np.float32)
        avatar_interaction = np.zeros(self.num_pairs * 2, dtype=np.int32)
        aide_strategy = np.zeros(self.num_pairs * 2, dtype=np.int32)

        with torch.no_grad():
            for i, agent in enumerate(self.agents):
                avatar_agent_id = i * 2
                aide_agent_id = i * 2 + 1

                # Avatar inference
                avatar_obs = torch.from_numpy(obs[avatar_agent_id]).float().unsqueeze(0).to(self.device)
                cont_mean, cont_std, disc_logits = agent.avatar_policy(avatar_obs)
                cont_dist = Normal(cont_mean, cont_std)
                disc_dist = Categorical(logits=disc_logits)

                cont_action = cont_dist.sample().cpu().numpy()[0]
                disc_action = disc_dist.sample().item()

                avatar_move[avatar_agent_id] = cont_action
                avatar_interaction[avatar_agent_id] = disc_action

                # Aide inference (observes paired Avatar)
                aide_obs = torch.from_numpy(obs[avatar_agent_id]).float().unsqueeze(0).to(self.device)
                aide_logits = agent.aide_policy(aide_obs)
                aide_dist = Categorical(logits=aide_logits)
                aide_action = aide_dist.sample().item()

                aide_strategy[aide_agent_id] = aide_action

        return avatar_move, avatar_interaction, aide_strategy

    # ------------------------------------------------------------------
    # PPO Training Step
    # ------------------------------------------------------------------
    def compute_advantages_and_returns(self, agent: PPOAgent) -> Tuple[np.ndarray, np.ndarray]:
        """Compute GAE(λ) advantages and returns for a trajectory."""
        traj = agent.avatar_traj  # Using avatar trajectory for both (reward is shared)

        rewards = np.array([t.reward for t in traj], dtype=np.float32)
        values = np.array([t.value for t in traj], dtype=np.float32)
        dones = np.array([t.done for t in traj], dtype=np.float32)

        # Compute returns
        returns = np.zeros_like(rewards)
        advantages = np.zeros_like(rewards)
        last_value = 0.0

        for t in reversed(range(len(traj))):
            if t == len(traj) - 1:
                next_value = last_value
            else:
                next_value = values[t + 1]

            mask = 1.0 - dones[t]
            returns[t] = rewards[t] + DISCOUNT * mask * next_value
            delta = returns[t] - values[t]
            advantages[t] = delta + DISCOUNT * GAE_LAMBDA * mask * (advantages[t + 1] if t + 1 < len(traj) else 0.0)

        # Normalize advantages
        if advantages.std() > 1e-8:
            advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        return advantages, returns

    def ppo_train_step(self, agent: PPOAgent) -> Dict[str, float]:
        """Run one PPO update step for one agent pair."""
        if len(agent.avatar_traj) == 0:
            return {"loss": 0.0}

        # Prepare batches
        obs_batch = np.array([t.obs for t in agent.avatar_traj], dtype=np.float32)
        cont_actions = np.array([t.actions_cont for t in agent.avatar_traj], dtype=np.float32)
        disc_actions = np.array([t.actions_disc for t in agent.avatar_traj], dtype=np.int32)

        advantages, returns = self.compute_advantages_and_returns(agent)

        obs_tensor = torch.from_numpy(obs_batch).float().to(self.device)
        cont_actions_tensor = torch.from_numpy(cont_actions).float().to(self.device)
        disc_actions_tensor = torch.from_numpy(disc_actions).long().to(self.device)
        advantages_tensor = torch.from_numpy(advantages).float().to(self.device)
        returns_tensor = torch.from_numpy(returns).float().to(self.device)

        stats = {}

        # --- Avatar policy update ---
        cont_mean, cont_std, disc_logits = agent.avatar_policy(obs_tensor)
        cont_dist = Normal(cont_mean, cont_std)
        disc_dist = Categorical(logits=disc_logits)

        # Log probabilities
        cont_logp = cont_dist.log_prob(cont_actions_tensor).sum(dim=-1)
        disc_logp = disc_dist.log_prob(disc_actions_tensor)
        total_logp = cont_logp + disc_logp

        # Value function
        values = agent.avatar_critic(obs_tensor).squeeze(-1)

        # PPO losses
        ratio = torch.exp(total_logp - torch.from_numpy(
            np.array([t.logp for t in agent.avatar_traj], dtype=np.float32)
        ).to(self.device))
        surr1 = ratio * advantages_tensor
        surr2 = torch.clamp(ratio, 1 - EPSILON_CLIP, 1 + EPSILON_CLIP) * advantages_tensor
        policy_loss = -torch.min(surr1, surr2).mean()

        critic_loss = nn.MSELoss()(values, returns_tensor)

        # Update Avatar
        agent.avatar_optimizer_policy.zero_grad()
        policy_loss.backward(retain_graph=True)
        agent.avatar_optimizer_policy.step()

        agent.avatar_optimizer_critic.zero_grad()
        critic_loss.backward()
        agent.avatar_optimizer_critic.step()

        # --- Aide policy update ---
        aide_logits = agent.aide_policy(obs_tensor)
        aide_dist = Categorical(logits=aide_logits)
        aide_actions = np.array([0] * len(agent.aide_traj), dtype=np.int32)  # Simplified
        if len(agent.aide_traj) > 0:
            aide_actions = np.array([t.actions_disc for t in agent.aide_traj], dtype=np.int32)
        aide_actions_tensor = torch.from_numpy(aide_actions).long().to(self.device)

        aide_logp = aide_dist.log_prob(aide_actions_tensor)
        aide_ratio = torch.exp(aide_logp - torch.from_numpy(
            np.array([t.logp for t in agent.aide_traj], dtype=np.float32)
        ).to(self.device))
        aide_surr1 = aide_ratio * advantages_tensor
        aide_surr2 = torch.clamp(aide_ratio, 1 - EPSILON_CLIP, 1 + EPSILON_CLIP) * advantages_tensor
        aide_policy_loss = -torch.min(aide_surr1, aide_surr2).mean()

        aide_values = agent.aide_critic(obs_tensor).squeeze(-1)
        aide_critic_loss = nn.MSELoss()(aide_values, returns_tensor)

        agent.aide_optimizer_policy.zero_grad()
        aide_policy_loss.backward(retain_graph=True)
        agent.aide_optimizer_policy.step()

        agent.aide_optimizer_critic.zero_grad()
        aide_critic_loss.backward()
        agent.aide_optimizer_critic.step()

        stats = {
            "avatar_policy_loss": policy_loss.item(),
            "avatar_value_loss": critic_loss.item(),
            "aide_policy_loss": aide_policy_loss.item(),
            "aide_value_loss": aide_critic_loss.item(),
        }
        return stats

    # ------------------------------------------------------------------
    # Main Training Loop
    # ------------------------------------------------------------------
    def train(self, args=None):
        """Main training loop — branches between PyTorch and LLM modes."""
        if args and args.llm:
            self._train_llm(args)
        else:
            self._train_pytorch()

    def _train_llm(self, args):
        """LLM inference loop — uses Ollama instead of PyTorch policies."""
        if not HAS_LLM_POLICY:
            log.error("LLM policy bridge not available. Ensure llm_policy.py is in the same directory.")
            sys.exit(1)

        log.info("Starting LLM inference loop...")

        # Initialize Ollama client and policies
        client = OllamaClient(model=args.ollama_model, base_url=args.ollama_url)
        avatar_policy = AvatarLLMPolicy(client)
        aide_policy = AideLLMPolicy(client)

        if not self.comm.connect():
            log.warning("Could not connect to UE5 communicator. Running in standalone mode.")
            self.standalone = True
            self._init_synthetic_state()

        log.info(f"LLM mode active: model={args.ollama_model}, agents={self.num_pairs}")

        prev_obs = self.comm.read_observations()

        while not self._stop and self.iteration < self.max_iter:
            obs = self.comm.read_observations()

            # Run LLM inference for all agents
            avatar_move, avatar_interaction, aide_strategy = self._run_llm_inference(
                obs, avatar_policy, aide_policy
            )

            if self.standalone:
                self.comm.update_cognitive_state(obs, avatar_move, aide_strategy, dt=TICK_INTERVAL)
            else:
                self.comm.write_actions(avatar_move, avatar_interaction, aide_strategy)

            # Compute rewards
            rewards = self.comm.compute_reward(obs, prev_obs)
            prev_obs = obs.copy()

            self.iteration += 1

            # Log progress
            if self.iteration % 10 == 0:
                avg_reward = np.mean(rewards) if len(rewards) > 0 else 0.0
                log.info(f"LLM step {self.iteration}/{self.max_iter} — avg reward: {avg_reward:.3f}")

        log.info(f"LLM inference complete. {self.iteration} iterations.")
        self._close()

    def _run_llm_inference(
        self,
        obs: np.ndarray,
        avatar_policy,
        aide_policy,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Run LLM inference for all agents."""
        n = self.num_pairs * 2
        avatar_move = np.zeros((n, AVATAR_CONTINUOUS_DIM), dtype=np.float32)
        avatar_interaction = np.zeros(n, dtype=np.int32)
        aide_strategy = np.zeros(n, dtype=np.int32)

        for i in range(self.num_pairs):
            avatar_id = i * 2
            aide_id = i * 2 + 1

            # Extract cognitive state (dims 6-12: focus, load, stress, burnout, independence, fusion, success)
            avatar_cog = obs[avatar_id][6:13]

            # Avatar action
            move, interact = avatar_policy(avatar_cog)
            avatar_move[avatar_id] = move
            avatar_interaction[avatar_id] = interact

            # Aide strategy
            strategy = aide_policy(avatar_cog)
            aide_strategy[aide_id] = strategy

        return avatar_move, avatar_interaction, aide_strategy

    def _train_pytorch(self):
        """Main training loop — mirrors NLTTrainingManager::Tick()."""
        log.info("Starting PPO training loop...")

        if not self.comm.connect():
            log.warning("Could not connect to UE5 communicator. Running in standalone mode.")
            self.standalone = True
            # Initialize synthetic cognitive states
            self._init_synthetic_state()

        # Reset all episodes
        for agent in self.agents:
            agent.reset_episode()

        prev_obs = self.comm.read_observations()

        while not self._stop and self.iteration < self.max_iter:
            # --- Inference step (every 0.1s tick) ---
            obs = self.comm.read_observations()

            if self.standalone:
                # In standalone mode, we simulate the cognitive state evolution
                avatar_move, avatar_interaction, aide_strategy = self.run_inference_step(obs)
                self.comm.update_cognitive_state(obs, avatar_move, aide_strategy, dt=TICK_INTERVAL)
            else:
                # Connected to UE5: run inference, send actions
                avatar_move, avatar_interaction, aide_strategy = self.run_inference_step(obs)
                self.comm.write_actions(avatar_move, avatar_interaction, aide_strategy)

            # Compute rewards
            rewards = self.comm.compute_reward(obs, prev_obs)

            # Record experience for each pair
            for i, agent in enumerate(self.agents):
                avatar_id = i * 2
                aide_id = i * 2 + 1

                # Avatar trajectory
                traj = Trajectory(
                    obs=obs[avatar_id].copy(),
                    actions_cont=avatar_move[avatar_id],
                    actions_disc=int(avatar_interaction[avatar_id]),
                    logp=0.0,  # Would compute from policy
                    value=0.0,  # Would compute from critic
                    reward=float(rewards[avatar_id]),
                    done=False,
                )
                agent.avatar_traj.append(traj)
                agent.episode_reward += float(rewards[avatar_id])
                agent.episode_steps += 1

                # Aide trajectory (uses paired avatar's reward)
                aide_traj = Trajectory(
                    obs=obs[avatar_id].copy(),  # Same obs (paired)
                    actions_cont=np.zeros(AVATAR_CONTINUOUS_DIM, dtype=np.float32),
                    actions_disc=int(aide_strategy[aide_id]),
                    logp=0.0,
                    value=0.0,
                    reward=float(rewards[avatar_id]),  # Shared reward
                    done=False,
                )
                agent.aide_traj.append(aide_traj)

            # Check episode completion for each pair
            for i, agent in enumerate(self.agents):
                avatar_id = i * 2
                avatar_obs = obs[avatar_id]
                independence = avatar_obs[INDEPENDENCE_IDX]
                burnout = avatar_obs[BURNOUT_IDX]

                if independence >= INDEPENDENCE_THRESHOLD:
                    log.info(f"Pair {i}: Avatar achieved independence ({independence:.3f})")
                    self._log_episode_result(i, "success", agent)
                    agent.reset_episode()
                elif burnout >= BURNOUT_THRESHOLD:
                    log.warning(f"Pair {i}: Avatar burnout ({burnout:.3f})")
                    self._log_episode_result(i, "burnout", agent)
                    agent.reset_episode()
                elif agent.episode_steps >= MAX_EPISODE_STEPS:
                    self._log_episode_result(i, "truncated", agent)
                    agent.reset_episode()

            # --- PPO training step (every 1.0s = every 10 ticks) ---
            self.steps_current += 1
            self.comm.steps_current = self.steps_current

            if self.steps_current % 10 == 0:  # Every 1.0s (10 × 0.1s ticks)
                self.iteration += 1
                self._run_training_iteration()

            prev_obs = obs.copy()

        log.info(f"Training complete. {self.iteration} iterations, {self.comm.episode_count} episodes.")
        self._close()



        log.info("Synthetic cognitive state initialized (standalone mode)")

    def _init_synthetic_state(self):
        """Initialize synthetic cognitive states for standalone mode."""
        # Start all avatars with base cognitive state (13-dim: posXYZ(3) + velXYZ(3) + cognitive(7))
        base_state = np.zeros(OBS_DIM, dtype=np.float32)
        # Cognitive state (last 7 dims)
        base_state[6] = 0.65   # Focus
        base_state[7] = 0.20   # CognitiveLoad
        base_state[8] = 0.15   # Stress
        base_state[9] = 0.05   # Burnout
        base_state[10] = 0.20  # Independence
        base_state[11] = 0.0   # FusionReady
        base_state[12] = 0.5   # SuccessRate
        for i in range(self.comm.num_agents):
            self.comm.obs_buffer[i] = base_state

    def _run_training_iteration(self):
        """Run one PPO training iteration for all agents."""
        total_loss = 0.0
        for agent in self.agents:
            if len(agent.avatar_traj) > 1:
                stats = self.ppo_train_step(agent)
                total_loss += stats.get("avatar_policy_loss", 0.0)

        avg_loss = total_loss / max(len(self.agents), 1)
        log.info(f"Iteration {self.iteration}/{self.max_iter} — avg policy loss: {avg_loss:.4f}")

        # Log TensorBoard
        if self.writer:
            self.writer.add_scalar("Loss/AvatarPolicy", avg_loss, self.iteration)
            self.writer.add_scalar("Loss/AidePolicy", avg_loss, self.iteration)
            self.writer.add_scalar("Iteration", self.iteration, self.iteration)

            # Log aggregate metrics
            avg_rewards = []
            avg_independence = []
            avg_burnout = []
            for agent in self.agents:
                if len(agent.avatar_traj) > 0:
                    latest = agent.avatar_traj[-1]
                    avg_rewards.append(latest.reward)
                    avg_independence.append(latest.obs[INDEPENDENCE_IDX])
                    avg_burnout.append(latest.obs[BURNOUT_IDX])

            if avg_rewards:
                self.writer.add_scalar("Reward/AvatarMean", np.mean(avg_rewards), self.iteration)
                self.writer.add_scalar("Independence/AvatarMean", np.mean(avg_independence), self.iteration)
                self.writer.add_scalar("Burnout/AvatarMean", np.mean(avg_burnout), self.iteration)

            self.writer.flush()

    def _log_episode_result(self, pair_idx: int, outcome: str, agent: PPOAgent):
        """Log episode results to TensorBoard and console."""
        reward = agent.episode_reward
        steps = agent.episode_steps
        self.comm.episode_count += 1

        log.info(f"Episode complete: pair={pair_idx}, outcome={outcome}, "
                 f"reward={reward:.3f}, steps={steps}")

        if self.writer:
            self.writer.add_scalar(f"Episode/Reward_Pair{pair_idx}", reward, self.comm.episode_count)
            self.writer.add_scalar(f"Episode/Steps_Pair{pair_idx}", steps, self.comm.episode_count)

            # Outcome counts
            outcome_map = {"success": 1, "burnout": 0, "truncated": -1}
            self.writer.add_scalar("Episode/Outcome", outcome_map.get(outcome, 0),
                                   self.comm.episode_count)

    def _close(self):
        """Clean up."""
        if self.writer:
            self.writer.close()
        self.comm.disconnect()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="NLT World Engine — PPO Training Orchestrator"
    )
    parser.add_argument("--port", type=int, default=5555,
                        help="UE5 communicator port (default: 5555)")
    parser.add_argument("--agents", type=int, default=20,
                        help="Number of Avatar/Aide pairs (default: 20)")
    parser.add_argument("--iterations", type=int, default=1000,
                        help="Max PPO iterations (default: 1000)")
    parser.add_argument("--standalone", action="store_true",
                        help="Run without UE5 connection (synthetic observations)")
    parser.add_argument("--scenario", type=str, default="pers_4",
                        help="Scenario ID to train on (default: pers_4 = Morning Routine)")
    parser.add_argument("--device", type=str, default="auto",
                        help="Device: auto/cpu/cuda (default: auto)")
    parser.add_argument("--llm", action="store_true",
                        help="Use LLM policy instead of PyTorch (Ollama)")
    parser.add_argument("--ollama-model", type=str, default="qwen2.5:1.5b",
                        help="Ollama model to use with --llm (default: qwen2.5:1.5b)")
    parser.add_argument("--ollama-url", type=str, default="http://localhost:11434",
                        help="Ollama API URL (default: http://localhost:11434)")

    args = parser.parse_args()

    device = args.device
    if device == "auto":
        device = "cuda" if HAS_TORCH and torch.cuda.is_available() else "cpu"

    log.info(f"Device: {device}")
    log.info(f"PyTorch: {torch.__version__}")

    trainer = NLTTrainer(
        num_pairs=args.agents,
        device=device,
        port=args.port,
        standalone=args.standalone,
        max_iter=args.iterations,
        scenario_id=args.scenario,
    )

    try:
        trainer.train(args)
    except KeyboardInterrupt:
        log.info("Training interrupted by user.")
        trainer._close()
    except Exception as e:
        log.error(f"Training failed: {e}", exc_info=True)
        trainer._close()
        sys.exit(1)


if __name__ == "__main__":
    main()
