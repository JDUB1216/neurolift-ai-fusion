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
# RRT Foundation module not yet implemented
# from .rrt_foundation import (
#     RRTFoundation,
#     BurnoutDetector,
#     CrisisIntervention,
#     RecoveryProtocols,
# )
from .executive_function_expertise import (
    AttentionCoaching,
    # Additional expertise modules will be imported here as they are implemented
    # ImpulseManagement,
    # WorkingMemoryStrategies,
    # TimeManagement,
    # EmotionalRegulation,
    # FocusTechniques,
    # TaskInitiationSupport,
    # FrustrationManagement,
    # PlanningSupport,
    # TransitionCoaching,
    # SelfAwareness,
)
# Real world feedback module not yet implemented
# from .real_world_feedback import (
#     SuccessStories,
#     FailureAnalysis,
#     FeedbackProcessor,
# )

__all__ = [
    "BaseAide",
    "CoachingAction",
    "CoachingContext", 
    "BurnoutRisk",
    # RRT Foundation exports will be added here when implemented
    # "RRTFoundation",
    # "BurnoutDetector",
    # "CrisisIntervention",
    # "RecoveryProtocols",
    "AttentionCoaching",
    # Additional expertise exports will be added here as they are implemented
]