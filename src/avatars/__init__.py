"""
Avatar System

The Avatar system simulates authentic ADHD experiences and struggles. Each Avatar
embodies a specific ADHD trait (attention deficit, impulsivity, working memory 
issues, etc.) and experiences realistic stress, frustration, and failure patterns.

Key Components:
- BaseAvatar: Core Avatar behavior and state management
- ADHD Traits: Specific trait implementations (attention_deficit.py, etc.)
- Avatar Configs: Configuration files for each Avatar type
"""

from .base_avatar import BaseAvatar, AvatarState, TaskResult
from .adhd_traits import (
    AttentionDeficit,
    # Additional traits will be imported here as they are implemented
    # Impulsivity,
    # WorkingMemory,
    # TimeBlindness,
    # EmotionalDysregulation,
    # Hyperfocus,
    # TaskInitiation,
    # FrustrationTolerance,
    # PlanningDeficit,
    # TransitionDifficulty,
    # SelfMonitoring,
    # ImpulseControl,
    # FocusFatigue,
    # EffortPerception,
    # StressSensitivity,
    # SensorySensitivity,
    # SocialChallenges,
    # SensorySeeking,
    # IdentityChallenges,
)

__all__ = [
    "BaseAvatar",
    "AvatarState", 
    "TaskResult",
    "AttentionDeficit",
    # Additional traits will be added here as they are implemented
]