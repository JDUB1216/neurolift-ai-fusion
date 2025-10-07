"""
Aide System

The Aide system provides expert coaching and support during Avatar struggles. Each
Aide combines PhD-level expertise in specific executive functions with real-world
feedback from successful ADHD individuals, plus RRT (Rapid Response Team) 
foundation for burnout response.

Key Components:
- BaseAide: Core Aide behavior and coaching logic
- RRT Foundation: Rapid Response Team core system
- Executive Function Expertise: PhD-level knowledge modules
- Real World Feedback: Community wisdom and success stories
- Aide Configs: Configuration files for each Aide type
"""

from .base_aide import BaseAide, CoachingAction, CoachingContext, BurnoutRisk
from .rrt_foundation import (
    RRTFoundation,
    BurnoutDetector,
    CrisisIntervention,
    RecoveryProtocols,
)
from .executive_function_expertise import (
    AttentionCoaching,
    ImpulseManagement,
    WorkingMemoryStrategies,
    TimeManagement,
    EmotionalRegulation,
    FocusTechniques,
    TaskInitiationSupport,
    FrustrationManagement,
    PlanningSupport,
    TransitionCoaching,
    SelfAwareness,
)
from .real_world_feedback import (
    SuccessStories,
    FailureAnalysis,
    FeedbackProcessor,
)

__all__ = [
    "BaseAide",
    "CoachingAction",
    "CoachingContext", 
    "BurnoutRisk",
    "RRTFoundation",
    "BurnoutDetector",
    "CrisisIntervention",
    "RecoveryProtocols",
    "AttentionCoaching",
    "ImpulseManagement",
    "WorkingMemoryStrategies",
    "TimeManagement",
    "EmotionalRegulation",
    "FocusTechniques",
    "TaskInitiationSupport",
    "FrustrationManagement",
    "PlanningSupport",
    "TransitionCoaching",
    "SelfAwareness",
    "SuccessStories",
    "FailureAnalysis",
    "FeedbackProcessor",
]