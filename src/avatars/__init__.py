"""
Avatar System

Simulates authentic ADHD experiences and struggles. Each Avatar embodies
a specific ADHD trait and experiences realistic stress, frustration, and
failure patterns during simulation.
"""

from .base_avatar import BaseAvatar, AvatarState, TaskResult, LearningProgress

__all__ = [
    "BaseAvatar",
    "AvatarState",
    "TaskResult",
    "LearningProgress",
]
