"""
Aide System

Provides expert coaching and support during Avatar struggles. Each Aide
combines PhD-level expertise with real-world feedback plus RRT foundation
for burnout response.
"""

from .base_aide import BaseAide, CoachingAction, CoachingContext, BurnoutRisk

__all__ = [
    "BaseAide",
    "CoachingAction",
    "CoachingContext",
    "BurnoutRisk",
]
